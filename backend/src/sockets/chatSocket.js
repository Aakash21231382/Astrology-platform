const jwt = require('jsonwebtoken');
const { executeProcedure, getPool } = require('../config/db');
const { generateAstrologyReply } = require('../services/aiChatService');

const JWT_SECRET = process.env.JWT_SECRET || 'astrology_jwt_secret_key_super_secure_2026';

// Active consultation timers tracking in memory (consultationId => { startTime, interval, customerId, expertId, rate, freeSeconds })
const activeSessions = new Map();

/**
 * Fetch full session details for consultation (Expert, Customer, Wallet, Specialties)
 */
async function getConsultationSessionDetails(consultationId) {
    try {
        const pool = await getPool();
        const req = pool.request();
        req.input('id', consultationId);
        const queryRes = await req.query(`
            SELECT 
                c.*, 
                ep.userId AS expertUserId, 
                ep.displayName AS expertName,
                ep.title AS expertTitle,
                ep.bio,
                w.balance AS customerWalletBalance,
                uCust.fullName AS customerName,
                uExp.avatarUrl AS expertAvatar
            FROM dbo.Consultations c
            JOIN dbo.ExpertProfiles ep ON ep.id = c.expertId
            JOIN dbo.Wallets w ON w.userId = c.customerId
            JOIN dbo.Users uCust ON uCust.id = c.customerId
            JOIN dbo.Users uExp ON uExp.id = ep.userId
            WHERE c.id = @id;
        `);
        return queryRes.recordset[0] || null;
    } catch (err) {
        console.error('[Socket] getConsultationSessionDetails error:', err.message);
        return null;
    }
}

/**
 * Start authoritative 1-second ticker for consultation
 */
function startSessionTimer(io, consultationId, roomName, session) {
    if (activeSessions.has(consultationId)) return;

    const freeSeconds = (session.freeMinutesAllowed || 0) * 60;
    const startTime = Date.now();

    const interval = setInterval(async () => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const freeRemaining = Math.max(0, freeSeconds - elapsedSeconds);
        const paidSeconds = Math.max(0, elapsedSeconds - freeSeconds);
        const currentCost = Math.ceil(paidSeconds / 60) * (session.ratePerMinute || 0);

        // Low balance auto-end enforcement
        if (paidSeconds > 0 && currentCost > (session.customerWalletBalance || 0)) {
            clearInterval(interval);
            activeSessions.delete(consultationId);

            // Settle immediately
            try {
                await executeProcedure('dbo.sp_SettleConsultationBilling', {
                    ConsultationId: consultationId,
                    TotalDurationSeconds: elapsedSeconds,
                    EndReason: 'INSUFFICIENT_BALANCE'
                });
            } catch (err) {
                console.error('[Socket] Settle on low balance error:', err.message);
            }

            io.to(roomName).emit('consultation:ended', {
                consultationId,
                endReason: 'INSUFFICIENT_BALANCE',
                totalSeconds: elapsedSeconds,
                message: 'Consultation ended automatically due to low wallet balance.'
            });
            return;
        }

        io.to(roomName).emit('consultation:billing_tick', {
            consultationId,
            elapsedSeconds,
            freeRemaining,
            paidSeconds,
            currentCost,
            isFree: freeRemaining > 0
        });
    }, 1000);

    activeSessions.set(consultationId, { interval, startTime, session });
}

/**
 * Handle initial greeting message from AI Astrologer when room is first joined
 */
async function handleAiAstrologerGreeting(io, consultationId, roomName, session) {
    try {
        // Emit typing
        io.to(roomName).emit('consultation:typing', {
            userId: session.expertUserId,
            role: 'EXPERT'
        });

        // Small natural typing delay
        await new Promise((r) => setTimeout(r, 1200));

        const welcomeText = `Namaste ${session.customerName || 'Ji'} 🙏! Main ${session.expertName || 'Acharya'} hoon. Hamare is live consultation me aapka hardik swagat hai. Kripya apni Janma Tithi (DOB), Janma Samay (Birth Time) aur Sthan (City) share karein, ya batayein aaj aap kis vishay (Career, Shadi, ya Kundali) par guidance chahte hain?`;

        const result = await executeProcedure('dbo.sp_SaveChatMessage', {
            ConsultationId: consultationId,
            SenderId: session.expertUserId,
            SenderRole: 'EXPERT',
            MessageType: 'TEXT',
            Content: welcomeText,
            FileUrl: null
        });

        io.to(roomName).emit('consultation:stop_typing', {
            userId: session.expertUserId,
            role: 'EXPERT'
        });

        const savedMsg = result.recordset[0];
        io.to(roomName).emit('consultation:message', {
            id: savedMsg.messageId,
            consultationId,
            senderId: session.expertUserId,
            senderRole: 'EXPERT',
            messageType: 'TEXT',
            content: welcomeText,
            fileUrl: null,
            status: 'DELIVERED',
            sentAt: savedMsg.sentAt
        });
    } catch (err) {
        console.error('[Socket] handleAiAstrologerGreeting error:', err.message);
        io.to(roomName).emit('consultation:stop_typing', { role: 'EXPERT' });
    }
}

/**
 * Handle real-time AI Astrologer reply to customer question
 */
async function handleAiAstrologerReply(io, consultationId, roomName, customerMessage) {
    try {
        const cid = parseInt(consultationId, 10);
        const targetRoom = roomName || `consultation:${cid}`;
        const session = await getConsultationSessionDetails(cid);
        if (!session) {
            console.warn('[Socket] No session found for AI reply:', cid);
            return;
        }

        // Show typing indicator in real time
        io.to(targetRoom).emit('consultation:typing', {
            userId: session.expertUserId,
            role: 'EXPERT'
        });

        // Fetch recent messages for conversational context
        const pool = await getPool();
        const histReq = pool.request();
        histReq.input('consultationId', cid);
        const histRes = await histReq.query(`
            SELECT TOP 6 senderRole, content 
            FROM dbo.ChatMessages 
            WHERE consultationId = @consultationId AND messageType = 'TEXT'
            ORDER BY sentAt DESC;
        `);
        const history = (histRes.recordset || []).reverse();

        // Call AI Astrologer service
        const aiReply = await generateAstrologyReply({
            expertName: session.expertName,
            specialties: session.expertTitle || session.bio,
            customerName: session.customerName,
            currentMessage: customerMessage,
            history
        });

        // Add 1.2s typing pacing so user experiences genuine real-time interaction
        await new Promise((r) => setTimeout(r, 1200));

        // Stop typing
        io.to(targetRoom).emit('consultation:stop_typing', {
            userId: session.expertUserId,
            role: 'EXPERT'
        });

        // Save AI reply to MS SQL Database as EXPERT message
        const saveRes = await executeProcedure('dbo.sp_SaveChatMessage', {
            ConsultationId: cid,
            SenderId: session.expertUserId,
            SenderRole: 'EXPERT',
            MessageType: 'TEXT',
            Content: aiReply,
            FileUrl: null
        });

        const savedAiMsg = saveRes.recordset[0];

        // Emit message to room
        io.to(targetRoom).emit('consultation:message', {
            id: savedAiMsg.messageId,
            consultationId: cid,
            senderId: session.expertUserId,
            senderRole: 'EXPERT',
            messageType: 'TEXT',
            content: aiReply,
            fileUrl: null,
            status: 'DELIVERED',
            sentAt: savedAiMsg.sentAt
        });
    } catch (err) {
        console.error('[Socket] handleAiAstrologerReply error:', err.message);
        const cid = parseInt(consultationId, 10);
        io.to(roomName || `consultation:${cid}`).emit('consultation:stop_typing', { role: 'EXPERT' });
    }
}

function initChatSockets(io) {
    // Socket authentication middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
        if (!token) {
            return next(new Error('Authentication token required for live consultation'));
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            socket.user = decoded; // { id, email, role, status }
            next();
        } catch (err) {
            return next(new Error('Invalid or expired socket token'));
        }
    });

    io.on('connection', (socket) => {
        const user = socket.user;
        console.log(`[Socket] User connected: ${user.email} (${user.role}) [socketId: ${socket.id}]`);

        // Join personal user room for direct notifications
        socket.join(`user:${user.id}`);

        // Set Online Presence
        socket.on('presence:set_online', async () => {
            if (user.role === 'EXPERT') {
                await executeProcedure('dbo.sp_SetExpertAvailability', {
                    UserId: user.id,
                    IsOnline: 1,
                    IsChatEnabled: 1
                });
                io.emit('expert:presence', { expertUserId: user.id, isOnline: true });
            }
        });

        socket.on('presence:set_offline', async () => {
            if (user.role === 'EXPERT') {
                await executeProcedure('dbo.sp_SetExpertAvailability', {
                    UserId: user.id,
                    IsOnline: 0,
                    IsChatEnabled: 1
                });
                io.emit('expert:presence', { expertUserId: user.id, isOnline: false });
            }
        });

        // Join Consultation Room
        socket.on('consultation:join', async ({ consultationId }) => {
            const cid = parseInt(consultationId, 10);
            const roomName = `consultation:${cid}`;
            socket.join(roomName);
            console.log(`[Socket] User ${user.email} (${user.role}) joined room: ${roomName}`);
            io.to(roomName).emit('consultation:user_joined', {
                userId: user.id,
                role: user.role
            });

            try {
                const session = await getConsultationSessionDetails(cid);
                if (session && session.status !== 'COMPLETED' && session.status !== 'REJECTED') {
                    // If consultation was in REQUESTED state, activate it automatically for live consultation
                    if (session.status === 'REQUESTED') {
                        await executeProcedure('dbo.sp_UpdateConsultationStatus', {
                            ConsultationId: consultationId,
                            NewStatus: 'ACTIVE'
                        });
                        session.status = 'ACTIVE';
                        io.to(roomName).emit('consultation:accepted', {
                            consultationId,
                            status: 'ACTIVE',
                            startedAt: new Date()
                        });
                    }

                    // Start authoritative timer ticker
                    startSessionTimer(io, consultationId, roomName, session);

                    // Check if there are any existing messages in this consultation
                    const pool = await getPool();
                    const msgReq = pool.request();
                    msgReq.input('consultationId', consultationId);
                    const msgRes = await msgReq.query(`
                        SELECT COUNT(*) AS totalMsgs FROM dbo.ChatMessages WHERE consultationId = @consultationId;
                    `);
                    const totalMsgs = msgRes.recordset[0]?.totalMsgs || 0;

                    // If brand new consultation (0 messages) and Customer joined, trigger initial AI greeting
                    if (totalMsgs === 0 && user.role === 'CUSTOMER') {
                        setTimeout(async () => {
                            await handleAiAstrologerGreeting(io, consultationId, roomName, session);
                        }, 1000);
                    }
                }
            } catch (joinErr) {
                console.error('[Socket] consultation:join error:', joinErr.message);
            }
        });

        // Accept Consultation (Expert Manual)
        socket.on('consultation:accept', async ({ consultationId }) => {
            try {
                const roomName = `consultation:${consultationId}`;
                await executeProcedure('dbo.sp_UpdateConsultationStatus', {
                    ConsultationId: consultationId,
                    NewStatus: 'ACTIVE'
                });

                const session = await getConsultationSessionDetails(consultationId);
                if (session) {
                    startSessionTimer(io, consultationId, roomName, session);
                }

                io.to(roomName).emit('consultation:accepted', {
                    consultationId,
                    status: 'ACTIVE',
                    startedAt: new Date()
                });
            } catch (err) {
                console.error('[Socket] consultation:accept error:', err.message);
            }
        });

        // Reject Consultation (Expert)
        socket.on('consultation:reject', async ({ consultationId, reason }) => {
            try {
                const roomName = `consultation:${consultationId}`;
                await executeProcedure('dbo.sp_UpdateConsultationStatus', {
                    ConsultationId: consultationId,
                    NewStatus: 'REJECTED',
                    EndReason: reason || 'EXPERT_DECLINED'
                });

                io.to(roomName).emit('consultation:rejected', {
                    consultationId,
                    reason: reason || 'Expert is currently unavailable.'
                });
            } catch (err) {
                console.error('[Socket] consultation:reject error:', err.message);
            }
        });

        // Chat Message
        socket.on('consultation:message', async ({ consultationId, content, messageType = 'TEXT', fileUrl = null }) => {
            try {
                const cid = parseInt(consultationId, 10);
                const roomName = `consultation:${cid}`;

                // Persist in MS SQL
                const result = await executeProcedure('dbo.sp_SaveChatMessage', {
                    ConsultationId: cid,
                    SenderId: user.id,
                    SenderRole: user.role,
                    MessageType: messageType,
                    Content: content,
                    FileUrl: fileUrl
                });

                const savedMsg = result.recordset[0];

                const messagePayload = {
                    id: savedMsg.messageId,
                    consultationId: cid,
                    senderId: user.id,
                    senderRole: user.role,
                    messageType,
                    content,
                    fileUrl,
                    status: 'DELIVERED',
                    sentAt: savedMsg.sentAt
                };

                // Broadcast message to room
                io.to(roomName).emit('consultation:message', messagePayload);

                // If message was sent by customer, trigger Real-time AI Astrologer reply
                if (user.role === 'CUSTOMER' && messageType === 'TEXT') {
                    handleAiAstrologerReply(io, cid, roomName, content);
                }
            } catch (err) {
                console.error('[Socket] consultation:message error:', err.message);
            }
        });

        // Typing Indicators
        socket.on('consultation:typing', ({ consultationId }) => {
            const cid = parseInt(consultationId, 10);
            socket.to(`consultation:${cid}`).emit('consultation:typing', {
                userId: user.id,
                role: user.role
            });
        });

        socket.on('consultation:stop_typing', ({ consultationId }) => {
            const cid = parseInt(consultationId, 10);
            socket.to(`consultation:${cid}`).emit('consultation:stop_typing', {
                userId: user.id,
                role: user.role
            });
        });

        // End Consultation & Authoritative Settle
        socket.on('consultation:end', async ({ consultationId, endReason = 'USER_END' }) => {
            try {
                const roomName = `consultation:${consultationId}`;
                let totalSeconds = 60; // fallback

                if (activeSessions.has(consultationId)) {
                    const sessionData = activeSessions.get(consultationId);
                    clearInterval(sessionData.interval);
                    totalSeconds = Math.floor((Date.now() - sessionData.startTime) / 1000);
                    activeSessions.delete(consultationId);
                }

                // Settle billing atomically in MS SQL Server
                const settleRes = await executeProcedure('dbo.sp_SettleConsultationBilling', {
                    ConsultationId: consultationId,
                    TotalDurationSeconds: totalSeconds,
                    EndReason: endReason
                });

                const settledConsultation = settleRes.recordset[0] || {};

                io.to(roomName).emit('consultation:ended', {
                    consultationId,
                    status: 'COMPLETED',
                    totalSeconds,
                    grossAmount: settledConsultation.grossAmount,
                    expertEarning: settledConsultation.expertEarning,
                    platformCommission: settledConsultation.platformCommission,
                    endReason
                });
            } catch (err) {
                console.error('[Socket] consultation:end error:', err.message);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] User disconnected: ${user.email}`);
        });
    });
}

module.exports = {
    initChatSockets
};

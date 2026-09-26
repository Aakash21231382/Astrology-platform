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
 * Anti-Leak Security Filter
 * Automatically masks phone numbers, WhatsApp links, social handles, and UPI IDs
 */
function maskContactLeakedInfo(text) {
    if (!text || typeof text !== 'string') return { text, wasMasked: false };
    
    let sanitized = text;
    let wasMasked = false;

    // 1. Phone number patterns (Indian 10-digit and international formats)
    const phoneRegex = /(\+?91[\-\s]?)?[6-9]\d{2}[\-\s]?\d{3}[\-\s]?\d{4}\b|\b\d{5}[\-\s]?\d{5}\b|\b\d{10}\b/g;
    if (phoneRegex.test(sanitized)) {
        sanitized = sanitized.replace(phoneRegex, '[Protected Contact: Number sharing is prohibited]');
        wasMasked = true;
    }

    // 2. WhatsApp links and keywords
    const waRegex = /(wa\.me\/\S+|whatsapp[:\s]+\+?\d+)/gi;
    if (waRegex.test(sanitized)) {
        sanitized = sanitized.replace(waRegex, '[WhatsApp Contact Blocked by System]');
        wasMasked = true;
    }

    // 3. Social Media handles (Instagram, Telegram)
    const socialRegex = /(instagram\.com\/\S+|t\.me\/\S+|ig[:\s]+@?[a-zA-Z0-9._]+|insta[:\s]+@?[a-zA-Z0-9._]+)/gi;
    if (socialRegex.test(sanitized)) {
        sanitized = sanitized.replace(socialRegex, '[Social Handle Blocked by System]');
        wasMasked = true;
    }

    // 4. UPI Handles
    const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@(okhdfcbank|okaxis|oksbi|okicici|upi|ybl|paytm|apl|axl|ibl)/gi;
    if (upiRegex.test(sanitized)) {
        sanitized = sanitized.replace(upiRegex, '[UPI Payment ID Blocked by System]');
        wasMasked = true;
    }

    return { text: sanitized, wasMasked };
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
        socket.on('consultation:join', async ({ consultationId, mode }) => {
            const cid = parseInt(consultationId, 10);
            const roomName = `consultation:${cid}`;
            socket.join(roomName);

            try {
                const session = await getConsultationSessionDetails(cid);
                const isCall = (mode || '').toUpperCase() === 'CALL' || (session?.consultationType || '').toUpperCase() === 'CALL';
                const effectiveMode = isCall ? 'CALL' : 'CHAT';
                console.log(`[Socket] User ${user.email} (${user.role}) joined room: ${roomName} [mode: ${effectiveMode}]`);
                io.to(roomName).emit('consultation:user_joined', {
                    userId: user.id,
                    role: user.role,
                    mode: effectiveMode
                });

                if (session && session.status !== 'COMPLETED' && session.status !== 'REJECTED') {
                    // If consultation was in REQUESTED state, activate it automatically for live consultation
                    if (session.status === 'REQUESTED') {
                        await executeProcedure('dbo.sp_UpdateConsultationStatus', {
                            ConsultationId: consultationId,
                            NewStatus: 'ACTIVE'
                        });
                        session.status = 'ACTIVE';
                        const acceptPayload = {
                            consultationId,
                            status: 'ACTIVE',
                            startedAt: new Date()
                        };
                        io.to(roomName).emit('consultation:accepted', acceptPayload);
                        io.to(roomName).emit('call:accepted', acceptPayload);
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

                    // If brand new CHAT consultation (0 messages) and Customer joined, trigger initial AI greeting
                    // DO NOT trigger chat greeting for voice calls!
                    if (!isCall && totalMsgs === 0 && user.role === 'CUSTOMER') {
                        setTimeout(async () => {
                            await handleAiAstrologerGreeting(io, consultationId, roomName, session);
                        }, 1000);
                    }
                }
            } catch (joinErr) {
                console.error('[Socket] consultation:join error:', joinErr.message);
            }
        });

        // WebRTC Voice Call Signaling (for real-time in-browser audio voice calls)
        socket.on('webrtc:signal', ({ consultationId, signal }) => {
            const cid = parseInt(consultationId, 10);
            socket.to(`consultation:${cid}`).emit('webrtc:signal', {
                senderId: user.id,
                signal
            });
        });

        // Accept Consultation / Call (Expert Manual)
        const handleAcceptConsultation = async ({ consultationId }) => {
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

                const acceptPayload = {
                    consultationId,
                    status: 'ACTIVE',
                    startedAt: new Date()
                };

                io.to(roomName).emit('consultation:accepted', acceptPayload);
                io.to(roomName).emit('call:accepted', acceptPayload);

                // If customer is in personal room, alert them directly
                if (session?.customerId) {
                    io.to(`user:${session.customerId}`).emit('consultation:accepted', acceptPayload);
                    io.to(`user:${session.customerId}`).emit('call:accepted', acceptPayload);
                }
            } catch (err) {
                console.error('[Socket] consultation:accept error:', err.message);
            }
        };

        socket.on('consultation:accept', handleAcceptConsultation);
        socket.on('call:accept', handleAcceptConsultation);

        // Reject Consultation / Call (Expert)
        const handleRejectConsultation = async ({ consultationId, reason }) => {
            try {
                const roomName = `consultation:${consultationId}`;
                await executeProcedure('dbo.sp_UpdateConsultationStatus', {
                    ConsultationId: consultationId,
                    NewStatus: 'REJECTED',
                    EndReason: reason || 'EXPERT_DECLINED'
                });

                const session = await getConsultationSessionDetails(consultationId);

                const rejectPayload = {
                    consultationId,
                    reason: reason || 'Expert is currently unavailable.'
                };

                io.to(roomName).emit('consultation:rejected', rejectPayload);
                io.to(roomName).emit('call:rejected', rejectPayload);

                if (session?.customerId) {
                    io.to(`user:${session.customerId}`).emit('consultation:rejected', rejectPayload);
                    io.to(`user:${session.customerId}`).emit('call:rejected', rejectPayload);
                }
            } catch (err) {
                console.error('[Socket] consultation:reject error:', err.message);
            }
        };

        socket.on('consultation:reject', handleRejectConsultation);
        socket.on('call:reject', handleRejectConsultation);

        // Chat Message
        socket.on('consultation:message', async ({ consultationId, content, messageType = 'TEXT', fileUrl = null }) => {
            try {
                const cid = parseInt(consultationId, 10);
                const roomName = `consultation:${cid}`;

                // Anti-Leak Security Filter
                let effectiveContent = content;
                if (messageType === 'TEXT' && content) {
                    const check = maskContactLeakedInfo(content);
                    if (check.wasMasked) {
                        effectiveContent = check.text;
                        socket.emit('consultation:security_warning', {
                            warning: 'Contact Sharing Blocked: Sharing phone numbers, WhatsApp, social media, or direct payment handles is strictly prohibited on Aakash Astrology.'
                        });
                    }
                }

                // Persist in MS SQL
                const result = await executeProcedure('dbo.sp_SaveChatMessage', {
                    ConsultationId: cid,
                    SenderId: user.id,
                    SenderRole: user.role,
                    MessageType: messageType,
                    Content: effectiveContent,
                    FileUrl: fileUrl
                });

                const savedMsg = result.recordset[0];

                const messagePayload = {
                    id: savedMsg.messageId,
                    consultationId: cid,
                    senderId: user.id,
                    senderRole: user.role,
                    messageType,
                    content: effectiveContent,
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

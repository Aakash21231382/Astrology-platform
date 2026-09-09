const { executeProcedure, getPool } = require('../config/db');
const { sendNewChatNotificationEmail } = require('../services/emailService');

/**
 * Request a live consultation session
 * POST /api/consultations/request
 */
async function requestConsultation(req, res, next) {
    try {
        const { expertId } = req.body;

        if (!expertId) {
            return res.status(400).json({
                success: false,
                message: 'expertId is required.'
            });
        }

        const result = await executeProcedure('dbo.sp_CreateConsultation', {
            CustomerId: req.user.id,
            ExpertId: parseInt(expertId, 10)
        });

        const consultation = result.recordset[0];

        // Fetch expert details and send real-time notification + email
        try {
            const pool = await getPool();
            const expReq = pool.request();
            expReq.input('expertId', parseInt(expertId, 10));
            expReq.input('customerId', req.user.id);
            const expRes = await expReq.query(`
                SELECT 
                    ep.id, ep.userId AS expertUserId, ep.displayName AS expertName,
                    uExp.email AS expertEmail,
                    uCust.fullName AS customerName
                FROM dbo.ExpertProfiles ep
                JOIN dbo.Users uExp ON uExp.id = ep.userId
                CROSS JOIN (SELECT fullName FROM dbo.Users WHERE id = @customerId) uCust
                WHERE ep.id = @expertId;
            `);
            const expertInfo = expRes.recordset[0];
            if (expertInfo) {
                // Async send email (won't block response)
                sendNewChatNotificationEmail(
                    expertInfo.expertEmail,
                    expertInfo.expertName,
                    expertInfo.customerName,
                    consultation.id
                ).catch(err => console.error('[Consultation] Email notify error:', err.message));

                // Emit Socket.IO alert directly to expert
                const io = req.app.get('io');
                if (io) {
                    io.to(`user:${expertInfo.expertUserId}`).emit('consultation:incoming', {
                        consultationId: consultation.id,
                        customerName: expertInfo.customerName,
                        requestedAt: new Date()
                    });
                }
            }
        } catch (notifyErr) {
            console.warn('[Consultation] Notification dispatch warning:', notifyErr.message);
        }

        return res.status(201).json({
            success: true,
            message: 'Consultation requested successfully.',
            data: consultation
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get active or requested consultations for currently logged in expert
 * GET /api/consultations/active-for-expert
 */
async function getActiveForExpert(req, res, next) {
    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('userId', req.user.id);
        const result = await request.query(`
            SELECT TOP 5 
                c.*, 
                uCust.fullName AS customerName,
                uCust.avatarUrl AS customerAvatar
            FROM dbo.Consultations c
            JOIN dbo.ExpertProfiles ep ON ep.id = c.expertId
            JOIN dbo.Users uCust ON uCust.id = c.customerId
            WHERE ep.userId = @userId 
              AND c.status IN ('REQUESTED', 'ACTIVE')
            ORDER BY c.requestedAt DESC;
        `);
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get consultation session details
 * GET /api/consultations/:id
 */
async function getConsultation(req, res, next) {
    try {
        const consultationId = parseInt(req.params.id, 10);
        const pool = await getPool();
        const request = pool.request();
        request.input('id', consultationId);

        const result = await request.query(`
            SELECT 
                c.*,
                ep.displayName AS expertName,
                ep.title AS expertTitle,
                uExpert.avatarUrl AS expertAvatar,
                uCust.fullName AS customerName,
                uCust.avatarUrl AS customerAvatar,
                w.balance AS customerWalletBalance
            FROM dbo.Consultations c
            JOIN dbo.ExpertProfiles ep ON ep.id = c.expertId
            JOIN dbo.Users uExpert ON uExpert.id = ep.userId
            JOIN dbo.Users uCust ON uCust.id = c.customerId
            JOIN dbo.Wallets w ON w.userId = c.customerId
            WHERE c.id = @id;
        `);

        const consultation = result.recordset[0];
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found.'
            });
        }

        // Check if caller is participant or admin
        const isCustomer = consultation.customerId === req.user.id;
        const isExpert = req.user.role === 'EXPERT'; // or check expert userId
        const isAdmin = req.user.role === 'ADMIN';

        if (!isCustomer && !isExpert && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You are not a participant in this consultation.'
            });
        }

        return res.status(200).json({
            success: true,
            data: consultation
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get message history for a consultation
 * GET /api/consultations/:id/messages
 */
async function getMessages(req, res, next) {
    try {
        const consultationId = parseInt(req.params.id, 10);

        const result = await executeProcedure('dbo.sp_GetChatMessages', {
            ConsultationId: consultationId
        });

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get past consultation sessions for current user (Customer or Expert)
 * GET /api/consultations/history
 */
async function getHistory(req, res, next) {
    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('userId', req.user.id);

        let query;
        if (req.user.role === 'EXPERT') {
            query = `
                SELECT 
                    c.*,
                    uCust.fullName AS customerName,
                    uCust.avatarUrl AS customerAvatar
                FROM dbo.Consultations c
                JOIN dbo.ExpertProfiles ep ON ep.id = c.expertId
                JOIN dbo.Users uCust ON uCust.id = c.customerId
                WHERE ep.userId = @userId
                ORDER BY c.requestedAt DESC;
            `;
        } else {
            query = `
                SELECT 
                    c.*,
                    ep.displayName AS expertName,
                    ep.title AS expertTitle,
                    uExp.avatarUrl AS expertAvatar,
                    r.rating AS customerRating,
                    r.comment AS customerReview
                FROM dbo.Consultations c
                JOIN dbo.ExpertProfiles ep ON ep.id = c.expertId
                JOIN dbo.Users uExp ON uExp.id = ep.userId
                LEFT JOIN dbo.Reviews r ON r.consultationId = c.id
                WHERE c.customerId = @userId
                ORDER BY c.requestedAt DESC;
            `;
        }

        const result = await request.query(query);

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Submit consultation review
 * POST /api/reviews
 */
async function submitReview(req, res, next) {
    try {
        const { consultationId, rating, comment } = req.body;

        if (!consultationId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'consultationId and rating (1-5) are required.'
            });
        }

        const result = await executeProcedure('dbo.sp_CreateReview', {
            ConsultationId: parseInt(consultationId, 10),
            CustomerId: req.user.id,
            Rating: parseInt(rating, 10),
            Comment: comment || null
        });

        return res.status(201).json({
            success: true,
            message: 'Thank you for your review!',
            data: result.recordset[0]
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    requestConsultation,
    getConsultation,
    getMessages,
    getHistory,
    getActiveForExpert,
    submitReview
};

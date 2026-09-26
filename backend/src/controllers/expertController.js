const { executeProcedure, getPool } = require('../config/db');

/**
 * Get current expert's complete profile
 * GET /api/experts/profile/me
 */
async function getMyProfile(req, res, next) {
    try {
        const result = await executeProcedure('dbo.sp_GetExpertFullProfileByUserId', {
            UserId: req.user.id
        });

        const profile = result.recordset[0];
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Expert profile not found.'
            });
        }

        let categories = [];
        if (profile.categoriesJson) {
            try {
                categories = JSON.parse(profile.categoriesJson);
            } catch (e) {}
        }

        return res.status(200).json({
            success: true,
            data: {
                ...profile,
                categories
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Upsert expert profile details
 * PUT /api/experts/profile
 */
async function upsertProfile(req, res, next) {
    try {
        const {
            displayName,
            screenName,
            title,
            bio,
            experienceYears,
            languages,
            pricePerMinute,
            freeMinutes,
            documentUrls,
            avatarUrl,
            phoneNumber,
            address,
            city,
            state,
            country,
            zipCode,
            isActive,
            isOnline,
            categoryIds
        } = req.body;

        const result = await executeProcedure('dbo.sp_UpsertExpertProfile', {
            UserId: req.user.id,
            DisplayName: displayName || req.user.email.split('@')[0],
            ScreenName: screenName || null,
            Title: title || null,
            Bio: bio || null,
            ExperienceYears: parseInt(experienceYears || 0, 10),
            Languages: languages || null,
            PricePerMinute: parseFloat(pricePerMinute || 20.00),
            FreeMinutes: parseInt(freeMinutes || 0, 10),
            DocumentUrls: documentUrls ? (typeof documentUrls === 'string' ? documentUrls : JSON.stringify(documentUrls)) : null,
            AvatarUrl: avatarUrl || null,
            PhoneNumber: phoneNumber || null,
            Address: address || null,
            City: city || null,
            State: state || null,
            Country: country || null,
            ZipCode: zipCode || null,
            IsActive: isActive !== undefined ? Boolean(isActive) : null,
            IsOnline: isOnline !== undefined ? Boolean(isOnline) : null
        });

        const profile = result.recordset[0];

        // If categories provided, sync them
        if (categoryIds && Array.isArray(categoryIds) && profile.id) {
            const pool = await getPool();
            const delReq = pool.request();
            delReq.input('expertId', profile.id);
            await delReq.query(`DELETE FROM dbo.ExpertCategories WHERE expertId = @expertId`);

            for (const catId of categoryIds) {
                const insReq = pool.request();
                insReq.input('expertId', profile.id);
                insReq.input('categoryId', parseInt(catId, 10));
                await insReq.query(`
                    IF NOT EXISTS (SELECT 1 FROM dbo.ExpertCategories WHERE expertId = @expertId AND categoryId = @categoryId)
                    INSERT INTO dbo.ExpertCategories (expertId, categoryId) VALUES (@expertId, @categoryId);
                `);
            }
        }

        // Return refreshed full profile
        const freshProfileRes = await executeProcedure('dbo.sp_GetExpertFullProfileByUserId', {
            UserId: req.user.id
        });

        let categories = [];
        if (freshProfileRes.recordset[0]?.categoriesJson) {
            try {
                categories = JSON.parse(freshProfileRes.recordset[0].categoriesJson);
            } catch (e) {}
        }

        return res.status(200).json({
            success: true,
            message: 'Expert profile updated successfully',
            data: {
                ...(freshProfileRes.recordset[0] || profile),
                categories
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Toggle online / active status (Expert)
 * PUT /api/experts/availability
 */
async function setAvailability(req, res, next) {
    try {
        const { isOnline, isActive } = req.body;

        const result = await executeProcedure('dbo.sp_SetExpertAvailability', {
            UserId: req.user.id,
            IsOnline: isOnline !== undefined ? Boolean(isOnline) : 1,
            IsActive: isActive !== undefined ? Boolean(isActive) : null
        });

        const status = result.recordset[0];

        return res.status(200).json({
            success: true,
            message: `Status updated: ${status.isOnline ? 'Online' : 'Offline'} (${status.isActive ? 'Active' : 'Inactive'})`,
            data: status
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get Public Profile by Expert ID
 * GET /api/experts/:id
 */
async function getPublicProfile(req, res, next) {
    try {
        const expertId = parseInt(req.params.id, 10);
        const result = await executeProcedure('dbo.sp_GetExpertPublicProfile', {
            ExpertId: expertId
        });

        const profile = result.recordsets[0]?.[0];
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Expert profile not found or not approved.'
            });
        }

        const categories = result.recordsets[1] || [];
        const services = result.recordsets[2] || [];
        const reviews = result.recordsets[3] || [];

        let weeklySchedule = [];
        if (profile.weeklySchedule) {
            try {
                weeklySchedule = typeof profile.weeklySchedule === 'string' ? JSON.parse(profile.weeklySchedule) : profile.weeklySchedule;
            } catch (e) {
                weeklySchedule = [];
            }
        }

        // Check canConsult: user can only chat/pay if expert is approved, online, and active
        const canConsult = (
            profile.approvalStatus === 'APPROVED' &&
            Boolean(profile.isOnline) &&
            (profile.isActive === undefined || Boolean(profile.isActive))
        );

        return res.status(200).json({
            success: true,
            data: {
                ...profile,
                weeklySchedule,
                canConsult,
                categories,
                services,
                reviews
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get Approved Experts List (Public Discovery)
 * GET /api/experts
 */
async function getApprovedList(req, res, next) {
    try {
        const { category, search, minPrice, maxPrice, sortBy } = req.query;

        const result = await executeProcedure('dbo.sp_GetApprovedExperts', {
            CategorySlug: category || null,
            SearchQuery: search || null,
            MinPrice: minPrice ? parseFloat(minPrice) : null,
            MaxPrice: maxPrice ? parseFloat(maxPrice) : null,
            SortBy: sortBy || 'RATING'
        });

        const list = result.recordset.map(item => {
            let categories = [];
            if (item.categoriesJson) {
                try {
                    categories = JSON.parse(item.categoriesJson);
                } catch (e) {}
            }
            return {
                ...item,
                categories
            };
        });

        return res.status(200).json({
            success: true,
            count: list.length,
            data: list
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get Expert Earnings Breakdown
 * GET /api/experts/earnings
 */
async function getEarnings(req, res, next) {
    try {
        const pool = await getPool();
        const request = pool.request();
        request.input('userId', req.user.id);

        const result = await request.query(`
            SELECT 
                ep.id AS expertId,
                COALESCE(SUM(ee.grossAmount), 0) AS totalGross,
                COALESCE(SUM(ee.platformCommission), 0) AS totalCommission,
                COALESCE(SUM(ee.netEarning), 0) AS totalNetEarnings,
                (
                    SELECT COALESCE(SUM(w.amount), 0) 
                    FROM dbo.Withdrawals w 
                    WHERE w.expertId = ep.id AND w.status IN ('PAID', 'PENDING', 'APPROVED')
                ) AS totalWithdrawnOrPending
            FROM dbo.ExpertProfiles ep
            LEFT JOIN dbo.ExpertEarnings ee ON ee.expertId = ep.id
            WHERE ep.userId = @userId
            GROUP BY ep.id;
        `);

        const stats = result.recordset[0] || {
            totalGross: 0,
            totalCommission: 0,
            totalNetEarnings: 0,
            totalWithdrawnOrPending: 0
        };

        const availableForWithdrawal = Math.max(0, stats.totalNetEarnings - stats.totalWithdrawnOrPending);

        // Fetch recent earnings ledger
        const ledgerReq = pool.request();
        ledgerReq.input('userId', req.user.id);
        const ledger = await ledgerReq.query(`
            SELECT TOP 30 ee.*, c.startedAt, c.endedAt, u.fullName AS customerName
            FROM dbo.ExpertEarnings ee
            JOIN dbo.ExpertProfiles ep ON ep.id = ee.expertId
            JOIN dbo.Consultations c ON c.id = ee.consultationId
            JOIN dbo.Users u ON u.id = c.customerId
            WHERE ep.userId = @userId
            ORDER BY ee.createdAt DESC;
        `);

        return res.status(200).json({
            success: true,
            data: {
                summary: {
                    ...stats,
                    availableForWithdrawal
                },
                earningsLedger: ledger.recordset
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Submit Payout Withdrawal Request
 * POST /api/experts/withdrawals
 */
async function requestWithdrawal(req, res, next) {
    try {
        const { amount, bankDetails } = req.body;
        const withdrawAmount = parseFloat(amount);

        if (!withdrawAmount || withdrawAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'A valid withdrawal amount is required.'
            });
        }

        const pool = await getPool();
        const checkReq = pool.request();
        checkReq.input('userId', req.user.id);
        const check = await checkReq.query(`
            SELECT ep.id,
                COALESCE((SELECT SUM(netEarning) FROM dbo.ExpertEarnings WHERE expertId = ep.id), 0) -
                COALESCE((SELECT SUM(amount) FROM dbo.Withdrawals WHERE expertId = ep.id AND status IN ('PENDING', 'APPROVED', 'PAID')), 0) AS availableBalance
            FROM dbo.ExpertProfiles ep
            WHERE ep.userId = @userId;
        `);

        const expert = check.recordset[0];
        if (!expert) {
            return res.status(404).json({
                success: false,
                message: 'Expert profile not found.'
            });
        }

        if (withdrawAmount > expert.availableBalance) {
            return res.status(400).json({
                success: false,
                message: `Insufficient available balance (Available: ₹${expert.availableBalance.toFixed(2)})`
            });
        }

        const insReq = pool.request();
        insReq.input('expertId', expert.id);
        insReq.input('amount', withdrawAmount);
        insReq.input('bankDetails', bankDetails ? (typeof bankDetails === 'string' ? bankDetails : JSON.stringify(bankDetails)) : null);

        const insRes = await insReq.query(`
            INSERT INTO dbo.Withdrawals (expertId, amount, status, bankDetails)
            VALUES (@expertId, @amount, 'PENDING', @bankDetails);
            SELECT * FROM dbo.Withdrawals WHERE id = SCOPE_IDENTITY();
        `);

        return res.status(201).json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            data: insRes.recordset[0]
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get expert's client directory (all seekers who consulted with this expert)
 * GET /api/experts/account/clients
 */
async function getMyClients(req, res, next) {
    try {
        const pool = await getPool();
        const expReq = pool.request();
        expReq.input('userId', req.user.id);
        const expRes = await expReq.query(`SELECT id FROM dbo.ExpertProfiles WHERE userId = @userId`);
        const expert = expRes.recordset[0];
        if (!expert) {
            return res.status(404).json({ success: false, message: 'Expert profile not found.' });
        }

        const result = await executeProcedure('dbo.sp_GetExpertClients', {
            ExpertId: expert.id
        });

        return res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get expert mailbox messages & notifications
 * GET /api/experts/account/mailbox
 */
async function getMailbox(req, res, next) {
    try {
        const result = await executeProcedure('dbo.sp_GetExpertNotifications', {
            UserId: req.user.id
        });

        return res.status(200).json({
            success: true,
            count: result.recordset.length,
            unreadCount: result.recordset.filter(n => !n.isRead).length,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Mark mailbox notification as read
 * PATCH /api/experts/account/mailbox/:id/read
 */
async function markMailboxRead(req, res, next) {
    try {
        const notificationId = parseInt(req.params.id, 10);
        await executeProcedure('dbo.sp_MarkNotificationRead', {
            NotificationId: notificationId,
            UserId: req.user.id
        });

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get saved payment options (bank & UPI)
 * GET /api/experts/account/payment-options
 */
async function getPaymentOptions(req, res, next) {
    try {
        const pool = await getPool();
        const expReq = pool.request();
        expReq.input('userId', req.user.id);
        const expRes = await expReq.query(`SELECT id, paymentOptionsJson FROM dbo.ExpertProfiles WHERE userId = @userId`);
        const expert = expRes.recordset[0];
        if (!expert) {
            return res.status(404).json({ success: false, message: 'Expert profile not found.' });
        }

        let options = {};
        if (expert.paymentOptionsJson) {
            try {
                options = JSON.parse(expert.paymentOptionsJson);
            } catch (e) {
                options = {};
            }
        }

        return res.status(200).json({
            success: true,
            data: options
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Save payment options (bank & UPI)
 * PUT /api/experts/account/payment-options
 */
async function savePaymentOptions(req, res, next) {
    try {
        const pool = await getPool();
        const expReq = pool.request();
        expReq.input('userId', req.user.id);
        const expRes = await expReq.query(`SELECT id FROM dbo.ExpertProfiles WHERE userId = @userId`);
        const expert = expRes.recordset[0];
        if (!expert) {
            return res.status(404).json({ success: false, message: 'Expert profile not found.' });
        }

        const optionsJson = JSON.stringify(req.body);
        await executeProcedure('dbo.sp_UpdateExpertPaymentOptions', {
            ExpertId: expert.id,
            PaymentOptionsJson: optionsJson
        });

        return res.status(200).json({
            success: true,
            message: 'Payment options updated successfully',
            data: req.body
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Submit account close request
 * POST /api/experts/account/close-request
 */
async function requestAccountClose(req, res, next) {
    try {
        const { reason } = req.body;
        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reason for closing your account.'
            });
        }

        const pool = await getPool();
        const expReq = pool.request();
        expReq.input('userId', req.user.id);
        const expRes = await expReq.query(`SELECT id FROM dbo.ExpertProfiles WHERE userId = @userId`);
        const expert = expRes.recordset[0];
        if (!expert) {
            return res.status(404).json({ success: false, message: 'Expert profile not found.' });
        }

        const result = await executeProcedure('dbo.sp_CreateAccountCloseRequest', {
            ExpertId: expert.id,
            UserId: req.user.id,
            Reason: reason.trim()
        });

        return res.status(201).json({
            success: true,
            message: 'Account closure request submitted successfully. Administration will review your request.',
            data: result.recordset[0]
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update expert verification documents
 * POST /api/experts/account/documents
 */
async function updateDocuments(req, res, next) {
    try {
        const { documents } = req.body;
        const docsJson = Array.isArray(documents) ? JSON.stringify(documents) : String(documents || '');

        const pool = await getPool();
        const updReq = pool.request();
        updReq.input('userId', req.user.id);
        updReq.input('documentUrls', docsJson);
        await updReq.query(`
            UPDATE dbo.ExpertProfiles 
            SET documentUrls = @documentUrls, updatedAt = SYSUTCDATETIME()
            WHERE userId = @userId;
        `);

        return res.status(200).json({
            success: true,
            message: 'Documents updated successfully'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get Expert Weekly Schedule & Auto-Schedule Status
 * GET /api/experts/schedule
 */
async function getExpertSchedule(req, res, next) {
    try {
        const result = await executeProcedure('dbo.sp_GetExpertSchedule', {
            UserId: req.user.id
        });

        const data = result.recordset?.[0] || null;
        let weeklySchedule = [];
        if (data?.weeklySchedule) {
            try {
                weeklySchedule = JSON.parse(data.weeklySchedule);
            } catch (e) {
                weeklySchedule = [];
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                ...data,
                weeklySchedule
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update Expert Weekly Schedule & Auto-Schedule Status
 * PUT /api/experts/schedule
 */
async function updateExpertSchedule(req, res, next) {
    try {
        const { autoScheduleEnabled, weeklySchedule } = req.body;
        const scheduleJson = Array.isArray(weeklySchedule) 
            ? JSON.stringify(weeklySchedule) 
            : String(weeklySchedule || '[]');

        const result = await executeProcedure('dbo.sp_UpdateExpertSchedule', {
            UserId: req.user.id,
            AutoScheduleEnabled: Boolean(autoScheduleEnabled),
            WeeklySchedule: scheduleJson
        });

        const updated = result.recordset?.[0];

        // Evaluate immediately if auto-schedule is enabled
        const { isScheduleActiveNow } = require('../services/scheduleRunner');
        let isNowActive = false;

        if (Boolean(autoScheduleEnabled)) {
            const check = isScheduleActiveNow(scheduleJson);
            isNowActive = check.isActive;

            await executeProcedure('dbo.sp_SetExpertOnlineByProfileId', {
                ExpertId: updated.expertId,
                IsOnline: isNowActive ? 1 : 0
            });
            updated.isOnline = isNowActive ? 1 : 0;
        }

        let parsedSchedule = [];
        try {
            parsedSchedule = JSON.parse(updated.weeklySchedule || '[]');
        } catch (e) {}

        return res.status(200).json({
            success: true,
            message: `Weekly schedule saved successfully! Auto-Schedule is ${autoScheduleEnabled ? 'ENABLED' : 'DISABLED'}.`,
            data: {
                ...updated,
                weeklySchedule: parsedSchedule,
                isCurrentlyInSchedule: isNowActive
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getMyProfile,
    upsertProfile,
    setAvailability,
    getPublicProfile,
    getApprovedList,
    getEarnings,
    requestWithdrawal,
    getMyClients,
    getMailbox,
    markMailboxRead,
    getPaymentOptions,
    savePaymentOptions,
    requestAccountClose,
    updateDocuments,
    getExpertSchedule,
    updateExpertSchedule
};

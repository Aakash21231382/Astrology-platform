const { executeProcedure, getPool } = require('../config/db');

/**
 * Get Admin Overview KPIs
 * GET /api/admin/dashboard
 */
async function getDashboardStats(req, res, next) {
    try {
        const result = await executeProcedure('dbo.sp_GetAdminDashboardStats');
        return res.status(200).json({
            success: true,
            data: result.recordset[0] || {}
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all experts with filters
 * GET /api/admin/experts
 */
async function getAllExperts(req, res, next) {
    try {
        const { approvalStatus, isActive, search } = req.query;
        const result = await executeProcedure('dbo.sp_AdminGetAllExperts', {
            ApprovalStatus: approvalStatus || null,
            IsActive: isActive !== undefined && isActive !== '' ? (isActive === 'true' || isActive === '1' ? 1 : 0) : null,
            Search: search || null
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
 * Get pending expert applications
 * GET /api/admin/experts/pending
 */
async function getPendingExperts(req, res, next) {
    try {
        const result = await executeProcedure('dbo.sp_GetPendingExperts');
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Approve, Reject, or Block Expert
 * PATCH /api/admin/experts/:id/review
 */
async function reviewExpert(req, res, next) {
    try {
        const expertId = parseInt(req.params.id, 10);
        const { action, rejectionReason } = req.body; // 'APPROVE', 'REJECT', 'BLOCK'

        const result = await executeProcedure('dbo.sp_AdminReviewExpert', {
            ExpertId: expertId,
            Action: action.toUpperCase(),
            RejectionReason: rejectionReason || null,
            AdminUserId: req.user.id
        });

        return res.status(200).json({
            success: true,
            message: `Expert status updated to: ${action}`,
            data: result.recordset[0]
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Toggle Expert Active / Inactive (Admin)
 * PATCH /api/admin/experts/:id/active
 */
async function toggleExpertActive(req, res, next) {
    try {
        const expertId = parseInt(req.params.id, 10);
        const { isActive } = req.body;

        const result = await executeProcedure('dbo.sp_AdminToggleExpertActive', {
            ExpertId: expertId,
            IsActive: Boolean(isActive)
        });

        return res.status(200).json({
            success: true,
            message: `Expert status set to ${isActive ? 'ACTIVE' : 'INACTIVE'}`,
            data: result.recordset[0]
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete Expert Permanently (Admin)
 * DELETE /api/admin/experts/:id
 */
async function deleteExpert(req, res, next) {
    try {
        const expertId = parseInt(req.params.id, 10);
        await executeProcedure('dbo.sp_AdminDeleteExpert', {
            ExpertId: expertId
        });

        return res.status(200).json({
            success: true,
            message: 'Expert profile and records deleted successfully.'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * List all users with filtering
 * GET /api/admin/users
 */
async function getAllUsers(req, res, next) {
    try {
        const { role, status, search } = req.query;
        const pool = await getPool();
        const request = pool.request();

        let query = `
            SELECT 
                u.id, u.email, u.role, u.fullName, u.phoneNumber, u.avatarUrl,
                u.isEmailVerified, u.status, u.createdAt,
                w.balance AS walletBalance,
                ep.id AS expertProfileId, ep.approvalStatus, ep.isOnline
            FROM dbo.Users u
            LEFT JOIN dbo.Wallets w ON w.userId = u.id
            LEFT JOIN dbo.ExpertProfiles ep ON ep.userId = u.id
            WHERE 1=1
        `;

        if (role) {
            request.input('role', role);
            query += ` AND u.role = @role`;
        }
        if (status) {
            request.input('status', status);
            query += ` AND u.status = @status`;
        }
        if (search) {
            request.input('search', `%${search}%`);
            query += ` AND (u.email LIKE @search OR u.fullName LIKE @search)`;
        }

        query += ` ORDER BY u.createdAt DESC;`;

        const result = await request.query(query);

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
 * Block / Unblock User
 * PATCH /api/admin/users/:id/status
 */
async function updateUserStatus(req, res, next) {
    try {
        const userId = parseInt(req.params.id, 10);
        const { status } = req.body; // 'ACTIVE', 'BLOCKED'

        const pool = await getPool();
        const request = pool.request();
        request.input('userId', userId);
        request.input('status', status.toUpperCase());

        await request.query(`
            UPDATE dbo.Users SET status = @status, updatedAt = SYSUTCDATETIME() WHERE id = @userId;
        `);

        return res.status(200).json({
            success: true,
            message: `User status changed to ${status}`
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Banner Management
 */
async function getAllBanners(req, res, next) {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT * FROM dbo.Banners ORDER BY sortOrder ASC, createdAt DESC;
        `);
        return res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

async function upsertBanner(req, res, next) {
    try {
        const { id, title, subtitle, imageUrl, mobileImageUrl, ctaText, ctaUrl, targetPlacement, isActive, sortOrder } = req.body;

        const result = await executeProcedure('dbo.sp_AdminUpsertBanner', {
            Id: id ? parseInt(id, 10) : null,
            Title: title?.trim() ? title.trim() : null,
            Subtitle: subtitle?.trim() ? subtitle.trim() : null,
            ImageUrl: imageUrl,
            MobileImageUrl: mobileImageUrl || null,
            CtaText: ctaText || null,
            CtaUrl: ctaUrl || null,
            TargetPlacement: targetPlacement || 'HOMEPAGE',
            IsActive: isActive !== undefined ? (isActive ? 1 : 0) : 1,
            SortOrder: parseInt(sortOrder || 0, 10)
        });

        return res.status(200).json({
            success: true,
            message: 'Banner saved successfully',
            data: result.recordset[0]
        });
    } catch (error) {
        next(error);
    }
}

async function deleteBanner(req, res, next) {
    try {
        const bannerId = parseInt(req.params.id, 10);
        const pool = await getPool();
        const request = pool.request();
        request.input('id', bannerId);
        await request.query(`DELETE FROM dbo.Banners WHERE id = @id`);

        return res.status(200).json({
            success: true,
            message: 'Banner deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Category Management
 */
async function getAllCategories(req, res, next) {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT * FROM dbo.Categories ORDER BY sortOrder ASC, name ASC;
        `);
        return res.status(200).json({
            success: true,
            count: result.recordset.length,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

async function upsertCategory(req, res, next) {
    try {
        const { id, name, slug, description, imageUrl, isActive, sortOrder } = req.body;

        const result = await executeProcedure('dbo.sp_AdminUpsertCategory', {
            Id: id ? parseInt(id, 10) : null,
            Name: name,
            Slug: slug.toLowerCase().trim(),
            Description: description || null,
            ImageUrl: imageUrl || null,
            IsActive: isActive !== undefined ? (isActive ? 1 : 0) : 1,
            SortOrder: parseInt(sortOrder || 0, 10)
        });

        return res.status(200).json({
            success: true,
            message: 'Category saved successfully',
            data: result.recordset[0]
        });
    } catch (error) {
        next(error);
    }
}

async function deleteCategory(req, res, next) {
    try {
        const categoryId = parseInt(req.params.id, 10);
        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID'
            });
        }

        const pool = await getPool();
        const request = pool.request();
        request.input('id', categoryId);

        // Delete mapping in ExpertCategories first, then delete from Categories
        await request.query(`
            DELETE FROM dbo.ExpertCategories WHERE categoryId = @id;
            DELETE FROM dbo.Categories WHERE id = @id;
        `);

        return res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * CMS Page Management
 */
async function getAllCms(req, res, next) {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT id, slug, title, metaDescription, updatedAt, createdAt 
            FROM dbo.CmsPages 
            ORDER BY title ASC;
        `);
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

async function upsertCms(req, res, next) {
    try {
        const { slug, title, content, metaDescription } = req.body;

        if (!slug || !title || !content) {
            return res.status(400).json({
                success: false,
                message: 'slug, title, and content are required.'
            });
        }

        const result = await executeProcedure('dbo.sp_AdminUpsertCmsPage', {
            Slug: slug.toLowerCase().trim(),
            Title: title,
            Content: content,
            MetaDescription: metaDescription || null
        });

        return res.status(200).json({
            success: true,
            message: 'CMS page updated successfully',
            data: result.recordset[0]
        });
    } catch (error) {
        next(error);
    }
}

async function deleteCms(req, res, next) {
    try {
        const { slug } = req.params;
        if (!slug) {
            return res.status(400).json({
                success: false,
                message: 'Slug parameter is required.'
            });
        }

        const pool = await getPool();
        const request = pool.request();
        request.input('slug', slug.toLowerCase().trim());
        await request.query(`DELETE FROM dbo.CmsPages WHERE slug = @slug;`);

        return res.status(200).json({
            success: true,
            message: `CMS page [${slug}] deleted successfully.`
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Global Settings Management
 */
async function getSettings(req, res, next) {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`SELECT * FROM dbo.Settings;`);
        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

async function updateSetting(req, res, next) {
    try {
        const { key, value, description } = req.body;
        const pool = await getPool();
        const request = pool.request();
        request.input('key', key);
        request.input('value', String(value));
        request.input('description', description || null);

        await request.query(`
            IF EXISTS (SELECT 1 FROM dbo.Settings WHERE [key] = @key)
                UPDATE dbo.Settings SET [value] = @value, description = COALESCE(@description, description), updatedAt = SYSUTCDATETIME() WHERE [key] = @key;
            ELSE
                INSERT INTO dbo.Settings ([key], [value], description) VALUES (@key, @value, @description);
        `);

        return res.status(200).json({
            success: true,
            message: `Setting [${key}] updated successfully`
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Withdrawals Management
 */
async function getWithdrawals(req, res, next) {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                w.*,
                ep.displayName AS expertName,
                u.email AS expertEmail,
                u.phoneNumber AS expertPhone
            FROM dbo.Withdrawals w
            JOIN dbo.ExpertProfiles ep ON ep.id = w.expertId
            JOIN dbo.Users u ON u.id = ep.userId
            ORDER BY w.createdAt DESC;
        `);

        return res.status(200).json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        next(error);
    }
}

async function processWithdrawal(req, res, next) {
    try {
        const withdrawalId = parseInt(req.params.id, 10);
        const { status, adminNotes } = req.body; // 'APPROVED', 'PAID', 'REJECTED'

        const pool = await getPool();
        const request = pool.request();
        request.input('id', withdrawalId);
        request.input('status', status.toUpperCase());
        request.input('adminNotes', adminNotes || null);
        request.input('adminUserId', req.user.id);

        await request.query(`
            UPDATE dbo.Withdrawals
            SET status = @status,
                adminNotes = @adminNotes,
                processedBy = @adminUserId,
                processedAt = SYSUTCDATETIME()
            WHERE id = @id;
        `);

        return res.status(200).json({
            success: true,
            message: `Withdrawal payout updated to ${status}`
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all consultation sessions with filters
 * GET /api/admin/consultations
 */
async function getAllConsultations(req, res, next) {
    try {
        const { status, search } = req.query;
        const pool = await getPool();
        const request = pool.request();

        let query = `
            SELECT 
                c.*,
                uCust.fullName AS customerName,
                uCust.email AS customerEmail,
                uCust.avatarUrl AS customerAvatar,
                ep.displayName AS expertName,
                uExp.email AS expertEmail,
                uExp.avatarUrl AS expertAvatar
            FROM dbo.Consultations c
            JOIN dbo.Users uCust ON uCust.id = c.customerId
            JOIN dbo.ExpertProfiles ep ON ep.id = c.expertId
            JOIN dbo.Users uExp ON uExp.id = ep.userId
            WHERE 1=1
        `;

        if (status && status !== 'ALL') {
            request.input('status', status.toUpperCase());
            query += ` AND c.status = @status`;
        }

        if (search && search.trim()) {
            request.input('search', `%${search.trim()}%`);
            query += ` AND (uCust.fullName LIKE @search OR uCust.email LIKE @search OR ep.displayName LIKE @search OR uExp.email LIKE @search)`;
        }

        query += ` ORDER BY c.requestedAt DESC;`;

        const result = await request.query(query);

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
 * Get chat messages for any consultation session
 * GET /api/admin/consultations/:id/messages
 */
async function getConsultationMessages(req, res, next) {
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
 * Get expert account closure requests
 * GET /api/admin/account-close-requests
 */
async function getAccountCloseRequests(req, res, next) {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                acr.*,
                ep.displayName AS expertName,
                ep.title AS expertTitle,
                ep.approvalStatus,
                ep.isActive,
                u.email AS expertEmail,
                u.phoneNumber AS expertPhone,
                u.avatarUrl AS expertAvatar
            FROM dbo.AccountCloseRequests acr
            JOIN dbo.ExpertProfiles ep ON ep.id = acr.expertId
            JOIN dbo.Users u ON u.id = acr.userId
            ORDER BY acr.requestedAt DESC;
        `);

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
 * Process account closure request (Approve or Reject)
 * PATCH /api/admin/account-close-requests/:id
 */
async function processAccountCloseRequest(req, res, next) {
    try {
        const requestId = parseInt(req.params.id, 10);
        const { status, adminNotes } = req.body; // 'APPROVED', 'REJECTED'

        if (!['APPROVED', 'REJECTED'].includes(status?.toUpperCase())) {
            return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED.' });
        }

        const pool = await getPool();
        const reqDb = pool.request();
        reqDb.input('id', requestId);
        reqDb.input('status', status.toUpperCase());
        reqDb.input('adminNotes', adminNotes || null);

        const updated = await reqDb.query(`
            UPDATE dbo.AccountCloseRequests
            SET status = @status,
                adminNotes = @adminNotes,
                processedAt = SYSUTCDATETIME()
            OUTPUT inserted.expertId, inserted.userId
            WHERE id = @id;
        `);

        const requestRecord = updated.recordset[0];
        if (requestRecord && status.toUpperCase() === 'APPROVED') {
            // Deactivate expert profile
            const deactReq = pool.request();
            deactReq.input('expertId', requestRecord.expertId);
            await deactReq.query(`
                UPDATE dbo.ExpertProfiles 
                SET isActive = 0, isOnline = 0, updatedAt = SYSUTCDATETIME()
                WHERE id = @expertId;
            `);
        }

        return res.status(200).json({
            success: true,
            message: `Account closure request marked as ${status}.`
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all customer reviews across experts
 * GET /api/admin/reviews
 */
async function getAllReviews(req, res, next) {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                r.*,
                uCust.fullName AS customerName,
                uCust.email AS customerEmail,
                uCust.avatarUrl AS customerAvatar,
                ep.id AS expertId,
                ep.displayName AS expertName,
                c.startedAt AS consultationDate
            FROM dbo.Reviews r
            JOIN dbo.Consultations c ON c.id = r.consultationId
            JOIN dbo.Users uCust ON uCust.id = c.customerId
            JOIN dbo.ExpertProfiles ep ON ep.id = c.expertId
            ORDER BY r.createdAt DESC;
        `);

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
 * Delete / Moderate review
 * DELETE /api/admin/reviews/:id
 */
async function deleteReview(req, res, next) {
    try {
        const reviewId = parseInt(req.params.id, 10);
        const pool = await getPool();
        const request = pool.request();
        request.input('id', reviewId);
        await request.query(`DELETE FROM dbo.Reviews WHERE id = @id;`);

        return res.status(200).json({
            success: true,
            message: 'Review deleted successfully.'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get sent notifications log
 * GET /api/admin/notifications
 */
async function getBroadcastNotifications(req, res, next) {
    try {
        const pool = await getPool();
        // Ensure Notifications table exists
        await pool.request().query(`
            IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Notifications (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    userId INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(id) ON DELETE CASCADE,
                    title NVARCHAR(200) NOT NULL,
                    message NVARCHAR(MAX) NOT NULL,
                    type NVARCHAR(50) NOT NULL DEFAULT 'INFO',
                    isRead BIT NOT NULL DEFAULT 0,
                    createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
                );
                CREATE INDEX IX_Notifications_User ON dbo.Notifications(userId, isRead);
            END;
        `);

        const result = await pool.request().query(`
            SELECT TOP 100
                n.*,
                u.email AS recipientEmail,
                u.fullName AS recipientName,
                u.role AS recipientRole
            FROM dbo.Notifications n
            JOIN dbo.Users u ON u.id = n.userId
            ORDER BY n.createdAt DESC;
        `);

        return res.status(200).json({
            success: true,
            data: result.recordset || []
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Dispatch notification / broadcast to experts
 * POST /api/admin/notifications/broadcast
 */
async function sendBroadcastNotification(req, res, next) {
    try {
        const { target, expertId, title, message } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: 'Title and message are required.' });
        }

        const pool = await getPool();

        if (target === 'ALL_EXPERTS' || !expertId) {
            // Send to all registered experts
            const expRes = await pool.request().query(`
                SELECT userId FROM dbo.ExpertProfiles;
            `);

            for (const row of expRes.recordset) {
                const insReq = pool.request();
                insReq.input('userId', row.userId);
                insReq.input('title', title);
                insReq.input('message', message);
                insReq.input('type', 'SYSTEM_BROADCAST');
                await insReq.query(`
                    INSERT INTO dbo.Notifications (userId, title, message, type, isRead, createdAt)
                    VALUES (@userId, @title, @message, @type, 0, SYSUTCDATETIME());
                `);
            }

            return res.status(201).json({
                success: true,
                message: `Broadcast message sent to ${expRes.recordset.length} experts.`
            });
        } else {
            // Specific expert
            const expReq = pool.request();
            expReq.input('expertId', parseInt(expertId, 10));
            const expRes = await expReq.query(`
                SELECT userId FROM dbo.ExpertProfiles WHERE id = @expertId;
            `);

            if (!expRes.recordset[0]) {
                return res.status(404).json({ success: false, message: 'Expert not found.' });
            }

            const insReq = pool.request();
            insReq.input('userId', expRes.recordset[0].userId);
            insReq.input('title', title);
            insReq.input('message', message);
            insReq.input('type', 'SYSTEM_NOTIFICATION');
            await insReq.query(`
                INSERT INTO dbo.Notifications (userId, title, message, type, isRead, createdAt)
                VALUES (@userId, @title, @message, @type, 0, SYSUTCDATETIME());
            `);

            return res.status(201).json({
                success: true,
                message: 'Notification sent to astrologer mailbox.'
            });
        }
    } catch (error) {
        next(error);
    }
}

/**
 * Get all expert uploaded verification documents
 * GET /api/admin/expert-documents
 */
async function getExpertDocuments(req, res, next) {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT 
                ep.id,
                ep.userId,
                ep.displayName,
                ep.title,
                ep.approvalStatus,
                ep.isActive,
                ep.documentUrls,
                u.email,
                u.phoneNumber,
                u.avatarUrl,
                ep.createdAt
            FROM dbo.ExpertProfiles ep
            JOIN dbo.Users u ON u.id = ep.userId
            WHERE ep.documentUrls IS NOT NULL AND ep.documentUrls != ''
            ORDER BY ep.createdAt DESC;
        `);

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
 * Get all products (Admin)
 * GET /api/admin/products
 */
async function getAllProducts(req, res, next) {
    try {
        const { category, search, isActive } = req.query;
        const result = await executeProcedure('dbo.sp_GetAllProducts', {
            Category: category || null,
            Search: search || null,
            IsActive: isActive !== undefined && isActive !== '' ? (isActive === 'true' || isActive === '1' ? 1 : 0) : null
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
 * Get single product by ID (Admin)
 * GET /api/admin/products/:id
 */
async function getProductById(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const result = await executeProcedure('dbo.sp_GetProductById', { Id: id });
        const product = result.recordset[0];
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }
        return res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Create or Update Product (Admin)
 * POST /api/admin/products
 * PUT /api/admin/products/:id
 */
async function upsertProduct(req, res, next) {
    try {
        const id = req.params.id ? parseInt(req.params.id, 10) : (req.body.id ? parseInt(req.body.id, 10) : null);
        const {
            name,
            category = 'Gemstones',
            price,
            originalPrice,
            rating = 5.0,
            reviews = 0,
            planet,
            weight,
            inStock = true,
            image,
            description,
            isActive = true
        } = req.body;

        if (!name || price === undefined || price === null || price === '') {
            return res.status(400).json({
                success: false,
                message: 'Product name and price are required.'
            });
        }

        const result = await executeProcedure('dbo.sp_UpsertProduct', {
            Id: id,
            Name: String(name).trim(),
            Category: String(category || 'Gemstones').trim(),
            Price: parseFloat(price),
            OriginalPrice: originalPrice ? parseFloat(originalPrice) : null,
            Rating: rating ? parseFloat(rating) : 5.0,
            Reviews: reviews ? parseInt(reviews, 10) : 0,
            Planet: planet || null,
            Weight: weight || null,
            InStock: Boolean(inStock),
            Image: image || null,
            Description: description || null,
            IsActive: Boolean(isActive)
        });

        return res.status(200).json({
            success: true,
            message: id ? 'Product updated successfully' : 'Product created successfully',
            data: result.recordset[0]
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete Product (Admin)
 * DELETE /api/admin/products/:id
 */
async function deleteProduct(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        await executeProcedure('dbo.sp_DeleteProduct', { Id: id });
        return res.status(200).json({
            success: true,
            message: 'Product permanently deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get all temple pujas (Admin)
 * GET /api/admin/pujas
 */
async function getAllTemplePujas(req, res, next) {
    try {
        const { search, isActive } = req.query;
        const result = await executeProcedure('dbo.sp_GetAllTemplePujas', {
            Search: search || null,
            IsActive: isActive !== undefined && isActive !== '' ? (isActive === 'true' || isActive === '1' ? 1 : 0) : null
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
 * Get single temple puja by ID (Admin)
 * GET /api/admin/pujas/:id
 */
async function getTemplePujaById(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        const result = await executeProcedure('dbo.sp_GetTemplePujaById', { Id: id });
        const puja = result.recordset[0];
        if (!puja) {
            return res.status(404).json({
                success: false,
                message: 'Temple Puja not found'
            });
        }
        return res.status(200).json({
            success: true,
            data: puja
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Create or Update Temple Puja (Admin)
 * POST /api/admin/pujas
 * PUT /api/admin/pujas/:id
 */
async function upsertTemplePuja(req, res, next) {
    try {
        const id = req.params.id ? parseInt(req.params.id, 10) : (req.body.id ? parseInt(req.body.id, 10) : null);
        const {
            title,
            temple,
            benefits,
            price,
            originalPrice,
            duration,
            pandits,
            date,
            image,
            tags,
            isActive = true
        } = req.body;

        if (!title || !temple || price === undefined || price === null || price === '') {
            return res.status(400).json({
                success: false,
                message: 'Puja title, temple name, and price are required.'
            });
        }

        const result = await executeProcedure('dbo.sp_UpsertTemplePuja', {
            Id: id,
            Title: String(title).trim(),
            Temple: String(temple).trim(),
            Benefits: benefits || null,
            Price: parseFloat(price),
            OriginalPrice: originalPrice ? parseFloat(originalPrice) : null,
            Duration: duration || null,
            Pandits: pandits || null,
            Date: date || null,
            Image: image || null,
            Tags: Array.isArray(tags) ? tags.join(', ') : (tags || null),
            IsActive: Boolean(isActive)
        });

        return res.status(200).json({
            success: true,
            message: id ? 'Temple Puja updated successfully' : 'Temple Puja created successfully',
            data: result.recordset[0]
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Delete Temple Puja (Admin)
 * DELETE /api/admin/pujas/:id
 */
async function deleteTemplePuja(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        await executeProcedure('dbo.sp_DeleteTemplePuja', { Id: id });
        return res.status(200).json({
            success: true,
            message: 'Temple Puja permanently deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getDashboardStats,
    getAllExperts,
    getPendingExperts,
    reviewExpert,
    toggleExpertActive,
    deleteExpert,
    getAllUsers,
    updateUserStatus,
    getAllBanners,
    upsertBanner,
    deleteBanner,
    getAllCategories,
    upsertCategory,
    deleteCategory,
    getAllCms,
    upsertCms,
    deleteCms,
    getSettings,
    updateSetting,
    getWithdrawals,
    processWithdrawal,
    getAllConsultations,
    getConsultationMessages,
    getAccountCloseRequests,
    processAccountCloseRequest,
    getAllReviews,
    deleteReview,
    getBroadcastNotifications,
    sendBroadcastNotification,
    getExpertDocuments,
    // E-Commerce Products & Pujas
    getAllProducts,
    getProductById,
    upsertProduct,
    deleteProduct,
    getAllTemplePujas,
    getTemplePujaById,
    upsertTemplePuja,
    deleteTemplePuja
};

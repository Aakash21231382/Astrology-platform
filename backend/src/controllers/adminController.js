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
async function upsertCms(req, res, next) {
    try {
        const { slug, title, content, metaDescription } = req.body;

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
    upsertCms,
    getSettings,
    updateSetting,
    getWithdrawals,
    processWithdrawal
};

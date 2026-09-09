const { executeProcedure } = require('../config/db');

/**
 * Get current authenticated user details + wallet balance
 * GET /api/users/me
 */
async function getMe(req, res, next) {
    try {
        const result = await executeProcedure('dbo.sp_GetUserById', {
            UserId: req.user.id
        });

        const user = result.recordset[0];
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update personal profile
 * PUT /api/users/me
 */
async function updateProfile(req, res, next) {
    try {
        const { fullName, phoneNumber, avatarUrl } = req.body;

        await executeProcedure('dbo.sp_RegisterUser', { // or custom update query
            // Will run custom update procedure or direct update
        });

        const pool = await require('../config/db').getPool();
        const request = pool.request();
        request.input('userId', req.user.id);
        request.input('fullName', fullName || null);
        request.input('phoneNumber', phoneNumber || null);
        request.input('avatarUrl', avatarUrl || null);

        await request.query(`
            UPDATE dbo.Users
            SET fullName = COALESCE(@fullName, fullName),
                phoneNumber = COALESCE(@phoneNumber, phoneNumber),
                avatarUrl = COALESCE(@avatarUrl, avatarUrl),
                updatedAt = SYSUTCDATETIME()
            WHERE id = @userId;
        `);

        const result = await executeProcedure('dbo.sp_GetUserById', {
            UserId: req.user.id
        });

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: result.recordset[0]
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getMe,
    updateProfile
};

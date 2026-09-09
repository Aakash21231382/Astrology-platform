/**
 * Role-Based Access Control Middleware
 * @param  {...string} roles Allowed roles ('CUSTOMER', 'EXPERT', 'ADMIN')
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (req.user.status === 'BLOCKED') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended. Please contact support.'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Role [${req.user.role}] is not authorized for this resource.`
            });
        }

        next();
    };
}

module.exports = {
    requireRole
};

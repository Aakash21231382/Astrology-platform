const express = require('express');
const {
    getApprovedList,
    getPublicProfile,
    getMyProfile,
    upsertProfile,
    setAvailability,
    getEarnings,
    requestWithdrawal
} = require('../controllers/expertController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

// Expert protected actions
router.get('/profile/me', authenticateToken, requireRole('EXPERT'), getMyProfile);
router.put('/profile', authenticateToken, requireRole('EXPERT'), upsertProfile);
router.put('/availability', authenticateToken, requireRole('EXPERT'), setAvailability);
router.get('/account/earnings', authenticateToken, requireRole('EXPERT'), getEarnings);
router.post('/account/withdrawals', authenticateToken, requireRole('EXPERT'), requestWithdrawal);

// Public discovery
router.get('/', getApprovedList);
router.get('/:id', getPublicProfile);

module.exports = router;

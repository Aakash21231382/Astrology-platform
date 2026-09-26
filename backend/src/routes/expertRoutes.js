const express = require('express');
const {
    getApprovedList,
    getPublicProfile,
    getMyProfile,
    upsertProfile,
    setAvailability,
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
} = require('../controllers/expertController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

// Expert protected actions
router.get('/profile/me', authenticateToken, requireRole('EXPERT'), getMyProfile);
router.put('/profile', authenticateToken, requireRole('EXPERT'), upsertProfile);
router.put('/availability', authenticateToken, requireRole('EXPERT'), setAvailability);
router.get('/schedule', authenticateToken, requireRole('EXPERT'), getExpertSchedule);
router.put('/schedule', authenticateToken, requireRole('EXPERT'), updateExpertSchedule);
router.get('/account/earnings', authenticateToken, requireRole('EXPERT'), getEarnings);
router.post('/account/withdrawals', authenticateToken, requireRole('EXPERT'), requestWithdrawal);
router.get('/account/clients', authenticateToken, requireRole('EXPERT'), getMyClients);
router.get('/account/mailbox', authenticateToken, requireRole('EXPERT'), getMailbox);
router.patch('/account/mailbox/:id/read', authenticateToken, requireRole('EXPERT'), markMailboxRead);
router.get('/account/payment-options', authenticateToken, requireRole('EXPERT'), getPaymentOptions);
router.put('/account/payment-options', authenticateToken, requireRole('EXPERT'), savePaymentOptions);
router.post('/account/close-request', authenticateToken, requireRole('EXPERT'), requestAccountClose);
router.post('/account/documents', authenticateToken, requireRole('EXPERT'), updateDocuments);

// Public discovery
router.get('/', getApprovedList);
router.get('/:id', getPublicProfile);

module.exports = router;

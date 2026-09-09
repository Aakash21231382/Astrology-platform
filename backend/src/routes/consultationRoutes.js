const express = require('express');
const {
    requestConsultation,
    getConsultation,
    getMessages,
    getHistory,
    getActiveForExpert,
    submitReview
} = require('../controllers/consultationController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

router.use(authenticateToken);

router.post('/request', requireRole('CUSTOMER'), requestConsultation);
router.get('/history', getHistory);
router.get('/active-for-expert', requireRole('EXPERT'), getActiveForExpert);
router.get('/:id', getConsultation);
router.get('/:id/messages', getMessages);
router.post('/reviews', requireRole('CUSTOMER'), submitReview);

module.exports = router;

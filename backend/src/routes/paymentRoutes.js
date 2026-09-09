const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);

module.exports = router;

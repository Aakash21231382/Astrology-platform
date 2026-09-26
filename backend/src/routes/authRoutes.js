const express = require('express');
const { 
    register, 
    registerExpert, 
    login, 
    sendOtp, 
    verifyOtp,
    forgotPassword,
    resetPassword,
    changePassword
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/expert/signup', registerExpert);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;

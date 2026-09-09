const express = require('express');
const { 
    register, 
    registerExpert, 
    login, 
    sendOtp, 
    verifyOtp,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/expert/signup', registerExpert);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;

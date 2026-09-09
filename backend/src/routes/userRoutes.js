const express = require('express');
const { getMe, updateProfile } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/me', getMe);
router.put('/me', updateProfile);

module.exports = router;

const express = require('express');
const { getWalletAndHistory, addMoneyDirect } = require('../controllers/walletController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getWalletAndHistory);
router.post('/add-money', addMoneyDirect);

module.exports = router;

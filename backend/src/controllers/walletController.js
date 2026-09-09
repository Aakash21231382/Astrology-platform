const { executeProcedure } = require('../config/db');

/**
 * Get wallet balance and ledger transaction history
 * GET /api/wallet
 */
async function getWalletAndHistory(req, res, next) {
    try {
        const pageNumber = parseInt(req.query.page || 1, 10);
        const pageSize = parseInt(req.query.limit || 20, 10);

        const result = await executeProcedure('dbo.sp_GetWalletBalanceAndHistory', {
            UserId: req.user.id,
            PageNumber: pageNumber,
            PageSize: pageSize
        });

        const wallet = result.recordsets[0]?.[0] || { balance: 0.00, currency: 'INR' };
        const transactions = result.recordsets[1] || [];

        return res.status(200).json({
            success: true,
            data: {
                wallet,
                transactions
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Direct Wallet Top-Up (for Development/Testing or Instant Top-up)
 * POST /api/wallet/add-money
 */
async function addMoneyDirect(req, res, next) {
    try {
        const { amount, note = 'Manual wallet top-up' } = req.body;
        const creditAmount = parseFloat(amount);

        if (!creditAmount || creditAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'A valid recharge amount is required.'
            });
        }

        const idempotencyKey = `TOPUP_${req.user.id}_${Date.now()}`;

        const result = await executeProcedure('dbo.sp_CreateWalletTransaction', {
            UserId: req.user.id,
            Type: 'TOPUP',
            Amount: creditAmount,
            Direction: 'CREDIT',
            ReferenceType: 'MANUAL_TEST',
            ReferenceId: idempotencyKey,
            IdempotencyKey: idempotencyKey,
            Note: note
        });

        return res.status(200).json({
            success: true,
            message: `₹${creditAmount.toFixed(2)} credited to your wallet successfully.`,
            data: result.recordset[0]
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getWalletAndHistory,
    addMoneyDirect
};

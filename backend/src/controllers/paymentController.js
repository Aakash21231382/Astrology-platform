const crypto = require('crypto');
const Razorpay = require('razorpay');
const { executeProcedure } = require('../config/db');

const KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret';

let razorpayInstance = null;
if (KEY_ID && KEY_SECRET && KEY_ID !== 'rzp_test_placeholder') {
    razorpayInstance = new Razorpay({
        key_id: KEY_ID,
        key_secret: KEY_SECRET
    });
}

/**
 * Create Razorpay Order
 * POST /api/payments/create-order
 */
async function createOrder(req, res, next) {
    try {
        const { amount } = req.body;
        const topupAmount = parseFloat(amount);

        if (!topupAmount || topupAmount < 10) {
            return res.status(400).json({
                success: false,
                message: 'Minimum topup amount is ₹10.'
            });
        }

        let orderId;
        const amountInPaise = Math.round(topupAmount * 100);

        if (razorpayInstance) {
            const options = {
                amount: amountInPaise,
                currency: 'INR',
                receipt: `rcpt_${req.user.id}_${Date.now()}`
            };
            const order = await razorpayInstance.orders.create(options);
            orderId = order.id;
        } else {
            // Simulated Test Order for development without live Razorpay keys
            orderId = `order_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        }

        // Record order in MS SQL
        const result = await executeProcedure('dbo.sp_RecordPaymentOrder', {
            UserId: req.user.id,
            OrderId: orderId,
            Amount: topupAmount,
            Currency: 'INR',
            IdempotencyKey: `ORDER_${orderId}`
        });

        return res.status(200).json({
            success: true,
            data: {
                orderId,
                amount: topupAmount,
                currency: 'INR',
                keyId: KEY_ID
            }
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Verify Razorpay Payment Signature
 * POST /api/payments/verify
 */
async function verifyPayment(req, res, next) {
    try {
        const { orderId, paymentId, signature } = req.body;

        if (!orderId || !paymentId) {
            return res.status(400).json({
                success: false,
                message: 'orderId and paymentId are required.'
            });
        }

        // If running with real Razorpay keys, verify HMAC SHA256 signature
        if (razorpayInstance && signature) {
            const generatedSignature = crypto
                .createHmac('sha256', KEY_SECRET)
                .update(`${orderId}|${paymentId}`)
                .digest('hex');

            if (generatedSignature !== signature) {
                return res.status(400).json({
                    success: false,
                    message: 'Payment verification failed: Invalid signature.'
                });
            }
        }

        // Record payment & credit wallet ledger in atomic Stored Procedure
        const result = await executeProcedure('dbo.sp_VerifyPaymentOrder', {
            OrderId: orderId,
            PaymentId: paymentId,
            Signature: signature || 'test_mode_signature'
        });

        return res.status(200).json({
            success: true,
            message: 'Payment verified and wallet credited successfully.',
            data: result.recordset[0]
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createOrder,
    verifyPayment
};

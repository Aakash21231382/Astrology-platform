import { walletService } from '../services/api';
import { toast } from 'react-toastify';

/**
 * Load Razorpay Checkout Script dynamically if not already in document
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay SDK from CDN.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Initiate Razorpay Payment
 * @param {Object} params
 * @param {number} params.amount - Topup amount in INR
 * @param {Object} params.user - Current logged-in user object
 * @param {string} [params.description] - Payment description
 * @returns {Promise<Object>} Verification response data
 */
export const processRazorpayPayment = async ({ amount, user, description = 'Wallet Recharge' }) => {
  const numAmount = parseFloat(amount);
  if (!numAmount || numAmount < 10) {
    throw new Error('Minimum recharge amount is ₹10.');
  }

  // 1. Create order on backend
  const orderRes = await walletService.createOrder({ amount: numAmount });
  const { orderId, keyId, currency } = orderRes.data.data;

  // Check if we have real Razorpay keys or placeholder
  const isRealRazorpay = keyId && keyId.startsWith('rzp_') && keyId !== 'rzp_test_placeholder';

  if (isRealRazorpay) {
    await loadRazorpayScript();

    if (!window.Razorpay) {
      throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
    }

    return new Promise((resolve, reject) => {
      const options = {
        key: keyId,
        amount: Math.round(numAmount * 100),
        currency: currency || 'INR',
        name: 'VVIP Psychics',
        description: description,
        order_id: orderId,
        prefill: {
          name: user?.fullName || 'Valued Seeker',
          email: user?.email || '',
          contact: user?.phoneNumber || ''
        },
        theme: {
          color: '#7c3aed'
        },
        handler: async function (response) {
          try {
            const verifyRes = await walletService.verifyPayment({
              orderId: orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });
            resolve(verifyRes.data);
          } catch (err) {
            reject(new Error(err.response?.data?.message || 'Payment verification failed.'));
          }
        },
        modal: {
          ondismiss: function () {
            reject(new Error('Payment was cancelled by user.'));
          }
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          reject(new Error(resp.error?.description || 'Payment transaction failed.'));
        });
        rzp.open();
      } catch (err) {
        reject(err);
      }
    });
  } else {
    // Development / Test mode with test placeholder
    // Complete simulated Razorpay test payment
    const simulatedPaymentId = `pay_test_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const verifyRes = await walletService.verifyPayment({
      orderId: orderId,
      paymentId: simulatedPaymentId,
      signature: 'test_mode_simulated_signature'
    });
    return verifyRes.data;
  }
};

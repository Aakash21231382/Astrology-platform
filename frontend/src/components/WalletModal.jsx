import React, { useState } from 'react';
import { IoClose, IoWalletOutline } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { processRazorpayPayment } from '../utils/razorpay';
import { toast } from 'react-toastify';
import '../assets/css/modals.css';

export default function WalletModal({ isOpen, onClose, onSuccess, currentBalance = 0 }) {
  const [amount, setAmount] = useState(200);
  const [loading, setLoading] = useState(false);
  const { user, refreshUser } = useAuth();

  if (!isOpen) return null;

  const handleRecharge = async () => {
    if (!amount || amount < 10) {
      toast.error('Minimum recharge amount is ₹10');
      return;
    }

    setLoading(true);
    try {
      // Process through Razorpay Payment Gateway
      const res = await processRazorpayPayment({
        amount: parseFloat(amount),
        user,
        description: `Wallet Recharge of ₹${amount}`
      });
      await refreshUser();
      toast.success(res?.message || `₹${amount} added to wallet successfully via Razorpay!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      if (err.message && err.message.includes('cancelled')) {
        toast.info('Payment was cancelled.');
      } else {
        toast.error(err.message || 'Failed to recharge wallet.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop-overlay">
      <div className="modal-dialog-box wallet-dialog-box">
        <button 
          onClick={onClose}
          className="modal-round-close-btn"
        >
          <IoClose />
        </button>

        <div className="wallet-modal-header">
          <div className="wallet-modal-icon-wrap">
            <IoWalletOutline />
          </div>
          <h3 className="wallet-modal-title">Recharge Wallet</h3>
          <p className="wallet-modal-balance">
            Current Balance: <strong>₹{parseFloat(currentBalance).toFixed(2)}</strong>
          </p>
        </div>

        <div>
          <label className="wallet-field-label">
            Select Quick Amount (INR)
          </label>
          <div className="wallet-quick-amounts-grid">
            {[100, 200, 500, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt)}
                className={`wallet-amount-pill ${amount === amt ? 'active' : ''}`}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <label className="wallet-field-label">
            Or Enter Custom Amount
          </label>
          <input
            type="number"
            min="10"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="wallet-custom-input"
          />
        </div>

        <button
          onClick={handleRecharge}
          disabled={loading}
          className="btn-gold wallet-submit-btn"
        >
          {loading ? 'Processing Top-up...' : `Add ₹${amount} to Wallet`}
        </button>

        <p className="consult-safe-note">
          🔒 100% Safe & Encrypted Payment via Razorpay
        </p>
      </div>
    </div>
  );
}

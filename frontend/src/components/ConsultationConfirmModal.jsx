import React, { useState, useEffect } from 'react';
import { 
  IoClose, 
  IoChatbubbleEllipses, 
  IoCall, 
  IoWalletOutline, 
  IoShieldCheckmark, 
  IoGiftOutline, 
  IoLockClosedOutline, 
  IoCheckmarkCircleOutline 
} from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { processRazorpayPayment } from '../utils/razorpay';
import { toast } from 'react-toastify';
import '../assets/css/modals.css';

export default function ConsultationConfirmModal({
  isOpen,
  onClose,
  expert,
  mode = 'CALL',
  onConfirmStart
}) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState(mode);

  useEffect(() => {
    setActiveMode(mode);
  }, [mode, isOpen]);

  const rate = parseFloat(expert?.pricePerMinute || 20);
  const freeMins = parseInt(expert?.freeMinutes || 0, 10);
  const hasFreeMinutes = freeMins > 0;
  const userBalance = parseFloat(user?.walletBalance || 0);

  // Minimum required balance to start is 1 minute (or 0 if free promotional minutes offered)
  const minRequiredBalance = hasFreeMinutes ? 0 : rate;
  const hasSufficientBalance = hasFreeMinutes || userBalance >= minRequiredBalance;
  const shortfall = Math.max(10, Math.ceil(minRequiredBalance - userBalance));

  const [rechargeAmount, setRechargeAmount] = useState(shortfall);

  useEffect(() => {
    if (shortfall > 0) {
      setRechargeAmount(shortfall);
    }
  }, [shortfall]);

  if (!isOpen || !expert) return null;

  const isAudioCall = activeMode === 'CALL';

  // Handle direct consultation start
  const handleStartConsultation = async () => {
    setLoading(true);
    try {
      await onConfirmStart(expert, activeMode);
      onClose();
    } catch (err) {
      console.error('Failed to start consultation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Razorpay recharge then start chat
  const handleRechargeAndStart = async () => {
    if (!rechargeAmount || rechargeAmount < 10) {
      toast.error('Minimum recharge amount is ₹10');
      return;
    }

    setLoading(true);
    try {
      // 1. Process Razorpay Payment
      const payRes = await processRazorpayPayment({
        amount: parseFloat(rechargeAmount),
        user,
        description: `Consultation Recharge for ${expert.displayName}`
      });

      // 2. Refresh user wallet balance
      await refreshUser();
      toast.success(payRes?.message || 'Wallet recharged successfully via Razorpay!');

      // 3. Automatically initialize consultation
      await onConfirmStart(expert, activeMode);
      onClose();
    } catch (err) {
      if (err.message && err.message.includes('cancelled')) {
        toast.info('Payment was cancelled. You can recharge anytime.');
      } else {
        toast.error(err.message || 'Payment processing failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop-overlay">
      <div className="modal-dialog-box consult-confirm-dialog">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="modal-round-close-btn"
        >
          <IoClose />
        </button>

        {/* Expert Summary Header */}
        <div className="consult-expert-summary">
          <img
            src={expert.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
            alt={expert.displayName}
            className="consult-avatar-img"
          />
          <div>
            <h3 className="consult-expert-name">
              {expert.displayName}
            </h3>
            <p className="consult-expert-title">
              {expert.title || 'Astrology Consultant'}
            </p>
            <div className="consult-meta-row">
              <span className="consult-online-badge">
                ● Online & Ready
              </span>
              <span className="consult-rate-text">
                ₹{rate}/min
              </span>
            </div>
          </div>
        </div>

        {/* Consultation Mode Selector (Audio Call vs Live Chat) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setActiveMode('CALL')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: isAudioCall ? '2px solid #FF6B00' : '1px solid #cbd5e1',
              background: isAudioCall ? '#FFF7ED' : '#ffffff',
              color: isAudioCall ? '#FF6B00' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <IoCall style={{ fontSize: '16px' }} />
            <span>Voice Call</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('CHAT')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: !isAudioCall ? '2px solid #800000' : '1px solid #cbd5e1',
              background: !isAudioCall ? '#fff5f5' : '#ffffff',
              color: !isAudioCall ? '#800000' : '#64748b',
              fontWeight: 700,
              fontSize: '13.5px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <IoChatbubbleEllipses style={{ fontSize: '16px' }} />
            <span>Live Chat</span>
          </button>
        </div>

        {/* Offer Status Card */}
        {hasFreeMinutes ? (
          /* Free Minutes Available */
          <div className="consult-offer-banner free">
            <div className="consult-offer-heading">
              <IoGiftOutline style={{ fontSize: '18px' }} />
              <span>{freeMins} Free Promotional Minutes Available!</span>
            </div>
            <p className="consult-offer-desc">
              The first {freeMins} minutes are completely free of charge. After your free time, the session will continue at ₹{rate}/minute billed from your wallet.
            </p>
          </div>
        ) : (
          /* No Free Minutes - Paid Consultation */
          <div className="consult-offer-banner paid">
            <div className="consult-offer-heading">
              <IoLockClosedOutline style={{ fontSize: '16px', color: '#7c3aed' }} />
              <span>Paid Consultation (Standard ₹{rate}/min)</span>
            </div>
            <p className="consult-offer-desc">
              This expert does not offer free promotional minutes. Consultations are billed on a per-minute basis from your wallet balance.
            </p>
          </div>
        )}

        {/* Wallet Balance Status */}
        <div className="consult-wallet-strip">
          <div className="consult-wallet-label-wrap">
            <IoWalletOutline className="consult-wallet-icon" />
            <span className="consult-wallet-label">Your Wallet Balance:</span>
          </div>
          <span className="consult-wallet-balance-val">
            ₹{userBalance.toFixed(2)}
          </span>
        </div>

        {/* Action Controls */}
        {hasFreeMinutes || hasSufficientBalance ? (
          /* Sufficient balance or free minutes: Allow direct start */
          <div>
            <div className="consult-status-msg success">
              <IoCheckmarkCircleOutline style={{ fontSize: '18px', color: '#EA580C', flexShrink: 0 }} />
              <span>
                {hasFreeMinutes 
                  ? `Promotional free time available! First ${freeMins} mins are 100% free.`
                  : `Sufficient balance available! Chat will be deducted @ ₹${rate}/min directly from your wallet.`}
              </span>
            </div>

            <button
              onClick={handleStartConsultation}
              disabled={loading}
              className={`consult-action-btn start-free ${isAudioCall ? 'start-call-btn' : ''}`}
              style={{
                background: isAudioCall ? 'linear-gradient(135deg, #FF6B00, #FF6B00)' : undefined
              }}
            >
              {isAudioCall ? <IoCall style={{ fontSize: '18px' }} /> : <IoChatbubbleEllipses style={{ fontSize: '18px' }} />}
              {loading 
                ? (isAudioCall ? 'Connecting Call...' : 'Starting Chat...') 
                : hasFreeMinutes 
                  ? (isAudioCall ? `Start Free Call (${freeMins} Mins)` : `Start Free Chat (${freeMins} Mins)`) 
                  : (isAudioCall ? 'Start Audio Call (From Wallet)' : 'Start Chat Now (From Wallet)')}
            </button>
          </div>
        ) : (
          /* Low Balance: User must recharge via Razorpay first */
          <div>
            <div className="consult-status-msg warning">
              ⚠️ Minimum balance required to start {isAudioCall ? 'call' : 'chat'} is ₹{minRequiredBalance} (1 minute). Please recharge your wallet via <strong>Razorpay</strong> to initiate this consultation.
            </div>

            {/* Quick Amount Selector */}
            <div className="consult-quick-grid">
              {[100, 200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setRechargeAmount(amt)}
                  className={`consult-quick-btn ${rechargeAmount === amt ? 'active' : ''}`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            {/* Razorpay Gateway Action Button */}
            <button
              onClick={handleRechargeAndStart}
              disabled={loading}
              className="consult-action-btn recharge-start"
              style={{
                background: isAudioCall ? 'linear-gradient(135deg, #FF6B00, #FF6B00)' : undefined
              }}
            >
              <IoWalletOutline style={{ fontSize: '18px' }} />
              {loading ? 'Processing Razorpay...' : `Pay ₹${rechargeAmount} via Razorpay & Start ${isAudioCall ? 'Call' : 'Chat'}`}
            </button>
          </div>
        )}

        <div className="consult-safe-note">
          <IoShieldCheckmark style={{ color: '#FF6B00', fontSize: '14px' }} />
          <span>100% Encrypted & Safe Payment via Razorpay</span>
        </div>
      </div>
    </div>
  );
}

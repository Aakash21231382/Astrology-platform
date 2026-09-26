import React, { useState } from 'react';
import { IoCloseCircleOutline, IoAlertCircleOutline, IoSendOutline } from 'react-icons/io5';
import { expertService } from '../../services/api';
import { toast } from 'react-toastify';

export default function AccountClosePage() {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please enter the reason for your account closure request.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await expertService.requestAccountClose({ reason });
      toast.success(res.data?.message || 'Request submitted successfully.');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit account closure request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="expert-content-container">
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoCloseCircleOutline style={{ color: '#800000', fontSize: '24px' }} />
              Account Close / Deactivation Request
            </h2>
            <p className="expert-card-desc">
              Submit a formal request to platform management to deactivate your astrologer profile.
            </p>
          </div>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', background: '#fffef9', borderRadius: '14px', border: '1px solid #E2E8F0', margin: '16px 0' }}>
            <IoCloseCircleOutline style={{ fontSize: '54px', color: '#FF6B00', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#800000', margin: '0 0 8px 0' }}>
              Closure Request Under Review
            </h3>
            <p style={{ fontSize: '13.5px', color: '#4a3b32', margin: 0, maxWidth: '560px', marginInline: 'auto' }}>
              Your account deactivation request has been logged. Platform administration will process it within 24 to 48 business hours.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginTop: '16px' }}>
            
            {/* Left Column: Closure Form */}
            <form onSubmit={handleSubmit}>
              <div className="expert-input-group">
                <label className="expert-input-label">Reason for Account Closure *</label>
                <textarea
                  rows={6}
                  required
                  className="expert-form-textarea"
                  placeholder="Enter reason for account closure..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-expert-primary"
                style={{ background: '#800000' }}
              >
                <IoSendOutline style={{ fontSize: '16px' }} />
                {submitting ? 'Submitting Request...' : 'Submit Closure Request'}
              </button>
            </form>

            {/* Right Column: Policy & Guidelines */}
            <div>
              <div style={{ background: '#fffcf0', border: '1px solid #fae29f', borderLeft: '4px solid #b45309', padding: '22px', borderRadius: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#800000', fontSize: '14px', marginBottom: '10px' }}>
                  <IoAlertCircleOutline style={{ fontSize: '22px', color: '#b45309' }} /> Please Read Before Requesting:
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#4a3b32', lineHeight: '1.7' }}>
                  <li><strong>Withdraw Remaining Funds:</strong> Please request a payout of all available wallet balances prior to submitting your closure request.</li>
                  <li><strong>Settle Active Consultations:</strong> Any ongoing or pending seeker chat requests must be cleared or completed.</li>
                  <li><strong>Profile Unlisting:</strong> Upon administrative approval, your public listing, badges, and seeker reviews will be archived from search results.</li>
                  <li><strong>Reactivation Policy:</strong> If you wish to rejoin in the future, re-verification of your documents will be required by our onboarding team.</li>
                </ul>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

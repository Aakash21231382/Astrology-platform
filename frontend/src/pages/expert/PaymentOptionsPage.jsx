import React, { useState, useEffect } from 'react';
import { IoCardOutline, IoSaveOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
import { expertService } from '../../services/api';
import { toast } from 'react-toastify';

export default function PaymentOptionsPage() {
  const [formData, setFormData] = useState({
    beneficiaryName: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    upiId: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    expertService.getPaymentOptions()
      .then(res => {
        if (res.data?.data) {
          const d = res.data.data;
          setFormData({
            beneficiaryName: d.beneficiaryName || '',
            bankName: d.bankName || '',
            accountNumber: d.accountNumber || '',
            confirmAccountNumber: d.accountNumber || '',
            ifscCode: d.ifscCode || '',
            upiId: d.upiId || ''
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.accountNumber && formData.accountNumber !== formData.confirmAccountNumber) {
      toast.error('Bank account numbers do not match.');
      return;
    }

    setSaving(true);
    try {
      await expertService.savePaymentOptions(formData);
      toast.success('Payment & payout details saved successfully!');
    } catch (err) {
      toast.error('Failed to save payment options.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="expert-content-container">
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoCardOutline style={{ color: '#800000', fontSize: '24px' }} />
              Payment & Payout Options
            </h2>
            <p className="expert-card-desc">
              Configure your default bank account and UPI details for automatic withdrawal disbursements.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginTop: '16px' }}>
          {/* Left Column: Bank & UPI Configuration Form */}
          <form onSubmit={handleSubmit}>
            <div className="expert-input-group">
              <label className="expert-input-label">Beneficiary Account Holder Name *</label>
              <input
                type="text"
                required
                className="expert-form-input"
                placeholder="Enter account holder name"
                value={formData.beneficiaryName}
                onChange={e => setFormData({ ...formData, beneficiaryName: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="expert-input-group">
                <label className="expert-input-label">Bank Name</label>
                <input
                  type="text"
                  className="expert-form-input"
                  placeholder="Enter bank name"
                  value={formData.bankName}
                  onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                />
              </div>

              <div className="expert-input-group">
                <label className="expert-input-label">IFSC Code</label>
                <input
                  type="text"
                  className="expert-form-input"
                  placeholder="Enter IFSC code"
                  value={formData.ifscCode}
                  onChange={e => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="expert-input-group">
                <label className="expert-input-label">Bank Account Number</label>
                <input
                  type="password"
                  className="expert-form-input"
                  placeholder="Enter account number"
                  value={formData.accountNumber}
                  onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                />
              </div>

              <div className="expert-input-group">
                <label className="expert-input-label">Confirm Account Number</label>
                <input
                  type="text"
                  className="expert-form-input"
                  placeholder="Confirm account number"
                  value={formData.confirmAccountNumber}
                  onChange={e => setFormData({ ...formData, confirmAccountNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="expert-input-group">
              <label className="expert-input-label">Primary UPI ID (Instant Payouts)</label>
              <input
                type="text"
                className="expert-form-input"
                placeholder="Enter UPI ID"
                value={formData.upiId}
                onChange={e => setFormData({ ...formData, upiId: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-expert-primary"
              style={{ marginTop: '8px' }}
            >
              <IoSaveOutline style={{ fontSize: '18px' }} />
              {saving ? 'Saving...' : 'Save Payment Options'}
            </button>
          </form>

          {/* Right Column: Payout Information & Security Box */}
          <div>
            <div style={{ background: '#fffef9', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#800000', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IoShieldCheckmarkOutline style={{ color: '#FF6B00', fontSize: '22px' }} />
                Disbursement & Settlement Information
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', color: '#4a3b32', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', marginTop: '7px', flexShrink: 0 }}></span>
                  <span><strong>Supported Methods:</strong> Direct National Electronic Funds Transfer (NEFT/IMPS) and instant UPI payments.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', marginTop: '7px', flexShrink: 0 }}></span>
                  <span><strong>Settlement Schedule:</strong> Payout requests are verified and disbursed every business day between 10:00 AM and 6:00 PM.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', marginTop: '7px', flexShrink: 0 }}></span>
                  <span><strong>Name Verification:</strong> Ensure the beneficiary name matches the legal name on your verified banking documents.</span>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '14px 16px', background: '#f2f8ed', border: '1px solid #c9e2b3', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IoShieldCheckmarkOutline style={{ color: '#FF6B00', fontSize: '22px', flexShrink: 0 }} />
                <span style={{ fontSize: '12.5px', color: '#2d5016', fontWeight: 600 }}>
                  Bank details are encrypted using AES-256 and never shared with third parties.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

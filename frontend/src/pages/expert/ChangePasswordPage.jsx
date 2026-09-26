import React, { useState } from 'react';
import { IoKeyOutline, IoEyeOutline, IoEyeOffOutline, IoShieldCheckmarkOutline, IoLockClosedOutline } from 'react-icons/io5';
import { authService } from '../../services/api';
import { toast } from 'react-toastify';

export default function ChangePasswordPage() {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All fields are required.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password cannot be identical to your current password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success(res.data?.message || 'Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password. Please verify current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="expert-content-container">
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoKeyOutline style={{ color: '#800000', fontSize: '22px' }} />
              Change Account Password
            </h2>
            <p className="expert-card-desc">
              Keep your consultation portal secure by updating your password regularly.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginTop: '16px' }}>
          
          {/* Left Column: Password Update Form */}
          <form onSubmit={handleSubmit}>
            <div className="expert-input-group">
              <label className="expert-input-label">Current Password *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  className="expert-form-input"
                  style={{ paddingRight: '44px' }}
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: '#800000', fontSize: '20px', cursor: 'pointer', display: 'flex' }}
                  title={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </button>
              </div>
            </div>

            <div className="expert-input-group">
              <label className="expert-input-label">New Password *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="expert-form-input"
                  style={{ paddingRight: '44px' }}
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: '#800000', fontSize: '20px', cursor: 'pointer', display: 'flex' }}
                  title={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </button>
              </div>
            </div>

            <div className="expert-input-group">
              <label className="expert-input-label">Confirm New Password *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={6}
                  className="expert-form-input"
                  style={{ paddingRight: '44px' }}
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '12px', background: 'transparent', border: 'none', color: '#800000', fontSize: '20px', cursor: 'pointer', display: 'flex' }}
                  title={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <IoEyeOffOutline /> : <IoEyeOutline />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-expert-primary"
              style={{ marginTop: '8px' }}
            >
              <IoLockClosedOutline style={{ fontSize: '18px' }} />
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>

          {/* Right Column: Security Standards & Guidance Card */}
          <div>
            <div style={{ background: '#fffef9', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#800000', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <IoShieldCheckmarkOutline style={{ color: '#FF6B00', fontSize: '22px' }} />
                Account Security Standards
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#6b3a3a', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', marginTop: '7px', flexShrink: 0 }}></span>
                  <span><strong>Minimum Length:</strong> Password must be at least 6 characters long.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', marginTop: '7px', flexShrink: 0 }}></span>
                  <span><strong>Complexity:</strong> Combine uppercase, lowercase, numbers, and symbols for high resistance against brute-force attempts.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', marginTop: '7px', flexShrink: 0 }}></span>
                  <span><strong>Confidentiality:</strong> Never disclose your astrologer credentials or OTP to anyone, including platform support staff.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', marginTop: '7px', flexShrink: 0 }}></span>
                  <span><strong>Device Hygiene:</strong> Avoid saving your credentials on public or shared computers.</span>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '12px 16px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IoShieldCheckmarkOutline style={{ color: '#276727', fontSize: '20px', flexShrink: 0 }} />
                <span style={{ fontSize: '12.5px', color: '#276727', fontWeight: 700 }}>
                  End-to-end encrypted session authentication active.
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

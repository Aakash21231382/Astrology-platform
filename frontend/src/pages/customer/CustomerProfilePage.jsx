import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  IoPersonOutline,
  IoSparkles,
  IoKeyOutline,
  IoCheckmarkCircle,
  IoCalendarOutline,
  IoTimeOutline,
  IoLocationOutline
} from 'react-icons/io5';
import { userService, authService } from '../../services/api';
import { toast } from 'react-toastify';

export default function CustomerProfilePage() {
  const { user, refreshUser } = useOutletContext();

  // Basic Profile Info
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Kundali Birth Details (stored in user profile or local kundali cache)
  const [dob, setDob] = useState(localStorage.getItem('kundali_dob') || '1995-05-15');
  const [tob, setTob] = useState(localStorage.getItem('kundali_tob') || '10:30');
  const [city, setCity] = useState(localStorage.getItem('kundali_city') || 'New Delhi');
  const [gender, setGender] = useState(localStorage.getItem('kundali_gender') || 'Male');
  const [savingKundali, setSavingKundali] = useState(false);

  // Password Change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // Handle Basic Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await userService.updateProfile({
        fullName,
        phoneNumber,
        avatarUrl
      });
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Kundali Details Save
  const handleSaveKundali = (e) => {
    e.preventDefault();
    setSavingKundali(true);
    try {
      localStorage.setItem('kundali_dob', dob);
      localStorage.setItem('kundali_tob', tob);
      localStorage.setItem('kundali_city', city);
      localStorage.setItem('kundali_gender', gender);
      toast.success('Kundali birth details saved! Astrologers will use this during readings.');
    } catch (err) {
      toast.error('Failed to save birth details.');
    } finally {
      setSavingKundali(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: oldPassword,
        newPassword
      });
      toast.success('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password. Please verify current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div>
      {/* 1. Basic Personal Profile */}
      <div className="customer-card">
        <div className="customer-card-header">
          <h3 className="customer-card-title">
            <IoPersonOutline style={{ color: '#FF6B00' }} />
            Personal Profile Information
          </h3>
        </div>

        <form onSubmit={handleUpdateProfile}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <img
              src={avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt="Avatar"
              style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #FF6B00' }}
            />
            <div style={{ flex: 1, minWidth: '220px' }}>
              <label className="customer-form-label">Profile Image URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Enter image URL"
                className="customer-form-input"
              />
            </div>
          </div>

          <div className="customer-form-row">
            <div className="customer-form-group">
              <label className="customer-form-label">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                required
                className="customer-form-input"
              />
            </div>

            <div className="customer-form-group">
              <label className="customer-form-label">Email Address (Read-only)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="customer-form-input"
                style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
              />
            </div>

            <div className="customer-form-group">
              <label className="customer-form-label">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                className="customer-form-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="customer-header-consult-btn"
            style={{ border: 'none', cursor: 'pointer', padding: '10px 24px' }}
          >
            {savingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* 2. Kundali Birth Chart Details */}
      <div className="customer-card">
        <div className="customer-card-header">
          <div>
            <h3 className="customer-card-title">
              <IoSparkles style={{ color: '#d97706' }} />
              Spiritual & Kundali Birth Details
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0' }}>
              Used to instantly generate your Vedic Horoscope / Kundali during live consultation sessions.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveKundali}>
          <div className="customer-form-row">
            <div className="customer-form-group">
              <label className="customer-form-label">
                <IoCalendarOutline style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="customer-form-input"
              />
            </div>

            <div className="customer-form-group">
              <label className="customer-form-label">
                <IoTimeOutline style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                Time of Birth (Approx)
              </label>
              <input
                type="time"
                value={tob}
                onChange={(e) => setTob(e.target.value)}
                className="customer-form-input"
              />
            </div>

            <div className="customer-form-group">
              <label className="customer-form-label">
                <IoLocationOutline style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                Place of Birth (City / State)
              </label>
              <input
                type="text"
                placeholder="Enter place of birth"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="customer-form-input"
              />
            </div>

            <div className="customer-form-group">
              <label className="customer-form-label">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="customer-form-select"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingKundali}
            className="customer-sidebar-cta"
            style={{ border: 'none', cursor: 'pointer', padding: '10px 24px', display: 'inline-flex' }}
          >
            {savingKundali ? 'Saving...' : 'Save Kundali Data'}
          </button>
        </form>
      </div>

      {/* 3. Change Password Card */}
      <div className="customer-card">
        <div className="customer-card-header">
          <h3 className="customer-card-title">
            <IoKeyOutline style={{ color: '#4c1d95' }} />
            Security & Change Password
          </h3>
        </div>

        <form onSubmit={handleChangePassword}>
          <div className="customer-form-row">
            <div className="customer-form-group">
              <label className="customer-form-label">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="customer-form-input"
              />
            </div>

            <div className="customer-form-group">
              <label className="customer-form-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="customer-form-input"
              />
            </div>

            <div className="customer-form-group">
              <label className="customer-form-label">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="customer-form-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={changingPassword}
            style={{
              background: '#4c1d95',
              color: '#ffffff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            {changingPassword ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

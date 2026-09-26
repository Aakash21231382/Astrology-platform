import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  IoCashOutline, 
  IoChatbubblesOutline, 
  IoStar, 
  IoTimeOutline, 
  IoCheckmarkCircle, 
  IoAlertCircleOutline, 
  IoArrowUpCircleOutline, 
  IoSettingsOutline,
  IoPersonOutline,
  IoCameraOutline,
  IoRadioOutline,
  IoGlobeOutline,
  IoNotificationsOutline,
  IoEyeOutline,
  IoEyeOffOutline,
  IoShieldCheckmarkOutline,
  IoCheckmark,
  IoKeyOutline,
  IoLockClosedOutline
} from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { expertService, consultationService, uploadService, publicService, authService } from '../services/api';
import { connectSocket } from '../services/socket';
import { toast } from 'react-toastify';
import '../assets/css/expert-dashboard.css';
import '../assets/css/dashboard.css';

// Pleasant incoming notification chime using Web Audio API
function playIncomingChatTone() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Note 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Note 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.18);
    gain2.gain.setValueAtTime(0.25, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.warn('Audio chime warning:', err);
  }
}

export default function ExpertDashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'rates' | 'history' | 'payout' | 'security'

  // Loading States
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Incoming consultation alert
  const [incomingConsultation, setIncomingConsultation] = useState(null);

  // Categories list
  const [categoriesList, setCategoriesList] = useState([]);

  // Full Profile State
  const [profile, setProfile] = useState({
    id: null,
    userId: null,
    fullName: '',
    title: '',
    handle: '',
    bio: '',
    experienceYears: 5,
    languages: 'English, Hindi',
    categoryIds: [],
    pricePerMinute: 25,
    freeMinutes: 5,
    rating: 5.0,
    totalConsultations: 0,
    isOnline: false,
    isActive: true,
    isVerified: true,
    avatarUrl: '',
    phone: '',
    location: ''
  });

  // Financials & History
  const [earnings, setEarnings] = useState(null);
  const [history, setHistory] = useState([]);

  // Payout Modal
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutUpi, setPayoutUpi] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Change Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    loadAllExpertData();
  }, []);

  // Socket & Real-Time Incoming Chat Listener
  useEffect(() => {
    const socket = connectSocket();

    const handleIncomingConsultation = (data) => {
      console.log('Incoming consultation notification:', data);
      setIncomingConsultation(data);
      playIncomingChatTone();
      toast.info(`Incoming Live Chat from ${data.customerName || 'Seeker'}! Click to join.`, {
        autoClose: 10000
      });
    };

    if (socket) {
      socket.on('consultation:incoming', handleIncomingConsultation);
    }

    // Periodic check for active/pending consultations (in case page refreshed)
    const interval = setInterval(async () => {
      try {
        const res = await consultationService.getActiveForExpert();
        if (res?.data?.data && res.data.data.length > 0) {
          const activeItem = res.data.data[0];
          setIncomingConsultation({
            consultationId: activeItem.id,
            customerId: activeItem.customerId,
            customerName: activeItem.customerName || 'Seeker',
            status: activeItem.status
          });
        }
      } catch (e) {
        // silent polling failure
      }
    }, 15000);
    
    return () => {
      if (socket) {
        socket.off('consultation:incoming', handleIncomingConsultation);
      }
      clearInterval(interval);
    };
  }, []);

  async function loadAllExpertData() {
    setLoading(true);
    try {
      // 1. Fetch profile from dedicated /me endpoint
      const profilePromise = expertService.getMyProfile().catch(() => null);
      // 2. Fetch categories
      const catPromise = publicService.getCategories().catch(() => null);
      // 3. Fetch earnings
      const earnPromise = expertService.getEarnings().catch(() => null);
      // 4. Fetch history
      const histPromise = consultationService.getHistory().catch(() => null);
      // 5. Check active consultations
      const activePromise = consultationService.getActiveForExpert().catch(() => null);

      const [profRes, catRes, earnRes, histRes, activeRes] = await Promise.all([
        profilePromise,
        catPromise,
        earnPromise,
        histPromise,
        activePromise
      ]);

      if (catRes?.data?.data) {
        setCategoriesList(catRes.data.data);
      }

      if (earnRes?.data?.data) {
        setEarnings(earnRes.data.data);
      }

      if (histRes?.data?.data) {
        setHistory(histRes.data.data);
      }

      if (activeRes?.data?.data && activeRes.data.data.length > 0) {
        const activeItem = activeRes.data.data[0];
        setIncomingConsultation({
          consultationId: activeItem.id,
          customerId: activeItem.customerId,
          customerName: activeItem.customerName || 'Seeker',
          status: activeItem.status
        });
      }

      if (profRes?.data?.data) {
        const p = profRes.data.data;
        // Parse categoryIds if string "1,2,3"
        let parsedCatIds = [];
        if (Array.isArray(p.categoryIds)) {
          parsedCatIds = p.categoryIds;
        } else if (typeof p.categoryIds === 'string' && p.categoryIds.trim()) {
          parsedCatIds = p.categoryIds.split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean);
        }

        setProfile({
          id: p.id || user?.expertProfileId,
          userId: p.userId || user?.id,
          fullName: p.fullName || user?.fullName || '',
          title: p.title || 'Vedic Astrologer & Tarot Reader',
          handle: p.handle || '',
          bio: p.bio || '',
          experienceYears: p.experienceYears !== undefined ? p.experienceYears : 5,
          languages: p.languages || 'English, Hindi',
          categoryIds: parsedCatIds,
          pricePerMinute: p.pricePerMinute !== undefined ? parseFloat(p.pricePerMinute) : 25,
          freeMinutes: p.freeMinutes !== undefined ? parseInt(p.freeMinutes, 10) : 5,
          rating: p.rating || 5.0,
          totalConsultations: p.totalConsultations || histRes?.data?.data?.length || 0,
          isOnline: Boolean(p.isOnline),
          isActive: p.isActive !== undefined ? Boolean(p.isActive) : true,
          isVerified: Boolean(p.isVerified),
          avatarUrl: p.avatarUrl || user?.avatarUrl || '',
          phone: p.phone || user?.phone || '',
          location: p.location || ''
        });
      }
    } catch (err) {
      console.error('Error loading expert dashboard:', err);
      toast.error('Failed to load some expert profile details.');
    } finally {
      setLoading(false);
    }
  }

  // Toggle Online Status (for live chat)
  const handleToggleOnline = async (e) => {
    const nextOnline = e.target.checked;
    setUpdatingAvailability(true);
    try {
      const res = await expertService.setAvailability({
        isOnline: nextOnline,
        isActive: profile.isActive
      });
      setProfile(prev => ({ ...prev, isOnline: nextOnline }));
      if (nextOnline) {
        toast.success('Live Chat Status is now ONLINE! Seekers can initiate chat sessions.');
      } else {
        toast.info('Live Chat Status is now OFFLINE. Live chat requests paused.');
      }
    } catch (err) {
      toast.error('Failed to update live chat availability.');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  // Toggle Marketplace Web Active Status (Public Listing)
  const handleToggleActive = async (e) => {
    const nextActive = e.target.checked;
    setUpdatingAvailability(true);
    try {
      const res = await expertService.setAvailability({
        isOnline: profile.isOnline,
        isActive: nextActive
      });
      setProfile(prev => ({ ...prev, isActive: nextActive }));
      if (nextActive) {
        toast.success('Your profile is now ACTIVE and visible on the website marketplace!');
      } else {
        toast.warn('Your profile is now INACTIVE and hidden from public search/listing on the web.');
      }
    } catch (err) {
      toast.error('Failed to update web listing status.');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  // Avatar Image Upload
  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const res = await uploadService.uploadFile(file);
      const newUrl = typeof res === 'string' ? res : (res?.url || res?.data?.url || res?.data?.data?.url);
      if (newUrl) {
        setProfile(prev => ({ ...prev, avatarUrl: newUrl }));
        toast.success('Profile photo uploaded! Click "Save Profile" to apply changes.');
      } else {
        toast.error('Could not get uploaded image URL.');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error('Failed to upload image. You can also paste an image URL directly.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Category selection toggle
  const toggleCategory = (catId) => {
    setProfile(prev => {
      const exists = prev.categoryIds.includes(catId);
      const nextIds = exists 
        ? prev.categoryIds.filter(id => id !== catId)
        : [...prev.categoryIds, catId];
      return { ...prev, categoryIds: nextIds };
    });
  };

  // Save Full Profile Details
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await expertService.updateProfile({
        displayName: profile.fullName,
        title: profile.title,
        bio: profile.bio,
        experienceYears: parseInt(profile.experienceYears, 10) || 0,
        languages: profile.languages,
        categoryIds: profile.categoryIds.join(','),
        pricePerMinute: parseFloat(profile.pricePerMinute) || 25,
        freeMinutes: parseInt(profile.freeMinutes, 10) || 0,
        avatarUrl: profile.avatarUrl,
        phone: profile.phone,
        location: profile.location
      });
      toast.success('Profile updated successfully!');
      if (refreshUser) refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Request Payout
  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const amt = parseFloat(payoutAmount);
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid payout amount.');
      return;
    }

    setSubmittingPayout(true);
    try {
      await expertService.requestWithdrawal({
        amount: amt,
        bankDetails: { upi: payoutUpi }
      });
      toast.success('Payout withdrawal request submitted to admin for approval!');
      setPayoutModalOpen(false);
      setPayoutAmount('');
      setPayoutUpi('');
      loadAllExpertData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payout request failed.');
    } finally {
      setSubmittingPayout(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required.');
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
      toast.error('New password cannot be the same as your current password.');
      return;
    }

    setChangingPassword(true);
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
      toast.error(err.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="expert-dashboard-wrap">
      <div className="astro-container">
        
        {/* ===================================================================
            1. TOP PROFILE HERO BANNER WITH DUAL STATUS SWITCHES
           =================================================================== */}
        <div className="expert-profile-hero">
          
          {/* Left: Avatar with live upload & Details */}
          <div className="expert-profile-left">
            <div className="expert-avatar-wrap">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="expert-avatar-img" />
              ) : (
                <div className="expert-avatar-placeholder">
                  <IoPersonOutline />
                </div>
              )}
              <label 
                className="avatar-upload-btn" 
                title={uploadingAvatar ? 'Uploading...' : 'Change Profile Photo'}
                onClick={() => fileInputRef.current?.click()}
              >
                <IoCameraOutline style={{ fontSize: '16px' }} />
              </label>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="avatar-upload-input" 
                accept="image/*"
                onChange={handleAvatarFileSelect}
                disabled={uploadingAvatar}
              />
            </div>

            <div className="expert-intro-details">
              <h1>
                {profile.fullName || 'Astrologer / Reader'}
                {profile.isVerified && (
                  <IoShieldCheckmarkOutline style={{ color: '#EA580C', fontSize: '20px' }} title="Verified Expert" />
                )}
              </h1>
              <p className="expert-title-sub">{profile.title || 'Expert Reader & Astrologer'}</p>
              
              <div className="expert-badges-row">
                <span className="badge-tag badge-verified">
                  <IoCheckmarkCircle /> Verified Reader
                </span>
                <span className="badge-tag badge-rating">
                  <IoStar style={{ color: '#d97706' }} /> {profile.rating || '5.0'} Rating
                </span>
                <span className="badge-tag badge-category">
                  {profile.experienceYears} Years Exp
                </span>
                {profile.id && (
                  <Link 
                    to={`/expert/${profile.id}`} 
                    target="_blank" 
                    className="badge-tag"
                    style={{ background: '#f1f5f9', color: '#334155', textDecoration: 'none', border: '1px solid #cbd5e1' }}
                  >
                    <IoGlobeOutline /> View Public Profile
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right: Dual Availability Switches */}
          <div className="expert-switches-panel">
            
            {/* Switch 1: Live Chat Availability (isOnline) */}
            <div className="switch-group-box">
              <div>
                <div className="switch-info-title">
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: profile.isOnline ? '#FF6B00' : '#94a3b8',
                    display: 'inline-block'
                  }}></span>
                  Live Chat: {profile.isOnline ? 'ONLINE' : 'OFFLINE'}
                </div>
                <p className="switch-info-sub">
                  {profile.isOnline ? 'Ready for instant chats' : 'Paused / Offline'}
                </p>
              </div>

              <label className="toggle-switch-input" title="Toggle Live Chat Availability">
                <input 
                  type="checkbox" 
                  checked={profile.isOnline} 
                  onChange={handleToggleOnline}
                  disabled={updatingAvailability}
                />
                <span className="toggle-switch-track"></span>
              </label>
            </div>

            {/* Switch 2: Marketplace Web Visibility (isActive) */}
            <div className="switch-group-box">
              <div>
                <div className="switch-info-title">
                  {profile.isActive ? (
                    <IoEyeOutline style={{ color: '#7c3aed', fontSize: '15px' }} />
                  ) : (
                    <IoEyeOffOutline style={{ color: '#94a3b8', fontSize: '15px' }} />
                  )}
                  Web Listing: {profile.isActive ? 'ACTIVE' : 'INACTIVE'}
                </div>
                <p className="switch-info-sub">
                  {profile.isActive ? 'Visible in public search' : 'Hidden from readers list'}
                </p>
              </div>

              <label className="toggle-switch-input" title="Toggle Public Web Listing">
                <input 
                  type="checkbox" 
                  checked={profile.isActive} 
                  onChange={handleToggleActive}
                  disabled={updatingAvailability}
                />
                <span className="toggle-switch-track active-marketplace"></span>
              </label>
            </div>

          </div>
        </div>

        {/* ===================================================================
            2. REAL-TIME INCOMING CONSULTATION ALERT BANNER
           =================================================================== */}
        {incomingConsultation && (
          <div className="incoming-consultation-banner">
            <div className="incoming-alert-left">
              <div className="incoming-pulse-icon">
                <IoNotificationsOutline />
              </div>
              <div>
                <h3 className="incoming-alert-title">
                  Incoming Live Consultation Request!
                </h3>
                <p className="incoming-alert-desc">
                  Seeker <strong>{incomingConsultation.customerName || 'Client'}</strong> has initiated a live chat consultation session with you (Session #{incomingConsultation.consultationId}).
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link 
                to={`/consultation/${incomingConsultation.consultationId}`}
                className="incoming-join-btn"
              >
                <IoChatbubblesOutline style={{ fontSize: '18px' }} /> Join Live Chat Now
              </Link>
              <button 
                onClick={() => setIncomingConsultation(null)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#92400e', 
                  fontSize: '13px', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  padding: '6px 12px'
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            3. KPI STATS OVERVIEW
           =================================================================== */}
        <div className="expert-kpi-grid">
          
          <div className="expert-kpi-card">
            <div className="kpi-icon-circle kpi-green">
              <IoCashOutline />
            </div>
            <div className="kpi-data-wrap">
              <div className="kpi-number">
                ₹{parseFloat(earnings?.summary?.availableForWithdrawal || 0).toFixed(2)}
              </div>
              <div className="kpi-title">Available for Payout</div>
              <button 
                onClick={() => setPayoutModalOpen(true)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#EA580C', 
                  fontWeight: 700, 
                  fontSize: '12px', 
                  marginTop: '6px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  padding: 0
                }}
              >
                <IoArrowUpCircleOutline style={{ fontSize: '15px' }} /> Request Withdrawal
              </button>
            </div>
          </div>

          <div className="expert-kpi-card">
            <div className="kpi-icon-circle kpi-purple">
              <IoCashOutline />
            </div>
            <div className="kpi-data-wrap">
              <div className="kpi-number">
                ₹{parseFloat(earnings?.summary?.totalNetEarnings || 0).toFixed(2)}
              </div>
              <div className="kpi-title">Total Lifetime Earnings</div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Gross Consultations: ₹{earnings?.summary?.totalGross || 0}
              </span>
            </div>
          </div>

          <div className="expert-kpi-card">
            <div className="kpi-icon-circle kpi-gold">
              <IoChatbubblesOutline />
            </div>
            <div className="kpi-data-wrap">
              <div className="kpi-number">{history.length}</div>
              <div className="kpi-title">Consultation Sessions</div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Completed & Paid
              </span>
            </div>
          </div>

          <div className="expert-kpi-card">
            <div className="kpi-icon-circle kpi-blue">
              <IoStar />
            </div>
            <div className="kpi-data-wrap">
              <div className="kpi-number">{profile.rating || '5.0'} / 5.0</div>
              <div className="kpi-title">Client Satisfaction</div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Based on verified seeker reviews
              </span>
            </div>
          </div>

        </div>

        {/* ===================================================================
            4. NAVIGATION TABS
           =================================================================== */}
        <div className="expert-tabs-bar">
          <button 
            className={`expert-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <IoPersonOutline /> Profile & Bio
          </button>
          <button 
            className={`expert-tab-btn ${activeTab === 'rates' ? 'active' : ''}`}
            onClick={() => setActiveTab('rates')}
          >
            <IoSettingsOutline /> Pricing & Free Minutes
          </button>
          <button 
            className={`expert-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <IoChatbubblesOutline /> Consultation History ({history.length})
          </button>
          <button 
            className={`expert-tab-btn ${activeTab === 'payout' ? 'active' : ''}`}
            onClick={() => setActiveTab('payout')}
          >
            <IoCashOutline /> Payouts & Earnings
          </button>
          <button 
            className={`expert-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <IoKeyOutline /> Change Password
          </button>
        </div>

        {/* ===================================================================
            5. TAB 1: FULL PROFILE & BIO EDITOR
           =================================================================== */}
        {activeTab === 'profile' && (
          <div className="expert-panel-card">
            <h3 className="panel-header-title">
              <IoPersonOutline style={{ color: '#7c3aed' }} /> Edit Complete Expert Profile
            </h3>
            <p className="panel-header-desc">
              Keep your profile updated with your latest expertise, profile photo, languages, and bio to attract more seekers.
            </p>

            <form onSubmit={handleSaveProfile}>
              <div className="expert-form-grid">
                
                {/* Full Name */}
                <div className="expert-input-group">
                  <label>Full Display Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={profile.fullName} 
                    onChange={e => setProfile({ ...profile, fullName: e.target.value })} 
                    placeholder="Enter full name"
                  />
                </div>

                {/* Professional Title */}
                <div className="expert-input-group">
                  <label>Professional Headline / Title *</label>
                  <input 
                    type="text" 
                    required 
                    value={profile.title} 
                    onChange={e => setProfile({ ...profile, title: e.target.value })} 
                    placeholder="Enter title or specialization"
                  />
                </div>

                {/* Experience in Years */}
                <div className="expert-input-group">
                  <label>Years of Experience *</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="60" 
                    required 
                    value={profile.experienceYears} 
                    onChange={e => setProfile({ ...profile, experienceYears: e.target.value })} 
                  />
                </div>

                {/* Languages */}
                <div className="expert-input-group">
                  <label>Languages Spoken (comma separated) *</label>
                  <input 
                    type="text" 
                    required 
                    value={profile.languages} 
                    onChange={e => setProfile({ ...profile, languages: e.target.value })} 
                    placeholder="Enter languages spoken"
                  />
                </div>

                {/* Contact Phone */}
                <div className="expert-input-group">
                  <label>Contact Phone Number</label>
                  <input 
                    type="text" 
                    value={profile.phone} 
                    onChange={e => setProfile({ ...profile, phone: e.target.value })} 
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Location */}
                <div className="expert-input-group">
                  <label>Location / City</label>
                  <input 
                    type="text" 
                    value={profile.location} 
                    onChange={e => setProfile({ ...profile, location: e.target.value })} 
                    placeholder="Enter location or city"
                  />
                </div>

                {/* Avatar URL / Direct Image Upload */}
                <div className="expert-input-group form-full-width">
                  <label>Profile Image URL (or use photo icon above to upload file)</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="url" 
                      value={profile.avatarUrl} 
                      onChange={e => setProfile({ ...profile, avatarUrl: e.target.value })} 
                      placeholder="Enter image URL"
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-outline"
                      style={{ whiteSpace: 'nowrap', padding: '0 16px' }}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? 'Uploading...' : 'Choose File'}
                    </button>
                  </div>
                </div>

                {/* Categories Selection */}
                <div className="expert-input-group form-full-width">
                  <label>Expertise Categories (Select all that apply)</label>
                  <div className="expert-category-chips">
                    {categoriesList.map(cat => {
                      const isSelected = profile.categoryIds.includes(cat.id);
                      return (
                        <div 
                          key={cat.id}
                          className={`category-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleCategory(cat.id)}
                        >
                          {isSelected && <IoCheckmark style={{ marginRight: '4px' }} />}
                          {cat.name}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bio / About */}
                <div className="expert-input-group form-full-width">
                  <label>Detailed Bio & Spiritual Journey *</label>
                  <textarea 
                    rows="5" 
                    required 
                    value={profile.bio} 
                    onChange={e => setProfile({ ...profile, bio: e.target.value })} 
                    placeholder="Enter your bio and experience..."
                  />
                </div>

              </div>

              <div className="expert-form-actions">
                <button 
                  type="submit" 
                  className="expert-btn-save"
                  disabled={savingProfile}
                >
                  <IoCheckmarkCircle /> {savingProfile ? 'Saving Profile...' : 'Save Complete Profile'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===================================================================
            6. TAB 2: CONSULTATION PRICING & FREE MINUTES
           =================================================================== */}
        {activeTab === 'rates' && (
          <div className="expert-panel-card">
            <h3 className="panel-header-title">
              <IoSettingsOutline style={{ color: '#7c3aed' }} /> Pricing & Promotional Offerings
            </h3>
            <p className="panel-header-desc">
              Control your per-minute consultation fee and optional promotional free minutes to welcome first-time clients.
            </p>

            <form onSubmit={handleSaveProfile}>
              <div className="expert-form-grid">
                
                <div className="expert-input-group">
                  <label>Consultation Price Per Minute (INR) *</label>
                  <input 
                    type="number" 
                    min="5" 
                    max="1000" 
                    required 
                    value={profile.pricePerMinute} 
                    onChange={e => setProfile({ ...profile, pricePerMinute: e.target.value })} 
                  />
                  <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Platform retains 20% commission. You receive ₹{(parseFloat(profile.pricePerMinute || 0) * 0.8).toFixed(2)} per minute.
                  </span>
                </div>

                <div className="expert-input-group">
                  <label>Promotional Free Minutes for First-Time Seekers</label>
                  <select 
                    value={profile.freeMinutes} 
                    onChange={e => setProfile({ ...profile, freeMinutes: e.target.value })}
                  >
                    <option value="0">No Free Minutes</option>
                    <option value="3">3 Free Minutes</option>
                    <option value="5">5 Free Minutes (Recommended to boost conversion)</option>
                    <option value="10">10 Free Minutes</option>
                  </select>
                  <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Helps new seekers experience your reading before billable time starts.
                  </span>
                </div>

              </div>

              <div className="expert-form-actions">
                <button 
                  type="submit" 
                  className="expert-btn-save"
                  disabled={savingProfile}
                >
                  <IoCheckmarkCircle /> {savingProfile ? 'Updating Rates...' : 'Update Pricing Rules'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ===================================================================
            7. TAB 3: CONSULTATION HISTORY
           =================================================================== */}
        {activeTab === 'history' && (
          <div className="expert-panel-card">
            <h3 className="panel-header-title">
              <IoChatbubblesOutline style={{ color: '#7c3aed' }} /> All Consultation Sessions
            </h3>
            <p className="panel-header-desc">
              A comprehensive log of all seeker chat sessions, billed duration, and net earnings.
            </p>

            {history.length > 0 ? (
              <div className="table-responsive">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>Session ID</th>
                      <th>Client Name</th>
                      <th>Date</th>
                      <th>Duration</th>
                      <th>Gross</th>
                      <th>Platform 20%</th>
                      <th>Net Earning</th>
                      <th>Status</th>
                      <th>Chat Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600 }}>#{c.id}</td>
                        <td style={{ fontWeight: 600 }}>{c.customerName || 'Seeker'}</td>
                        <td>{new Date(c.requestedAt).toLocaleDateString()}</td>
                        <td>{Math.round((c.totalDurationSeconds || 0) / 60)} mins</td>
                        <td>₹{c.grossAmount || 0}</td>
                        <td style={{ color: '#64748b' }}>₹{c.platformCommission || 0}</td>
                        <td style={{ fontWeight: 700, color: '#C2410C' }}>₹{c.expertEarning || 0}</td>
                        <td>
                          <span className={`status-tag ${c.status === 'COMPLETED' ? 'success' : 'pending'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <Link 
                            to={`/consultation/${c.id}`} 
                            style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}
                          >
                            Open Room →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#64748b', padding: '24px 0' }}>No consultation records yet.</p>
            )}
          </div>
        )}

        {/* ===================================================================
            8. TAB 4: PAYOUTS & EARNINGS
           =================================================================== */}
        {activeTab === 'payout' && (
          <div className="expert-panel-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 className="panel-header-title">
                  <IoCashOutline style={{ color: '#7c3aed' }} /> Earnings & Payout Ledger
                </h3>
                <p className="panel-header-desc">
                  Track your available balance and submit withdrawal requests to your bank or UPI.
                </p>
              </div>

              <button 
                onClick={() => setPayoutModalOpen(true)}
                className="expert-btn-save"
                style={{ background: '#EA580C' }}
              >
                <IoArrowUpCircleOutline style={{ fontSize: '18px' }} /> Request Payout
              </button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '14px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>AVAILABLE FOR WITHDRAWAL</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#EA580C' }}>
                    ₹{parseFloat(earnings?.summary?.availableForWithdrawal || 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>TOTAL NET EARNINGS</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
                    ₹{parseFloat(earnings?.summary?.totalNetEarnings || 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>COMMISSION WITHHELD (20%)</span>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#64748b' }}>
                    ₹{parseFloat(earnings?.summary?.totalCommission || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '20px 0 12px 0' }}>Recent Payout Transactions</h4>
            {earnings?.payouts && earnings.payouts.length > 0 ? (
              <div className="table-responsive">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>Payout ID</th>
                      <th>Requested At</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Account / UPI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.payouts.map(p => (
                      <tr key={p.id}>
                        <td>#{p.id}</td>
                        <td>{new Date(p.requestedAt).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 700 }}>₹{p.amount}</td>
                        <td>
                          <span className={`status-tag ${p.status === 'COMPLETED' ? 'success' : 'pending'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>{p.bankDetails?.upi || 'Bank Transfer'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#64748b' }}>No withdrawal requests submitted yet.</p>
            )}
          </div>
        )}

        {/* ===================================================================
            8. TAB 5: CHANGE PASSWORD & SECURITY
           =================================================================== */}
        {activeTab === 'security' && (
          <div className="expert-panel-card">
            <h3 className="panel-header-title">
              <IoKeyOutline style={{ color: '#7c3aed' }} /> Change Account Password
            </h3>
            <p className="panel-header-desc">
              Ensure your astrologer account stays secure by using a strong password. You will need your current password to set a new one.
            </p>

            <form onSubmit={handleChangePassword} style={{ maxWidth: '640px', marginTop: '24px' }}>
              <div className="expert-security-form-group">
                <label className="security-label">Current Password *</label>
                <div className="security-input-wrapper">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="security-input"
                  />
                  <button
                    type="button"
                    className="security-eye-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    title={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                  </button>
                </div>
              </div>

              <div className="expert-security-form-group">
                <label className="security-label">New Password *</label>
                <div className="security-input-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Enter new password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="security-input"
                  />
                  <button
                    type="button"
                    className="security-eye-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                  </button>
                </div>
              </div>

              <div className="expert-security-form-group">
                <label className="security-label">Confirm New Password *</label>
                <div className="security-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="security-input"
                  />
                  <button
                    type="button"
                    className="security-eye-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                  </button>
                </div>
              </div>

              {/* Security Guidelines */}
              <div className="security-tips-box">
                <div className="security-tips-title">
                  <IoShieldCheckmarkOutline /> Password Security Guidelines:
                </div>
                <ul className="security-tips-list">
                  <li>At least <strong>6 characters</strong> long.</li>
                  <li>Use a combination of uppercase, lowercase letters, numbers, and symbols.</li>
                  <li>Never share your password or OTP code with anyone.</li>
                </ul>
              </div>

              <div style={{ marginTop: '28px' }}>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="expert-btn-save"
                >
                  <IoKeyOutline style={{ fontSize: '18px' }} />
                  {changingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* =====================================================================
          9. PAYOUT WITHDRAWAL MODAL
         ===================================================================== */}
      {payoutModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px'
        }}>
          <div style={{ background: '#ffffff', borderRadius: '18px', maxWidth: '440px', width: '100%', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>
              Request Payout Withdrawal
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              Available Balance: <strong style={{ color: '#EA580C' }}>₹{parseFloat(earnings?.summary?.availableForWithdrawal || 0).toFixed(2)}</strong>
            </p>

            <form onSubmit={handleRequestPayout}>
              <div className="expert-input-group" style={{ marginBottom: '16px' }}>
                <label>Withdrawal Amount (INR) *</label>
                <input
                  type="number"
                  required
                  min="10"
                  max={earnings?.summary?.availableForWithdrawal || 0}
                  placeholder="Enter amount"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                />
              </div>

              <div className="expert-input-group" style={{ marginBottom: '24px' }}>
                <label>UPI ID or Bank Account Details *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter UPI ID or bank details"
                  value={payoutUpi}
                  onChange={(e) => setPayoutUpi(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="btn-outline"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="expert-btn-save"
                  style={{ flex: 1, justifyContent: 'center', background: '#EA580C' }}
                >
                  {submittingPayout ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  IoStar, 
  IoCashOutline, 
  IoChatbubblesOutline, 
  IoCheckmarkCircle, 
  IoGlobeOutline,
  IoArrowForwardOutline,
  IoShieldCheckmarkOutline,
  IoSparklesOutline
} from 'react-icons/io5';
import { expertService } from '../../services/api';
import { toast } from 'react-toastify';

export default function MyProfilesPage() {
  const { profile, setProfile, refreshProfile } = useOutletContext();
  const [earnings, setEarnings] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    expertService.getEarnings()
      .then(res => {
        if (res.data?.data) setEarnings(res.data.data);
      })
      .catch(console.error);
  }, []);

  const handleToggleActive = async (e) => {
    const nextActive = e.target.checked;
    setUpdating(true);
    try {
      await expertService.setAvailability({
        isOnline: profile.isOnline,
        isActive: nextActive
      });
      setProfile(prev => ({ ...prev, isActive: nextActive }));
      if (nextActive) {
        toast.success('Your profile is now ACTIVE and visible on the marketplace search!');
      } else {
        toast.warn('Your profile is now INACTIVE and hidden from public searches.');
      }
    } catch (err) {
      toast.error('Failed to update marketplace active status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="expert-content-container">
      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        <div className="expert-card" style={{ padding: '20px', margin: 0 }}>
          <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
            Available Payout
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#FF6B00' }}>
            ₹{parseFloat(earnings?.summary?.availableForWithdrawal || 0).toFixed(2)}
          </div>
          <Link to="/expert/dashboard/withdrawals" style={{ fontSize: '12.5px', color: '#FF6B00', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
            Withdraw Funds <IoArrowForwardOutline />
          </Link>
        </div>

        <div className="expert-card" style={{ padding: '20px', margin: 0 }}>
          <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
            Total Consultations
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#800000' }}>
            {profile?.totalConsultations || 0}
          </div>
          <Link to="/expert/dashboard/chat-history" style={{ fontSize: '12.5px', color: '#FF6B00', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
            View Sessions <IoArrowForwardOutline />
          </Link>
        </div>

        <div className="expert-card" style={{ padding: '20px', margin: 0 }}>
          <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
            Client Rating
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IoStar /> {profile?.rating || '5.0'}
          </div>
          <span style={{ fontSize: '12px', color: '#6b3a3a' }}>
            {profile?.totalReviews || 0} Verified Reviews
          </span>
        </div>

        <div className="expert-card" style={{ padding: '20px', margin: 0 }}>
          <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
            Per Minute Charge
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#800000' }}>
            ₹{profile?.pricePerMinute || 20} <span style={{ fontSize: '14px', fontWeight: 600, color: '#6b3a3a' }}>/ min</span>
          </div>
          <span style={{ fontSize: '12px', color: '#6b3a3a' }}>
            {profile?.freeMinutes || 0} Promotional Free Mins
          </span>
        </div>

      </div>

      {/* Main Profile Summary Card */}
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoSparklesOutline style={{ color: '#800000', fontSize: '22px' }} />
              Active Astrologer Profile
            </h2>
            <p className="expert-card-desc">
              Your publicly viewable marketplace profile card and visibility switches.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {profile?.id && (
              <Link 
                to={`/expert/${profile.id}`} 
                target="_blank" 
                className="btn-expert-secondary"
              >
                <IoGlobeOutline /> Live Site Preview
              </Link>
            )}
            <Link to="/expert/dashboard/create-profile" className="btn-expert-primary">
              Edit Profile
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start', marginTop: '14px' }}>
          <img
            src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
            alt={profile?.displayName || 'Expert'}
            style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #FF6B00', boxShadow: '0 4px 12px rgba(107, 142, 35, 0.25)' }}
          />

          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#800000', margin: 0 }}>
                {profile?.displayName || 'Astrologer Name'}
              </h3>
              <span style={{ background: '#FFF7ED', color: '#276727', border: '1px solid #FED7AA', fontSize: '11.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <IoCheckmarkCircle /> VERIFIED
              </span>
            </div>

            <p style={{ fontSize: '14px', color: '#6b3a3a', margin: '0 0 12px 0', fontWeight: 600 }}>
              {profile?.title || 'Vedic Astrologer & Tarot Consultant'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: '#fffef9', padding: '6px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', color: '#800000' }}>
                <strong>Experience:</strong> {profile?.experienceYears || 5} Years
              </div>
              <div style={{ background: '#fffef9', padding: '6px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', color: '#800000' }}>
                <strong>Languages:</strong> {profile?.languages || 'English, Hindi'}
              </div>
              <div style={{ background: '#fffef9', padding: '6px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', color: '#800000' }}>
                <strong>Location:</strong> {[profile?.city, profile?.state].filter(Boolean).join(', ') || 'India'}
              </div>
            </div>

            <p style={{ fontSize: '14px', color: '#4a1212', lineHeight: '1.6', background: '#fffef9', padding: '14px 18px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              {profile?.bio || 'Dedicated to spiritual enlightenment and astrological accuracy through ancient Vedic principles, birth chart readings, and practical remedial solutions.'}
            </p>
          </div>
        </div>

        {/* Visibility Controls */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#800000' }}>
              Marketplace Search Visibility
            </div>
            <div style={{ fontSize: '12.5px', color: '#6b3a3a' }}>
              When enabled, your profile appears on the homepage, category listings, and astrologer search.
            </div>
          </div>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={profile?.isActive || false}
              onChange={handleToggleActive}
              disabled={updating}
              style={{ width: '18px', height: '18px', accentColor: '#FF6B00', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', fontWeight: 700, color: profile?.isActive ? '#276727' : '#8a3333' }}>
              {profile?.isActive ? 'Publicly Active' : 'Hidden / Inactive'}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  IoPersonCircleOutline, 
  IoMailOutline, 
  IoCallOutline, 
  IoCalendarOutline, 
  IoLocationOutline, 
  IoShieldCheckmarkOutline,
  IoCheckmarkCircle,
  IoAlertCircleOutline,
  IoCreateOutline
} from 'react-icons/io5';

export default function AccountDetailsPage() {
  const { profile } = useOutletContext();

  return (
    <div className="expert-content-container">
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoPersonCircleOutline style={{ color: '#800000', fontSize: '24px' }} />
              Account Details & Credentials
            </h2>
            <p className="expert-card-desc">
              Your verified astrologer account identity, registration details, and security status.
            </p>
          </div>
          <Link to="/expert/dashboard/create-profile" className="btn-expert-primary">
            <IoCreateOutline /> Edit Profile Info
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginTop: '16px' }}>
          
          <div style={{ background: '#fffef9', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
              Full Name
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#800000' }}>
              {profile?.displayName || 'Not Set'}
            </div>
          </div>

          <div style={{ background: '#fffef9', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
              Screen / Username
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#FF6B00' }}>
              @{profile?.screenName || 'astrologer'}
            </div>
          </div>

          <div style={{ background: '#fffef9', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
              Registered Email
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#800000', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoMailOutline style={{ color: '#FF6B00' }} />
              {profile?.email || 'N/A'}
            </div>
          </div>

          <div style={{ background: '#fffef9', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
              Contact Telephone / Phone
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#800000', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoCallOutline style={{ color: '#FF6B00' }} />
              {profile?.telephone || profile?.phoneNumber || 'Not Provided'}
            </div>
          </div>

          <div style={{ background: '#fffef9', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
              Account Role
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F0FFF0', color: '#276727', border: '1px solid #FED7AA', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 800 }}>
              <IoShieldCheckmarkOutline /> ASTROLOGY EXPERT
            </div>
          </div>

          <div style={{ background: '#fffef9', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
              Approval Status
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: profile?.approvalStatus === 'APPROVED' ? '#FFF7ED' : '#fef7e7', color: profile?.approvalStatus === 'APPROVED' ? '#276727' : '#92400e', border: profile?.approvalStatus === 'APPROVED' ? '1px solid #FED7AA' : '1px solid #f9e2b1', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 800 }}>
              {profile?.approvalStatus === 'APPROVED' ? <IoCheckmarkCircle /> : <IoAlertCircleOutline />}
              {profile?.approvalStatus || 'PENDING'}
            </div>
          </div>

          <div style={{ background: '#fffef9', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
              Member Since
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#800000', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoCalendarOutline style={{ color: '#FF6B00' }} />
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently Joined'}
            </div>
          </div>

          <div style={{ background: '#fffef9', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
              Location & Jurisdiction
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#800000', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoLocationOutline style={{ color: '#FF6B00' }} />
              {[profile?.city, profile?.state, profile?.country].filter(Boolean).join(', ') || 'India'}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

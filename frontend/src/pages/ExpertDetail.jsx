import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  IoStar, IoTimeOutline, IoLanguageOutline, IoLocationOutline, 
  IoChatbubbleEllipses, IoShieldCheckmark, IoRibbonOutline, IoCheckmarkCircle 
} from 'react-icons/io5';
import { expertService, consultationService } from '../services/api';
import ActiveBadge from '../components/ActiveBadge';
import WalletModal from '../components/WalletModal';
import ConsultationConfirmModal from '../components/ConsultationConfirmModal';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function ExpertDetail() {
  const { id } = useParams();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const { user, isAuthenticated, isCustomer, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadExpertProfile() {
      try {
        const res = await expertService.getPublicProfile(id);
        setExpert(res.data.data);
      } catch (err) {
        toast.error('Failed to load expert profile.');
      } finally {
        setLoading(false);
      }
    }
    loadExpertProfile();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#7c3aed', fontWeight: 600 }}>Loading expert profile...</p>
      </div>
    );
  }

  if (!expert) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2>Expert Not Found</h2>
        <p style={{ color: '#64748b', marginTop: '10px' }}>This profile does not exist or has not yet been approved.</p>
      </div>
    );
  }

  const isAvailable = Boolean(expert.isOnline) && (expert.isActive === undefined || Boolean(expert.isActive));

  const handleStartConsultation = () => {
    if (!isAvailable) {
      toast.warning('This expert is currently Offline / Inactive. Consultations and payments are disabled.');
      return;
    }

    if (!isAuthenticated) {
      toast.info('Please login to your account to start a consultation.');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!isCustomer) {
      toast.error('Only customers can book consultations.');
      return;
    }

    // Open consultation confirmation modal
    setConfirmModalOpen(true);
  };

  const handleConfirmStart = async (selectedExpert) => {
    try {
      const res = await consultationService.requestConsultation({
        expertId: selectedExpert.id
      });
      toast.success('Consultation session initialized!');
      navigate(`/consultation/${res.data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start consultation.');
    }
  };

  return (
    <div className="expert-detail-page">
      {/* Top Header Hero */}
      <section className="profile-page-header">
        <div className="astro-container profile-header-grid">
          <img
            src={expert.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
            alt={expert.displayName}
            className="profile-avatar-large"
          />

          <div className="profile-header-info">
            <div style={{ marginBottom: '8px' }}>
              <ActiveBadge isOnline={expert.isOnline} isActive={expert.isActive} />
            </div>

            <h1>{expert.displayName}</h1>
            <span className="profile-header-title">{expert.title || 'Master Astrologer'}</span>

            <div className="profile-header-meta">
              <span>
                <IoStar style={{ color: '#f59e0b' }} /> {parseFloat(expert.rating || 5.0).toFixed(1)} ({expert.totalReviews || 0} reviews)
              </span>
              <span>
                <IoRibbonOutline /> {expert.totalConsultations || 0} Consultations
              </span>
              <span>
                <IoTimeOutline /> {expert.experienceYears || 5}+ Years Exp
              </span>
              <span>
                <IoLanguageOutline /> {expert.languages || 'English, Hindi'}
              </span>
              {(expert.city || expert.country) && (
                <span>
                  <IoLocationOutline /> {[expert.city, expert.state, expert.country].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Pricing & CTA Card */}
          <div className="profile-cta-card">
            <div className="profile-price-tag">
              ₹{parseFloat(expert.pricePerMinute).toFixed(0)}
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}> / min</span>
            </div>

            {expert.freeMinutes > 0 ? (
              <div style={{ background: '#ecfdf5', color: '#047857', padding: '6px 12px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700, marginBottom: '16px' }}>
                🎉 First {expert.freeMinutes} Minutes Free!
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                Per-minute billing once connected
              </p>
            )}

            {isAvailable ? (
              <button
                onClick={handleStartConsultation}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px' }}
              >
                <IoChatbubbleEllipses style={{ fontSize: '18px' }} />
                Start Live Chat Now
              </button>
            ) : (
              <div>
                <button
                  disabled
                  className="btn-primary btn-disabled"
                  style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                >
                  Currently Offline
                </button>
                <p style={{ color: '#b91c1c', fontSize: '12px', marginTop: '8px', fontWeight: 600 }}>
                  Consultations and payments are paused while the expert is offline.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="astro-container profile-layout-grid">
        {/* Left Column: Bio, Services, Reviews */}
        <div className="profile-main-col">
          {/* About & Bio */}
          <div className="profile-section-card">
            <h3>About {expert.displayName}</h3>
            <p className="bio-paragraph">
              {expert.bio || 'Experienced spiritual counselor offering authentic insights and guidance in ancient astrology, numerology, and psychic readings.'}
            </p>
          </div>

          {/* Categories / Specialties */}
          {expert.categories && expert.categories.length > 0 && (
            <div className="profile-section-card">
              <h3>Areas of Expertise</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {expert.categories.map((c) => (
                  <span
                    key={c.id}
                    style={{
                      background: '#f3e8ff',
                      color: '#581c87',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '13.5px'
                    }}
                  >
                    ✦ {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {expert.services && expert.services.length > 0 && (
            <div className="profile-section-card">
              <h3>Specialized Services</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {expert.services.map((srv) => (
                  <div 
                    key={srv.id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '16px', color: '#1e1145', marginBottom: '4px' }}>{srv.title}</h4>
                      <p style={{ fontSize: '13px', color: '#64748b' }}>{srv.description || `${srv.durationMinutes} minutes dedicated reading`}</p>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: '#7c3aed' }}>
                      ₹{parseFloat(srv.price).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Reviews */}
          <div className="profile-section-card">
            <h3>Customer Reviews ({expert.reviews?.length || 0})</h3>
            {expert.reviews && expert.reviews.length > 0 ? (
              expert.reviews.map((rev) => (
                <div key={rev.id} className="review-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="review-author">{rev.customerName || 'Verified Seeker'}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="review-stars">
                    {[...Array(rev.rating || 5)].map((_, i) => (
                      <IoStar key={i} />
                    ))}
                  </div>
                  <p className="review-comment">{rev.comment}</p>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b', fontSize: '14px' }}>No reviews yet for this expert.</p>
            )}
          </div>
        </div>

        {/* Right Column: Platform Guarantees */}
        <div className="profile-sidebar-col">
          <div className="profile-section-card">
            <h3>Our Trust Promise</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#334155' }}>
                <IoCheckmarkCircle style={{ color: '#10b981', fontSize: '20px', flexShrink: 0 }} />
                100% Confidential live consultation
              </li>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#334155' }}>
                <IoCheckmarkCircle style={{ color: '#10b981', fontSize: '20px', flexShrink: 0 }} />
                Verified credentials & experience
              </li>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#334155' }}>
                <IoCheckmarkCircle style={{ color: '#10b981', fontSize: '20px', flexShrink: 0 }} />
                Pay strictly per minute used
              </li>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#334155' }}>
                <IoCheckmarkCircle style={{ color: '#10b981', fontSize: '20px', flexShrink: 0 }} />
                Instant refund if connection disrupts
              </li>
            </ul>
          </div>
        </div>
      </div>

      <WalletModal 
        isOpen={walletModalOpen} 
        onClose={() => setWalletModalOpen(false)}
        onSuccess={refreshUser}
        currentBalance={user?.walletBalance || 0}
      />

      <ConsultationConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        expert={expert}
        onConfirmStart={handleConfirmStart}
      />
    </div>
  );
}

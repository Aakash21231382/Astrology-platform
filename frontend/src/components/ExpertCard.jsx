import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoStar, IoChatbubbleEllipsesOutline, IoCallOutline, IoTimeOutline, IoLanguageOutline } from 'react-icons/io5';
import ActiveBadge from './ActiveBadge';
import ConsultationConfirmModal from './ConsultationConfirmModal';
import { useAuth } from '../context/AuthContext';
import { consultationService } from '../services/api';
import { toast } from 'react-toastify';

export default function ExpertCard({ expert, onOpenWallet }) {
  const { isAuthenticated, isCustomer, user } = useAuth();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [consultationMode, setConsultationMode] = useState('CALL'); // 'CALL' | 'CHAT'
  const navigate = useNavigate();

  const isAvailable = Boolean(expert.isOnline) && (expert.isActive === undefined || Boolean(expert.isActive));

  const initiateConsultation = (mode) => {
    if (!isAvailable) {
      toast.warning('This expert is currently Offline / Inactive. Live calls and consultations are unavailable.');
      return;
    }

    if (!isAuthenticated) {
      toast.info('Please login to your account to start a consultation.');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Prevent self-consultation if an expert clicks their own card
    if (user && (expert.userId === user.id || expert.id === user.expertProfileId)) {
      toast.warning('You cannot initiate a consultation with your own expert profile. Please select another expert.');
      return;
    }

    setConsultationMode(mode);
    setConfirmModalOpen(true);
  };

  const handleStartChat = (e) => {
    e.preventDefault();
    initiateConsultation('CHAT');
  };

  const handleStartCall = (e) => {
    e.preventDefault();
    initiateConsultation('CALL');
  };

  const handleConfirmStart = async (selectedExpert, mode = 'CALL') => {
    try {
      const res = await consultationService.requestConsultation({
        expertId: selectedExpert.id,
        type: mode
      });
      toast.success(`${mode === 'CALL' ? 'Audio Call' : 'Chat'} session initialized! Connecting...`);
      navigate(`/consultation/${res.data.data.id}?mode=${mode.toLowerCase()}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start consultation.');
    }
  };

  return (
    <>
      <div className="expert-card">
      <div className="expert-card-top">
        <div className="expert-avatar-wrap">
          <img
            src={expert.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
            alt={expert.displayName}
            className="expert-avatar-img"
          />
        </div>

        <div className="expert-info-meta">
          <div className="expert-name-row">
            <Link to={`/expert/${expert.id}`} className="expert-name">
              {expert.displayName}
            </Link>
          </div>

          <span className="expert-title-tag">
            {expert.title || 'Astrology Specialist'}
          </span>

          <div className="expert-badge-wrap">
            <ActiveBadge isOnline={expert.isOnline} isActive={expert.isActive} />
          </div>

          <div className="expert-rating-row">
            <IoStar className="expert-star-icon" />
            <span>{parseFloat(expert.rating || 5.0).toFixed(1)}</span>
            <span className="expert-review-count">({expert.totalReviews || 0} reviews)</span>
          </div>
        </div>
      </div>

      {/* Languages & Experience */}
      <div className="expert-stats-line">
        <span><IoTimeOutline className="expert-stat-icon" /> {expert.experienceYears || 5}+ yrs exp</span>
        <span><IoLanguageOutline className="expert-stat-icon" /> {expert.languages || 'English, Hindi'}</span>
      </div>

      {/* Category Pills */}
      {expert.categories && expert.categories.length > 0 && (
        <div className="expert-skills-row">
          {expert.categories.slice(0, 3).map((cat, idx) => (
            <span key={idx} className="expert-skill-pill">
              {cat.name}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer with Price & Chat Button */}
      <div className="expert-card-footer">
        <div className="expert-pricing-box">
          <span className="price-main">₹{parseFloat(expert.pricePerMinute || 20).toFixed(0)}</span>
          <span className="price-unit">per minute</span>
          {expert.freeMinutes > 0 && (
            <span className="free-min-chip">
              🎁 {expert.freeMinutes} Mins Free
            </span>
          )}
        </div>

        {isAvailable ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleStartCall}
              className="btn-primary expert-call-btn"
              style={{
                background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                border: '1px solid rgba(22, 163, 74, 0.2)',
                color: '#FFFFFF',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              title="Start Audio Call Consultation"
            >
              <IoCallOutline style={{ fontSize: '15px' }} />
              Call Now
            </button>

            <button
              onClick={handleStartChat}
              className="btn-primary expert-chat-btn"
              style={{
                background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                boxShadow: '0 4px 14px rgba(255, 107, 0, 0.3)',
                border: '1px solid rgba(255, 107, 0, 0.2)',
                color: '#FFFFFF',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              title="Start Live Chat Consultation"
            >
              <IoChatbubbleEllipsesOutline style={{ fontSize: '15px' }} />
              Chat
            </button>
          </div>
        ) : (
          <button
            disabled
            className="btn-primary btn-disabled expert-offline-btn"
            title="Expert is currently offline or inactive"
          >
            Offline
          </button>
        )}
      </div>
    </div>

    {/* Consultation Confirmation & Razorpay Gateway Modal */}
    <ConsultationConfirmModal
      isOpen={confirmModalOpen}
      onClose={() => setConfirmModalOpen(false)}
      expert={expert}
      mode={consultationMode}
      onConfirmStart={handleConfirmStart}
    />
  </>
  );
}

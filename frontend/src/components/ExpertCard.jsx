import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IoStar, IoChatbubbleEllipsesOutline, IoTimeOutline, IoLanguageOutline } from 'react-icons/io5';
import ActiveBadge from './ActiveBadge';
import ConsultationConfirmModal from './ConsultationConfirmModal';
import { useAuth } from '../context/AuthContext';
import { consultationService } from '../services/api';
import { toast } from 'react-toastify';

export default function ExpertCard({ expert, onOpenWallet }) {
  const { isAuthenticated, isCustomer, user } = useAuth();
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const navigate = useNavigate();

  const isAvailable = Boolean(expert.isOnline) && (expert.isActive === undefined || Boolean(expert.isActive));

  const handleStartChat = (e) => {
    e.preventDefault();

    if (!isAvailable) {
      toast.warning('This expert is currently Offline / Inactive. Live chat and consultations are unavailable.');
      return;
    }

    if (!isAuthenticated) {
      toast.info('Please login to your account to start a consultation.');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!isCustomer) {
      toast.error('Only customer accounts can initiate consultations.');
      return;
    }

    // Open consultation confirmation modal (checks free minutes and Razorpay balance)
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
          <button
            onClick={handleStartChat}
            className="btn-primary expert-chat-btn"
          >
            <IoChatbubbleEllipsesOutline />
            Chat Now
          </button>
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
      onConfirmStart={handleConfirmStart}
    />
  </>
  );
}

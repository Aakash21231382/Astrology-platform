import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  IoStar, 
  IoChatbubbleEllipses, 
  IoCall, 
  IoTimeOutline, 
  IoLanguageOutline, 
  IoRibbonOutline, 
  IoLocationOutline, 
  IoShieldCheckmarkOutline, 
  IoWalletOutline,
  IoCalendarOutline,
  IoFlashOutline,
  IoSparklesOutline
} from 'react-icons/io5';
import { IoCheckmarkCircle } from "react-icons/io5";
import { expertService, consultationService } from '../services/api';
import ActiveBadge from '../components/ActiveBadge';
import WalletModal from '../components/WalletModal';
import ConsultationConfirmModal from '../components/ConsultationConfirmModal';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const format12Hour = (time24) => {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m < 10 ? '0' + m : m} ${period}`;
};

const DEFAULT_WEEKLY_SCHEDULE = [
  { dayName: 'Monday', enabled: true, startTime: '09:00', endTime: '21:00' },
  { dayName: 'Tuesday', enabled: true, startTime: '09:00', endTime: '21:00' },
  { dayName: 'Wednesday', enabled: true, startTime: '09:00', endTime: '21:00' },
  { dayName: 'Thursday', enabled: true, startTime: '09:00', endTime: '21:00' },
  { dayName: 'Friday', enabled: true, startTime: '09:00', endTime: '21:00' },
  { dayName: 'Saturday', enabled: true, startTime: '10:00', endTime: '22:00' },
  { dayName: 'Sunday', enabled: true, startTime: '14:30', endTime: '16:30' }
];

export default function ExpertDetail() {
  const { id } = useParams();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [consultationMode, setConsultationMode] = useState('CALL'); // 'CALL' | 'CHAT'
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const audioContextRef = React.useRef(null);
  const { user, isAuthenticated, isCustomer, refreshUser } = useAuth();
  const navigate = useNavigate();

  const togglePlayVoiceIntro = () => {
    if (isPlayingVoice) {
      setIsPlayingVoice(false);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      return;
    }

    setIsPlayingVoice(true);
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      
      // Play a calming 3-tone Vedic bell harmonic sequence
      const freqs = [432, 528, 639]; // Healing solfeggio frequencies
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.4);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.4);
        gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + idx * 0.4 + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.4 + 2.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.4);
        osc.stop(ctx.currentTime + idx * 0.4 + 2.6);
      });

      // Auto stop after sample completes
      setTimeout(() => {
        setIsPlayingVoice(false);
      }, 3500);
    } catch {
      setIsPlayingVoice(false);
    }
  };

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

  const isAvailable = Boolean(expert?.isOnline) && (expert?.isActive === undefined || Boolean(expert?.isActive));

  const initiateConsultation = (mode) => {
    if (!isAvailable) {
      toast.warning('This expert is currently Offline / Inactive. Consultations and payments are disabled.');
      return;
    }

    if (!isAuthenticated) {
      toast.info('Please login to your account to start a consultation.');
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    // Prevent self-consultation if an expert visits their own profile
    if (user && (expert?.userId === user.id || expert?.id === user.expertProfileId)) {
      toast.warning('You cannot initiate a consultation with your own expert profile. Please select another expert.');
      return;
    }

    setConsultationMode(mode);
    setConfirmModalOpen(true);
  };

  const handleStartConsultation = () => {
    initiateConsultation('CHAT');
  };

  const handleStartCall = () => {
    initiateConsultation('CALL');
  };

  const handleConfirmStart = async (selectedExpert, mode = consultationMode) => {
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
              <div style={{ background: '#ecfdf5', color: '#C2410C', padding: '6px 12px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700, marginBottom: '16px' }}>
                🎉 First {expert.freeMinutes} Minutes Free!
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                Per-minute billing once connected
              </p>
            )}

            {/* Waiting Queue Status */}
            <div style={{
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9A3412', fontWeight: 700, fontSize: '13px' }}>
                <span style={{ fontSize: '15px' }}>⏳</span>
                <span>Live Queue:</span>
              </div>
              <span style={{
                background: isAvailable ? '#E8F5E9' : '#F1F5F9',
                color: isAvailable ? '#FF6B00' : '#64748B',
                border: isAvailable ? '1px solid #A5D6A7' : '1px solid #CBD5E1',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11.5px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: isAvailable ? '#FF6B00' : '#94A3B8'
                }}></span>
                {isAvailable ? 'Instant Connect (0 in line)' : 'Currently Offline'}
              </span>
            </div>

            {/* Pandit Ji's Audio Intro Sample */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button
                type="button"
                onClick={togglePlayVoiceIntro}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: isPlayingVoice ? '#ef4444' : '#FF6B00',
                  color: '#ffffff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(255, 107, 0, 0.3)'
                }}
                title={isPlayingVoice ? 'Stop voice sample' : 'Listen to Pandit Ji voice'}
              >
                {isPlayingVoice ? '⏸' : '▶'}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                  Pandit Ji's Voice Intro 🎧
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {isPlayingVoice ? 'Playing Vedic Greeting (0:15)...' : 'Click to hear audio greeting sample'}
                </div>
              </div>
              {isPlayingVoice && (
                <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '16px' }}>
                  <span style={{ width: '3px', height: '14px', background: '#FF6B00', borderRadius: '2px', animation: 'bounce 0.6s infinite alternate' }} />
                  <span style={{ width: '3px', height: '8px', background: '#FF6B00', borderRadius: '2px', animation: 'bounce 0.8s infinite alternate' }} />
                  <span style={{ width: '3px', height: '16px', background: '#FF6B00', borderRadius: '2px', animation: 'bounce 0.5s infinite alternate' }} />
                </div>
              )}
            </div>

            {isAvailable ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={handleStartCall}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                    border: '1px solid rgba(22, 163, 74, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <IoCall style={{ fontSize: '18px' }} />
                  Start Audio Call Now
                </button>

                <button
                  onClick={handleStartConsultation}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)',
                    boxShadow: '0 4px 14px rgba(255, 107, 0, 0.3)',
                    border: '1px solid rgba(255, 107, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <IoChatbubbleEllipses style={{ fontSize: '18px' }} />
                  Start Live Chat
                </button>
              </div>
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

          {/* Weekly Live Consultation Schedule */}
          <div className="profile-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>
                <IoCalendarOutline style={{ color: '#FF6B00' }} /> Weekly Live Consultation Hours
              </h3>
              {expert.autoScheduleEnabled ? (
                <span style={{
                  background: '#E8F5E9',
                  color: '#FF6B00',
                  border: '1px solid #A5D6A7',
                  padding: '4px 12px',
                  borderRadius: '14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <IoFlashOutline /> Auto-Live Active
                </span>
              ) : (
                <span style={{
                  background: '#F1F5F9',
                  color: '#64748B',
                  padding: '4px 12px',
                  borderRadius: '14px',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  Standard Weekly Shift
                </span>
              )}
            </div>
            
            <p style={{ fontSize: '13.5px', color: '#64748B', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              Astrologer is guaranteed available during the scheduled shift hours below. You can start instant audio calls or live chat during these hours.
            </p>

            <div className="schedule-days-list">
              {(expert.weeklySchedule && expert.weeklySchedule.length > 0 ? expert.weeklySchedule : DEFAULT_WEEKLY_SCHEDULE).map((day) => {
                const currentDayName = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long' }).format(new Date());
                const isToday = currentDayName.toLowerCase() === (day.dayName || '').toLowerCase();
                const isDayEnabled = day.enabled !== undefined ? Boolean(day.enabled) : Boolean(day.isEnabled);

                return (
                  <div
                    key={day.dayName}
                    className={`schedule-day-box ${isToday ? 'today' : ''} ${!isDayEnabled ? 'off' : ''}`}
                  >
                    <div className="schedule-day-name">
                      <span>{day.dayName}</span>
                      {isToday && <span className="schedule-today-tag">TODAY</span>}
                    </div>

                    {isDayEnabled ? (
                      <span className="schedule-time-val">
                        {format12Hour(day.startTime || '09:00')} – {format12Hour(day.endTime || '21:00')}
                      </span>
                    ) : (
                      <span className="schedule-off-val">
                        Day Off
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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

          {/* Customer Reviews Section */}
          <div className="profile-section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '18px', paddingBottom: '14px', borderBottom: '1.5px solid #EFE6D6' }}>
              <h3 style={{ margin: 0 }}>
                Verified Devotee Reviews ({expert.reviews?.length || 0})
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '4px 12px', borderRadius: '20px' }}>
                <IoStar style={{ color: '#F59E0B', fontSize: '16px' }} />
                <strong style={{ color: '#9A3412', fontSize: '13.5px' }}>{parseFloat(expert.rating || 5.0).toFixed(1)} / 5.0</strong>
              </div>
            </div>

            {expert.reviews && expert.reviews.length > 0 ? (
              <div className="reviews-feed-list">
                {expert.reviews.map((rev) => {
                  const initial = (rev.customerName || 'S').charAt(0).toUpperCase();
                  return (
                    <div key={rev.id} className="review-card-modern">
                      <div className="review-card-header">
                        <div className="review-user-info">
                          <div className="review-avatar-initials">
                            {initial}
                          </div>
                          <div>
                            <div className="review-author-name">
                              {rev.customerName || 'Verified Seeker'}
                              <span className="review-verified-tag">✓ Verified Consultation</span>
                            </div>
                            <div className="review-stars-row">
                              <div className="review-stars">
                                {[...Array(rev.rating || 5)].map((_, i) => (
                                  <IoStar key={i} />
                                ))}
                              </div>
                              <span className="review-rating-num">{parseFloat(rev.rating || 5).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>

                        <span className="review-date-tag">
                          {new Date(rev.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <p className="review-comment-modern">
                        "{rev.comment || 'Very insightful and accurate reading. Highly recommend!'}"
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="review-empty-state">
                <div className="review-empty-icon">⭐</div>
                <h4>No Reviews Yet</h4>
                <p>Be the first devotee to consult with {expert.displayName} and share your spiritual experience!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Platform Guarantees */}
        <div className="profile-sidebar-col">
          <div className="profile-section-card">
            <h3>Our Trust Promise</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#334155' }}>
                <IoCheckmarkCircle style={{ color: '#FF6B00', fontSize: '20px', flexShrink: 0 }} />
                100% Confidential live consultation
              </li>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#334155' }}>
                <IoCheckmarkCircle style={{ color: '#FF6B00', fontSize: '20px', flexShrink: 0 }} />
                Verified credentials & experience
              </li>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#334155' }}>
                <IoCheckmarkCircle style={{ color: '#FF6B00', fontSize: '20px', flexShrink: 0 }} />
                Pay strictly per minute used
              </li>
              <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: '#334155' }}>
                <IoCheckmarkCircle style={{ color: '#FF6B00', fontSize: '20px', flexShrink: 0 }} />
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
        mode={consultationMode}
        onConfirmStart={handleConfirmStart}
      />
    </div>
  );
}

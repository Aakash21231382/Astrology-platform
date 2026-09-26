import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  IoChatbubblesOutline, 
  IoCheckmarkCircle, 
  IoCloseCircle, 
  IoRadioOutline, 
  IoFlashOutline, 
  IoNotificationsOutline, 
  IoArrowForwardCircleOutline,
  IoPulseOutline,
  IoVolumeHighOutline,
  IoStopOutline
} from 'react-icons/io5';
import { consultationService, expertService } from '../../services/api';
import { soundEffects } from '../../utils/soundEffects';
import { toast } from 'react-toastify';

export default function LiveChatPage() {
  const { profile, setProfile } = useOutletContext();
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [testingSound, setTestingSound] = useState(false);

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 5000);
    return () => {
      clearInterval(interval);
      soundEffects.stopIncomingCallRingtone();
    };
  }, []);

  const handleTestRingtone = () => {
    if (testingSound) {
      soundEffects.stopIncomingCallRingtone();
      setTestingSound(false);
      toast.info('Ringtone sound stopped.');
    } else {
      soundEffects.startIncomingCallRingtone();
      setTestingSound(true);
      toast.success('🔊 Playing test incoming call ringtone... Click again to stop.');
      setTimeout(() => {
        soundEffects.stopIncomingCallRingtone();
        setTestingSound(false);
      }, 7000);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const res = await consultationService.getActiveForExpert();
      if (res.data?.data) {
        setActiveSessions(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnline = async () => {
    if (!profile) return;
    const nextStatus = !profile.isOnline;
    setUpdating(true);
    try {
      await expertService.setAvailability({
        isOnline: nextStatus,
        isActive: profile.isActive
      });
      setProfile(prev => ({ ...prev, isOnline: nextStatus }));
      if (nextStatus) {
        toast.success('Live Chat is now ONLINE! Seekers can initiate chat sessions.');
      } else {
        toast.info('Live Chat is now OFFLINE.');
      }
    } catch (err) {
      toast.error('Failed to update availability.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="expert-content-container">
      {/* Availability Status Card */}
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoChatbubblesOutline style={{ color: '#800000', fontSize: '24px' }} />
              Live Consultation Control Room
            </h2>
            <p className="expert-card-desc">
              Manage your availability to take incoming seeker consultations in real time.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleTestRingtone}
              className="btn-expert-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 700,
                border: '1px solid #d97706',
                color: '#b45309',
                background: testingSound ? '#fef3c7' : '#ffffff',
                cursor: 'pointer'
              }}
              title="Test audio speakers and ringtone sound"
            >
              {testingSound ? <IoStopOutline style={{ fontSize: '18px', color: '#dc2626' }} /> : <IoVolumeHighOutline style={{ fontSize: '18px' }} />}
              {testingSound ? 'Stop Ringtone' : 'Test Call Ringtone'}
            </button>

            <button
              onClick={handleToggleOnline}
              disabled={updating}
              className="btn-expert-primary"
              style={{
                background: profile?.isOnline ? '#FF6B00' : '#8a3333'
              }}
            >
              <IoPulseOutline style={{ fontSize: '18px' }} />
              {updating ? 'Updating...' : profile?.isOnline ? 'Status: ONLINE (Taking Calls & Chats)' : 'Status: OFFLINE (Click to Go Online)'}
            </button>
          </div>
        </div>

        <div style={{ background: profile?.isOnline ? '#FFF7ED' : '#fdf2f2', padding: '18px 22px', borderRadius: '10px', border: profile?.isOnline ? '1px solid #FED7AA' : '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '14px', height: '14px', borderRadius: '50%',
            background: profile?.isOnline ? '#FF6B00' : '#991b1b',
            boxShadow: profile?.isOnline ? '0 0 0 4px rgba(107, 142, 35, 0.25)' : 'none'
          }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: profile?.isOnline ? '#276727' : '#991b1b' }}>
              {profile?.isOnline ? 'You are visible as ONLINE to all seekers nationwide' : 'You are currently OFFLINE'}
            </div>
            <div style={{ fontSize: '12.5px', color: profile?.isOnline ? '#276727' : '#8a3333', marginTop: '2px' }}>
              {profile?.isOnline ? 'When a seeker clicks "Start Chat", a sound chime and popup alert will immediately notify you.' : 'Switch to ONLINE when you are ready to answer live astrological questions.'}
            </div>
          </div>
        </div>
      </div>

      {/* Active Consultation Sessions */}
      <div className="expert-card">
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#800000', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IoFlashOutline style={{ color: '#FF6B00' }} />
          Active / Incoming Consultation Sessions ({activeSessions.length})
        </h3>

        {activeSessions.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {activeSessions.map(session => (
              <div key={session.id} style={{ background: '#ffffff', border: '2px solid #FF6B00', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 6px 14px rgba(107, 142, 35, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#276727', background: '#F0FFF0', border: '1px solid #FED7AA', padding: '2px 8px', borderRadius: '12px' }}>
                    SESSION #{session.id}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#276727', background: '#FFF7ED', padding: '2px 8px', borderRadius: '12px' }}>
                    {session.status}
                  </span>
                </div>

                <div style={{ fontSize: '16px', fontWeight: 800, color: '#800000', marginBottom: '4px' }}>
                  Client: {session.customerName || 'Seeker'}
                </div>

                <div style={{ fontSize: '13px', color: '#6b3a3a', marginBottom: '16px' }}>
                  Rate: ₹{session.ratePerMinute}/min • Free Mins Allowed: {session.freeMinutesAllowed}
                </div>

                <Link
                  to={`/consultation/${session.id}`}
                  className="btn-expert-primary"
                  style={{ width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}
                >
                  <IoArrowForwardCircleOutline style={{ fontSize: '18px' }} />
                  Enter Consultation Room
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b3a3a' }}>
            <IoNotificationsOutline style={{ fontSize: '42px', color: '#E2E8F0', marginBottom: '8px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No live active chat requests right now. Keep your status Online to receive inquiries!</p>
          </div>
        )}
      </div>
    </div>
  );
}

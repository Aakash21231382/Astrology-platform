import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  IoCall, 
  IoCallOutline,
  IoPulseOutline, 
  IoVolumeHighOutline, 
  IoStopOutline,
  IoMicOutline,
  IoNotificationsOutline,
  IoArrowForwardCircleOutline,
  IoTimeOutline,
  IoCheckmarkCircle,
  IoRadioOutline
} from 'react-icons/io5';
import { consultationService, expertService } from '../../services/api';
import { soundEffects } from '../../utils/soundEffects';
import { toast } from 'react-toastify';

export default function LiveCallPage() {
  const { profile, setProfile } = useOutletContext();
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [testingSound, setTestingSound] = useState(false);
  const [testingMic, setTestingMic] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  useEffect(() => {
    fetchActiveCallSessions();
    const interval = setInterval(fetchActiveCallSessions, 5000);
    return () => {
      clearInterval(interval);
      soundEffects.stopIncomingCallRingtone();
    };
  }, []);

  const fetchActiveCallSessions = async () => {
    try {
      const res = await consultationService.getActiveForExpert();
      if (res.data?.data) {
        // Filter or display active sessions
        const calls = res.data.data.filter(s => !s.consultationType || s.consultationType === 'CALL' || s.type === 'CALL');
        setActiveSessions(calls.length > 0 ? calls : res.data.data);
      }
    } catch (err) {
      console.error('Failed to load active call sessions:', err);
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
        toast.success('Live Audio Calls are now ONLINE! Seekers can call you.');
      } else {
        toast.info('Live Audio Calls are now OFFLINE.');
      }
    } catch (err) {
      toast.error('Failed to update call availability.');
    } finally {
      setUpdating(false);
    }
  };

  const handleTestRingtone = () => {
    if (testingSound) {
      soundEffects.stopIncomingCallRingtone();
      setTestingSound(false);
      toast.info('Ringtone test stopped.');
    } else {
      soundEffects.startIncomingCallRingtone();
      setTestingSound(true);
      toast.success('🔊 Playing incoming call ringtone... Click again to stop.');
      setTimeout(() => {
        soundEffects.stopIncomingCallRingtone();
        setTestingSound(false);
      }, 7000);
    }
  };

  const handleTestMic = async () => {
    if (testingMic) {
      setTestingMic(false);
      setMicLevel(0);
      toast.info('Mic test ended.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setTestingMic(true);
      toast.success('🎙️ Microphone active! Speak to test your audio.');

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 64;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkLevel = () => {
        if (!testingMic && audioCtx.state === 'closed') return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        if (stream.active) {
          requestAnimationFrame(checkLevel);
        }
      };
      checkLevel();

      setTimeout(() => {
        stream.getTracks().forEach(t => t.stop());
        audioCtx.close().catch(() => {});
        setTestingMic(false);
        setMicLevel(0);
      }, 8000);
    } catch (e) {
      toast.warning('Microphone permission denied or not available.');
    }
  };

  return (
    <div className="expert-content-container">
      {/* Call Availability Status Card */}
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoCall style={{ color: '#FF6B00', fontSize: '24px' }} />
              Live Audio Call Control Room
            </h2>
            <p className="expert-card-desc">
              Manage your availability to take incoming seeker voice calls in real time.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Audio Test Button */}
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
                border: '1px solid #FF6B00',
                color: '#FF6B00',
                background: testingSound ? '#FFEDD5' : '#ffffff',
                cursor: 'pointer'
              }}
              title="Test incoming call ringtone audio"
            >
              {testingSound ? <IoStopOutline style={{ fontSize: '18px', color: '#dc2626' }} /> : <IoVolumeHighOutline style={{ fontSize: '18px' }} />}
              {testingSound ? 'Stop Ringtone' : 'Test Call Ringtone'}
            </button>

            {/* Mic Test Button */}
            <button
              onClick={handleTestMic}
              className="btn-expert-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 700,
                border: '1px solid #0284c7',
                color: '#0369a1',
                background: testingMic ? '#e0f2fe' : '#ffffff',
                cursor: 'pointer'
              }}
              title="Test microphone input"
            >
              <IoMicOutline style={{ fontSize: '18px' }} />
              {testingMic ? `Mic Active (${micLevel}%)` : 'Test Mic'}
            </button>

            {/* Online Status Toggle */}
            <button
              onClick={handleToggleOnline}
              disabled={updating}
              className="btn-expert-primary"
              style={{
                background: profile?.isOnline ? '#FF6B00' : '#8a3333'
              }}
            >
              <IoPulseOutline style={{ fontSize: '18px' }} />
              {updating ? 'Updating...' : profile?.isOnline ? 'Status: ONLINE (Taking Calls)' : 'Status: OFFLINE (Click to Go Online)'}
            </button>
          </div>
        </div>

        {/* Live Call Online Status Banner */}
        <div style={{
          background: profile?.isOnline ? '#FFF7ED' : '#fdf2f2',
          padding: '18px 22px',
          borderRadius: '10px',
          border: profile?.isOnline ? '1px solid #FED7AA' : '1px solid #fecaca',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: profile?.isOnline ? '#FF6B00' : '#991b1b',
            boxShadow: profile?.isOnline ? '0 0 0 4px rgba(22, 163, 74, 0.25)' : 'none'
          }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: profile?.isOnline ? '#FF6B00' : '#991b1b' }}>
              {profile?.isOnline ? 'You are visible as READY FOR CALLS to all seekers' : 'Voice Calls are currently OFFLINE'}
            </div>
            <div style={{ fontSize: '12.5px', color: profile?.isOnline ? '#EA580C' : '#8a3333', marginTop: '2px' }}>
              {profile?.isOnline 
                ? 'When a seeker taps "Call Now", a continuous ringtone will chime and an incoming call screen will alert you instantly.' 
                : 'Turn your status ONLINE whenever you are available to answer live voice calls.'}
            </div>
          </div>
        </div>
      </div>

      {/* Active / Incoming Audio Call Sessions */}
      <div className="expert-card">
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#EA580C', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IoCall style={{ color: '#FF6B00' }} />
          Active / Incoming Call Sessions ({activeSessions.length})
        </h3>

        {activeSessions.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {activeSessions.map(session => (
              <div
                key={session.id}
                style={{
                  background: '#ffffff',
                  border: '2px solid #FF6B00',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: '0 8px 18px rgba(22, 163, 74, 0.12)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#FF6B00', background: '#FFEDD5', border: '1px solid #FED7AA', padding: '3px 10px', borderRadius: '12px' }}>
                    CALL #{session.id}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF6B00', background: '#FFF7ED', padding: '3px 10px', borderRadius: '12px' }}>
                    {session.status}
                  </span>
                </div>

                <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                  Caller: {session.customerName || 'Seeker'}
                </div>

                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  Rate: ₹{session.ratePerMinute}/min • Free Mins: {session.freeMinutesAllowed || 0}
                </div>

                <Link
                  to={`/consultation/${session.id}?mode=call`}
                  className="btn-expert-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                    background: 'linear-gradient(135deg, #FF6B00, #FF6B00)'
                  }}
                >
                  <IoArrowForwardCircleOutline style={{ fontSize: '18px' }} />
                  Enter Call Room
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <IoNotificationsOutline style={{ fontSize: '42px', color: '#cbd5e1', marginBottom: '8px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No live audio calls right now. Keep your status Online to receive incoming calls!</p>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  IoSend, IoAttach, IoTimeOutline, IoStopCircleOutline, 
  IoStar, IoSparkles, IoCall, 
  IoMicOutline, IoMicOffOutline,
  IoVolumeHighOutline, IoVolumeMuteOutline,
  IoCheckmarkCircle 
} from 'react-icons/io5';
import { consultationService, uploadService } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { soundEffects } from '../utils/soundEffects';
import { processRazorpayPayment } from '../utils/razorpay';
import { calculateKundali } from '../utils/kundaliCalculator';
import { toast } from 'react-toastify';
import '../assets/css/consultation-room.css';

export default function ConsultationRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Mode: STRICTLY 'CALL' or 'CHAT'
  const modeParam = (searchParams.get('mode') || '').toUpperCase();
  const [consultationMode, setConsultationMode] = useState(
    modeParam === 'CALL' ? 'CALL' : 'CHAT'
  );

  // Voice Call States & WebRTC
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // Common Consultation States
  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [ticker, setTicker] = useState({
    elapsedSeconds: 0,
    freeRemaining: 0,
    currentCost: 0,
    isFree: true
  });
  const [isTyping, setIsTyping] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [endSummary, setEndSummary] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // New Features: Quick Recharge, Starred Remedies
  const [showQuickRecharge, setShowQuickRecharge] = useState(false);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [starredIds, setStarredIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('starred_remedy_ids') || '[]');
    } catch (e) {
      return [];
    }
  });

  const toggleStarMessage = (msgId) => {
    let next;
    if (starredIds.includes(msgId)) {
      next = starredIds.filter(i => i !== msgId);
      toast.info('Removed from starred remedies');
    } else {
      next = [...starredIds, msgId];
      toast.success('Remedy saved to Starred Remedies! ⭐');
    }
    setStarredIds(next);
    localStorage.setItem('starred_remedy_ids', JSON.stringify(next));
  };

  const handleQuickRecharge = async (amount) => {
    setRechargeLoading(true);
    try {
      await processRazorpayPayment({
        amount,
        user,
        description: `In-Chat Quick Recharge (Consultation #${id})`
      });
      toast.success(`₹${amount} added successfully! Chat will continue seamlessly.`);
      setShowQuickRecharge(false);
    } catch (err) {
      toast.error('Recharge was not completed');
    } finally {
      setRechargeLoading(false);
    }
  };

  const clientKundali = React.useMemo(() => {
    const clientName = consultation?.customerName || 'Seeker';
    return calculateKundali({
      name: clientName,
      dob: consultation?.birthDate || '1998-05-15',
      tob: consultation?.birthTime || '10:30',
      pob: consultation?.birthPlace || 'New Delhi, India'
    });
  }, [consultation]);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Initialize Consultation Session & Details
  useEffect(() => {
    let currentConsData = null;

    async function initSession() {
      try {
        const [resDetails, resMsgs] = await Promise.all([
          consultationService.getConsultation(id),
          consultationService.getMessages(id)
        ]);

        currentConsData = resDetails.data.data;
        const consData = currentConsData;
        setConsultation(consData);
        setMessages(resMsgs.data.data || []);

        // Authoritatively set mode from backend consultationType if present
        const effectiveMode = (consData.consultationType || modeParam || 'CHAT').toUpperCase();
        setConsultationMode(effectiveMode);

        if (consData.status === 'COMPLETED') {
          setSessionEnded(true);
        }

        // Connect Socket & Join Room
        const socket = connectSocket();
        const cid = parseInt(id, 10);

        const joinRoom = () => {
          socket.emit('consultation:join', { 
            consultationId: cid,
            mode: effectiveMode
          });
        };

        if (socket.connected) {
          joinRoom();
        } else {
          socket.on('connect', joinRoom);
        }
      } catch (err) {
        toast.error('Failed to load consultation session.');
        navigate('/dashboard');
      }
    }

    initSession();

    const socket = getSocket();
    const cid = parseInt(id, 10);

    // Auto-accept if providing expert joins
    const handleUserJoined = ({ role }) => {
      if (currentConsData && user?.id !== currentConsData?.customerId && (user?.role === 'EXPERT' || user?.id === currentConsData?.expertUserId)) {
        socket.emit('consultation:accept', { consultationId: cid });
      }
    };
    socket.on('consultation:user_joined', handleUserJoined);

    // Live message receiver (for Chat)
    const handleIncomingMessage = (msg) => {
      if (!msg) return;
      if (msg.consultationId && parseInt(msg.consultationId, 10) !== cid) return;

      setMessages((prev) => {
        const tempIdx = prev.findIndex(
          (m) =>
            m.id === msg.id ||
            (typeof m.id === 'string' &&
              m.id.startsWith('temp_') &&
              m.senderId === msg.senderId &&
              m.content === msg.content)
        );
        if (tempIdx !== -1) {
          const next = [...prev];
          next[tempIdx] = msg;
          return next;
        }
        if (msg.id && prev.some((m) => m.id === msg.id)) {
          return prev;
        }

        // Notification chime for incoming chat message
        if (msg.senderId !== user?.id) {
          soundEffects.playChatNotificationChime();
        }

        return [...prev, msg];
      });
      setIsTyping(false);
      setTimeout(scrollToBottom, 50);
    };
    socket.on('consultation:message', handleIncomingMessage);

    // Live Authoritative Billing Ticker
    const handleBillingTick = (tickData) => {
      setTicker({
        elapsedSeconds: tickData.elapsedSeconds,
        freeRemaining: tickData.freeRemaining,
        currentCost: tickData.currentCost,
        isFree: tickData.isFree
      });
    };
    socket.on('consultation:billing_tick', handleBillingTick);

    // Live Typing Indicator
    const handleTypingStart = (data) => {
      if (data?.userId && data.userId === user?.id) return;
      setIsTyping(true);
      setTimeout(scrollToBottom, 50);
    };
    const handleTypingStop = (data) => {
      if (data?.userId && data.userId === user?.id) return;
      setIsTyping(false);
    };
    socket.on('consultation:typing', handleTypingStart);
    socket.on('consultation:stop_typing', handleTypingStop);

    // Session ended
    const handleSessionEnded = (summary) => {
      setSessionEnded(true);
      setEndSummary(summary);
      setIsTyping(false);
      soundEffects.playCallEndedTone();
      toast.info('Consultation has ended.');
    };
    socket.on('consultation:ended', handleSessionEnded);

    // Security warning on contact sharing attempt
    const handleSecurityWarning = (data) => {
      toast.error(data.warning || 'Contact sharing is strictly prohibited by Aakash Security.', {
        autoClose: 6000
      });
    };
    socket.on('consultation:security_warning', handleSecurityWarning);

    return () => {
      socket.off('consultation:user_joined', handleUserJoined);
      socket.off('consultation:message', handleIncomingMessage);
      socket.off('consultation:billing_tick', handleBillingTick);
      socket.off('consultation:typing', handleTypingStart);
      socket.off('consultation:stop_typing', handleTypingStop);
      socket.off('consultation:ended', handleSessionEnded);
      socket.off('consultation:security_warning', handleSecurityWarning);
    };
  }, [id, modeParam]);

  // 2. WebRTC Live Voice Call Connection (STRICTLY for CALL mode)
  useEffect(() => {
    if (consultationMode !== 'CALL' || sessionEnded) return;

    let pc = null;
    let localStream = null;
    const cid = parseInt(id, 10);
    const socket = getSocket();

    async function startVoiceCall() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = localStream;
      } catch (err) {
        console.warn('Microphone permission denied or not available:', err);
        toast.warn('Please allow microphone access to talk in this live voice call.');
      }

      pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      // Add microphone audio tracks to PeerConnection
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // Stream remote incoming voice to audio player
      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch((e) => console.log('Audio autoplay:', e));
        }
      };

      // Broadcast ICE candidate
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc:signal', {
            consultationId: cid,
            signal: { type: 'candidate', candidate: event.candidate }
          });
        }
      };

      // Handle signaling messages (offer, answer, candidate)
      const handleWebRtcSignal = async ({ senderId, signal }) => {
        if (!pc || senderId === user?.id) return;
        try {
          if (signal.type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('webrtc:signal', {
              consultationId: cid,
              signal: { type: 'answer', sdp: pc.localDescription }
            });
          } else if (signal.type === 'answer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          } else if (signal.type === 'candidate') {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        } catch (e) {
          console.error('WebRTC signal handling error:', e);
        }
      };
      socket.on('webrtc:signal', handleWebRtcSignal);

      // Initiator creates offer
      const initiateOffer = async () => {
        if (!pc) return;
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc:signal', {
            consultationId: cid,
            signal: { type: 'offer', sdp: pc.localDescription }
          });
        } catch (e) {
          console.error('WebRTC offer error:', e);
        }
      };

      const handleUserJoinedForCall = () => {
        if (user?.role === 'CUSTOMER') {
          setTimeout(initiateOffer, 600);
        }
      };
      socket.on('consultation:user_joined', handleUserJoinedForCall);

      if (user?.role === 'CUSTOMER') {
        setTimeout(initiateOffer, 1000);
      }
    }

    startVoiceCall();

    return () => {
      socket.off('webrtc:signal');
      socket.off('consultation:user_joined');
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [consultationMode, sessionEnded, id, user?.id, user?.role]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mic Mute Toggle
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted; // Toggle enabled
      }
    }
    setIsMuted(!isMuted);
    toast.info(!isMuted ? 'Microphone Muted' : 'Microphone Unmuted');
  };

  // Speaker Mute Toggle
  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerMuted;
    }
    setIsSpeakerMuted(!isSpeakerMuted);
    toast.info(!isSpeakerMuted ? 'Audio Output Muted' : 'Audio Output Unmuted');
  };

  // Chat Actions
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    const cid = parseInt(id, 10);
    const socket = getSocket();

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      consultationId: cid,
      senderId: user?.id,
      senderRole: user?.role,
      messageType: 'TEXT',
      content,
      sentAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText('');
    setTimeout(scrollToBottom, 50);

    socket.emit('consultation:message', {
      consultationId: cid,
      content,
      messageType: 'TEXT'
    });

    socket.emit('consultation:stop_typing', { consultationId: cid });
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);
    const socket = getSocket();
    socket.emit('consultation:typing', { consultationId: parseInt(id, 10) });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('consultation:stop_typing', { consultationId: parseInt(id, 10) });
    }, 1500);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      toast.info('Uploading image...');
      const uploadRes = await uploadService.uploadFile(file);
      const imageUrl = typeof uploadRes === 'string' ? uploadRes : (uploadRes?.url || uploadRes?.data?.url || uploadRes?.data?.data?.url);

      const socket = getSocket();
      socket.emit('consultation:message', {
        consultationId: parseInt(id, 10),
        content: 'Shared an image',
        messageType: 'IMAGE',
        fileUrl: imageUrl
      });
      toast.success('Image shared!');
    } catch (err) {
      toast.error('Failed to upload image.');
    }
  };

  const handleEndSession = () => {
    const isCall = consultationMode === 'CALL';
    const confirmText = isCall 
      ? 'Are you sure you want to end this voice call?' 
      : 'Are you sure you want to end this chat session?';
    if (window.confirm(confirmText)) {
      const socket = getSocket();
      socket.emit('consultation:end', {
        consultationId: parseInt(id, 10),
        endReason: user?.role === 'EXPERT' ? 'EXPERT_END' : 'CUSTOMER_END'
      });
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await consultationService.submitReview({
        consultationId: parseInt(id, 10),
        rating: reviewRating,
        comment: reviewComment
      });
      toast.success('Review submitted! Thank you.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const isSeeker = user?.id === consultation?.customerId;
  const partnerName = isSeeker ? consultation?.expertName : consultation?.customerName;
  const partnerAvatar = isSeeker ? consultation?.expertAvatar : consultation?.customerAvatar;

  // =========================================================================
  // VIEW 1: STRICTLY DEDICATED VOICE CALL SCREEN (NO CHAT AT ALL)
  // =========================================================================
  if (consultationMode === 'CALL') {
    return (
      <div className="voice-call-screen">
        {/* Ambient Cosmic Background Glow Orbs */}
        <div className="vc-bg-glow glow-top" />
        <div className="vc-bg-glow glow-bottom" />

        {/* Top Header Floating Glass Capsule */}
        <header className="voice-call-top-bar">
          <div className="voice-call-partner-meta">
            <img
              src={partnerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={partnerName}
              className="voice-call-header-avatar"
            />
            <div className="voice-call-meta-text">
              <div className="voice-call-meta-name">{partnerName || 'Astrologer'}</div>
              <div className="voice-call-meta-sub">
                <span className="live-pulsing-dot" />
                <span>HD Audio • Encrypted</span>
              </div>
            </div>
          </div>

          <div className="voice-call-top-stats">
            <div className="voice-call-stat-pill rate-pill">
              <span className="stat-pill-label">Rate</span>
              <span className="stat-pill-value">₹{consultation?.ratePerMinute || 20}/m</span>
            </div>

            {ticker.freeRemaining > 0 ? (
              <div className="voice-call-stat-pill free-pill">
                <span className="stat-pill-label">🎁 Free</span>
                <span className="stat-pill-value">{formatSeconds(ticker.freeRemaining)}</span>
              </div>
            ) : (
              <div className="voice-call-stat-pill billed-pill">
                <span className="stat-pill-label">Billed</span>
                <span className="stat-pill-value">₹{ticker.currentCost.toFixed(2)}</span>
              </div>
            )}
          </div>
        </header>

        {/* Center Hero Stage */}
        <div className="voice-call-stage">
          <div className="voice-call-avatar-outer">
            <div className="voice-call-pulse-ring ring-a" />
            <div className="voice-call-pulse-ring ring-b" />
            <div className="voice-call-pulse-ring ring-c" />
            <img
              src={partnerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
              alt={partnerName}
              className="voice-call-main-avatar"
            />
          </div>

          <h1 className="voice-call-partner-name">{partnerName || 'Astrologer'}</h1>

          <div className="voice-call-badge-live">
            <span className="badge-live-dot" /> LIVE VOICE CALL
          </div>

          <div className="voice-call-timer-display">
            {formatSeconds(ticker.elapsedSeconds)}
          </div>

          {/* Equalizer Sound Waves Spectrum Animation */}
          {!isMuted ? (
            <div className="voice-call-waves">
              <span className="vc-wave w1" />
              <span className="vc-wave w2" />
              <span className="vc-wave w3" />
              <span className="vc-wave w4" />
              <span className="vc-wave w5" />
              <span className="vc-wave w6" />
              <span className="vc-wave w7" />
            </div>
          ) : (
            <div className="voice-call-muted-badge">
              <span>🔇 Microphone Muted</span>
            </div>
          )}

          <p className="voice-call-status-caption">
            {isMuted ? 'Tap unmute below to speak' : 'Connected live via encrypted browser voice'}
          </p>
        </div>

        {/* Bottom Floating Controls Bar */}
        <footer className="voice-call-controls-bar">
          {/* Mute Mic */}
          <button
            type="button"
            onClick={toggleMic}
            className={`voice-ctrl-btn mic-btn ${isMuted ? 'muted' : ''}`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            <div className="voice-ctrl-circle">
              {isMuted ? <IoMicOffOutline /> : <IoMicOutline />}
            </div>
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Speaker Mute/Unmute */}
          <button
            type="button"
            onClick={toggleSpeaker}
            className={`voice-ctrl-btn speaker-btn ${isSpeakerMuted ? 'muted' : ''}`}
            title={isSpeakerMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            <div className="voice-ctrl-circle">
              {isSpeakerMuted ? <IoVolumeMuteOutline /> : <IoVolumeHighOutline />}
            </div>
            <span>{isSpeakerMuted ? 'Unmute' : 'Speaker'}</span>
          </button>

          {/* In-Call Kundali Trigger */}
          <button
            type="button"
            onClick={() => setShowKundaliDrawer(true)}
            className="voice-ctrl-btn kundali-btn"
            title="View Kundali Insights"
          >
            <div className="voice-ctrl-circle">
              <IoSparkles />
            </div>
            <span>Kundali</span>
          </button>

          {/* End Call Button */}
          {!sessionEnded && (
            <button
              type="button"
              onClick={handleEndSession}
              className="voice-ctrl-btn end-btn"
              title="End Voice Call"
            >
              <div className="voice-ctrl-circle">
                <IoCall style={{ transform: 'rotate(135deg)' }} />
              </div>
              <span>End Call</span>
            </button>
          )}
        </footer>

        {/* Hidden HTML5 Audio Element for Peer Audio Streaming */}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        {/* Review Modal after Call End (For Customer) */}
        {sessionEnded && user?.role === 'CUSTOMER' && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(6,11,5,0.85)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px'
          }}>
            <div style={{ background: '#fff', borderRadius: '24px', maxWidth: '440px', width: '100%', padding: '32px 28px', textAlign: 'center', color: '#162b1a', boxShadow: '0 25px 50px rgba(0,0,0,0.35)' }}>
              <h3 style={{ fontSize: '22px', marginBottom: '8px', fontWeight: 800 }}>Rate Your Voice Call</h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                How was your consultation experience with {consultation?.expertName}?
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px', fontSize: '28px', color: '#f59e0b', cursor: 'pointer' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <IoStar
                    key={star}
                    onClick={() => setReviewRating(star)}
                    style={{ opacity: star <= reviewRating ? 1 : 0.3 }}
                  />
                ))}
              </div>

              <textarea
                className="form-textarea"
                rows="3"
                placeholder="Write your review..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                style={{ marginBottom: '20px', width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="btn-outline"
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', cursor: 'pointer', background: 'transparent', fontWeight: 700 }}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #FF6B00, #2a5a30)', color: '#ffffff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Call Completion & Earnings Summary Modal (For Expert) */}
        {sessionEnded && (user?.role === 'EXPERT' || user?.id === consultation?.expertUserId) && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(6,11,5,0.88)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px'
          }}>
            <div style={{
              background: '#ffffff', borderRadius: '24px', maxWidth: '460px', width: '100%',
              padding: '32px 28px', textAlign: 'center', color: '#162b1a',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)', border: '1px solid #d5e8da'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: '#ebf7ed', color: '#FF6B00', fontSize: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(46, 125, 50, 0.18)'
              }}>
                <IoCheckmarkCircle />
              </div>

              <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#162b1a' }}>
                Call Ended Successfully!
              </h3>
              <p style={{ fontSize: '13.5px', color: '#5e7a63', margin: '0 0 20px' }}>
                Your consultation session with <strong>{consultation?.customerName || 'Seeker'}</strong> has concluded.
              </p>

              <div style={{
                background: '#f8faf9', border: '1px solid #e3ede5', borderRadius: '16px',
                padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
                marginBottom: '24px', textAlign: 'left'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#5e7a63', textTransform: 'uppercase', fontWeight: 700 }}>
                    Duration
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#162b1a' }}>
                    {formatSeconds(endSummary?.totalSeconds || ticker.elapsedSeconds)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', color: '#5e7a63', textTransform: 'uppercase', fontWeight: 700 }}>
                    Your Earnings (Net)
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#FF6B00' }}>
                    ₹{(endSummary?.expertEarning != null ? Number(endSummary.expertEarning) : (ticker.currentCost * 0.8)).toFixed(2)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/expert/dashboard/live-call')}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FF6B00, #2a5a30)',
                  color: '#ffffff', border: 'none', fontWeight: 800, fontSize: '15px',
                  cursor: 'pointer', boxShadow: '0 6px 18px rgba(255, 107, 0, 0.35)'
                }}
              >
                Return to Live Call Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: STRICTLY DEDICATED LIVE CHAT ROOM (NO CALLING AT ALL)
  // =========================================================================
  return (
    <div className="chat-page-container">
      {/* Header Bar with Live Billing Ticker */}
      <div className="chat-header-bar">
        <div className="chat-partner-info">
          <img
            src={partnerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
            alt="Partner"
            className="chat-partner-avatar"
          />
          <div>
            <div className="chat-partner-name">{partnerName || 'Astrologer'}</div>
            <span style={{ fontSize: '12px', color: '#FF6B00', fontWeight: 600 }}>● Live Encrypted Chat</span>
          </div>
        </div>

        {/* Real-Time Billing Bar */}
        <div className="billing-ticker-badge">
          <div className="ticker-item">
            <IoTimeOutline /> {formatSeconds(ticker.elapsedSeconds)}
          </div>

          {ticker.freeRemaining > 0 ? (
            <div className="ticker-item free">
              🎁 Free Time: {formatSeconds(ticker.freeRemaining)}
            </div>
          ) : (
            <div className="ticker-item cost">
              Billed: ₹{ticker.currentCost.toFixed(2)}
            </div>
          )}

          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Rate: ₹{consultation?.ratePerMinute}/min
          </div>
        </div>

        {/* Action Controls: Kundali View, Quick Top-Up, End Session */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowKundaliDrawer(true)}
            style={{
              background: '#F8FAF5',
              color: '#FF6B00',
              border: '1px solid #FB923C',
              padding: '7px 12px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="View Client Janam Kundali"
          >
            🔮 Kundali
          </button>

          {user?.role === 'CUSTOMER' && (
            <button
              type="button"
              onClick={() => setShowQuickRecharge(true)}
              style={{
                background: '#FFFFFF',
                color: '#FF6B00',
                border: '1px solid #FF6B00',
                padding: '7px 12px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Add wallet balance without disconnecting"
            >
              ⚡ Top-Up
            </button>
          )}

          {!sessionEnded && (
            <button
              onClick={handleEndSession}
              style={{
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                padding: '8px 18px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <IoStopCircleOutline style={{ fontSize: '18px' }} />
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-messages-area">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === user?.id;
          const msgKey = msg.id || index;
          const isStarred = starredIds.includes(msgKey);
          return (
            <div key={index} className={`message-bubble ${isMe ? 'sent' : 'received'}`}>
              {msg.messageType === 'IMAGE' && msg.fileUrl && (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                  <img src={msg.fileUrl} alt="Attached" className="chat-image-preview" />
                </a>
              )}
              {msg.content && <p>{msg.content}</p>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', gap: '8px' }}>
                <div className="message-time">
                  {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
                <button
                  type="button"
                  onClick={() => toggleStarMessage(msgKey)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: isStarred ? '#F59E0B' : '#94A3B8',
                    fontSize: '14px',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={isStarred ? "Starred Remedy" : "Star Remedy Advice"}
                >
                  <IoStar />
                </button>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 14px',
            background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.95), rgba(245, 243, 255, 0.95))',
            border: '1px solid rgba(165, 180, 252, 0.4)',
            borderRadius: '20px',
            fontSize: '12px',
            color: '#4f46e5',
            fontWeight: 600,
            margin: '4px 0 10px',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.08)'
          }}>
            <IoSparkles style={{ color: '#8b5cf6', fontSize: '14px' }} />
            <span>{partnerName || 'Astrologer'} is typing...</span>
            <span style={{ display: 'inline-flex', gap: '3px', marginLeft: '2px' }}>
              <span className="dot-pulse" style={{ width: '4px', height: '4px', background: '#6366f1', borderRadius: '50%' }}></span>
              <span className="dot-pulse" style={{ width: '4px', height: '4px', background: '#8b5cf6', borderRadius: '50%' }}></span>
              <span className="dot-pulse" style={{ width: '4px', height: '4px', background: '#a855f7', borderRadius: '50%' }}></span>
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      {!sessionEnded ? (
        <form onSubmit={handleSendMessage} className="chat-input-bar">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button
            type="button"
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Kundali / Image"
          >
            <IoAttach />
          </button>

          <input
            type="text"
            className="chat-input-field"
            placeholder="Type your message..."
            value={inputText}
            onChange={handleTyping}
          />

          <button type="submit" className="send-btn">
            <IoSend />
          </button>
        </form>
      ) : (
        <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '16px', textAlign: 'center' }}>
          <p style={{ fontWeight: 600, color: '#334155' }}>
            This chat consultation session has ended.
          </p>
        </div>
      )}

      {/* Review Modal after Session End (For Customer) */}
      {sessionEnded && user?.role === 'CUSTOMER' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(19,10,42,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px'
        }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '30px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '22px', color: '#130a2a', marginBottom: '8px' }}>Rate Your Reading</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
              How was your consultation experience with {consultation?.expertName}?
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px', fontSize: '28px', color: '#f59e0b', cursor: 'pointer' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <IoStar
                  key={star}
                  onClick={() => setReviewRating(star)}
                  style={{ opacity: star <= reviewRating ? 1 : 0.3 }}
                />
              ))}
            </div>

            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Write your review..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              style={{ marginBottom: '20px' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-outline"
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #cbd5e1', cursor: 'pointer', background: 'transparent', fontWeight: 700 }}
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #FF6B00, #2a5a30)', color: '#ffffff', border: 'none', fontWeight: 800, cursor: 'pointer' }}
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Completion & Earnings Summary Modal (For Expert) */}
      {sessionEnded && (user?.role === 'EXPERT' || user?.id === consultation?.expertUserId) && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(6,11,5,0.88)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '24px', maxWidth: '460px', width: '100%',
            padding: '32px 28px', textAlign: 'center', color: '#162b1a',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.4)', border: '1px solid #d5e8da'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#ebf7ed', color: '#FF6B00', fontSize: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(46, 125, 50, 0.18)'
            }}>
              <IoCheckmarkCircle />
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px', color: '#162b1a' }}>
              Chat Ended Successfully!
            </h3>
            <p style={{ fontSize: '13.5px', color: '#5e7a63', margin: '0 0 20px' }}>
              Your live chat session with <strong>{consultation?.customerName || 'Seeker'}</strong> has concluded.
            </p>

            <div style={{
              background: '#f8faf9', border: '1px solid #e3ede5', borderRadius: '16px',
              padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
              marginBottom: '24px', textAlign: 'left'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#5e7a63', textTransform: 'uppercase', fontWeight: 700 }}>
                  Duration
                </span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#162b1a' }}>
                  {formatSeconds(endSummary?.totalSeconds || ticker.elapsedSeconds)}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: '#5e7a63', textTransform: 'uppercase', fontWeight: 700 }}>
                  Your Earnings (Net)
                </span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#FF6B00' }}>
                  ₹{(endSummary?.expertEarning != null ? Number(endSummary.expertEarning) : (ticker.currentCost * 0.8)).toFixed(2)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/expert/dashboard/live-chat')}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #FF6B00, #2a5a30)',
                color: '#ffffff', border: 'none', fontWeight: 800, fontSize: '15px',
                cursor: 'pointer', boxShadow: '0 6px 18px rgba(255, 107, 0, 0.35)'
              }}
            >
              Return to Live Chat Dashboard
            </button>
          </div>
        </div>
      )}
      {showQuickRecharge && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(19, 10, 42, 0.75)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '16px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', maxWidth: '440px', width: '100%',
            padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>⚡</span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Instant Balance Top-Up
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickRecharge(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.5 }}>
              Recharge your wallet instantly with Razorpay to keep your live consultation active without any disconnection or drop.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[100, 250, 500, 1000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  disabled={rechargeLoading}
                  onClick={() => handleQuickRecharge(amt)}
                  style={{
                    padding: '14px', borderRadius: '12px', border: '2px solid #FB923C',
                    background: '#FFFFFF', color: '#FF6B00', fontWeight: 800, fontSize: '16px',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '4px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#FF6B00'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#FB923C'}
                >
                  <span>₹{amt}</span>
                  <span style={{ fontSize: '10px', color: '#78716c', fontWeight: 500 }}>
                    ~{Math.floor(amt / (consultation?.ratePerMinute || 20))} mins
                  </span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
              <span>🔒 256-Bit Encrypted Razorpay Checkout</span>
            </div>
          </div>
        </div>
      )}

      {/* In-Chat Client Kundali Drawer */}
      {showKundaliDrawer && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 3000, display: 'flex', justifyContent: 'flex-end'
        }}>
          <div style={{
            background: '#ffffff', width: '100%', maxWidth: '460px', height: '100%',
            overflowY: 'auto', padding: '24px', boxShadow: '-10px 0 25px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  🔮 Client Kundali Insights
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {consultation?.customerName || 'Seeker'} • Vedic Birth Chart
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowKundaliDrawer(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Quick Planetary Snapshot */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#78716c', textTransform: 'uppercase' }}>Ascendant / Lagna</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#FF6B00' }}>{clientKundali.lagna?.sign}</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#78716c', textTransform: 'uppercase' }}>Moon Sign / Rashi</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#FF6B00' }}>{clientKundali.moonSign}</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#78716c', textTransform: 'uppercase' }}>Sun Sign</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#FF6B00' }}>{clientKundali.sunSign}</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#78716c', textTransform: 'uppercase' }}>Nakshatra</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#FF6B00' }}>{clientKundali.nakshatra}</div>
              </div>
            </div>

            {/* Dosha Status Bar */}
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                Dosha Scans
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Manglik Dosha:</span>
                  <span style={{ fontWeight: 700, color: clientKundali.manglik?.isManglik ? '#ef4444' : '#FF6B00' }}>
                    {clientKundali.manglik?.isManglik ? 'Active' : 'Not Present'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Shani Sade Sati:</span>
                  <span style={{ fontWeight: 700, color: clientKundali.sadeSati?.active ? '#f59e0b' : '#FF6B00' }}>
                    {clientKundali.sadeSati?.active ? clientKundali.sadeSati.phase : 'No Active Sade Sati'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Kaal Sarp Yoga:</span>
                  <span style={{ fontWeight: 700, color: clientKundali.kaalSarp?.detected ? '#ef4444' : '#FF6B00' }}>
                    {clientKundali.kaalSarp?.detected ? clientKundali.kaalSarp.type : 'Clean'}
                  </span>
                </div>
              </div>
            </div>

            {/* 12 Vedic Houses Planetary Placement */}
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                12 Vedic Bhavas (Houses)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {clientKundali.houses?.map((h) => (
                  <div key={h.house} style={{
                    padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0',
                    background: '#ffffff', fontSize: '11px'
                  }}>
                    <div style={{ fontWeight: 700, color: '#FF6B00' }}>H{h.house}: {h.sign}</div>
                    <div style={{ color: '#64748b', marginTop: '2px' }}>
                      {h.planets?.length > 0 ? h.planets.join(', ') : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

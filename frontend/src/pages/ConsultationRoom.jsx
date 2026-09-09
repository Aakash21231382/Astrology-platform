import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  IoSend, IoAttach, IoTimeOutline, IoStopCircleOutline, 
  IoStar, IoImageOutline, IoSparkles 
} from 'react-icons/io5';
import { consultationService, uploadService } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../assets/css/consultation-room.css';

export default function ConsultationRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

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
  const [typingUser, setTypingUser] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [endSummary, setEndSummary] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    async function initSession() {
      try {
        const [resDetails, resMsgs] = await Promise.all([
          consultationService.getConsultation(id),
          consultationService.getMessages(id)
        ]);
        setConsultation(resDetails.data.data);
        setMessages(resMsgs.data.data || []);
        if (resDetails.data.data.status === 'COMPLETED') {
          setSessionEnded(true);
        }
      } catch (err) {
        toast.error('Failed to load consultation session.');
        navigate('/dashboard');
      }
    }
    initSession();

    // Socket setup
    const socket = connectSocket();
    const cid = parseInt(id, 10);

    const joinRoom = () => {
      socket.emit('consultation:join', { consultationId: cid });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.on('connect', joinRoom);
    }

    // Auto-accept if expert joins
    const handleUserJoined = ({ role }) => {
      if (user?.role === 'EXPERT') {
        socket.emit('consultation:accept', { consultationId: cid });
      }
    };
    socket.on('consultation:user_joined', handleUserJoined);

    // Live message receiver
    const handleIncomingMessage = (msg) => {
      if (!msg) return;
      if (msg.consultationId && parseInt(msg.consultationId, 10) !== cid) return;

      setMessages((prev) => {
        // Check if there is an optimistic temp message to replace
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
        // Avoid duplicate
        if (msg.id && prev.some((m) => m.id === msg.id)) {
          return prev;
        }
        return [...prev, msg];
      });
      setIsTyping(false);
      setTimeout(scrollToBottom, 50);
    };
    socket.on('consultation:message', handleIncomingMessage);

    // Live Billing Ticker
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
      toast.info('Consultation has ended.');
    };
    socket.on('consultation:ended', handleSessionEnded);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('consultation:user_joined', handleUserJoined);
      socket.off('consultation:message', handleIncomingMessage);
      socket.off('consultation:billing_tick', handleBillingTick);
      socket.off('consultation:typing', handleTypingStart);
      socket.off('consultation:stop_typing', handleTypingStop);
      socket.off('consultation:ended', handleSessionEnded);
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    const cid = parseInt(id, 10);
    const socket = getSocket();

    // 1. Optimistically display user message in chat immediately!
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

    // 2. Emit message to server
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
      toast.info('Uploading image to remote container...');
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
    if (window.confirm('Are you sure you want to end this consultation session?')) {
      const socket = getSocket();
      socket.emit('consultation:end', {
        consultationId: parseInt(id, 10),
        endReason: user.role === 'EXPERT' ? 'EXPERT_END' : 'CUSTOMER_END'
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

  const partnerName = user?.role === 'EXPERT' ? consultation?.customerName : consultation?.expertName;
  const partnerAvatar = user?.role === 'EXPERT' ? consultation?.customerAvatar : consultation?.expertAvatar;

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
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>● Live Encrypted Room</span>
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

        {/* End Button */}
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
            <IoStopCircleOutline style={{ fontSize: '16px' }} /> End Session
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="chat-messages-area">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={index} className={`message-bubble ${isMe ? 'sent' : 'received'}`}>
              {msg.messageType === 'IMAGE' && msg.fileUrl && (
                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
                  <img src={msg.fileUrl} alt="Attached" className="chat-image-preview" />
                </a>
              )}
              {msg.content && <p>{msg.content}</p>}
              <div className="message-time">
                {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
            <span>{partnerName || 'Astrologer'} is analyzing chart & typing...</span>
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
            placeholder="Type your message or birth details..."
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
            This consultation session has ended.
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
              placeholder="Leave a short comment (optional)..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              style={{ marginBottom: '20px' }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-outline"
                style={{ flex: 1 }}
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { 
  IoCall, 
  IoClose, 
  IoVolumeMuteOutline, 
  IoVolumeHighOutline,
  IoChatbubbleEllipses, 
  IoSparkles,
  IoTimeOutline
} from 'react-icons/io5';
import { soundEffects } from '../utils/soundEffects';

export default function IncomingCallModal({
  callData,
  onAccept,
  onDecline
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [ringSeconds, setRingSeconds] = useState(0);

  useEffect(() => {
    if (!callData) return;

    // Start incoming ringtone sound
    soundEffects.startIncomingCallRingtone();
    setIsMuted(false);
    setRingSeconds(0);

    const timer = setInterval(() => {
      setRingSeconds(s => s + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
      soundEffects.stopIncomingCallRingtone();
    };
  }, [callData]);

  if (!callData) return null;

  const isCall = (callData.type || callData.consultationType || 'CALL').toUpperCase() === 'CALL';
  const customerName = callData.customerName || 'Seeker';
  const customerAvatar = callData.customerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80';
  const ratePerMinute = callData.ratePerMinute || 20;

  const handleToggleMute = (e) => {
    e.stopPropagation();
    if (isMuted) {
      soundEffects.startIncomingCallRingtone();
      setIsMuted(false);
    } else {
      soundEffects.stopIncomingCallRingtone();
      setIsMuted(true);
    }
  };

  const handleAcceptClick = () => {
    soundEffects.stopIncomingCallRingtone();
    soundEffects.playCallConnectedTone();
    onAccept(callData);
  };

  const handleDeclineClick = () => {
    soundEffects.stopIncomingCallRingtone();
    soundEffects.playCallEndedTone();
    onDecline(callData);
  };

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-card">
        {/* Audio Mute / Sound Toggle */}
        <button 
          onClick={handleToggleMute}
          className="incoming-call-sound-toggle"
          title={isMuted ? 'Unmute Ringtone' : 'Silence Ringtone'}
        >
          {isMuted ? <IoVolumeMuteOutline /> : <IoVolumeHighOutline />}
          <span>{isMuted ? 'Muted' : 'Ringing'}</span>
        </button>

        {/* Top Header Badge */}
        <div className="incoming-call-type-badge">
          {isCall ? (
            <>
              <span className="incoming-dot-live"></span>
              <IoCall className="incoming-badge-icon" />
              <span>INCOMING AUDIO CALL</span>
            </>
          ) : (
            <>
              <span className="incoming-dot-live"></span>
              <IoChatbubbleEllipses className="incoming-badge-icon" />
              <span>INCOMING CHAT REQUEST</span>
            </>
          )}
        </div>

        {/* Pulsing Avatar Container */}
        <div className="incoming-avatar-container">
          <div className="incoming-pulse-ring ring-1"></div>
          <div className="incoming-pulse-ring ring-2"></div>
          <div className="incoming-pulse-ring ring-3"></div>
          <img 
            src={customerAvatar} 
            alt={customerName} 
            className="incoming-caller-avatar"
          />
        </div>

        {/* Caller Info */}
        <div className="incoming-caller-details">
          <h2 className="incoming-caller-name">{customerName}</h2>
          <p className="incoming-caller-subtitle">
            {isCall ? 'Calling for live astrology consultation...' : 'Requesting live chat consultation...'}
          </p>

          <div className="incoming-meta-row">
            <span className="incoming-rate-tag">₹{ratePerMinute}/min</span>
            <span className="incoming-time-tag">
              <IoTimeOutline /> Ringing {ringSeconds}s
            </span>
          </div>
        </div>

        {/* Animated Audio Equalizer Bars */}
        <div className="incoming-sound-equalizer">
          <span className="eq-bar eq-1"></span>
          <span className="eq-bar eq-2"></span>
          <span className="eq-bar eq-3"></span>
          <span className="eq-bar eq-4"></span>
          <span className="eq-bar eq-5"></span>
        </div>

        {/* Action Controls */}
        <div className="incoming-actions-row">
          {/* Decline Button */}
          <button 
            onClick={handleDeclineClick}
            className="incoming-btn-decline"
            title="Decline Call"
          >
            <div className="incoming-btn-icon-wrap decline-wrap">
              <IoClose />
            </div>
            <span>Decline</span>
          </button>

          {/* Accept Button */}
          <button 
            onClick={handleAcceptClick}
            className="incoming-btn-accept"
            title="Answer Call"
          >
            <div className="incoming-btn-icon-wrap accept-wrap">
              <IoCall />
            </div>
            <span>Answer {isCall ? 'Call' : 'Chat'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

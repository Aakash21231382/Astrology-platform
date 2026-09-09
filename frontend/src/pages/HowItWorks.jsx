import React from 'react';
import { Link } from 'react-router-dom';
import { IoSparkles } from 'react-icons/io5';
import '../assets/css/how-it-works.css';

export default function HowItWorks() {
  return (
    <div className="how-it-works-page">
      <div className="astro-container">
        <div className="section-header">
          <span className="section-tag">User Guide</span>
          <h1 className="section-title">How Live Consultations Work</h1>
          <p className="how-it-works-subtitle">
            Transparent, secure, and private guidance in just a few simple steps.
          </p>
        </div>

        <div className="astro-grid astro-grid-3 how-it-works-grid">
          <div className="step-card">
            <div className="step-badge-num step-1">
              1
            </div>
            <h3 className="step-card-title">Select an Astrologer</h3>
            <p className="step-card-desc">
              Filter by specialties such as Vedic, Tarot, or Numerology. Look for the green <strong>Active & Online</strong> badge.
            </p>
          </div>

          <div className="step-card">
            <div className="step-badge-num step-2">
              2
            </div>
            <h3 className="step-card-title">Recharge Wallet</h3>
            <p className="step-card-desc">
              Add money safely with Razorpay. Funds stay in your wallet and are deducted strictly per minute of live session.
            </p>
          </div>

          <div className="step-card">
            <div className="step-badge-num step-3">
              3
            </div>
            <h3 className="step-card-title">Live Consultation</h3>
            <p className="step-card-desc">
              Enjoy transparent real-time chat with countdown timers and promotional free minutes. End whenever you wish!
            </p>
          </div>
        </div>

        <div className="how-it-works-cta">
          <Link to="/experts" className="btn-primary how-it-works-cta-btn">
            <IoSparkles /> Find An Online Astrologer
          </Link>
        </div>
      </div>
    </div>
  );
}

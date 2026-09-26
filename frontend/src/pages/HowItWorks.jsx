import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoSparkles } from 'react-icons/io5';
import { publicService } from '../services/api';
import '../assets/css/how-it-works.css';

const DEFAULT_STEPS = [
  {
    step: 1,
    title: 'Select an Astrologer',
    desc: 'Filter by specialties such as Vedic, Tarot, or Numerology. Look for the green Active & Online badge.'
  },
  {
    step: 2,
    title: 'Recharge Wallet',
    desc: 'Add money safely with Razorpay. Funds stay in your wallet and are deducted strictly per minute of live session.'
  },
  {
    step: 3,
    title: 'Live Consultation',
    desc: 'Enjoy transparent real-time chat with countdown timers and promotional free minutes. End whenever you wish!'
  }
];

export default function HowItWorks() {
  const [cmsPage, setCmsPage] = useState(null);
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [isPlainContent, setIsPlainContent] = useState(false);

  useEffect(() => {
    publicService.getCmsPage('how-it-works')
      .then((res) => {
        if (res.data?.data) {
          const data = res.data.data;
          setCmsPage(data);

          if (data.content && typeof data.content === 'string') {
            const trimmed = data.content.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
              try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setSteps(parsed);
                  setIsPlainContent(false);
                  return;
                }
              } catch (e) {
                // Not JSON, continue to plain
              }
            }
            if (trimmed.length > 20 && !trimmed.startsWith('[')) {
              setIsPlainContent(true);
            }
          }
        }
      })
      .catch((err) => console.warn('Could not fetch live how-it-works CMS:', err));
  }, []);

  return (
    <div className="how-it-works-page">
      <div className="astro-container">
        <div className="section-header">
          <span className="section-tag">User Guide</span>
          <h1 className="section-title">
            {cmsPage?.title || 'How Live Consultations Work'}
          </h1>
          <p className="how-it-works-subtitle">
            {cmsPage?.metaDescription || 'Transparent, secure, and private guidance in just a few simple steps.'}
          </p>
        </div>

        {isPlainContent ? (
          <div 
            style={{ 
              background: '#FFFFFF', 
              padding: 32, 
              borderRadius: 12, 
              border: '1px solid #E2E8F0', 
              marginBottom: 32,
              lineHeight: 1.8,
              color: '#0F172A'
            }}
            dangerouslySetInnerHTML={{ __html: cmsPage?.content?.replace(/\n/g, '<br/>') || '' }}
          />
        ) : (
          <div className="astro-grid astro-grid-3 how-it-works-grid">
            {steps.map((item, idx) => (
              <div key={idx} className="step-card">
                <div className={`step-badge-num step-${idx + 1}`}>
                  {item.step || idx + 1}
                </div>
                <h3 className="step-card-title">{item.title}</h3>
                <p className="step-card-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        )}

        <div className="how-it-works-cta">
          <Link to="/experts" className="btn-primary how-it-works-cta-btn">
            <IoSparkles /> Find An Online Astrologer
          </Link>
        </div>
      </div>
    </div>
  );
}


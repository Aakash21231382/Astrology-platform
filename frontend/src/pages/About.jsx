import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  IoSparkles, 
  IoShieldCheckmarkOutline, 
  IoLockClosedOutline, 
  IoWalletOutline, 
  IoHeartOutline,
  IoCheckmarkCircleOutline,
  IoChatbubbleEllipsesOutline,
  IoPersonAddOutline
} from 'react-icons/io5';
import { publicService } from '../services/api';
import '../assets/css/about.css';

export default function About() {
  const [cmsPage, setCmsPage] = useState(null);

  useEffect(() => {
    publicService.getCmsPage('about')
      .then((res) => {
        if (res.data?.data) {
          setCmsPage(res.data.data);
        }
      })
      .catch((err) => console.warn('Could not fetch live about CMS:', err));
  }, []);

  return (
    <div className="about-page-container">
      {/* 1. Hero Header Banner */}
      <section className="about-hero-banner">
        <div className="astro-container">
          <div className="about-hero-content">
            <div className="about-tag-pill">
              <IoSparkles /> About Aakash Psychics Expert
            </div>

            <h1 className="about-main-title">
              {cmsPage?.title || "Guiding Your Life's Journey with Authentic Wisdom & Clarity"}
            </h1>

            <p className="about-lead-text">
              {cmsPage?.metaDescription || "We are a dedicated spiritual consultation platform bringing together genuine Vedic astrologers, intuitive tarot readers, numerologists, and psychic masters to help you navigate love, career, and life's deepest crossroads."}
            </p>

            {/* Trust Metrics Bar */}
            <div className="about-stats-bar">
              <div className="about-stat-box">
                <div className="about-stat-val">500+</div>
                <div className="about-stat-desc">Verified Astrologers & Readers</div>
              </div>
              <div className="about-stat-box">
                <div className="about-stat-val">100%</div>
                <div className="about-stat-desc">Private & Confidential Sessions</div>
              </div>
              <div className="about-stat-box">
                <div className="about-stat-val">Live</div>
                <div className="about-stat-desc">Real-Time Per-Minute Consultations</div>
              </div>
              <div className="about-stat-box">
                <div className="about-stat-val">24 / 7</div>
                <div className="about-stat-desc">Active Online Reader Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Our Story & Purpose */}
      <section className="about-story-block">
        <div className="astro-container">
          <div className="about-story-columns">
            <div className="about-story-text">
              <span className="section-tag">Our Purpose</span>
              <h2>Restoring Integrity & Compassion to Spiritual Guidance</h2>
              {cmsPage?.content ? (
                <div 
                  className="dynamic-about-body"
                  dangerouslySetInnerHTML={{ __html: cmsPage.content.replace(/\n\n/g, '<p></p>').replace(/\n/g, '<br/>') }} 
                />
              ) : (
                <>
                  <p>
                    When facing complex decisions — whether in personal relationships, business ventures, or emotional well-being — seeking honest astrological insight should provide peace of mind, not confusion or apprehension.
                  </p>
                  <p>
                    Too often, seekers encounter unverified claims, complicated consultation processes, or unnecessary superstition. <strong> Psychics Expert</strong> was founded with a clear principle: to create a transparent, reliable sanctuary where anyone can connect with authentic, well-screened mentors directly from the comfort of their home.
                  </p>
                  <p>
                    With transparent per-minute wallet billing, real-time live chat rooms, and strictly verified profiles, you stay in complete control of your session every single second.
                  </p>
                </>
              )}
            </div>

            <div className="about-commitments-card">
              <h3 className="about-card-head">Our Commitment to You</h3>
              <div className="about-commitments-list">
                <div className="about-commitment-item">
                  <IoCheckmarkCircleOutline className="about-check-icon" />
                  <div>
                    <h4>Thoroughly Screened Experts</h4>
                    <p>Every reader is verified for authentic experience, knowledge, and empathetic communication.</p>
                  </div>
                </div>

                <div className="about-commitment-item">
                  <IoCheckmarkCircleOutline className="about-check-icon" />
                  <div>
                    <h4>Absolute Confidentiality</h4>
                    <p>Your birth details, chats, and questions remain strictly anonymous and never shared.</p>
                  </div>
                </div>

                <div className="about-commitment-item">
                  <IoCheckmarkCircleOutline className="about-check-icon" />
                  <div>
                    <h4>No Hidden Fees or Subscriptions</h4>
                    <p>Pay only for the exact minutes you spend in consultation from your prepaid balance.</p>
                  </div>
                </div>

                <div className="about-commitment-item">
                  <IoCheckmarkCircleOutline className="about-check-icon" />
                  <div>
                    <h4>Uplifting & Ethical Advice</h4>
                    <p>Practical, positive remedies designed to empower your decisions, never induce fear.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Four Core Pillars */}
      <section className="about-pillars-block">
        <div className="astro-container">
          <div className="about-block-header">
            <span className="section-tag">Core Values</span>
            <h2>Why Seekers Trust Our Platform</h2>
            <p>
              Designed from the ground up to provide a safe, respectful, and reliable consultation experience.
            </p>
          </div>

          <div className="about-pillars-grid-4">
            <div className="about-pillar-white-card">
              <div className="about-pillar-icon purple">
                <IoShieldCheckmarkOutline />
              </div>
              <h3>Rigorous Vetting</h3>
              <p>
                We review credentials, past reading history, and conduct live evaluation sessions before onboarding any reader.
              </p>
            </div>

            <div className="about-pillar-white-card">
              <div className="about-pillar-icon blue">
                <IoLockClosedOutline />
              </div>
              <h3>Complete Privacy</h3>
              <p>
                All personal details and chats are encrypted end-to-end. Your consultation stays solely between you and your reader.
              </p>
            </div>

            <div className="about-pillar-white-card">
              <div className="about-pillar-icon gold">
                <IoWalletOutline />
              </div>
              <h3>Transparent Wallet</h3>
              <p>
                Recharge anytime via Razorpay. Your balance stays safe and deducts strictly as live session minutes tick by.
              </p>
            </div>

            <div className="about-pillar-white-card">
              <div className="about-pillar-icon rose">
                <IoHeartOutline />
              </div>
              <h3>Compassionate Care</h3>
              <p>
                Guidance focused on practical remedies, encouragement, and actionable clarity to help you move forward.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Astrologer Screening Step Guide */}
      <section className="about-vetting-block">
        <div className="astro-container">
          <div className="about-block-header">
            <span className="section-tag">Quality Standards</span>
            <h2>Our Reader Selection Process</h2>
            <p>
              How we ensure high quality, accuracy, and empathetic guidance across every consultation.
            </p>
          </div>

          <div className="about-vetting-steps">
            <div className="about-vet-step">
              <div className="about-step-badge">1</div>
              <h4>Identity & Profile Audit</h4>
              <p>Verification of background, spiritual tradition pedigree, and past client experience.</p>
            </div>

            <div className="about-vet-step">
              <div className="about-step-badge">2</div>
              <h4>Proficiency Evaluation</h4>
              <p>Practical chart reading and intuition assessments conducted by our senior advisory panel.</p>
            </div>

            <div className="about-vet-step">
              <div className="about-step-badge">3</div>
              <h4>Communication Review</h4>
              <p>Ensuring respectful, patient, and constructive guidance without fatalistic bias.</p>
            </div>

            <div className="about-vet-step">
              <div className="about-step-badge">4</div>
              <h4>Continuous Ratings</h4>
              <p>Reader performance and seeker reviews are monitored regularly to maintain our service standard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Section (Navy theme matching the brand header) */}
      <section className="about-cta-navy-section">
        <div className="astro-container">
          <div className="about-cta-navy-box">
            <h2>Have Questions About Your Life, Love, or Career?</h2>
            <p>
              Connect with a verified astrologer or psychic reader in real time and discover the clarity you deserve today.
            </p>
            <div className="about-cta-actions">
              <Link to="/experts" className="about-btn-gold">
                <IoChatbubbleEllipsesOutline /> Browse Online Readers
              </Link>
              <Link to="/expert/signup" className="about-btn-white-outline">
                <IoPersonAddOutline /> Join as an Astrologer
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

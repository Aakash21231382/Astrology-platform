import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IoPeopleOutline,
  IoStar,
  IoCallOutline,
  IoChatbubblesOutline,
  IoSparkles,
  IoShieldCheckmarkOutline
} from 'react-icons/io5';
import { expertService } from '../../services/api';

export default function CustomerAstrologersPage() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAstrologers() {
      try {
        const res = await expertService.getApprovedList({ limit: 12 });
        setExperts(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load astrologers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAstrologers();
  }, []);

  return (
    <div>
      <div className="customer-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#130a2a', margin: '0 0 4px' }}>
              My Astrologers & Divine Mentors
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Top certified Vedic Astrologers, Numerologists, and Tarot Readers available for instant Consultation.
            </p>
          </div>

          <Link to="/experts" className="customer-header-consult-btn">
            <IoSparkles />
            <span>Discover All Astrologers</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          Loading trusted astrologers...
        </div>
      ) : experts.length > 0 ? (
        <div className="customer-astrologers-grid">
          {experts.map((exp) => (
            <div key={exp.id} className="customer-astrologer-card">
              <div className="customer-astro-top">
                <img
                  src={exp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={exp.displayName}
                  className="customer-astro-avatar"
                />
                <div className="customer-astro-info">
                  <h4 className="customer-astro-name">{exp.displayName || 'Acharya'}</h4>
                  <div className="customer-astro-skills">
                    {exp.title || 'Vedic Astrologer'} • {exp.experienceYears || 5}+ yrs
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12.5px', fontWeight: 700, color: '#d97706' }}>
                      <IoStar style={{ color: '#f59e0b' }} /> {parseFloat(exp.ratingAvg || 5.0).toFixed(1)}
                    </span>
                    <span className="customer-astro-rate">
                      ₹{exp.ratePerMinute || 20}/min
                    </span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 10px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {exp.bio || 'Specialist in Kundali Matching, Career & Finance Guidance, Love Relationships, and Dosha Remedies.'}
              </p>

              {/* Action Buttons: Pure Call vs Pure Chat */}
              <div className="customer-astro-actions">
                <Link to={`/expert/${exp.id}?action=call`} className="customer-btn-call">
                  <IoCallOutline />
                  <span>Call Now</span>
                </Link>

                <Link to={`/expert/${exp.id}?action=chat`} className="customer-btn-chat">
                  <IoChatbubblesOutline />
                  <span>Chat Now</span>
                </Link>
              </div>

              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <Link 
                  to={`/expert/${exp.id}`}
                  style={{ fontSize: '12px', fontWeight: 700, color: '#FF6B00', textDecoration: 'none' }}
                >
                  View Full Profile →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="customer-card customer-empty-state">
          <div className="customer-empty-icon">🔮</div>
          <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
            No Astrologers Found
          </h4>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '18px' }}>
            Browse our directory of verified Vedic experts to start a reading.
          </p>
          <Link to="/experts" className="customer-header-consult-btn" style={{ display: 'inline-flex' }}>
            <IoSparkles />
            <span>Browse Directory</span>
          </Link>
        </div>
      )}
    </div>
  );
}

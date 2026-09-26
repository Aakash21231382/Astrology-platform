import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicService } from '../services/api';
import '../assets/css/offers.css';

const DEFAULT_OFFERS = [
  {
    title: 'First 5 Minutes Free Promotional Consultation',
    desc: 'Connect with any participating verified astrologer and get your first 5 minutes completely on the platform.',
    code: 'FIRST5FREE',
    tag: 'New Seekers',
    expiry: 'Active Today'
  },
  {
    title: 'Flat 20% Wallet Bonus Top-Up',
    desc: 'Recharge your consultation wallet with ₹500 or more and get an instant 20% bonus balance added to your ledger.',
    code: 'DIVYA20',
    tag: 'Recharge Bonus',
    expiry: 'Limited Period'
  },
  {
    title: 'Kundali & Matchmaking Special Reading',
    desc: 'Get in-depth Gun Milan and relationship synastry report with senior Vedic masters at discounted rates.',
    code: 'LOVE2026',
    tag: 'Specialty',
    expiry: 'Ongoing'
  }
];

export default function Offers() {
  const [cmsPage, setCmsPage] = useState(null);
  const [offersList, setOffersList] = useState(DEFAULT_OFFERS);
  const [isPlainContent, setIsPlainContent] = useState(false);

  useEffect(() => {
    publicService.getCmsPage('offers')
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
                  setOffersList(parsed);
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
      .catch((err) => console.warn('Could not fetch live offers CMS:', err));
  }, []);

  return (
    <div className="offers-page">
      <div className="astro-container">
        <div className="section-header">
          <span className="section-tag">Promotions & Discounts</span>
          <h1 className="section-title">
            {cmsPage?.title || 'Special Consultation Offers'}
          </h1>
          <p className="offers-subtitle">
            {cmsPage?.metaDescription || 'Exclusive deals to begin your spiritual clarity journey with our verified psychics and astrologers.'}
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
          <div className="astro-grid astro-grid-3">
            {offersList.map((offer, idx) => (
              <div key={idx} className="offer-card">
                <span className="offer-tag">
                  {offer.tag || 'Special Offer'}
                </span>
                <h3 className="offer-title">{offer.title}</h3>
                <p className="offer-desc">{offer.desc}</p>

                {offer.code && (
                  <div className="offer-code-box">
                    <span className="offer-code-label">Coupon Code:</span>
                    <strong className="offer-code-val">{offer.code}</strong>
                  </div>
                )}

                <Link to="/experts" className="btn-primary offer-apply-btn">
                  Apply & Consult Now
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


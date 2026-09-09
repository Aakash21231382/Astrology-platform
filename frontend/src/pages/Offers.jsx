import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/offers.css';

export default function Offers() {
  const offersList = [
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

  return (
    <div className="offers-page">
      <div className="astro-container">
        <div className="section-header">
          <span className="section-tag">Promotions & Discounts</span>
          <h1 className="section-title">Special Consultation Offers</h1>
          <p className="offers-subtitle">
            Exclusive deals to begin your spiritual clarity journey with our verified psychics and astrologers.
          </p>
        </div>

        <div className="astro-grid astro-grid-3">
          {offersList.map((offer, idx) => (
            <div key={idx} className="offer-card">
              <span className="offer-tag">
                {offer.tag}
              </span>
              <h3 className="offer-title">{offer.title}</h3>
              <p className="offer-desc">{offer.desc}</p>

              <div className="offer-code-box">
                <span className="offer-code-label">Coupon Code:</span>
                <strong className="offer-code-val">{offer.code}</strong>
              </div>

              <Link to="/experts" className="btn-primary offer-apply-btn">
                Apply & Consult Now
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

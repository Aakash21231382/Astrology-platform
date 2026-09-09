import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoClose } from 'react-icons/io5';
import { publicService } from '../services/api';
import '../assets/css/modals.css';

export default function PromotionalPopup() {
  const [popupBanner, setPopupBanner] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPopupBanner() {
      try {
        const res = await publicService.getBanners('POPUP');
        const list = res.data.data || [];
        if (list.length > 0) {
          setPopupBanner(list[0]);
          // Open popup smoothly after 1.5 seconds
          const timer = setTimeout(() => {
            setIsOpen(true);
          }, 1500);
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.warn('Failed to fetch promotional popup banner:', err.message);
      }
    }
    fetchPopupBanner();
  }, []);

  if (!isOpen || !popupBanner) return null;

  const handleBannerClick = () => {
    setIsOpen(false);
    if (popupBanner.ctaUrl) {
      if (popupBanner.ctaUrl.startsWith('http')) {
        window.open(popupBanner.ctaUrl, '_blank', 'noopener,noreferrer');
      } else {
        navigate(popupBanner.ctaUrl);
      }
    } else {
      navigate('/experts');
    }
  };

  return (
    <div className="modal-backdrop-overlay">
      <div className="promo-dialog-box">
        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          aria-label="Close popup"
          className="promo-close-btn"
        >
          <IoClose />
        </button>

        {/* Clickable Banner Content */}
        <div onClick={handleBannerClick}>
          <img
            src={popupBanner.imageUrl}
            alt={popupBanner.title || 'Special Promotion'}
            className="promo-banner-img"
          />

          {popupBanner.title && (
            <div className="promo-body">
              <h3 className="promo-title">
                {popupBanner.title}
              </h3>
              {popupBanner.subtitle && (
                <p className="promo-subtitle">
                  {popupBanner.subtitle}
                </p>
              )}
              <button className="promo-cta-btn">
                {popupBanner.ctaText || 'Claim Offer & Consult Now'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { IoArrowUp } from 'react-icons/io5';

export default function ScrollToTop() {
  const { pathname, search } = useLocation();
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // 1. Automatic Scroll to Top on Route Change
  useEffect(() => {
    // Instant scroll to top on page change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });

    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }

    const mainLayout = document.querySelector('.app-layout');
    if (mainLayout) {
      mainLayout.scrollTop = 0;
    }

    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [pathname, search]);

  // 2. Floating "Back to Top" button visibility listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 320) {
        setShowScrollBtn(true);
      } else {
        setShowScrollBtn(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTopSmooth = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Don't render floating button in consultation chat room
  const isChatRoom = pathname.startsWith('/consultation/');

  return (
    <>
      {!isChatRoom && (
        <button
          type="button"
          onClick={scrollToTopSmooth}
          aria-label="Scroll to top of page"
          title="Back to Top"
          style={{
            position: 'fixed',
            bottom: '28px',
            right: pathname.startsWith('/shop') ? '110px' : '28px', // Avoid overlapping cart button on shop page
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: '#FF6B00',
            color: '#FFFFFF',
            border: '2px solid rgba(255, 255, 255, 0.85)',
            boxShadow: '0 6px 20px rgba(255, 107, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            cursor: 'pointer',
            zIndex: 998,
            opacity: showScrollBtn ? 1 : 0,
            visibility: showScrollBtn ? 'visible' : 'hidden',
            transform: showScrollBtn ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.8)',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.08)';
            e.currentTarget.style.background = '#EA580C';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.background = '#FF6B00';
          }}
        >
          <IoArrowUp />
        </button>
      )}
    </>
  );
}

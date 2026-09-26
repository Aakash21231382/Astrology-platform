import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  IoSparkles, 
  IoSearch, 
  IoClose, 
  IoChevronDown, 
  IoHelpCircleOutline, 
  IoChatbubblesOutline, 
  IoCallOutline,
  IoShieldCheckmarkOutline
} from 'react-icons/io5';
import { publicService } from '../services/api';
import '../assets/css/faq.css';

const DEFAULT_FAQS = [
  {
    category: 'Consultations',
    question: 'How do I start a consultation with an astrologer?',
    answer: 'Browse our verified readers on the Readers page, choose your preferred astrologer based on ratings and specialities, make sure your consultation wallet has sufficient balance, and click "Chat Now" or "Call Now" to begin an instant real-time session.'
  },
  {
    category: 'Consultations',
    question: 'Are my consultation chats and personal details confidential?',
    answer: 'Yes, 100%. All chats, calls, birth dates, and personal queries are encrypted end-to-end. Astrologers cannot export or view your personal phone number or private payment information.'
  },
  {
    category: 'Billing & Wallet',
    question: 'How does per-minute billing work?',
    answer: 'Each astrologer sets a transparent per-minute rate. When you enter a consultation room, balance is deducted second-by-second from your wallet ledger. You can end the consultation at any point, and unspent funds remain safely in your balance.'
  },
  {
    category: 'Billing & Wallet',
    question: 'How do I recharge my consultation wallet?',
    answer: 'Click on the "Recharge" or "Wallet" button in the navigation bar or your seeker dashboard. You can add funds securely via Razorpay using UPI (GPay, PhonePe, Paytm), credit/debit cards, and net banking.'
  },
  {
    category: 'Privacy & Security',
    question: 'Can I get a refund if a session is disconnected due to internet failure?',
    answer: 'Yes! If a technical glitch or internet disconnection occurs on our servers or from the astrologer side, our platform automatically refunds the disrupted minutes back into your wallet balance. You can also contact support for assistance.'
  },
  {
    category: 'Astrologers',
    question: 'How are astrologers and psychic readers screened?',
    answer: 'Every reader undergoes a rigorous 3-step verification process including background checks, document validation, and practical consultation assessments conducted by senior Vedic and Tarot masters.'
  },
  {
    category: 'Astrologers',
    question: 'Can I request a custom Kundali report or matchmaking analysis?',
    answer: 'Yes. During your live consultation, you can provide your exact birth date, time, and location. The astrologer will generate your Kundali chart and provide detailed Gun Milan or gemstone suggestions.'
  }
];

export default function Faq() {
  const [cmsPage, setCmsPage] = useState(null);
  const [faqList, setFaqList] = useState(DEFAULT_FAQS);
  const [isPlainContent, setIsPlainContent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [openIdx, setOpenIdx] = useState(0); // First item open by default

  useEffect(() => {
    loadFaqContent();
  }, []);

  const loadFaqContent = async () => {
    setLoading(true);
    try {
      const res = await publicService.getCmsPage('faq');
      if (res.data?.data) {
        const data = res.data.data;
        setCmsPage(data);

        // Check if content is valid JSON array
        if (data.content && typeof data.content === 'string') {
          const trimmed = data.content.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setFaqList(parsed);
                setIsPlainContent(false);
              }
            } catch (e) {
              console.warn('FAQ content is not valid JSON, displaying as formatted text:', e);
              setIsPlainContent(true);
            }
          } else {
            setIsPlainContent(true);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load dynamic FAQ from CMS, using default curated FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Derive unique categories
  const categories = useMemo(() => {
    if (isPlainContent) return ['All'];
    const cats = new Set(['All']);
    faqList.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats);
  }, [faqList, isPlainContent]);

  // Filtered FAQs based on category & search query
  const filteredFaqs = useMemo(() => {
    if (isPlainContent) return [];
    return faqList.filter((item) => {
      const matchesCategory = 
        selectedCategory === 'All' || 
        (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = 
        !query || 
        (item.question && item.question.toLowerCase().includes(query)) ||
        (item.answer && item.answer.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [faqList, selectedCategory, searchQuery, isPlainContent]);

  const toggleAccordion = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="faq-page-container">
      {/* 1. Hero Header Banner */}
      <section className="faq-hero-banner">
        <div className="astro-container">
          <div className="faq-hero-content">
            <div className="faq-tag-pill">
              <IoSparkles /> Help & Support Center
            </div>

            <h1 className="faq-main-title">
              {cmsPage?.title || 'Frequently Asked Questions'}
            </h1>

            <p className="faq-lead-text">
              {cmsPage?.metaDescription || 
                'Everything you need to know about our verified spiritual consultations, instant wallet billing, and session privacy.'}
            </p>

            {/* Live Search Box */}
            <div className="faq-search-wrapper">
              <div className="faq-search-input-box">
                <IoSearch className="faq-search-icon" />
                <input
                  type="text"
                  className="faq-search-input"
                  placeholder="Search questions (e.g. wallet, refund, privacy, astrology)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    className="faq-search-clear" 
                    onClick={() => setSearchQuery('')}
                    title="Clear search"
                  >
                    <IoClose />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Questions & Answers Section */}
      <section className="faq-content-section">
        {/* Category Pills (Visible when not plain text) */}
        {!isPlainContent && categories.length > 1 && (
          <div className="faq-category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`faq-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Content Area */}
        {isPlainContent ? (
          <div className="faq-plain-content">
            <div dangerouslySetInnerHTML={{ __html: cmsPage?.content?.replace(/\n/g, '<br/>') || '' }} />
          </div>
        ) : filteredFaqs.length > 0 ? (
          <div className="faq-accordion-list">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div key={idx} className={`faq-item-card ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => toggleAccordion(idx)}
                    aria-expanded={isOpen}
                  >
                    <div className="faq-question-left">
                      {faq.category && (
                        <span className="faq-item-cat-badge">{faq.category}</span>
                      )}
                      <h3 className="faq-question-text">{faq.question}</h3>
                    </div>
                    <span className="faq-toggle-icon">
                      <IoChevronDown />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="faq-answer-collapse">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="faq-empty-state">
            <IoHelpCircleOutline style={{ fontSize: '3rem', color: '#FB923C', marginBottom: 12 }} />
            <h3>No matching questions found</h3>
            <p>We couldn't find any questions matching "{searchQuery}". Try a different search term or view all categories.</p>
            <button
              type="button"
              className="faq-cat-pill active"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
            >
              Reset Search & Filters
            </button>
          </div>
        )}

        {/* 3. Still Have Questions? Banner */}
        <div className="faq-support-banner">
          <div className="faq-support-info">
            <h3>Still have questions?</h3>
            <p>Our dedicated spiritual advisory support desk is available 24/7 to assist you.</p>
          </div>

          <div className="faq-support-actions">
            <Link to="/dashboard/support" className="faq-btn-primary">
              <IoChatbubblesOutline /> Contact Support
            </Link>
            <Link to="/experts" className="faq-btn-secondary">
              <IoSparkles /> Talk to Astrologer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

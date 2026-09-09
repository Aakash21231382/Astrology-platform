import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  IoSparkles,
  IoShieldCheckmark,
  IoChatbubbleEllipses,
  IoArrowForward,
  IoCheckmarkCircle,
  IoStar,
  IoPeople,
  IoSearch,
  IoFilterOutline,
  IoLanguageOutline,
  IoSwapVertical
} from 'react-icons/io5';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

import { publicService, expertService } from '../services/api';
import ExpertCard from '../components/ExpertCard';
import WalletModal from '../components/WalletModal';
import { useAuth } from '../context/AuthContext';

const AVAILABLE_LANGUAGES = [
  'English',
  'Hindi',
  'Sanskrit',
  'Tamil',
  'Telugu',
  'Bengali',
  'Marathi',
  'Gujarati',
  'Kannada',
  'Punjabi',
  'Malayalam'
];

export default function Home() {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topExperts, setTopExperts] = useState([]);
  const [displayedExperts, setDisplayedExperts] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [filterLoading, setFilterLoading] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [marketplaceBanners, setMarketplaceBanners] = useState([]);
  const { user, refreshUser } = useAuth();
  const swiperRef = useRef(null);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [banRes, mktRes, catRes, expRes] = await Promise.all([
          publicService.getBanners('HOMEPAGE'),
          publicService.getBanners('MARKETPLACE'),
          publicService.getCategories(),
          expertService.getApprovedList({ sortBy: 'RATING' })
        ]);
        setBanners(banRes.data.data || []);
        setMarketplaceBanners(mktRes.data.data || []);
        setCategories(catRes.data.data || []);
        const list = expRes.data.data || [];
        setTopExperts(list);
        setDisplayedExperts(list);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleFilterSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchName.trim() && !selectedCategory && !selectedLanguage && sortBy === 'rating') {
      setDisplayedExperts(topExperts);
      setIsFiltered(false);
      return;
    }

    setFilterLoading(true);
    setIsFiltered(true);
    try {
      let backendSort = 'RATING';
      if (sortBy === 'price_asc') backendSort = 'PRICE_ASC';
      else if (sortBy === 'price_desc') backendSort = 'PRICE_DESC';
      else if (sortBy === 'experience') backendSort = 'EXPERIENCE';

      const res = await expertService.getApprovedList({
        search: searchName.trim() || undefined,
        category: selectedCategory || undefined,
        sortBy: backendSort
      });
      let list = res.data.data || [];
      if (selectedLanguage) {
        list = list.filter((exp) =>
          exp.languages && exp.languages.toLowerCase().includes(selectedLanguage.toLowerCase())
        );
      }
      setDisplayedExperts(list);
    } catch (err) {
      console.error('Failed to filter experts:', err);
    } finally {
      setFilterLoading(false);
    }
  };

  const handleResetFilter = () => {
    setSearchName('');
    setSelectedCategory('');
    setSelectedLanguage('');
    setSortBy('rating');
    setDisplayedExperts(topExperts);
    setIsFiltered(false);
  };

  const displayBanners = banners;

  return (
    <div className="home-page">
      {/* 100% Full-Width Edge-to-Edge Hero Slider */}
      {displayBanners.length > 0 && (
        <section className="hero-full-slider-section">
          <div className="hero-slider-container">
            <Swiper
              modules={[Autoplay, Pagination]}
              spaceBetween={0}
              slidesPerView={1}
              loop={displayBanners.length > 1}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true
              }}
              speed={750}
              pagination={{ clickable: true }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              className="hero-swiper-main"
            >
          {displayBanners.map((banner, idx) => {
            const hasText = Boolean(banner.title && banner.title.trim().length > 0);

            return (
              <SwiperSlide key={banner.id || idx}>
                {!hasText ? (
                  /* 100% Full Image Banner without text (edge-to-edge full width) */
                  <Link
                    to={banner.ctaUrl || '/experts'}
                    className="full-bleed-banner-link"
                    title="Click to explore"
                  >
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || 'Astrology Banner'}
                      className="full-bleed-banner-img"
                    />
                  </Link>
                ) : (
                  /* Banner with Text Overlay Split */
                  <div className="full-bleed-text-banner">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="full-bleed-bg-img"
                    />
                    <div className="full-bleed-overlay">
                      <div className="astro-container">
                        <div className="hero-content-col">
                          <div className="hero-pill">
                            <IoSparkles /> India's Most Trusted Spiritual Platform
                          </div>

                          <h1 className="hero-title">
                            {banner.title}
                          </h1>

                          {banner.subtitle && (
                            <p className="hero-desc">
                              {banner.subtitle}
                            </p>
                          )}

                          <div className="hero-cta-group">
                            <Link
                              to={banner.ctaUrl || '/experts'}
                              className="btn-gold home-hero-cta-btn"
                            >
                              <IoChatbubbleEllipses style={{ fontSize: '18px' }} />
                              {banner.ctaText || 'Start Live Chat'}
                            </Link>
                            <Link
                              to="/expert/signup"
                              className="btn-outline home-hero-outline-btn"
                            >
                              Join as Astrologer
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Custom React-Icon Chevron Navigation (Left & Right) */}
        {displayBanners.length > 1 && (
          <>
            <button
              type="button"
              className="hero-slider-nav-btn hero-slider-prev"
              onClick={() => swiperRef.current?.slidePrev()}
              aria-label="Previous Slide"
            >
              <FaChevronLeft />
            </button>
            <button
              type="button"
              className="hero-slider-nav-btn hero-slider-next"
              onClick={() => swiperRef.current?.slideNext()}
              aria-label="Next Slide"
            >
              <FaChevronRight />
            </button>
          </>
        )}
      </div>
    </section>
  )}

  {/* Stats Ribbon Directly Below Full-Width Slider */}
  <div className="hero-stats-ribbon">
          <div className="astro-container">
            <div className="stats-ribbon-grid">
              <div className="stats-ribbon-item">
                <div className="ribbon-icon-yellow">
                  <IoPeople />
                </div>
                <div>
                  <h4>500+</h4>
                  <p>Verified Astrologers</p>
                </div>
              </div>

              <div className="stats-ribbon-item">
                <div className="ribbon-icon-green">
                  <IoChatbubbleEllipses />
                </div>
                <div>
                  <h4>50,000+</h4>
                  <p>Live Consultations</p>
                </div>
              </div>

              <div className="stats-ribbon-item">
                <div className="ribbon-icon-gold">
                  <IoStar />
                </div>
                <div>
                  <h4>4.9 / 5</h4>
                  <p>Seeker Satisfaction</p>
                </div>
              </div>

              <div className="stats-ribbon-item">
                <div className="ribbon-icon-blue">
                  <IoShieldCheckmark />
                </div>
                <div>
                  <h4>100% Private</h4>
                  <p>Encrypted Consultation</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Featured Categories */}
      <section className="home-categories-section">
        <div className="astro-container">
          <div className="section-header">
            <span className="section-tag">Spiritual Disciplines</span>
            <h2 className="section-title">Explore Sacred Wisdom</h2>
          </div>

          <div className="astro-grid astro-grid-4">
            {categories.slice(0, 8).map((cat) => (
              <Link to={`/experts?category=${cat.slug}`} key={cat.id} className="category-card">
                <div className="category-icon-box">
                  <IoSparkles />
                </div>
                <h4>{cat.name}</h4>
                <p>{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Astrologers Section */}
      <section className="home-experts-section">
        <div className="astro-container">
          
          {/* Premium Filter Bar */}
          <div className="home-expert-filter-card">
            <form onSubmit={handleFilterSubmit} className="home-expert-filter-form">
              {/* Search by Name */}
              <div className="home-filter-field">
                <IoSearch className="home-filter-field-icon" />
                <input
                  type="text"
                  placeholder="Search astrologer name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="home-filter-text-input"
                />
              </div>

              {/* Category Select */}
              <div className="home-filter-field">
                <IoSparkles className="home-filter-field-icon" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="home-filter-select-input"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Language Select */}
              <div className="home-filter-field">
                <IoLanguageOutline className="home-filter-field-icon" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="home-filter-select-input"
                >
                  <option value="">All Languages</option>
                  {AVAILABLE_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="home-filter-field">
                <IoSwapVertical className="home-filter-field-icon" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="home-filter-select-input"
                >
                  <option value="rating">Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="experience">Experience</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="home-filter-actions">
                <button
                  type="submit"
                  disabled={filterLoading}
                  className="home-filter-search-btn"
                >
                  <IoSearch /> {filterLoading ? 'Searching...' : 'Search'}
                </button>

                {isFiltered && (
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="home-filter-reset-btn"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="astro-flex-between home-experts-header-row">
            <div>
              <span className="section-tag">Top Ranked</span>
              <h2 className="section-title">Verified Astrologers & Psychics</h2>
            </div>
            <Link to="/experts" className="btn-outline">
              View All Experts <IoArrowForward />
            </Link>
          </div>

          {displayedExperts.length > 0 ? (
            <div className="astro-grid astro-grid-3">
              {(isFiltered ? displayedExperts : displayedExperts.slice(0, 6)).map((expert) => (
                <ExpertCard 
                  key={expert.id} 
                  expert={expert} 
                  onOpenWallet={() => setWalletModalOpen(true)}
                />
              ))}
            </div>
          ) : (
            <div className="home-empty-card">
              <p className="home-empty-text">
                No astrologers found matching {searchName ? `"${searchName}"` : 'your filter'}.
              </p>
              <button
                type="button"
                onClick={handleResetFilter}
                className="btn-outline home-empty-reset-btn"
              >
                Clear Filter
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Promotional Marketplace Strip Banner (From Admin Banners -> MARKETPLACE) */}
      {marketplaceBanners.length > 0 && (
        <section className="home-marketplace-section">
          <div className="astro-container">
            {marketplaceBanners.map((b) => (
              <a
                key={b.id}
                href={b.ctaUrl || '/experts'}
                className="home-marketplace-card"
              >
                <img
                  src={b.imageUrl}
                  alt={b.title || 'Special Promotion'}
                  className="home-marketplace-img"
                />
                {b.title && (
                  <div className="home-marketplace-overlay">
                    <h2 className="home-marketplace-title">{b.title}</h2>
                    {b.subtitle && <p className="home-marketplace-subtitle">{b.subtitle}</p>}
                  </div>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="how-it-works-section">
        <div className="astro-container">
          <div className="section-header">
            <span className="section-tag">Simple 3 Steps</span>
            <h2 className="section-title">How Live Consultation Works</h2>
          </div>

          <div className="astro-grid astro-grid-3">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="home-step-title">Choose Your Expert</h3>
              <p className="home-step-desc">
                Browse verified astrologers by skills, customer ratings, and active online status.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="home-step-title">Recharge Wallet</h3>
              <p className="home-step-desc">
                Add funds securely using Razorpay. Enjoy promotional free minutes on selected readers.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="home-step-title">Instant Private Live Chat</h3>
              <p className="home-step-desc">
                Connect in real-time. Pay per minute with authoritative transparent server billing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={walletModalOpen} 
        onClose={() => setWalletModalOpen(false)}
        onSuccess={refreshUser}
        currentBalance={user?.walletBalance || 0}
      />
    </div>
  );
}

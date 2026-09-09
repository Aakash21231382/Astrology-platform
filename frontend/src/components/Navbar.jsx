import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  IoPerson, 
  IoWalletOutline, 
  IoLogOutOutline, 
  IoMenu, 
  IoClose, 
  IoChevronDown, 
  IoSparkles,
  IoGridOutline,
  IoPersonCircleOutline
} from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { publicService } from '../services/api';
import WalletModal from './WalletModal';
import LogoImg from '../assets/images/logo.png';

// All categories from database with default seed values
const INITIAL_CATEGORIES = [
  { id: 7, name: 'Love & Relationship', slug: 'love-relationship' },
  { id: 6, name: 'Psychic & Clairvoyance', slug: 'psychic-clairvoyance' },
  { id: 2, name: 'Tarot Reading', slug: 'tarot-reading' },
  { id: 1, name: 'Vedic Astrology', slug: 'vedic-astrology' },
  { id: 3, name: 'Numerology', slug: 'numerology' },
  { id: 4, name: 'Palmistry', slug: 'palmistry' },
  { id: 5, name: 'Vastu Shastra', slug: 'vastu-shastra' },
  { id: 8, name: 'Career & Wealth', slug: 'career-wealth' }
];

export default function Navbar() {
  const { user, isAuthenticated, isCustomer, isExpert, logout, refreshUser } = useAuth();
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [readersDropdownOpen, setReadersDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolledUserDropdownOpen, setScrolledUserDropdownOpen] = useState(false);
  const [mobileReadersOpen, setMobileReadersOpen] = useState(false);
  const dropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
  const scrolledUserDropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch all live categories from database
  useEffect(() => {
    publicService.getCategories().then((res) => {
      if (res?.data?.data && res.data.data.length > 0) {
        setCategories(res.data.data);
      }
    }).catch((err) => {
      console.warn('Using initial categories for navbar:', err);
    });
  }, []);

  // Format category display names exactly matching reference screenshot
  const formatCategoryName = (name) => {
    const n = (name || '').trim().toLowerCase();
    if (n.includes('love')) return 'LOVE & RELATIONSHIPS';
    if (n.includes('psychic')) return 'PSYCHIC READING';
    if (n.includes('tarot')) return 'TAROT READING';
    if (n.includes('vedic')) return 'VEDIC ASTROLOGY';
    if (n.includes('numerology')) return 'NUMEROLOGY';
    if (n.includes('palmistry')) return 'PALMISTRY';
    if (n.includes('vastu')) return 'VASTU SHASTRA';
    if (n.includes('career')) return 'CAREER & WEALTH';
    return name.toUpperCase();
  };

  // Sort categories prioritizing Love & Relationships, Psychic, Tarot, Vedic, followed by all others
  const sortedCategories = React.useMemo(() => {
    const list = categories && categories.length > 0 ? categories : INITIAL_CATEGORIES;
    const priority = ['love', 'psychic', 'tarot', 'vedic', 'numerology', 'palmistry', 'vastu', 'career'];
    return [...list].sort((a, b) => {
      const aSlug = (a.slug || a.name || '').toLowerCase();
      const bSlug = (b.slug || b.name || '').toLowerCase();
      const aIdx = priority.findIndex((p) => aSlug.includes(p));
      const bIdx = priority.findIndex((p) => bSlug.includes(p));
      const aRank = aIdx === -1 ? 99 : aIdx;
      const bRank = bIdx === -1 ? 99 : bIdx;
      return aRank - bRank;
    });
  }, [categories]);

  // Handle scroll listener
  useEffect(() => {
    const handleScroll = () => {
      // Topbar height is approx 80px - when scrolled past, lock main navbar to top: 0
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setReadersDropdownOpen(false);
    setUserDropdownOpen(false);
    setScrolledUserDropdownOpen(false);
    setMobileMenuOpen(false);
    setMobileReadersOpen(false);
  }, [location.pathname, location.search]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setReadersDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (scrolledUserDropdownRef.current && !scrolledUserDropdownRef.current.contains(e.target)) {
        setScrolledUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`mobile-nav-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Off-canvas Side Drawer (Slides in from Left, exactly like Admin Panel) */}
      <aside className={`nav-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="mobile-drawer-brand">
            <img src={LogoImg} alt="VVIP Psychics Expert" className="mobile-drawer-logo" />
          </Link>
          <button 
            type="button" 
            className="mobile-drawer-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <IoClose />
          </button>
        </div>

        {isAuthenticated && (
          <div className="mobile-drawer-user-card">
            <div className="drawer-user-info-left">
              <span className="drawer-user-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
              <div className="drawer-user-text">
                <span className="drawer-user-name">{user?.name}</span>
                <span className="drawer-user-role">{isExpert ? 'Verified Expert' : 'Customer'}</span>
              </div>
            </div>
            {isCustomer && (
              <button 
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setWalletModalOpen(true);
                }} 
                className="drawer-wallet-pill"
                title="Recharge Wallet"
              >
                <IoWalletOutline />
                <span>₹{parseFloat(user?.walletBalance || user?.wallet_balance || 0).toFixed(2)}</span>
              </button>
            )}
          </div>
        )}

        <div className="mobile-drawer-nav">
          <div className="mobile-section-heading">EXPLORE & CONSULT</div>
          <ul className="mobile-nav-list">
            <li>
              <NavLink to="/" end onClick={() => setMobileMenuOpen(false)}>
                HOME
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" onClick={() => setMobileMenuOpen(false)}>
                ABOUT US
              </NavLink>
            </li>
            
            {/* Mobile Readers Expandable Submenu */}
            <li className="mobile-readers-item">
              <div 
                className="mobile-dropdown-header" 
                onClick={() => setMobileReadersOpen(!mobileReadersOpen)}
              >
                <span>READERS</span>
                <IoChevronDown className={`dropdown-arrow ${mobileReadersOpen ? 'rotated' : ''}`} />
              </div>
              {mobileReadersOpen && (
                <ul className="mobile-submenu-list">
                  <li>
                    <Link to="/experts" onClick={() => setMobileMenuOpen(false)}>
                      ★ All Readers & Psychics
                    </Link>
                  </li>
                  {sortedCategories.map((cat, idx) => (
                    <li key={cat.id || idx}>
                      <Link to={`/experts?category=${cat.slug}`} onClick={() => setMobileMenuOpen(false)}>
                        {formatCategoryName(cat.name)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            <li>
              <NavLink to="/offers" onClick={() => setMobileMenuOpen(false)}>
                OFFERS
              </NavLink>
            </li>
            <li>
              <NavLink to="/how-it-works" onClick={() => setMobileMenuOpen(false)}>
                HOW IT WORKS
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="mobile-nav-actions">
          {isAuthenticated ? (
            <div className="mobile-drawer-btn-group">
              {(!isExpert || location.pathname !== '/expert/dashboard') && (
                <Link 
                  to={isExpert ? "/expert/dashboard" : "/dashboard"} 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="mobile-btn mobile-btn-primary"
                >
                  <IoPerson className="btn-icon" /> {isExpert ? 'EXPERT PORTAL' : 'MY ACCOUNT'}
                </Link>
              )}
              <button 
                type="button" 
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }} 
                className="mobile-btn mobile-btn-logout"
              >
                <IoLogOutOutline className="btn-icon" /> LOGOUT
              </button>
            </div>
          ) : (
            <div className="mobile-drawer-btn-group">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="mobile-btn mobile-btn-login">
                <IoPerson className="btn-icon" /> LOG IN
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="mobile-btn mobile-btn-signup">
                <IoPerson className="btn-icon" /> SIGN UP
              </Link>
              <Link to="/expert/signup" onClick={() => setMobileMenuOpen(false)} className="mobile-btn mobile-btn-expert">
                <IoSparkles className="btn-icon" /> SIGN UP EXPERT
              </Link>
            </div>
          )}
        </div>
      </aside>

      <header className="astro-navbar-wrapper">
        {/* 1. Top Bar (Dark Navy #041639) - scrolls naturally with the page */}
        <div className="astro-topbar">
          <div className="container astro-container topbar-content">
            {/* Topbar Logo - large and clear */}
            <Link to="/" className="topbar-logo-link" title="VVIP Psychics Expert">
              <img src={LogoImg} alt="VVIP Psychics Expert" className="topbar-logo-img" />
            </Link>

            {/* Topbar Action Buttons (LOG IN, SIGN UP, SIGN UP EXPERT) */}
            <div className="topbar-actions">
              {isAuthenticated ? (
                <>
                  {isCustomer && (
                    <button 
                      onClick={() => setWalletModalOpen(true)}
                      className="nav-wallet-badge"
                      title="Recharge Wallet"
                    >
                      <IoWalletOutline style={{ fontSize: '16px' }} />
                      <span>₹{parseFloat(user?.walletBalance || 0).toFixed(2)}</span>
                    </button>
                  )}

                  {/* Interactive Profile Dropdown (Replaces separate portal & logout buttons) */}
                  <div className="topbar-user-dropdown-wrap" ref={userDropdownRef}>
                    <button 
                      type="button"
                      className={`topbar-user-pill clickable ${userDropdownOpen ? 'active' : ''}`}
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      aria-expanded={userDropdownOpen}
                      title="User Profile Menu"
                    >
                      <div className="topbar-user-avatar">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Avatar" />
                        ) : (
                          <IoPerson />
                        )}
                      </div>
                      <span className="topbar-user-name">
                        {user?.fullName?.split(' ')[0] || user?.email?.split('@')[0]}
                      </span>
                      {isExpert && (
                        <span className="topbar-role-badge">EXPERT</span>
                      )}
                      <IoChevronDown className={`topbar-pill-chevron ${userDropdownOpen ? 'rotated' : ''}`} />
                    </button>

                    {/* Profile Dropdown Menu */}
                    {userDropdownOpen && (
                      <div className="topbar-user-dropdown-menu">
                        <div className="dropdown-user-header">
                          <div className="header-user-avatar">
                            {user?.avatarUrl ? (
                              <img src={user.avatarUrl} alt="Avatar" />
                            ) : (
                              <IoPerson />
                            )}
                          </div>
                          <div className="header-user-info">
                            <div className="header-name">{user?.fullName || 'User'}</div>
                            <div className="header-email">{user?.email}</div>
                            <span className={`header-role-tag ${isExpert ? 'expert' : 'seeker'}`}>
                              {isExpert ? '⭐ Verified Expert Reader' : 'Seeker Account'}
                            </span>
                          </div>
                        </div>

                        <div className="dropdown-user-links">
                          {isExpert && (
                            <>
                              <Link 
                                to="/expert/dashboard" 
                                className="user-dropdown-item"
                                onClick={() => setUserDropdownOpen(false)}
                              >
                                <IoGridOutline />
                                <span>Expert Dashboard</span>
                              </Link>
                              {user?.expertProfileId && (
                                <Link 
                                  to={`/expert/${user.expertProfileId}`} 
                                  className="user-dropdown-item"
                                  onClick={() => setUserDropdownOpen(false)}
                                >
                                  <IoPersonCircleOutline />
                                  <span>Public Profile Preview</span>
                                </Link>
                              )}
                            </>
                          )}

                          {isCustomer && (
                            <>
                              <Link 
                                to="/dashboard" 
                                className="user-dropdown-item"
                                onClick={() => setUserDropdownOpen(false)}
                              >
                                <IoGridOutline />
                                <span>My Account & Orders</span>
                              </Link>
                              <button 
                                type="button" 
                                className="user-dropdown-item"
                                onClick={() => {
                                  setUserDropdownOpen(false);
                                  setWalletModalOpen(true);
                                }}
                              >
                                <IoWalletOutline />
                                <span>Recharge Wallet (₹{parseFloat(user?.walletBalance || 0).toFixed(2)})</span>
                              </button>
                            </>
                          )}

                          <div className="user-dropdown-divider"></div>

                          <button 
                            type="button"
                            onClick={() => {
                              setUserDropdownOpen(false);
                              handleLogout();
                            }}
                            className="user-dropdown-item logout-item"
                          >
                            <IoLogOutOutline />
                            <span>Log Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className="topbar-btn">
                    <IoPerson /> LOG IN
                  </Link>
                  <Link to="/register" className="topbar-btn">
                    <IoPerson /> SIGN UP
                  </Link>
                  <Link to="/expert/signup" className="topbar-btn btn-expert">
                    <IoPerson /> SIGN UP EXPERT
                  </Link>
                </>
              )}

              {/* Mobile Hamburger Toggle (Visible on mobile/tablet) */}
              <button 
                className="topbar-mobile-toggle" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <IoClose /> : <IoMenu />}
              </button>
            </div>
          </div>
        </div>

        {/* 2. Main Navigation Bar (Lavender / Light Lilac #ecdcfc) - STICKY TOP: 0 */}
        <nav className={`astro-main-navbar ${isScrolled ? 'is-scrolled' : ''}`}>
          <div className="container astro-container main-nav-content">
            
            {/* Left Brand Area:
                - When unscrolled: Big circled text "PSYCHIC READING / LIFT YOUR LIFE. INSTANT ADVICE"
                - When scrolled: The circled text DISAPPEARS and the LOGO moves down inside high-contrast badge!
            */}
            <div className="nav-brand-left">
              {isScrolled ? (
                <Link to="/" className="scrolled-nav-logo-link" title="Home">
                  <img src={LogoImg} alt="VVIP Psychics Expert" className="scrolled-nav-logo-img" />
                </Link>
              ) : (
                <Link to="/" className="nav-title-box" title="Psychic Reading">
                  <span className="nav-title-main">PSYCHIC READING</span>
                  <span className="nav-title-sub">LIFT YOUR LIFE. INSTANT ADVICE</span>
                </Link>
              )}
            </div>

            {/* Center Navigation Links (white-space: nowrap to prevent 2-line wraps) */}
            <ul className="nav-menu-links">
              <li className="nav-menu-item">
                <NavLink to="/" end>HOME</NavLink>
              </li>
              <li className="nav-menu-item">
                <NavLink to="/about">ABOUT US</NavLink>
              </li>

              {/* READERS WITH CATEGORY DROPDOWN (Matches exact user screenshot) */}
              <li 
                className={`nav-menu-item dropdown-parent ${readersDropdownOpen ? 'open' : ''}`}
                ref={dropdownRef}
                onMouseEnter={() => setReadersDropdownOpen(true)}
                onMouseLeave={() => setReadersDropdownOpen(false)}
              >
                <div 
                  className="readers-nav-trigger"
                  onClick={() => setReadersDropdownOpen(!readersDropdownOpen)}
                >
                  <NavLink to="/experts" className={({ isActive }) => (isActive ? 'active' : '')}>
                    READERS
                  </NavLink>
                  <IoChevronDown className={`dropdown-arrow ${readersDropdownOpen ? 'rotated' : ''}`} />
                </div>

                {/* Categories Dropdown Menu - Sleek Column Select Menu */}
                {readersDropdownOpen && (
                  <div className="nav-dropdown-menu readers-select-menu">
                    <div className="readers-dropdown-header">
                      <span>Browse by Category</span>
                    </div>

                    <div className="readers-dropdown-list">
                      <Link
                        to="/experts"
                        className="readers-dropdown-item all-readers"
                        onClick={() => setReadersDropdownOpen(false)}
                      >
                        <span className="cat-item-icon">★</span>
                        <span className="cat-item-name">All Readers & Psychics</span>
                      </Link>

                      <div className="readers-dropdown-divider"></div>

                      {sortedCategories.map((cat, idx) => {
                        const displayName = formatCategoryName(cat.name);
                        return (
                          <Link
                            key={cat.id || idx}
                            to={`/experts?category=${cat.slug}`}
                            className="readers-dropdown-item"
                            onClick={() => setReadersDropdownOpen(false)}
                          >
                            <span className="cat-item-dot"></span>
                            <span className="cat-item-name">{displayName}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </li>

              {/* Note: CATEGORIES item was removed as requested and merged into READERS dropdown */}
              <li className="nav-menu-item">
                <NavLink to="/offers">OFFERS</NavLink>
              </li>
              <li className="nav-menu-item">
                <NavLink to="/how-it-works">HOW IT WORKS</NavLink>
              </li>
            </ul>

            {/* Right Section: When scrolled, the action buttons move down here! */}
            {isScrolled && (
              <div className="scrolled-nav-actions">
                {isAuthenticated ? (
                  <>
                    {isCustomer && (
                      <button 
                        onClick={() => setWalletModalOpen(true)}
                        className="scrolled-wallet-btn"
                        title="Recharge Wallet"
                      >
                        <IoWalletOutline />
                        <span>₹{parseFloat(user?.walletBalance || 0).toFixed(2)}</span>
                      </button>
                    )}
                    {/* Scrolled Interactive Profile Dropdown */}
                    <div className="topbar-user-dropdown-wrap" ref={scrolledUserDropdownRef}>
                      <button 
                        type="button"
                        className={`scrolled-user-pill ${scrolledUserDropdownOpen ? 'active' : ''}`}
                        onClick={() => setScrolledUserDropdownOpen(!scrolledUserDropdownOpen)}
                        aria-expanded={scrolledUserDropdownOpen}
                        title="User Profile Menu"
                      >
                        <div className="topbar-user-avatar">
                          {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" />
                          ) : (
                            <IoPerson />
                          )}
                        </div>
                        <span className="topbar-user-name">
                          {user?.fullName?.split(' ')[0] || user?.email?.split('@')[0]}
                        </span>
                        {isExpert && (
                          <span className="topbar-role-badge">EXPERT</span>
                        )}
                        <IoChevronDown className={`topbar-pill-chevron ${scrolledUserDropdownOpen ? 'rotated' : ''}`} />
                      </button>

                      {/* Scrolled Profile Dropdown Menu */}
                      {scrolledUserDropdownOpen && (
                        <div className="topbar-user-dropdown-menu">
                          <div className="dropdown-user-header">
                            <div className="header-user-avatar">
                              {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="Avatar" />
                              ) : (
                                <IoPerson />
                              )}
                            </div>
                            <div className="header-user-info">
                              <div className="header-name">{user?.fullName || 'User'}</div>
                              <div className="header-email">{user?.email}</div>
                              <span className={`header-role-tag ${isExpert ? 'expert' : 'seeker'}`}>
                                {isExpert ? '⭐ Verified Expert Reader' : 'Seeker Account'}
                              </span>
                            </div>
                          </div>

                          <div className="dropdown-user-links">
                            {isExpert && (
                              <>
                                <Link 
                                  to="/expert/dashboard" 
                                  className="user-dropdown-item"
                                  onClick={() => setScrolledUserDropdownOpen(false)}
                                >
                                  <IoGridOutline />
                                  <span>Expert Dashboard</span>
                                </Link>
                                {user?.expertProfileId && (
                                  <Link 
                                    to={`/expert/${user.expertProfileId}`} 
                                    className="user-dropdown-item"
                                    onClick={() => setScrolledUserDropdownOpen(false)}
                                  >
                                    <IoPersonCircleOutline />
                                    <span>Public Profile Preview</span>
                                  </Link>
                                )}
                              </>
                            )}

                            {isCustomer && (
                              <>
                                <Link 
                                  to="/dashboard" 
                                  className="user-dropdown-item"
                                  onClick={() => setScrolledUserDropdownOpen(false)}
                                >
                                  <IoGridOutline />
                                  <span>My Account & Orders</span>
                                </Link>
                                <button 
                                  type="button" 
                                  className="user-dropdown-item"
                                  onClick={() => {
                                    setScrolledUserDropdownOpen(false);
                                    setWalletModalOpen(true);
                                  }}
                                >
                                  <IoWalletOutline />
                                  <span>Recharge Wallet (₹{parseFloat(user?.walletBalance || 0).toFixed(2)})</span>
                                </button>
                              </>
                            )}

                            <div className="user-dropdown-divider"></div>

                            <button 
                              type="button"
                              onClick={() => {
                                setScrolledUserDropdownOpen(false);
                                handleLogout();
                              }}
                              className="user-dropdown-item logout-item"
                            >
                              <IoLogOutOutline />
                              <span>Log Out</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="scrolled-action-btn">
                      <IoPerson /> LOG IN
                    </Link>
                    <Link to="/register" className="scrolled-action-btn">
                      <IoPerson /> SIGN UP
                    </Link>
                    <Link to="/expert/signup" className="scrolled-action-btn btn-expert">
                      <IoPerson /> SIGN UP EXPERT
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* When main navbar is fixed at top: 0, placeholder preserves natural layout flow so page doesn't jump */}
        {isScrolled && <div className="astro-navbar-placeholder" />}
      </header>

      {/* Wallet Modal */}
      <WalletModal 
        isOpen={walletModalOpen} 
        onClose={() => setWalletModalOpen(false)}
        onSuccess={refreshUser}
        currentBalance={user?.walletBalance || 0}
      />
    </>
  );
}

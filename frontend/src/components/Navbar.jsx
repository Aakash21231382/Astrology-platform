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
  IoPersonCircleOutline,
  IoCallOutline,
  IoChatbubblesOutline
} from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { publicService } from '../services/api';
import WalletModal from './WalletModal';

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
  const [mobileReadersOpen, setMobileReadersOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const userDropdownRef = useRef(null);
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

  // Format category display names
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

  // Sort categories prioritizing Love, Psychic, Tarot, Vedic
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

  // Handle sticky scroll state
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
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

      {/* Mobile Off-canvas Side Drawer */}
      <aside className={`nav-mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-header">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="mobile-drawer-brand">
            <span className="mobile-drawer-brand-text">Aakash</span>
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
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'
                )}
              </span>
              <div className="drawer-user-text">
                <span className="drawer-user-name">{user?.fullName || 'User'}</span>
                <span className="drawer-user-role">{isExpert ? 'Verified Astrologer' : 'Seeker Account'}</span>
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
                <span>₹{parseFloat(user?.walletBalance || 0).toFixed(2)}</span>
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
              <NavLink to="/shop" onClick={() => setMobileMenuOpen(false)}>
                SHOPPING
              </NavLink>
            </li>
            <li>
              <NavLink to="/puja" onClick={() => setMobileMenuOpen(false)}>
                PUJA
              </NavLink>
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
            <li>
              <NavLink to="/faq" onClick={() => setMobileMenuOpen(false)}>
                FAQ
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
                  <IoPerson className="btn-icon" /> {isExpert ? 'EXPERT DASHBOARD' : 'MY DASHBOARD'}
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

      {/* Unified Single Navbar */}
      <header className={`astro-unified-navbar ${isScrolled ? 'is-scrolled' : ''}`}>
        <div className="container astro-container unified-nav-inner">
          
          {/* 1. Left Brand Logo */}
          <div className="unified-nav-brand">
            <Link to="/" className="unified-logo-link" title="Aakash Astrology">
              <span className="unified-brand-text">Aakash</span>
            </Link>
          </div>

          {/* 2. Center Nav Menu Links */}
          <nav className="unified-nav-center">
            <ul className="unified-menu-links">
              <li className="unified-menu-item">
                <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
                  HOME
                </NavLink>
              </li>
              <li className="unified-menu-item">
                <NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>
                  ABOUT US
                </NavLink>
              </li>

              {/* Readers Dropdown */}
              <li 
                className={`unified-menu-item dropdown-parent ${readersDropdownOpen ? 'open' : ''}`}
                ref={dropdownRef}
                onMouseEnter={() => setReadersDropdownOpen(true)}
                onMouseLeave={() => setReadersDropdownOpen(false)}
              >
                <div 
                  className="unified-readers-trigger"
                  onClick={() => setReadersDropdownOpen(!readersDropdownOpen)}
                >
                  <NavLink to="/experts" className={({ isActive }) => (isActive ? 'active' : '')}>
                    READERS
                  </NavLink>
                  <IoChevronDown className={`dropdown-arrow ${readersDropdownOpen ? 'rotated' : ''}`} />
                </div>

                {/* Categories Dropdown Menu */}
                {readersDropdownOpen && (
                  <div className="nav-dropdown-menu readers-select-menu">
                    <div className="readers-dropdown-header">
                      <span>Browse by Specialty</span>
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

              <li className="unified-menu-item">
                <NavLink to="/shop" className={({ isActive }) => (isActive ? 'active' : '')}>
                  SHOPPING
                </NavLink>
              </li>
              <li className="unified-menu-item">
                <NavLink to="/puja" className={({ isActive }) => (isActive ? 'active' : '')}>
                  PUJA
                </NavLink>
              </li>
              <li className="unified-menu-item">
                <NavLink to="/offers" className={({ isActive }) => (isActive ? 'active' : '')}>
                  OFFERS
                </NavLink>
              </li>
            </ul>
          </nav>

          {/* 3. Right Action Items */}
          <div className="unified-nav-right">
            {isAuthenticated ? (
              <div className="unified-user-actions">
                {isCustomer && (
                  <button 
                    onClick={() => setWalletModalOpen(true)}
                    className="unified-wallet-btn"
                    title="Recharge Wallet"
                  >
                    <IoWalletOutline style={{ fontSize: '16px' }} />
                    <span>₹{parseFloat(user?.walletBalance || 0).toFixed(2)}</span>
                  </button>
                )}

                {/* User Profile Pill & Dropdown */}
                <div className="unified-user-dropdown-wrap" ref={userDropdownRef}>
                  <button 
                    type="button"
                    className={`unified-user-pill ${userDropdownOpen ? 'active' : ''}`}
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    aria-expanded={userDropdownOpen}
                    title="User Profile Menu"
                  >
                    <div className="unified-avatar-circle">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Avatar" />
                      ) : (
                        <IoPerson />
                      )}
                    </div>
                    <span className="unified-user-name">
                      {user?.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                    </span>
                    {isExpert && (
                      <span className="unified-role-tag">EXPERT</span>
                    )}
                    <IoChevronDown className={`unified-chevron ${userDropdownOpen ? 'rotated' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="unified-dropdown-card">
                      <div className="unified-dropdown-header">
                        <div className="unified-avatar-large">
                          {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" />
                          ) : (
                            <IoPerson />
                          )}
                        </div>
                        <div className="unified-dropdown-meta">
                          <div className="unified-drop-name">{user?.fullName || 'User'}</div>
                          <div className="unified-drop-email">{user?.email}</div>
                          <span className={`unified-drop-role ${isExpert ? 'expert' : 'seeker'}`}>
                            {isExpert ? '⭐ Verified Astrologer' : 'Seeker Account'}
                          </span>
                        </div>
                      </div>

                      <div className="unified-dropdown-links">
                        {isExpert && (
                          <>
                            <Link 
                              to="/expert/dashboard" 
                              className="unified-drop-link"
                              onClick={() => setUserDropdownOpen(false)}
                            >
                              <IoGridOutline />
                              <span>Expert Dashboard</span>
                            </Link>
                            {user?.expertProfileId && (
                              <Link 
                                to={`/expert/${user.expertProfileId}`} 
                                className="unified-drop-link"
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
                              className="unified-drop-link"
                              onClick={() => setUserDropdownOpen(false)}
                            >
                              <IoGridOutline />
                              <span>My Dashboard & Orders</span>
                            </Link>
                            <button 
                              type="button" 
                              className="unified-drop-link"
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

                        <div className="unified-drop-divider"></div>

                        <button 
                          type="button" 
                          onClick={() => {
                            setUserDropdownOpen(false);
                            handleLogout();
                          }} 
                          className="unified-drop-link logout"
                        >
                          <IoLogOutOutline />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="unified-auth-buttons">
                <Link to="/login" className="unified-btn unified-btn-outline">
                  <IoPerson /> LOG IN
                </Link>
                <Link to="/register" className="unified-btn unified-btn-outline">
                  <IoPerson /> SIGN UP
                </Link>
                <Link to="/expert/signup" className="unified-btn unified-btn-gold">
                  <IoSparkles /> SIGN UP EXPERT
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button 
              className="unified-mobile-toggle" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <IoClose /> : <IoMenu />}
            </button>
          </div>

        </div>
      </header>

      {/* Wallet Recharge Modal */}
      <WalletModal 
        isOpen={walletModalOpen} 
        onClose={() => setWalletModalOpen(false)}
        onSuccess={refreshUser}
        currentBalance={user?.walletBalance || 0}
      />
    </>
  );
}

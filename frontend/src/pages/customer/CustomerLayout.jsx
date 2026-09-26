import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  IoSpeedometerOutline,
  IoChatbubblesOutline,
  IoWalletOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoHelpCircleOutline,
  IoSparkles,
  IoGlobeOutline,
  IoLogOutOutline,
  IoMenu,
  IoClose,
  IoAdd,
  IoCallOutline,
  IoHeartOutline,
  IoFlameOutline
} from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import WalletModal from '../../components/WalletModal';
import '../../assets/css/customer-layout.css';

export default function CustomerLayout() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determine current page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/dashboard/') return 'Dashboard Overview';
    if (path.includes('/consultations')) return 'My Consultations (Chat & Call)';
    if (path.includes('/wallet')) return 'Wallet & Passbook';
    if (path.includes('/family-profiles')) return 'Family Birth Profiles Vault';
    if (path.includes('/remedies')) return 'Sacred Remedies & Upay Tracker';
    if (path.includes('/astrologers')) return 'My Astrologers';
    if (path.includes('/profile')) return 'Personal Profile & Settings';
    if (path.includes('/support')) return 'Help & Spiritual Support';
    return 'Seeker Portal';
  };

  return (
    <div className="customer-portal-layout">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`customer-sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Left Sidebar */}
      <aside className={`customer-portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="customer-sidebar-brand">
          <Link to="/" className="customer-brand-link">
            <div className="customer-brand-logo-icon">
              <IoSparkles />
            </div>
            <div>
              <span className="customer-brand-name">Aakash</span>
              <span className="customer-brand-badge">Seeker</span>
            </div>
          </Link>
          <button 
            type="button" 
            className="customer-close-sidebar-btn" 
            onClick={() => setSidebarOpen(false)}
          >
            <IoClose />
          </button>
        </div>

        {/* Modern User Profile Card in Sidebar */}
        <div className="customer-sidebar-user-card">
          <div className="customer-user-card-meta">
            <div className="customer-avatar-wrapper">
              <img
                src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={user?.fullName || 'Seeker'}
                className="customer-avatar"
              />
              <span className="customer-avatar-status" title="Active"></span>
            </div>
            <div className="customer-user-details">
              <div className="customer-user-name">{user?.fullName || 'Seeker'}</div>
              <span className="customer-user-badge">Valued Member</span>
            </div>
          </div>

          <div className="customer-wallet-box">
            <div className="customer-wallet-row">
              <div className="customer-wallet-label-wrap">
                <IoWalletOutline className="wallet-icon-svg" />
                <span>Wallet Balance</span>
              </div>
              <span className="customer-wallet-val">₹{parseFloat(user?.walletBalance || 0).toFixed(2)}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setWalletModalOpen(true)}
              className="customer-wallet-recharge-btn"
              title="Add Money to Wallet"
            >
              <IoAdd /> Recharge Wallet
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="customer-sidebar-nav">
          <div className="customer-nav-section-title">Navigation</div>

          <NavLink 
            to="/dashboard" 
            end 
            className={({ isActive }) => `customer-nav-item ${isActive ? 'active' : ''}`}
          >
            <IoSpeedometerOutline className="nav-icon" />
            <span>Overview</span>
          </NavLink>

          <NavLink 
            to="/dashboard/consultations" 
            className={({ isActive }) => `customer-nav-item ${isActive ? 'active' : ''}`}
          >
            <IoChatbubblesOutline className="nav-icon" />
            <span>Consultations</span>
          </NavLink>

          <NavLink 
            to="/dashboard/wallet" 
            className={({ isActive }) => `customer-nav-item ${isActive ? 'active' : ''}`}
          >
            <IoWalletOutline className="nav-icon" />
            <span>Wallet & Ledger</span>
          </NavLink>

          <NavLink 
            to="/dashboard/family-profiles" 
            className={({ isActive }) => `customer-nav-item ${isActive ? 'active' : ''}`}
          >
            <IoHeartOutline className="nav-icon" />
            <span>Family Birth Vault</span>
          </NavLink>

          <NavLink 
            to="/dashboard/remedies" 
            className={({ isActive }) => `customer-nav-item ${isActive ? 'active' : ''}`}
          >
            <IoFlameOutline className="nav-icon" />
            <span>Remedies & Upays</span>
          </NavLink>

          <NavLink 
            to="/dashboard/astrologers" 
            className={({ isActive }) => `customer-nav-item ${isActive ? 'active' : ''}`}
          >
            <IoPeopleOutline className="nav-icon" />
            <span>My Astrologers</span>
          </NavLink>

          <NavLink 
            to="/dashboard/profile" 
            className={({ isActive }) => `customer-nav-item ${isActive ? 'active' : ''}`}
          >
            <IoPersonOutline className="nav-icon" />
            <span>My Profile</span>
          </NavLink>

          <NavLink 
            to="/dashboard/support" 
            className={({ isActive }) => `customer-nav-item ${isActive ? 'active' : ''}`}
          >
            <IoHelpCircleOutline className="nav-icon" />
            <span>Help & Support</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer */}
        <div className="customer-sidebar-footer">
          <Link to="/experts" className="customer-sidebar-cta">
            <IoSparkles />
            <span>Consult Astrologer</span>
          </Link>

          <Link 
            to="/" 
            className="customer-nav-item" 
            style={{ margin: 0, padding: '9px 12px', fontSize: '13px' }}
          >
            <IoGlobeOutline className="nav-icon" />
            <span>Back to Website</span>
          </Link>

          <button 
            type="button" 
            onClick={handleLogout} 
            className="customer-sidebar-logout-btn"
          >
            <IoLogOutOutline style={{ fontSize: '16px' }} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="customer-portal-main">
        {/* Top Header Bar */}
        <header className="customer-top-header">
          <div className="customer-header-left">
            <button 
              type="button" 
              className="customer-menu-toggle-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Sidebar"
            >
              <IoMenu />
            </button>
            <h1 className="customer-header-title">{getPageTitle()}</h1>
          </div>

          <div className="customer-header-actions">
            {/* Wallet Quick Pill */}
            <div className="customer-header-wallet-pill">
              <IoWalletOutline style={{ fontSize: '18px' }} />
              <span>₹{parseFloat(user?.walletBalance || 0).toFixed(2)}</span>
              <button 
                type="button" 
                onClick={() => setWalletModalOpen(true)}
                className="customer-header-recharge-btn"
              >
                <IoAdd /> Add
              </button>
            </div>

            {/* Direct Consult CTA */}
            <Link to="/experts" className="customer-header-consult-btn">
              <IoSparkles />
              <span>Talk to Astrologer</span>
            </Link>
          </div>
        </header>

        {/* Nested Page Render Body */}
        <main className="customer-page-body">
          <Outlet context={{ user, refreshUser, setWalletModalOpen }} />
        </main>
      </div>

      {/* Global Wallet Recharge Modal */}
      <WalletModal 
        isOpen={walletModalOpen} 
        onClose={() => setWalletModalOpen(false)}
        onSuccess={refreshUser}
        currentBalance={user?.walletBalance || 0}
      />
    </div>
  );
}

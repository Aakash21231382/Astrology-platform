import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminApi } from '../services/api';
import {
  MdDashboard,
  MdVerifiedUser,
  MdPeople,
  MdImage,
  MdCategory,
  MdAccountBalanceWallet,
  MdSettings,
  MdLogout,
  MdOpenInNew,
  MdSupervisorAccount,
  MdMenu,
  MdClose
} from 'react-icons/md';
import '../assets/css/admin-layout.css';
import LogoImg from '../assets/images/logo.png';

export default function AdminLayout() {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 25000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingCount = async () => {
    try {
      const res = await adminApi.getPendingExperts();
      if (res.data?.data) {
        setPendingCount(res.data.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch pending experts count', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path === '/experts/pending') return 'Expert Verification & Approvals';
    if (path === '/experts') return 'All Experts & Live Status';
    if (path === '/users') return 'User & Customer Directory';
    if (path === '/banners') return 'Promotional Banners';
    if (path === '/categories') return 'Astrology Categories';
    if (path === '/withdrawals') return 'Expert Withdrawal Payouts';
    if (path === '/settings') return 'Platform Settings & CMS';
    return 'Admin Panel';
  };

  return (
    <div className="admin-layout">
      {/* Mobile Backdrop Overlay */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="admin-brand-logo-wrap">
            <img src={LogoImg} alt="VVIP Psychics" className="admin-brand-logo" />
            <span className="brand-badge">ADMIN CONTROL</span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <MdClose />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">CORE OPS</div>
          <NavLink
            to="/"
            end
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-item-icon"><MdDashboard /></span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/experts/pending"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-item-icon"><MdVerifiedUser /></span>
            <span>Verification</span>
            {pendingCount > 0 && <span className="nav-item-count">{pendingCount}</span>}
          </NavLink>

          <NavLink
            to="/experts"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-item-icon"><MdSupervisorAccount /></span>
            <span>All Experts</span>
          </NavLink>

          <NavLink
            to="/users"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-item-icon"><MdPeople /></span>
            <span>Users & Wallets</span>
          </NavLink>

          <div className="nav-section-title">CONTENT & COMMERCE</div>
          <NavLink
            to="/banners"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-item-icon"><MdImage /></span>
            <span>Banners</span>
          </NavLink>

          <NavLink
            to="/categories"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-item-icon"><MdCategory /></span>
            <span>Categories</span>
          </NavLink>

          <NavLink
            to="/withdrawals"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-item-icon"><MdAccountBalanceWallet /></span>
            <span>Payouts</span>
          </NavLink>

          <div className="nav-section-title">SYSTEM</div>
          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-item-icon"><MdSettings /></span>
            <span>Settings & CMS</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-user-card">
            <div className="admin-avatar">
              {adminUser?.fullName?.charAt(0) || 'A'}
            </div>
            <div className="admin-details">
              <div className="name">{adminUser?.fullName || 'Administrator'}</div>
              <div className="role">SUPER ADMIN</div>
            </div>
            <button className="btn-logout" onClick={handleLogout} title="Logout">
              <MdLogout />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <button
              type="button"
              className="admin-mobile-menu-btn"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation drawer"
            >
              {sidebarOpen ? <MdClose /> : <MdMenu />}
            </button>

            <div className="header-title">
              <h1>{getPageTitle()}</h1>
              <p>Astrology & Psychic Consultation Platform</p>
            </div>
          </div>

          <div className="header-actions">
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="site-badge-link"
              title="Open Marketplace Frontend"
            >
              <span className="site-badge-text">View Main Site</span>
              <MdOpenInNew />
            </a>
          </div>
        </header>

        <main className="admin-content-body">
          <Outlet context={{ refreshPending: fetchPendingCount }} />
        </main>
      </div>
    </div>
  );
}

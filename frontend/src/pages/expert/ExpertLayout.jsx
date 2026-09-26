import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  IoSpeedometerOutline,
  IoGridOutline,
  IoPersonOutline,
  IoKeyOutline,
  IoReceiptOutline,
  IoCashOutline,
  IoChatbubblesOutline,
  IoTimeOutline,
  IoMailOutline,
  IoPeopleOutline,
  IoCardOutline,
  IoCameraOutline,
  IoWalletOutline,
  IoDocumentTextOutline,
  IoCloseCircleOutline,
  IoDownloadOutline,
  IoLogOutOutline,
  IoMenu,
  IoClose,
  IoChevronDown,
  IoChevronForward,
  IoGlobeOutline,
  IoNotificationsOutline,
  IoCallOutline,
  IoCalendarOutline
} from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import { expertService } from '../../services/api';
import { connectSocket, getSocket } from '../../services/socket';
import { toast } from 'react-toastify';
import IncomingCallModal from '../../components/IncomingCallModal';
import { soundEffects } from '../../utils/soundEffects';
import '../../assets/css/expert-layout.css';

export default function ExpertLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(true);
  const [unreadMailCount, setUnreadMailCount] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [incomingCall, setIncomingCall] = useState(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Load expert profile data
  const loadProfile = async () => {
    try {
      const res = await (expertService.getMyProfile ? expertService.getMyProfile() : expertService.getProfile());
      if (res.data?.data) {
        setProfile(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load expert profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExpertData = loadProfile;

  // Fetch unread mailbox count
  const loadMailboxCount = async () => {
    try {
      const res = await expertService.getMailbox();
      if (res.data?.unreadCount !== undefined) {
        setUnreadMailCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch mailbox:', err);
    }
  };

  useEffect(() => {
    loadProfile();
    loadMailboxCount();

    // Request browser notification permission proactively for calls
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }

    // Live socket connection for consultation alerts & status sync
    const token = localStorage.getItem('astrology_token');
    if (token) {
      const socket = connectSocket();
      if (socket) {
        // Online presence update
        socket.on('expertAvailabilityChanged', (data) => {
          if (data && data.expertId === profile?.id) {
            setProfile(prev => prev ? { ...prev, isOnline: data.isOnline } : prev);
          }
        });

        // Incoming call or consultation request from seeker
        const handleIncoming = (reqData) => {
          console.log('[ExpertLayout] Incoming consultation/call received:', reqData);
          setIncomingCall(reqData);

          // Browser Title Blink
          const originalTitle = document.title;
          let blink = true;
          const blinkInterval = setInterval(() => {
            document.title = blink ? `🔴 (1) INCOMING CALL - ${reqData.customerName || 'Seeker'}!` : originalTitle;
            blink = !blink;
          }, 800);

          // Desktop Push Notification
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification('📞 Incoming Consultation Call', {
                body: `${reqData.customerName || 'A Seeker'} is calling you for live consultation!`,
                icon: reqData.customerAvatar || '/favicon.ico'
              });
            } catch (e) {}
          }

          // Stop blink on call response
          const clearBlink = () => {
            clearInterval(blinkInterval);
            document.title = originalTitle;
          };
          window._clearCallBlink = clearBlink;
        };

        socket.on('consultation:incoming', handleIncoming);
        socket.on('call:incoming', handleIncoming);

        // General chat message chime for expert
        socket.on('consultation:message', (msg) => {
          if (msg && msg.senderRole !== 'EXPERT') {
            soundEffects.playChatNotificationChime();
          }
        });

        return () => {
          socket.off('consultation:incoming', handleIncoming);
          socket.off('call:incoming', handleIncoming);
          if (window._clearCallBlink) window._clearCallBlink();
        };
      }
    }
  }, []);

  // Expert accepts incoming call
  const handleAcceptIncomingCall = (callData) => {
    if (window._clearCallBlink) window._clearCallBlink();
    setIncomingCall(null);
    const socket = getSocket();
    if (socket) {
      socket.emit('consultation:accept', { consultationId: callData.consultationId });
    }
    toast.success(`Connected to ${callData.customerName || 'Seeker'}!`);
    const mode = (callData.type || callData.consultationType || 'CALL').toLowerCase();
    navigate(`/consultation/${callData.consultationId}?mode=${mode}`);
  };

  // Expert declines incoming call
  const handleDeclineIncomingCall = (callData) => {
    if (window._clearCallBlink) window._clearCallBlink();
    setIncomingCall(null);
    const socket = getSocket();
    if (socket) {
      socket.emit('consultation:reject', { 
        consultationId: callData.consultationId,
        reason: 'Expert is currently engaged' 
      });
    }
    toast.info('Call declined.');
  };

  // Quick online/offline switch
  const handleToggleOnline = async () => {
    if (!profile) return;
    const nextOnline = !profile.isOnline;
    setUpdatingStatus(true);
    try {
      await expertService.setAvailability({
        isOnline: nextOnline,
        isActive: profile.isActive
      });
      setProfile(prev => ({ ...prev, isOnline: nextOnline }));
      if (nextOnline) {
        toast.success('Live Chat status is now ONLINE!');
      } else {
        toast.info('Live Chat status is now OFFLINE.');
      }
    } catch (err) {
      toast.error('Failed to update live status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/expert/dashboard' || path === '/expert/dashboard/') return 'My Profiles & Overview';
    if (path.includes('/account-details')) return 'Account Details';
    if (path.includes('/create-profile')) return 'Create / Edit Profile';
    if (path.includes('/change-password')) return 'Change Password';
    if (path.includes('/withdrawals')) return 'Withdrawal Amount Transactions';
    if (path.includes('/payments')) return 'My Payment & Ledger';
    if (path.includes('/live-chat')) return 'Live Chat Room & Control';
    if (path.includes('/live-call')) return 'Live Audio Call Control Room';
    if (path.includes('/chat-history')) return 'Chat Consultation History';
    if (path.includes('/mailbox')) return 'Mail Box';
    if (path.includes('/clients')) return 'My Clients Directory';
    if (path.includes('/payment-options')) return 'Payment & Bank Options';
    if (path.includes('/profile-picture')) return 'Change Profile Picture';
    if (path.includes('/add-credit')) return 'Add Credit & Wallet';
    if (path.includes('/documents')) return 'Manage Verification Documents';
    if (path.includes('/account-close')) return 'Account Close Request';
    if (path.includes('/software')) return 'Download Software & Tools';
    return 'Expert Dashboard';
  };

  return (
    <div className="expert-portal-layout">
      {/* Mobile Drawer Overlay */}
      <div
        className={`expert-sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Modern Sidebar (Strictly No Red) */}
      <aside className={`expert-portal-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="expert-sidebar-top">
          <Link to="/expert/dashboard" className="expert-brand-link" title="Aakash Expert Portal">
            <span className="expert-brand-text">Aakash</span>
          </Link>

          <button
            type="button"
            className="expert-sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <IoClose />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="expert-sidebar-nav-scroll">
          
          {/* Section 1: CORE OPERATIONS */}
          <div className="expert-nav-section-title">CORE OPERATIONS</div>
          <NavLink
            to="/expert/dashboard"
            end
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoSpeedometerOutline className="expert-nav-icon" />
              <span>Dashboard</span>
            </div>
            <span className="expert-nav-badge gold">OVERVIEW</span>
          </NavLink>

          <NavLink
            to="/expert/dashboard/schedule"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoCalendarOutline className="expert-nav-icon" style={{ color: '#FF6B00' }} />
              <span>Live Schedule</span>
            </div>
            <span className="expert-nav-badge gold" style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #D2E4CC' }}>
              AUTO-LIVE
            </span>
          </NavLink>

          {/* Section 2: CONSULTATIONS & CHAT */}
          <div className="expert-nav-section-title">CONSULTATIONS & CHAT</div>
          <NavLink
            to="/expert/dashboard/live-chat"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoChatbubblesOutline className="expert-nav-icon" />
              <span>Live Chat</span>
            </div>
            {profile?.isOnline && <span className="expert-nav-badge active-pulse">CHAT</span>}
          </NavLink>

          <NavLink
            to="/expert/dashboard/live-call"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoCallOutline className="expert-nav-icon" style={{ color: '#FF6B00' }} />
              <span>Live Call</span>
            </div>
            {profile?.isOnline && (
              <span className="expert-nav-badge active-pulse" style={{ background: '#FFEDD5', color: '#FF6B00', border: '1px solid #FED7AA' }}>
                CALL
              </span>
            )}
          </NavLink>

          <NavLink
            to="/expert/dashboard/chat-history"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoTimeOutline className="expert-nav-icon" />
              <span>Chat History</span>
            </div>
          </NavLink>

          <NavLink
            to="/expert/dashboard/mailbox"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoMailOutline className="expert-nav-icon" />
              <span>Mail Box ({unreadMailCount})</span>
            </div>
            {unreadMailCount > 0 && <span className="expert-nav-badge gold">{unreadMailCount}</span>}
          </NavLink>

          <NavLink
            to="/expert/dashboard/clients"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoPeopleOutline className="expert-nav-icon" />
              <span>My Clients</span>
            </div>
          </NavLink>

          {/* Section 3: PROFILE & CREDENTIALS */}
          <div className="expert-nav-section-title">PROFILE & CREDENTIALS</div>
          <NavLink
            to="/expert/dashboard/my-profiles"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoPersonOutline className="expert-nav-icon" />
              <span>My Profiles</span>
            </div>
            {profile?.isActive && <span className="expert-nav-badge active-pulse">ACTIVE</span>}
          </NavLink>

          <NavLink
            to="/expert/dashboard/account-details"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoGridOutline className="expert-nav-icon" />
              <span>Account Details</span>
            </div>
          </NavLink>

          <NavLink
            to="/expert/dashboard/create-profile"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoDocumentTextOutline className="expert-nav-icon" />
              <span>Create Profile</span>
            </div>
          </NavLink>

          <NavLink
            to="/expert/dashboard/profile-picture"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoCameraOutline className="expert-nav-icon" />
              <span>Change Profile Picture</span>
            </div>
          </NavLink>

          <NavLink
            to="/expert/dashboard/documents"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoDocumentTextOutline className="expert-nav-icon" />
              <span>Manage Documents</span>
            </div>
          </NavLink>

          <NavLink
            to="/expert/dashboard/change-password"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoKeyOutline className="expert-nav-icon" />
              <span>Change Password</span>
            </div>
          </NavLink>

          {/* Section 4: EARNINGS & PAYMENTS */}
          <div className="expert-nav-section-title">EARNINGS & PAYMENTS</div>
          <NavLink
            to="/expert/dashboard/payments"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoCashOutline className="expert-nav-icon" />
              <span>My Payment</span>
            </div>
          </NavLink>

          <NavLink
            to="/expert/dashboard/withdrawals"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoReceiptOutline className="expert-nav-icon" />
              <span>Withdrawal Transactions</span>
            </div>
          </NavLink>

          <NavLink
            to="/expert/dashboard/payment-options"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoCardOutline className="expert-nav-icon" />
              <span>Payment Options</span>
            </div>
          </NavLink>

          <NavLink
            to="/expert/dashboard/add-credit"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoWalletOutline className="expert-nav-icon" />
              <span>Add Credit</span>
            </div>
          </NavLink>

          {/* Section 5: SETTINGS & UTILITIES */}
          <div className="expert-nav-section-title">SETTINGS & UTILITIES</div>
          <NavLink
            to="/expert/dashboard/software"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoDownloadOutline className="expert-nav-icon" />
              <span>Download Software</span>
            </div>
          </NavLink>

          <NavLink
            to="/expert/dashboard/account-close"
            className={({ isActive }) => `expert-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="expert-nav-link-left">
              <IoCloseCircleOutline className="expert-nav-icon" />
              <span>Account Close Request</span>
            </div>
          </NavLink>

        </div>

        {/* Sidebar Footer Account Card */}
        <div className="expert-sidebar-bottom">
          <div className="expert-sidebar-user">
            <img
              src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={profile?.displayName || 'Expert'}
              className="expert-sidebar-avatar"
            />
            <div className="expert-sidebar-user-meta">
              <div className="expert-sidebar-user-name">
                {profile?.displayName || user?.fullName || 'Astrologer'}
              </div>
              <div className="expert-sidebar-user-role">VERIFIED EXPERT</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="expert-sidebar-logout-btn"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <IoLogOutOutline />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="expert-portal-main">
        {/* Header Bar */}
        <header className="expert-portal-header">
          <div className="expert-header-left">
            <button
              type="button"
              className="expert-mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
            >
              <IoMenu />
            </button>

            <div className="expert-page-title-box">
              <h1>{getPageTitle()}</h1>
              <p>Astrologer Consultation & Practice Management</p>
            </div>
          </div>

          <div className="expert-header-right">
            {/* Quick Live Chat Status Toggle */}
            <button
              type="button"
              className={`expert-live-status-pill ${profile?.isOnline ? 'online' : 'offline'}`}
              onClick={handleToggleOnline}
              disabled={updatingStatus}
              title="Click to toggle Online/Offline live chat availability"
            >
              <span className={profile?.isOnline ? 'status-dot-pulse' : 'status-dot-offline'} />
              <span>{updatingStatus ? 'Updating...' : profile?.isOnline ? 'Live Chat: ONLINE' : 'Live Chat: OFFLINE'}</span>
            </button>

            {/* View Public Profile on Main Site */}
            {profile?.id && (
              <Link
                to={`/expert/${profile.id}`}
                target="_blank"
                rel="noreferrer"
                className="expert-view-site-link"
                title="View public profile on marketplace"
              >
                <IoGlobeOutline />
                <span>Public Profile</span>
              </Link>
            )}
          </div>
        </header>

        {/* Page Body */}
        <main className="expert-portal-body">
          <Outlet
            context={{
              profile,
              setProfile,
              refreshProfile: loadProfile,
              unreadMailCount,
              setUnreadMailCount
            }}
          />
        </main>
      </div>

      {/* Global Incoming Call Modal with Continuous Audio Ringtone */}
      <IncomingCallModal
        callData={incomingCall}
        onAccept={handleAcceptIncomingCall}
        onDecline={handleDeclineIncomingCall}
      />
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  IoWalletOutline,
  IoChatbubblesOutline,
  IoTimeOutline,
  IoSparkles,
  IoCallOutline,
  IoPeopleOutline,
  IoPersonOutline,
  IoArrowForward,
  IoAdd
} from 'react-icons/io5';
import { consultationService } from '../../services/api';

export default function CustomerOverviewPage() {
  const { user, setWalletModalOpen } = useOutletContext();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const res = await consultationService.getHistory();
        setHistory(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load consultation history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  // Compute stats
  const totalMinutes = Math.round(
    history.reduce((acc, c) => acc + (c.paidSecondsUsed || 0) + (c.freeSecondsUsed || 0), 0) / 60
  );

  // Unique astrologers consulted
  const uniqueAstrologers = new Set(history.map(c => c.expertId)).size;

  // Recent 5 consultations
  const recentConsultations = history.slice(0, 5);

  return (
    <div>
      {/* 1. Spiritual Welcome Banner */}
      <div className="customer-welcome-banner">
        <div>
          <h2 className="customer-welcome-title">
            Namaste, {user?.fullName || 'Seeker'} 🙏
          </h2>
          <p className="customer-welcome-quote">
            "The stars incline us, they do not bind us." Welcome to your sacred consultation sanctuary. Connect with certified Vedic experts, tarot readers, and numerologists for personalized divine guidance.
          </p>
        </div>
        <Link to="/experts" className="customer-banner-btn">
          <IoSparkles />
          <span>Consult Astrologer</span>
        </Link>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="customer-kpi-grid">
        <div 
          className="customer-kpi-card clickable" 
          onClick={() => setWalletModalOpen(true)}
          title="Click to recharge wallet"
          style={{ cursor: 'pointer' }}
        >
          <div className="customer-kpi-left">
            <div className="customer-kpi-icon-wrap" style={{ background: '#EBF7ED', color: '#FF6B00' }}>
              <IoWalletOutline />
            </div>
            <div>
              <div className="customer-kpi-val">₹{parseFloat(user?.walletBalance || 0).toFixed(2)}</div>
              <div className="customer-kpi-label">Available Balance</div>
            </div>
          </div>
        </div>

        <div className="customer-kpi-card">
          <div className="customer-kpi-left">
            <div className="customer-kpi-icon-wrap" style={{ background: '#F0F9F1', color: '#2A5A30' }}>
              <IoChatbubblesOutline />
            </div>
            <div>
              <div className="customer-kpi-val">{history.length}</div>
              <div className="customer-kpi-label">Total Consultations</div>
            </div>
          </div>
        </div>

        <div className="customer-kpi-card">
          <div className="customer-kpi-left">
            <div className="customer-kpi-icon-wrap" style={{ background: '#EBF7ED', color: '#FF6B00' }}>
              <IoTimeOutline />
            </div>
            <div>
              <div className="customer-kpi-val">{totalMinutes} mins</div>
              <div className="customer-kpi-label">Total Minutes Talktime</div>
            </div>
          </div>
        </div>

        <div className="customer-kpi-card">
          <div className="customer-kpi-left">
            <div className="customer-kpi-icon-wrap" style={{ background: '#F5FAF6', color: '#FF6B00' }}>
              <IoPeopleOutline />
            </div>
            <div>
              <div className="customer-kpi-val">{uniqueAstrologers}</div>
              <div className="customer-kpi-label">Astrologers Consulted</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Action Tiles */}
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#130a2a', marginBottom: '14px' }}>
        Quick Actions
      </h3>
      <div className="customer-quick-actions-grid">
        <Link to="/experts" className="customer-quick-action-card">
          <div className="customer-qa-icon" style={{ background: '#FFEDD5', color: '#FF6B00' }}>
            <IoCallOutline />
          </div>
          <div>
            <div className="customer-qa-title">Start Voice Call</div>
            <div className="customer-qa-subtitle">Talk directly via live audio</div>
          </div>
        </Link>

        <Link to="/experts" className="customer-quick-action-card">
          <div className="customer-qa-icon" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            <IoChatbubblesOutline />
          </div>
          <div>
            <div className="customer-qa-title">Start Live Chat</div>
            <div className="customer-qa-subtitle">Encrypted text & real-time chat</div>
          </div>
        </Link>

        <div 
          onClick={() => setWalletModalOpen(true)} 
          className="customer-quick-action-card"
        >
          <div className="customer-qa-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <IoWalletOutline />
          </div>
          <div>
            <div className="customer-qa-title">Recharge Wallet</div>
            <div className="customer-qa-subtitle">Instant Razorpay top-up</div>
          </div>
        </div>

        <Link to="/dashboard/profile" className="customer-quick-action-card">
          <div className="customer-qa-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <IoPersonOutline />
          </div>
          <div>
            <div className="customer-qa-title">My Profile</div>
            <div className="customer-qa-subtitle">Account & personal details</div>
          </div>
        </Link>
      </div>

      {/* 4. Recent Consultations Summary Card */}
      <div className="customer-card">
        <div className="customer-card-header">
          <h3 className="customer-card-title">
            <IoChatbubblesOutline style={{ color: '#FF6B00' }} />
            Recent Consultations
          </h3>
          {history.length > 0 && (
            <Link 
              to="/dashboard/consultations" 
              style={{ fontSize: '13.5px', fontWeight: 700, color: '#FF6B00', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            >
              <span>View All</span>
              <IoArrowForward />
            </Link>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
            Loading your consultation sessions...
          </div>
        ) : recentConsultations.length > 0 ? (
          <div className="customer-table-wrap">
            <table className="customer-data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Astrologer</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Billed Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentConsultations.map((c) => {
                  const isCall = (c.consultationType || '').toUpperCase() === 'CALL';
                  return (
                    <tr key={c.id}>
                      <td>
                        <span className={`badge-type ${isCall ? 'call' : 'chat'}`}>
                          {isCall ? <IoCallOutline /> : <IoChatbubblesOutline />}
                          <span>{isCall ? 'Voice Call' : 'Live Chat'}</span>
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px' }}>
                          <img
                            src={c.expertAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                            alt={c.expertName}
                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FF6B00', flexShrink: 0 }}
                          />
                          <span style={{ fontWeight: 700, color: '#162B1A', whiteSpace: 'nowrap' }}>
                            {c.expertName || 'Astrologer'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#162B1A', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {new Date(c.requestedAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#7A967F', whiteSpace: 'nowrap' }}>
                          {new Date(c.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <strong style={{ whiteSpace: 'nowrap', color: '#162B1A' }}>{Math.round((c.totalDurationSeconds || 0) / 60)} mins</strong>
                      </td>
                      <td>
                        <strong style={{ color: '#162B1A', whiteSpace: 'nowrap' }}>
                          ₹{parseFloat(c.grossAmount || 0).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <span className={`status-pill ${c.status === 'COMPLETED' ? 'completed' : c.status === 'ACTIVE' ? 'active' : 'cancelled'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        {c.status === 'ACTIVE' ? (
                          <Link 
                            to={`/consultation/${c.id}?mode=${isCall ? 'call' : 'chat'}`}
                            className="customer-btn-call"
                            style={{ padding: '7px 14px', fontSize: '12.5px', display: 'inline-flex', whiteSpace: 'nowrap' }}
                          >
                            Join Session
                          </Link>
                        ) : (
                          <Link 
                            to={`/consultation/${c.id}?mode=${isCall ? 'call' : 'chat'}`}
                            className="customer-table-action-link"
                          >
                            View Details
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="customer-empty-state">
            <div className="customer-empty-icon">🔮</div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              No Consultations Yet
            </h4>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '18px' }}>
              You haven't had any consultations yet. Connect with our verified astrologers today!
            </p>
            <Link to="/experts" className="customer-header-consult-btn" style={{ display: 'inline-flex' }}>
              <IoSparkles />
              <span>Browse Astrologers</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

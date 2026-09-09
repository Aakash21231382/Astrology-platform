import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IoWalletOutline, IoChatbubblesOutline, IoSparkles, IoTimeOutline, IoAdd } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import { consultationService } from '../services/api';
import WalletModal from '../components/WalletModal';
import '../assets/css/dashboard.css';

export default function CustomerDashboard() {
  const { user, refreshUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await consultationService.getHistory();
        setHistory(res.data.data || []);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="astro-container">
        {/* Header Bar */}
        <div className="dashboard-header-bar">
          <div className="dashboard-user-greeting">
            <h1>Namaste, {user?.fullName || 'Seeker'}</h1>
            <p className="dashboard-subtitle">Welcome to your spiritual consultation center</p>
          </div>

          <div className="dashboard-header-actions">
            <button onClick={() => setWalletModalOpen(true)} className="btn-gold">
              <IoAdd style={{ fontSize: '18px' }} /> Add Money
            </button>
            <Link to="/experts" className="btn-primary">
              <IoSparkles /> Consult Astrologer
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-cards-grid">
          <div className="kpi-card">
            <div className="kpi-icon-wrap kpi-icon-gold">
              <IoWalletOutline />
            </div>
            <div>
              <div className="kpi-val">₹{parseFloat(user?.walletBalance || 0).toFixed(2)}</div>
              <div className="kpi-label">Available Wallet Balance</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrap kpi-icon-purple">
              <IoChatbubblesOutline />
            </div>
            <div>
              <div className="kpi-val">{history.length}</div>
              <div className="kpi-label">Total Consultations</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrap kpi-icon-green">
              <IoTimeOutline />
            </div>
            <div>
              <div className="kpi-val">
                {history.reduce((acc, c) => acc + (c.paidSecondsUsed || 0) + (c.freeSecondsUsed || 0), 0) / 60 >= 1
                  ? `${Math.round(history.reduce((acc, c) => acc + (c.paidSecondsUsed || 0) + (c.freeSecondsUsed || 0), 0) / 60)} mins`
                  : '0 mins'}
              </div>
              <div className="kpi-label">Consultation Minutes</div>
            </div>
          </div>
        </div>

        {/* Consultation History Table */}
        <div className="dashboard-table-card">
          <div className="dashboard-table-header">
            <h3 className="dashboard-table-title">Recent Consultations</h3>
            <Link to="/experts" className="dashboard-book-link">
              Book New +
            </Link>
          </div>

          {loading ? (
            <p style={{ color: '#64748b' }}>Loading consultations...</p>
          ) : history.length > 0 ? (
            <div className="table-responsive">
              <table className="custom-data-table">
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Astrologer</th>
                    <th>Date</th>
                    <th>Duration</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((c) => (
                    <tr key={c.id}>
                      <td>#{c.id}</td>
                      <td><strong>{c.expertName || 'Astrologer'}</strong></td>
                      <td>{new Date(c.requestedAt).toLocaleDateString()}</td>
                      <td>{Math.round((c.totalDurationSeconds || 0) / 60)} mins</td>
                      <td>
                        <strong>₹{parseFloat(c.grossAmount || 0).toFixed(2)}</strong>
                      </td>
                      <td>
                        <span className={`status-tag ${c.status === 'COMPLETED' ? 'success' : c.status === 'ACTIVE' ? 'pending' : 'danger'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        {c.status === 'ACTIVE' ? (
                          <Link to={`/consultation/${c.id}`} className="btn-primary dashboard-action-btn">
                            Join Chat
                          </Link>
                        ) : (
                          <Link to={`/consultation/${c.id}`} className="dashboard-view-link">
                            View Chat
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <p className="dashboard-empty-text">You haven't had any consultations yet.</p>
              <Link to="/experts" className="btn-primary">
                Browse Astrologers
              </Link>
            </div>
          )}
        </div>
      </div>

      <WalletModal 
        isOpen={walletModalOpen} 
        onClose={() => setWalletModalOpen(false)}
        onSuccess={refreshUser}
        currentBalance={user?.walletBalance || 0}
      />
    </div>
  );
}

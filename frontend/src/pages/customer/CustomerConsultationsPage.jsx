import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IoChatbubblesOutline,
  IoCallOutline,
  IoSearchOutline,
  IoSparkles,
  IoFilterOutline,
  IoTimeOutline
} from 'react-icons/io5';
import { consultationService } from '../../services/api';

export default function CustomerConsultationsPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // ALL, CALL, CHAT, ACTIVE, COMPLETED
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await consultationService.getHistory();
        setHistory(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch consultations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  // Filter consultations
  const filteredSessions = history.filter((item) => {
    const isCall = (item.consultationType || '').toUpperCase() === 'CALL';
    const status = (item.status || '').toUpperCase();

    if (filterType === 'CALL' && !isCall) return false;
    if (filterType === 'CHAT' && isCall) return false;
    if (filterType === 'ACTIVE' && status !== 'ACTIVE') return false;
    if (filterType === 'COMPLETED' && status !== 'COMPLETED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (item.expertName || '').toLowerCase();
      const id = String(item.id);
      if (!name.includes(q) && !id.includes(q)) return false;
    }

    return true;
  });

  return (
    <div>
      {/* Header & Filter Bar */}
      <div className="customer-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#130a2a', margin: '0 0 4px' }}>
              My Consultation History
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Review all your voice calls, live chats, readings, and session billings.
            </p>
          </div>

          <Link to="/experts" className="customer-header-consult-btn">
            <IoSparkles />
            <span>Book New Consultation</span>
          </Link>
        </div>

        {/* Filter Tabs & Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Sessions' },
              { id: 'CALL', label: '📞 Voice Calls' },
              { id: 'CHAT', label: '💬 Live Chats' },
              { id: 'ACTIVE', label: '🟢 Active Now' },
              { id: 'COMPLETED', label: 'Completed' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                style={{
                  background: filterType === tab.id ? '#FF6B00' : '#f8fafc',
                  color: filterType === tab.id ? '#ffffff' : '#475569',
                  border: filterType === tab.id ? '1px solid #FF6B00' : '1px solid #e2e8f0',
                  padding: '7px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <IoSearchOutline style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8', fontSize: '17px' }} />
            <input
              type="text"
              placeholder="Search astrologers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="customer-form-input"
              style={{ paddingLeft: '36px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {/* Consultations Table */}
      <div className="customer-card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading your consultation history...
          </div>
        ) : filteredSessions.length > 0 ? (
          <div className="customer-table-wrap">
            <table className="customer-data-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Type</th>
                  <th>Astrologer</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Rate</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((item) => {
                  const isCall = (item.consultationType || '').toUpperCase() === 'CALL';
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong style={{ color: '#6366f1' }}>#{item.id}</strong>
                      </td>
                      <td>
                        <span className={`badge-type ${isCall ? 'call' : 'chat'}`}>
                          {isCall ? <IoCallOutline /> : <IoChatbubblesOutline />}
                          <span>{isCall ? 'Voice Call' : 'Live Chat'}</span>
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
                          <img
                            src={item.expertAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                            alt={item.expertName}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FF6B00', flexShrink: 0 }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 700, color: '#162B1A', whiteSpace: 'nowrap' }}>
                              {item.expertName || 'Astrologer'}
                            </div>
                            <div 
                              style={{ fontSize: '11.5px', color: '#5E7A63', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} 
                              title={item.expertTitle || 'Vedic Expert'}
                            >
                              {item.expertTitle || 'Vedic Expert'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#162B1A', fontSize: '13px', whiteSpace: 'nowrap' }}>
                          {new Date(item.requestedAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#7A967F', whiteSpace: 'nowrap' }}>
                          {new Date(item.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#162B1A', whiteSpace: 'nowrap' }}>
                          <IoTimeOutline style={{ color: '#FF6B00' }} />
                          {Math.round((item.totalDurationSeconds || 0) / 60)} mins
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#5E7A63', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          ₹{item.ratePerMinute || 0}/min
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#162B1A', fontSize: '14px', whiteSpace: 'nowrap' }}>
                          ₹{parseFloat(item.grossAmount || 0).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <span className={`status-pill ${item.status === 'COMPLETED' ? 'completed' : item.status === 'ACTIVE' ? 'active' : 'cancelled'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {item.status === 'ACTIVE' ? (
                          <Link 
                            to={`/consultation/${item.id}?mode=${isCall ? 'call' : 'chat'}`}
                            className="customer-btn-call"
                            style={{ padding: '7px 14px', fontSize: '12.5px', display: 'inline-flex', whiteSpace: 'nowrap' }}
                          >
                            Join Session
                          </Link>
                        ) : (
                          <Link 
                            to={`/consultation/${item.id}?mode=${isCall ? 'call' : 'chat'}`}
                            className="customer-table-action-link"
                          >
                            View Reading
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
            <div className="customer-empty-icon">📭</div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              No Consultations Found
            </h4>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '18px' }}>
              No records match your selected filter. Start a new live consultation!
            </p>
            <Link to="/experts" className="customer-header-consult-btn" style={{ display: 'inline-flex' }}>
              <IoSparkles />
              <span>Explore Astrologers</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

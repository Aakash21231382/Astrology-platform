import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import {
  MdChat,
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdClose,
  MdAccessTime,
  MdAttachMoney,
  MdOutlineVisibility,
  MdCheckCircle,
  MdPlayCircleFilled
} from 'react-icons/md';
import '../assets/css/admin-tables.css';

export default function LiveChat() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Chat Transcript Modal
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    fetchConsultations();
  }, [statusFilter]);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (search.trim()) params.search = search.trim();

      const res = await adminApi.getConsultations(params);
      const allData = res.data?.data || [];
      // Filter for CHAT or show consultations
      setConsultations(allData.filter(c => !c.consultationType || c.consultationType.toUpperCase() === 'CHAT' || c.type === 'CHAT'));
    } catch (err) {
      toast.error('Failed to load live chat sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchConsultations();
  };

  const handleOpenTranscript = async (consultation) => {
    setSelectedConsultation(consultation);
    setLoadingMessages(true);
    try {
      const res = await adminApi.getConsultationMessages(consultation.id);
      setMessages(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load chat transcript');
    } finally {
      setLoadingMessages(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="status-badge active">COMPLETED</span>;
      case 'ACTIVE':
        return (
          <span className="status-badge" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#047857', border: '1px solid #A7F3D0' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }}></span>
            LIVE CHAT
          </span>
        );
      case 'REQUESTED':
        return <span className="status-badge pending">REQUESTED</span>;
      case 'CANCELLED':
        return <span className="status-badge danger">CANCELLED</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  // Metrics
  const liveCount = consultations.filter((c) => c.status === 'ACTIVE').length;
  const completedCount = consultations.filter((c) => c.status === 'COMPLETED').length;
  const totalGross = consultations.reduce((acc, c) => acc + parseFloat(c.grossAmount || 0), 0);

  return (
    <div className="consultations-page">
      {/* Top Stat Banner Grid */}
      <div className="subpage-stats-grid">
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', color: '#EA580C', border: '1.5px solid #FED7AA' }}>
            <MdChat />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Chat Sessions</span>
            <span className="subpage-stat-value">{consultations.length}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#059669', border: '1.5px solid #A7F3D0' }}>
            <MdPlayCircleFilled />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Live Active Chats</span>
            <span className="subpage-stat-value" style={{ color: '#059669' }}>{liveCount}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', color: '#D97706', border: '1.5px solid #FCD34D' }}>
            <MdCheckCircle />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Completed Chats</span>
            <span className="subpage-stat-value">{completedCount}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #F97316 100%)', color: '#FFFFFF' }}>
            <MdAttachMoney />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Gross Chat Revenue</span>
            <span className="subpage-stat-value" style={{ color: '#C2410C' }}>₹{totalGross.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="table-container">
        <div className="table-toolbar">
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
            <div className="table-search-box">
              <MdSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="table-filter-select">
              <MdFilterList style={{ marginRight: 6, color: '#EA580C' }} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All Chat Statuses</option>
                <option value="ACTIVE">Live Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="REQUESTED">Requested</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <button type="submit" className="btn-filter-apply">Search</button>
          </form>

          <button
            type="button"
            className="btn-refresh"
            onClick={fetchConsultations}
            title="Refresh list"
          >
            <MdRefresh /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="table-loading">Loading live chat sessions...</div>
        ) : consultations.length === 0 ? (
          <div className="table-empty">
            <div className="empty-icon"><MdChat /></div>
            <h3>No Live Chat Records Found</h3>
            <p>Chat consultations initiated by seekers will appear here in real time.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Customer (Seeker)</th>
                  <th>Astrologer (Expert)</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Rate</th>
                  <th>Gross Total</th>
                  <th>Expert Earning</th>
                  <th>Date & Time</th>
                  <th>Transcript</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="mono-id">#CHAT-{c.id}</span>
                    </td>
                    <td>
                      <div className="user-cell">
                        <span className="user-cell-name">{c.customerName || 'Seeker'}</span>
                        <span className="user-cell-sub">ID: {c.customerId}</span>
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <span className="user-cell-name">{c.expertName || 'Astrologer'}</span>
                        <span className="user-cell-sub">Exp ID: {c.expertId}</span>
                      </div>
                    </td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#475569', fontWeight: 600 }}>
                        <MdAccessTime style={{ color: '#EA580C' }} />
                        {Math.floor((c.totalDurationSeconds || 0) / 60)}m {(c.totalDurationSeconds || 0) % 60}s
                      </span>
                    </td>
                    <td>₹{parseFloat(c.ratePerMinute || 0).toFixed(0)}/min</td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>
                        ₹{parseFloat(c.grossAmount || 0).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#059669' }}>
                        ₹{parseFloat(c.expertEarning || 0).toFixed(2)}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: '#64748B' }}>
                      {c.requestedAt ? new Date(c.requestedAt).toLocaleString() : 'N/A'}
                    </td>
                    <td>
                      <button
                        className="btn-action-view"
                        onClick={() => handleOpenTranscript(c)}
                        title="View Chat Transcript"
                      >
                        <MdOutlineVisibility /> View Chat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transcript Modal */}
      {selectedConsultation && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content" style={{ maxWidth: 650 }}>
            <div className="admin-modal-header">
              <h3>
                <MdChat style={{ marginRight: 8, color: '#EA580C' }} />
                Chat Transcript: #{selectedConsultation.id} ({selectedConsultation.customerName} & {selectedConsultation.expertName})
              </h3>
              <button className="modal-close-btn" onClick={() => setSelectedConsultation(null)}>
                <MdClose />
              </button>
            </div>

            <div className="admin-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', background: '#F8FAFC', padding: 16 }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#64748B' }}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#64748B' }}>
                  No messages recorded in this chat session.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {messages.map((m) => {
                    const isExpert = m.senderRole === 'EXPERT';
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isExpert ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          background: isExpert ? 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)' : '#FFFFFF',
                          border: isExpert ? '1px solid #FED7AA' : '1px solid #E2E8F0',
                          borderRadius: 12,
                          padding: '10px 14px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 700, color: isExpert ? '#C2410C' : '#475569', marginBottom: 4 }}>
                          {isExpert ? selectedConsultation.expertName : selectedConsultation.customerName} ({m.senderRole})
                        </div>
                        <div style={{ fontSize: '13.5px', color: '#1E293B', whiteSpace: 'pre-wrap' }}>
                          {m.content}
                        </div>
                        {m.fileUrl && (
                          <div style={{ marginTop: 6 }}>
                            <img src={m.fileUrl} alt="attachment" style={{ maxWidth: '100%', borderRadius: 8 }} />
                          </div>
                        )}
                        <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: 4, textAlign: 'right' }}>
                          {new Date(m.sentAt).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button className="btn-cancel" onClick={() => setSelectedConsultation(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
import ExportDropdown from '../components/ExportDropdown';
import '../assets/css/admin-tables.css';

export default function Consultations() {
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
      setConsultations(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load consultations');
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
      toast.error('Failed to load consultation transcript');
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
            <span className="subpage-stat-label">Total Sessions</span>
            <span className="subpage-stat-value">{consultations.length}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#059669', border: '1.5px solid #A7F3D0' }}>
            <MdPlayCircleFilled />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Live Ongoing</span>
            <span className="subpage-stat-value" style={{ color: '#059669' }}>{liveCount}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', color: '#D97706', border: '1.5px solid #FCD34D' }}>
            <MdCheckCircle />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Completed</span>
            <span className="subpage-stat-value">{completedCount}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #F97316 100%)', color: '#FFFFFF' }}>
            <MdAttachMoney />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Gross Revenue</span>
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
                placeholder="Search consultations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="table-filter-select">
              <MdFilterList style={{ marginRight: 6, color: '#EA580C' }} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Live Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="REQUESTED">Requested</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <button type="submit" className="btn-filter-apply">Search</button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExportDropdown
              data={consultations.map((c) => {
                const gross = parseFloat(c.grossAmount || 0);
                const platformFee = parseFloat(c.platformCommission || gross * 0.2);
                const expertNet = parseFloat(c.expertEarning || gross - platformFee);
                const durationMins = Math.ceil((c.totalDurationSeconds || 0) / 60);

                return {
                  'Session ID': `#${c.id}`,
                  'Type': c.consultationType || 'CHAT',
                  'Customer Name': c.customerName || 'Seeker',
                  'Customer Email': c.customerEmail || 'N/A',
                  'Expert Name': c.expertName || 'Astrologer',
                  'Expert Email': c.expertEmail || 'N/A',
                  'Status': c.status || 'N/A',
                  'Duration (Mins)': durationMins,
                  'Total Duration (Secs)': c.totalDurationSeconds || 0,
                  'Rate Per Minute (INR)': `₹${parseFloat(c.ratePerMinute || 0).toFixed(2)}`,
                  'Gross Amount (INR)': `₹${gross.toFixed(2)}`,
                  'Platform Commission 20% (INR)': `₹${platformFee.toFixed(2)}`,
                  'Expert Earning (INR)': `₹${expertNet.toFixed(2)}`,
                  'Requested Date': c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : 'N/A'
                };
              })}
              fileName="Aakash_Consultations_Revenue"
              sheetName="Consultations"
              title="Consultation Sessions & Revenue Report"
              subtitle={`Total Sessions: ${consultations.length} | Completed: ${completedCount} | Total Gross: ₹${totalGross.toFixed(2)}`}
            />

            <button
              type="button"
              className="btn-refresh"
              onClick={fetchConsultations}
              title="Refresh list"
            >
              <MdRefresh /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="table-loading">Loading consultation sessions...</div>
        ) : consultations.length === 0 ? (
          <div className="table-empty">
            <div className="empty-icon"><MdChat /></div>
            <h3>No Consultation Records Found</h3>
            <p>Try modifying your search query or selecting a different status filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Client / Seeker</th>
                  <th>Astrologer / Expert</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Total Amount</th>
                  <th>Requested Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((c) => {
                  const durationMins = Math.ceil((c.totalDurationSeconds || 0) / 60);
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 800, color: '#C2410C' }}>#{c.id}</td>
                      <td>
                        <div className="user-cell">
                          <img
                            src={c.customerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                            alt={c.customerName}
                            className="table-avatar"
                          />
                          <div className="user-cell-meta">
                            <span className="name">{c.customerName || 'Seeker'}</span>
                            <span className="sub">{c.customerEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="user-cell">
                          <img
                            src={c.expertAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}
                            alt={c.expertName}
                            className="table-avatar"
                          />
                          <div className="user-cell-meta">
                            <span className="name">{c.expertName || 'Astrologer'}</span>
                            <span className="sub">{c.expertEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td>{getStatusBadge(c.status)}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{durationMins} mins</div>
                        <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{c.totalDurationSeconds || 0} seconds total</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#059669', fontSize: '0.96rem' }}>
                          ₹{parseFloat(c.grossAmount || 0).toFixed(2)}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#64748B' }}>
                        {c.requestedAt ? new Date(c.requestedAt).toLocaleString() : 'N/A'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-action view"
                          onClick={() => handleOpenTranscript(c)}
                          title="View complete chat transcript"
                        >
                          <MdOutlineVisibility /> Transcript
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transcript Modal */}
      {selectedConsultation && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <div className="modal-header" style={{ background: 'linear-gradient(180deg, #FFFDF9 0%, #FFFFFF 100%)', borderBottom: '1.5px solid #FED7AA' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                  Consultation Transcript #{selectedConsultation.id}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#C2410C', marginTop: 3, fontWeight: 700 }}>
                  Seeker: {selectedConsultation.customerName} ↔ Astrologer: {selectedConsultation.expertName}
                </div>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setSelectedConsultation(null)}
              >
                <MdClose />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '60vh', background: '#FFFDF9' }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#64748B', fontWeight: 600 }}>Loading messages...</div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 30, color: '#64748B', fontWeight: 600 }}>No messages logged in this session.</div>
              ) : (
                messages.map((m) => {
                  const isExpert = m.senderType === 'EXPERT';
                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isExpert ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        background: isExpert ? 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)' : '#FFFFFF',
                        border: isExpert ? '1.5px solid #FDBA74' : '1.5px solid #E2E8F0',
                        color: isExpert ? '#9A3412' : '#0F172A',
                        padding: '12px 16px',
                        borderRadius: 14,
                        fontSize: '0.9rem',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, marginBottom: 4, color: isExpert ? '#EA580C' : '#475569' }}>
                        {isExpert ? selectedConsultation.expertName : selectedConsultation.customerName}
                      </div>
                      <div style={{ lineHeight: 1.45 }}>{m.content || m.message}</div>
                      <div style={{ fontSize: '0.7rem', textAlign: 'right', marginTop: 4, color: '#94A3B8', fontWeight: 600 }}>
                        {m.sentAt ? new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1.5px solid #FED7AA' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => setSelectedConsultation(null)}
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

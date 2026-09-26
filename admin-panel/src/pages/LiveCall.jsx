import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import {
  MdCall,
  MdSearch,
  MdFilterList,
  MdRefresh,
  MdClose,
  MdAccessTime,
  MdAttachMoney,
  MdOutlineVisibility,
  MdCheckCircle,
  MdPlayCircleFilled,
  MdPhoneInTalk,
  MdGraphicEq
} from 'react-icons/md';
import '../assets/css/admin-tables.css';

export default function LiveCall() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);

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
      // Filter for CALL consultations or all calls
      setConsultations(allData.filter(c => c.consultationType === 'CALL' || c.type === 'CALL'));
    } catch (err) {
      toast.error('Failed to load call consultation records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchConsultations();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="status-badge active">COMPLETED</span>;
      case 'ACTIVE':
        return (
          <span className="status-badge" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#047857', border: '1px solid #A7F3D0' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 8px #10B981' }}></span>
            ONGOING CALL
          </span>
        );
      case 'REQUESTED':
        return <span className="status-badge pending">RINGING / REQUESTED</span>;
      case 'CANCELLED':
        return <span className="status-badge danger">MISSED / CANCELLED</span>;
      case 'REJECTED':
        return <span className="status-badge danger">DECLINED</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  // Metrics
  const liveCount = consultations.filter((c) => c.status === 'ACTIVE').length;
  const completedCount = consultations.filter((c) => c.status === 'COMPLETED').length;
  const totalMinutes = consultations.reduce((acc, c) => acc + Math.ceil((c.totalDurationSeconds || 0) / 60), 0);
  const totalGross = consultations.reduce((acc, c) => acc + parseFloat(c.grossAmount || 0), 0);

  return (
    <div className="consultations-page">
      {/* Top Stat Banner Grid */}
      <div className="subpage-stats-grid">
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)', color: '#15803D', border: '1.5px solid #86EFAC' }}>
            <MdCall />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Audio Calls</span>
            <span className="subpage-stat-value">{consultations.length}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#059669', border: '1.5px solid #A7F3D0' }}>
            <MdPhoneInTalk />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Live Active Calls</span>
            <span className="subpage-stat-value" style={{ color: '#059669' }}>{liveCount}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', color: '#D97706', border: '1.5px solid #FCD34D' }}>
            <MdAccessTime />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Billed Minutes</span>
            <span className="subpage-stat-value">{totalMinutes} mins</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', color: '#FFFFFF' }}>
            <MdAttachMoney />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Call Revenue</span>
            <span className="subpage-stat-value" style={{ color: '#15803D' }}>₹{totalGross.toFixed(2)}</span>
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
                placeholder="Search calls..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="table-filter-select">
              <MdFilterList style={{ marginRight: 6, color: '#16A34A' }} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All Call Statuses</option>
                <option value="ACTIVE">Live Ongoing Calls</option>
                <option value="COMPLETED">Completed Calls</option>
                <option value="REQUESTED">Ringing / Requested</option>
                <option value="CANCELLED">Cancelled / Missed</option>
              </select>
            </div>

            <button type="submit" className="btn-filter-apply" style={{ background: '#16A34A' }}>Search</button>
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
          <div className="table-loading">Loading live call sessions...</div>
        ) : consultations.length === 0 ? (
          <div className="table-empty">
            <div className="empty-icon" style={{ color: '#16A34A', background: '#DCFCE7' }}><MdCall /></div>
            <h3>No Live Call Records Found</h3>
            <p>Voice call consultations initiated by seekers will appear here in real time with duration and billing.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Call Session ID</th>
                  <th>Seeker (Caller)</th>
                  <th>Astrologer (Expert)</th>
                  <th>Status</th>
                  <th>Call Duration</th>
                  <th>Rate</th>
                  <th>Gross Total</th>
                  <th>Expert Earning</th>
                  <th>Call Timestamp</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="mono-id" style={{ color: '#16A34A', background: '#F0FDF4', borderColor: '#BBF7D0' }}>
                        #CALL-{c.id}
                      </span>
                    </td>
                    <td>
                      <div className="user-cell">
                        <span className="user-cell-name">{c.customerName || 'Seeker'}</span>
                        <span className="user-cell-sub">User ID: #{c.customerId}</span>
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <span className="user-cell-name">{c.expertName || 'Astrologer'}</span>
                        <span className="user-cell-sub">Exp ID: #{c.expertId}</span>
                      </div>
                    </td>
                    <td>{getStatusBadge(c.status)}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#166534', fontWeight: 700 }}>
                        <MdGraphicEq style={{ color: '#16A34A' }} />
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
                      <span style={{ fontWeight: 700, color: '#15803D' }}>
                        ₹{parseFloat(c.expertEarning || 0).toFixed(2)}
                      </span>
                    </td>
                    <td style={{ fontSize: '12.5px', color: '#64748B' }}>
                      {c.requestedAt ? new Date(c.requestedAt).toLocaleString() : 'N/A'}
                    </td>
                    <td>
                      <button
                        className="btn-action-view"
                        onClick={() => setSelectedCall(c)}
                        title="View Call Details"
                        style={{ color: '#15803D', borderColor: '#BBF7D0', background: '#F0FDF4' }}
                      >
                        <MdOutlineVisibility /> Call Info
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Call Details Modal */}
      {selectedCall && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-content" style={{ maxWidth: 520 }}>
            <div className="admin-modal-header">
              <h3>
                <MdCall style={{ marginRight: 8, color: '#16A34A' }} />
                Call Record: #CALL-{selectedCall.id}
              </h3>
              <button className="modal-close-btn" onClick={() => setSelectedCall(null)}>
                <MdClose />
              </button>
            </div>

            <div className="admin-modal-body" style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Seeker (Caller)</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{selectedCall.customerName}</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Astrologer</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{selectedCall.expertName}</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Call Status</div>
                  <div>{getStatusBadge(selectedCall.status)}</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Total Duration</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#16A34A' }}>
                    {Math.floor((selectedCall.totalDurationSeconds || 0) / 60)}m {(selectedCall.totalDurationSeconds || 0) % 60}s
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Rate Per Minute</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>₹{selectedCall.ratePerMinute}</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: '#64748B' }}>Total Gross Amount</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#C2410C' }}>₹{parseFloat(selectedCall.grossAmount || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="btn-cancel" onClick={() => setSelectedCall(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import {
  MdClose,
  MdCheckCircle,
  MdCancel,
  MdRefresh,
  MdPersonOff,
  MdWarning,
  MdHourglassEmpty
} from 'react-icons/md';
import '../assets/css/admin-tables.css';

export default function AccountCloseRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [actionType, setActionType] = useState('APPROVED'); // 'APPROVED' or 'REJECTED'
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAccountCloseRequests();
      setRequests(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load account closure requests');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (req, type) => {
    setSelectedReq(req);
    setActionType(type);
    setAdminNotes('');
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReq) return;

    setProcessing(true);
    try {
      await adminApi.processAccountCloseRequest(selectedReq.id, actionType, adminNotes);
      toast.success(`Account closure request ${actionType.toLowerCase()} successfully.`);
      setSelectedReq(null);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process request');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="status-badge danger">CLOSED (DEACTIVATED)</span>;
      case 'REJECTED':
        return <span className="status-badge active">REJECTED (ACTIVE)</span>;
      case 'PENDING':
      default:
        return <span className="status-badge pending">PENDING REVIEW</span>;
    }
  };

  // Metrics
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="account-close-requests-page">
      {/* Top Stat Banner Grid */}
      <div className="subpage-stats-grid">
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', color: '#EA580C', border: '1.5px solid #FED7AA' }}>
            <MdHourglassEmpty />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Pending Requests</span>
            <span className="subpage-stat-value" style={{ color: '#EA580C' }}>{pendingCount}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', color: '#DC2626', border: '1.5px solid #FCA5A5' }}>
            <MdPersonOff />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Approved Closures</span>
            <span className="subpage-stat-value" style={{ color: '#DC2626' }}>{approvedCount}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#059669', border: '1.5px solid #A7F3D0' }}>
            <MdCheckCircle />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Logged</span>
            <span className="subpage-stat-value">{requests.length}</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C' }}>
              <MdPersonOff style={{ fontSize: '1.2rem' }} />
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Astrologer Account Deactivation Requests
            </h2>
          </div>

          <button
            type="button"
            className="btn-refresh"
            onClick={fetchRequests}
            title="Refresh list"
          >
            <MdRefresh /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="table-loading">Loading closure requests...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#059669', border: '1.5px solid #A7F3D0' }}>
              <MdCheckCircle />
            </div>
            <h3>No Deactivation Requests</h3>
            <p>All astrologers are currently in good standing and actively listed on the marketplace.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Astrologer</th>
                  <th>Closure Reason</th>
                  <th>Requested Date</th>
                  <th>Status</th>
                  <th>Admin Remarks</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 800, color: '#C2410C' }}>#{r.id}</td>
                    <td>
                      <div className="user-cell">
                        <img
                          src={r.expertAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}
                          alt={r.expertName}
                          className="table-avatar"
                        />
                        <div className="user-cell-meta">
                          <span className="name">{r.expertName || 'Astrologer'}</span>
                          <span className="sub">{r.expertEmail}</span>
                          {r.expertPhone && <span className="sub">{r.expertPhone}</span>}
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 280 }}>
                      <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.45, background: '#FFFDF9', padding: '8px 12px', borderRadius: 8, border: '1px solid #FED7AA' }}>
                        {r.reason}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      {r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      {r.adminNotes || '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {r.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn-danger"
                            onClick={() => handleOpenActionModal(r, 'APPROVED')}
                            title="Approve closure and deactivate profile"
                          >
                            <MdCheckCircle /> Approve
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => handleOpenActionModal(r, 'REJECTED')}
                            title="Reject closure request"
                          >
                            <MdCancel /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Confirmation Modal */}
      {selectedReq && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header" style={{
              background: actionType === 'APPROVED' ? 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)' : 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
              borderBottom: '1.5px solid #FED7AA'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: actionType === 'APPROVED' ? '#991B1B' : '#C2410C' }}>
                {actionType === 'APPROVED' ? 'Approve Account Deactivation' : 'Reject Closure Request'}
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={() => setSelectedReq(null)}
              >
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleProcessSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0, lineHeight: 1.55 }}>
                {actionType === 'APPROVED'
                  ? `Are you sure you want to approve the closure for ${selectedReq.expertName}? This will deactivate their listing from the marketplace.`
                  : `Enter administrative feedback for rejecting ${selectedReq.expertName}'s request.`}
              </p>

              <div className="form-group">
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                  Admin Remarks / Reason (Logged for Astrologer)
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter admin remarks or notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div className="modal-footer" style={{ borderTop: '1.5px solid #FED7AA', padding: '16px 0 0 0', background: 'transparent' }}>
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={actionType === 'APPROVED' ? 'btn-danger' : 'btn-primary'}
                >
                  {processing ? 'Processing...' : `Confirm ${actionType === 'APPROVED' ? 'Deactivation' : 'Rejection'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

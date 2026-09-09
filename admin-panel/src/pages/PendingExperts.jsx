import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import {
  MdCheckCircle,
  MdCancel,
  MdVisibility,
  MdSearch,
  MdPerson,
  MdClose,
  MdPhone,
  MdLocationOn,
  MdEmail
} from 'react-icons/md';
import '../assets/css/admin-tables.css';
import '../assets/css/admin-modals.css';

export default function PendingExperts() {
  const { refreshPending } = useOutletContext();
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({ open: false, expertId: null, reason: '' });

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPendingExperts();
      setExperts(res.data?.data || []);
      if (refreshPending) refreshPending();
    } catch (err) {
      toast.error('Failed to load pending experts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (expertId, name) => {
    if (!window.confirm(`Are you sure you want to APPROVE ${name}? They will go LIVE on the marketplace.`)) return;

    try {
      await adminApi.reviewExpert(expertId, 'APPROVE');
      toast.success(`Expert ${name} approved and activated!`);
      setSelectedExpert(null);
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.reviewExpert(rejectionModal.expertId, 'REJECT', rejectionModal.reason);
      toast.info('Application rejected');
      setRejectionModal({ open: false, expertId: null, reason: '' });
      setSelectedExpert(null);
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
  };

  const filteredExperts = experts.filter((exp) => {
    const q = search.toLowerCase();
    return (
      exp.displayName?.toLowerCase().includes(q) ||
      exp.screenName?.toLowerCase().includes(q) ||
      exp.email?.toLowerCase().includes(q) ||
      exp.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="pending-experts-page">
      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-search-box">
            <MdSearch />
            <input
              type="text"
              placeholder="Search pending experts by name, email, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn-secondary" onClick={fetchPending}>
            Refresh Queue ({filteredExperts.length})
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#fff', padding: 40, textAlign: 'center' }}>Loading pending applications...</div>
        ) : filteredExperts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><MdCheckCircle /></div>
            <h3>No Pending Expert Approvals</h3>
            <p>All submitted expert registrations have been reviewed and verified.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
            <thead>
              <tr>
                <th>Expert Details</th>
                <th>Screen Name / Title</th>
                <th>Location</th>
                <th>Registered On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExperts.map((exp) => (
                <tr key={exp.id}>
                  <td>
                    <div className="user-cell">
                      <img
                        src={exp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={exp.displayName}
                        className="table-avatar"
                      />
                      <div className="user-cell-meta">
                        <span className="name">{exp.displayName || `${exp.firstName || ''} ${exp.lastName || ''}`}</span>
                        <span className="sub">{exp.email}</span>
                        {exp.telephone && <span className="sub">{exp.telephone}</span>}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>@{exp.screenName || 'N/A'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exp.title || 'Astrologer'}</div>
                  </td>

                  <td>
                    <div>{exp.city || 'N/A'}{exp.state ? `, ${exp.state}` : ''}</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{exp.country || 'India'}</div>
                  </td>

                  <td style={{ fontSize: '0.84rem', color: '#9ca3af' }}>
                    {new Date(exp.createdAt).toLocaleDateString()}
                  </td>

                  <td>
                    <span className="badge badge-warning">PENDING VERIFICATION</span>
                  </td>

                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-icon"
                        title="View Full Application Details"
                        onClick={() => setSelectedExpert(exp)}
                      >
                        <MdVisibility />
                      </button>

                      <button
                        className="btn-icon approve"
                        title="Approve & Go Live"
                        onClick={() => handleApprove(exp.id, exp.displayName || exp.screenName)}
                      >
                        <MdCheckCircle />
                      </button>

                      <button
                        className="btn-icon reject"
                        title="Reject Application"
                        onClick={() => setRejectionModal({ open: true, expertId: exp.id, reason: '' })}
                      >
                        <MdCancel />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Detail Modal */}
      {selectedExpert && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Expert Application: {selectedExpert.displayName || selectedExpert.screenName}</h3>
              <button className="btn-icon" onClick={() => setSelectedExpert(null)}>
                <MdClose />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <img
                  src={selectedExpert.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                  alt="Avatar"
                  style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--admin-primary)' }}
                />
                <div>
                  <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 600 }}>{selectedExpert.displayName}</h2>
                  <div style={{ color: 'var(--admin-primary)', fontSize: '0.86rem', fontWeight: 500 }}>@{selectedExpert.screenName} &bull; {selectedExpert.title}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Email: {selectedExpert.email}</div>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Date of Birth</div>
                  <div className="detail-val">{selectedExpert.dob || 'Not provided'}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Gender</div>
                  <div className="detail-val">{selectedExpert.gender || 'Not specified'}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Telephone</div>
                  <div className="detail-val">{selectedExpert.telephone || 'N/A'}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Fax Number</div>
                  <div className="detail-val">{selectedExpert.fax || 'N/A'}</div>
                </div>

                <div className="detail-item full-width">
                  <div className="detail-label">Street Address</div>
                  <div className="detail-val">{selectedExpert.address || 'N/A'}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">City, State</div>
                  <div className="detail-val">{selectedExpert.city || 'N/A'}, {selectedExpert.state || 'N/A'}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Country & ZipCode</div>
                  <div className="detail-val">{selectedExpert.country || 'India'} ({selectedExpert.zipCode || 'N/A'})</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Rate Per Minute</div>
                  <div className="detail-val">₹{selectedExpert.pricePerMinute || 20.00} / min</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Free Minutes Allowed</div>
                  <div className="detail-val">{selectedExpert.freeMinutes || 0} mins</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-danger"
                onClick={() => {
                  setRejectionModal({ open: true, expertId: selectedExpert.id, reason: '' });
                }}
              >
                Reject Application
              </button>

              <button
                className="btn-success"
                onClick={() => handleApprove(selectedExpert.id, selectedExpert.displayName || selectedExpert.screenName)}
              >
                Approve & Activate Live
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModal.open && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Specify Rejection Reason</h3>
              <button className="btn-icon" onClick={() => setRejectionModal({ open: false, expertId: null, reason: '' })}>
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.88rem', color: '#9ca3af' }}>
                  Please state why this application does not meet platform standards. This reason will be logged in the database.
                </p>
                <textarea
                  rows="4"
                  placeholder="e.g. Incomplete address verification, unreadable ID documents..."
                  value={rejectionModal.reason}
                  onChange={(e) => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setRejectionModal({ open: false, expertId: null, reason: '' })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-danger">
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

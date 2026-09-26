import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import {
  MdAccountBalanceWallet,
  MdCheckCircle,
  MdCancel,
  MdClose,
  MdPayment
} from 'react-icons/md';
import ExportDropdown from '../components/ExportDropdown';
import '../assets/css/admin-tables.css';
import '../assets/css/admin-modals.css';

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processModal, setProcessModal] = useState({ open: false, item: null, status: 'PAID', notes: '' });

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getWithdrawals();
      setWithdrawals(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.processWithdrawal(processModal.item.id, processModal.status, processModal.notes);
      toast.success(`Withdrawal marked as ${processModal.status}`);
      setProcessModal({ open: false, item: null, status: 'PAID', notes: '' });
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process withdrawal');
    }
  };

  const pendingCount = withdrawals.filter(w => (w.status || '').toUpperCase() === 'PENDING').length;
  const paidCount = withdrawals.filter(w => (w.status || '').toUpperCase() === 'PAID').length;
  const totalPaidAmount = withdrawals
    .filter(w => (w.status || '').toUpperCase() === 'PAID')
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  return (
    <div className="withdrawals-page">
      {/* Subpage Stat Banner */}
      <div className="subpage-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon">
            <MdPayment />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Pending Payouts</span>
            <span className="subpage-stat-value" style={{ color: '#EA580C' }}>{pendingCount}</span>
          </div>
        </div>
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon">
            <MdCheckCircle />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Processed (Paid)</span>
            <span className="subpage-stat-value">{paidCount}</span>
          </div>
        </div>
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon">
            <MdAccountBalanceWallet />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Disbursed</span>
            <span className="subpage-stat-value">₹{totalPaidAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <h2 style={{ fontSize: '1.1rem', color: '#0F172A', fontWeight: 700 }}>Expert Payout & Withdrawal Requests</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExportDropdown
              data={withdrawals.map((w) => ({
                'Request ID': `#${w.id}`,
                'Expert Name': w.expertName || 'N/A',
                'Expert Email': w.expertEmail || 'N/A',
                'Requested Amount (INR)': `₹${parseFloat(w.amount || 0).toFixed(2)}`,
                'Payout Method': w.payoutMethod || 'Bank Transfer',
                'Bank / UPI Details': w.payoutDetails || 'Details on file',
                'Request Date': w.createdAt ? new Date(w.createdAt).toLocaleDateString('en-IN') : 'N/A',
                'Status': w.status || 'PENDING'
              }))}
              fileName="Aakash_Expert_Payouts"
              sheetName="Payouts"
              title="Expert Payout & Withdrawal Requests"
              subtitle={`Total Requests: ${withdrawals.length} | Paid Disbursed: ₹${totalPaidAmount.toLocaleString('en-IN')}`}
            />
            <button className="btn-secondary" onClick={fetchWithdrawals}>Refresh</button>
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#64748B', padding: 40, textAlign: 'center', fontWeight: 500 }}>Loading withdrawal requests...</div>
        ) : withdrawals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><MdAccountBalanceWallet /></div>
            <h3>No Withdrawal Requests</h3>
            <p>Expert payout requests will appear here when requested.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Expert</th>
                  <th>Requested Amount</th>
                  <th>Bank / UPI Details</th>
                  <th>Request Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>{w.expertName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{w.expertEmail}</div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: '#059669', fontSize: '1rem' }}>
                        ₹{parseFloat(w.amount).toFixed(2)}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--admin-primary)', fontWeight: 600 }}>{w.payoutMethod || 'Bank Transfer'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{w.payoutDetails || 'Details on file'}</div>
                    </td>

                    <td style={{ fontSize: '0.84rem', color: '#64748B' }}>
                      {new Date(w.createdAt).toLocaleDateString()}
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          w.status === 'PAID'
                            ? 'badge-success'
                            : w.status === 'PENDING'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>

                    <td>
                      {w.status === 'PENDING' ? (
                        <div className="actions-cell">
                          <button
                            className="btn-icon approve"
                            title="Mark as Paid"
                            onClick={() => setProcessModal({ open: true, item: w, status: 'PAID', notes: '' })}
                          >
                            <MdCheckCircle />
                          </button>
                          <button
                            className="btn-icon reject"
                            title="Reject Request"
                            onClick={() => setProcessModal({ open: true, item: w, status: 'REJECTED', notes: '' })}
                          >
                            <MdCancel />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Modal */}
      {processModal.open && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3>Process Payout #{processModal.item.id}</h3>
              <button className="btn-icon" onClick={() => setProcessModal({ open: false, item: null, status: 'PAID', notes: '' })}>
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleProcessSubmit}>
              <div className="modal-body">
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 8 }}>
                  <div style={{ fontSize: '0.84rem', color: '#64748B' }}>Paying Expert:</div>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>{processModal.item.expertName}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669', marginTop: 4 }}>
                    ₹{parseFloat(processModal.item.amount).toFixed(2)}
                  </div>
                </div>

                <div className="form-group">
                  <label>Status Action</label>
                  <select
                    value={processModal.status}
                    onChange={(e) => setProcessModal({ ...processModal, status: e.target.value })}
                  >
                    <option value="PAID">PAID (Completed payout transfer)</option>
                    <option value="REJECTED">REJECT (Decline & return balance)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Transaction UTR / Notes</label>
                  <textarea
                    rows="3"
                    placeholder="Enter transaction reference or notes"
                    value={processModal.notes}
                    onChange={(e) => setProcessModal({ ...processModal, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setProcessModal({ open: false, item: null, status: 'PAID', notes: '' })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

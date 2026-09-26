import React, { useState, useEffect } from 'react';
import { IoReceiptOutline, IoArrowUpCircleOutline, IoCashOutline, IoCheckmarkCircle, IoTimeOutline, IoCloseCircle } from 'react-icons/io5';
import { expertService } from '../../services/api';
import { toast } from 'react-toastify';

export default function WithdrawalsPage() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [upi, setUpi] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await expertService.getEarnings();
      if (res.data?.data) {
        setEarnings(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    const withdrawAmt = parseFloat(amount);
    if (!withdrawAmt || withdrawAmt <= 0) {
      toast.error('Please enter a valid withdrawal amount.');
      return;
    }

    if (withdrawAmt > (earnings?.summary?.availableForWithdrawal || 0)) {
      toast.error('Requested amount exceeds available balance.');
      return;
    }

    setSubmitting(true);
    try {
      await expertService.requestWithdrawal({
        amount: withdrawAmt,
        bankDetails: { upi }
      });
      toast.success('Withdrawal request submitted to admin for payout approval!');
      setModalOpen(false);
      setAmount('');
      setUpi('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit withdrawal request.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'COMPLETED' || status === 'PAID') {
      return <span className="badge-status success"><IoCheckmarkCircle /> PAID</span>;
    }
    if (status === 'REJECTED') {
      return <span className="badge-status danger"><IoCloseCircle /> REJECTED</span>;
    }
    return <span className="badge-status pending"><IoTimeOutline /> PENDING</span>;
  };

  return (
    <div className="expert-content-container">
      {/* Available Balance Header Card */}
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoReceiptOutline style={{ color: '#800000', fontSize: '22px' }} />
              Withdrawal Amount Transactions
            </h2>
            <p className="expert-card-desc">
              Log of your requested payouts, transfer confirmations, and bank settlements.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="btn-expert-primary"
            disabled={!earnings?.summary?.availableForWithdrawal || earnings.summary.availableForWithdrawal <= 0}
          >
            <IoArrowUpCircleOutline style={{ fontSize: '18px' }} />
            Request Payout
          </button>
        </div>

        <div style={{ background: '#fffef9', padding: '18px 22px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, letterSpacing: '0.5px' }}>AVAILABLE FOR WITHDRAWAL</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#FF6B00', marginTop: '2px' }}>
              ₹{parseFloat(earnings?.summary?.availableForWithdrawal || 0).toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, letterSpacing: '0.5px' }}>TOTAL EARNED (NET)</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#800000', marginTop: '2px' }}>
              ₹{parseFloat(earnings?.summary?.totalNetEarnings || 0).toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, letterSpacing: '0.5px' }}>TOTAL WITHDRAWN</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#800000', marginTop: '2px' }}>
              ₹{parseFloat(earnings?.summary?.totalWithdrawn || 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Records Table */}
      <div className="expert-card">
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#800000', margin: '0 0 16px 0' }}>
          Recent Withdrawal Transactions
        </h3>

        {earnings?.payouts && earnings.payouts.length > 0 ? (
          <div className="expert-table-wrap">
            <table className="expert-table">
              <thead>
                <tr>
                  <th>Payout ID</th>
                  <th>Requested Date</th>
                  <th>Amount</th>
                  <th>Transfer Method / UPI</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.payouts.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 800, color: '#800000' }}>#{p.id}</td>
                    <td style={{ color: '#6b3a3a' }}>{new Date(p.requestedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ fontWeight: 800, color: '#FF6B00' }}>₹{parseFloat(p.amount).toFixed(2)}</td>
                    <td style={{ color: '#4a1212', fontWeight: 600 }}>{p.bankDetails?.upi || p.bankDetails?.accountNumber || 'Bank Transfer'}</td>
                    <td>{getStatusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: '#6b3a3a' }}>
            <IoReceiptOutline style={{ fontSize: '42px', color: '#E2E8F0', marginBottom: '8px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No withdrawal transactions recorded yet.</p>
          </div>
        )}
      </div>

      {/* Withdrawal Request Modal */}
      {modalOpen && (
        <div className="expert-modal-overlay">
          <div className="expert-modal-card">
            <div className="expert-modal-header">
              <h3 className="expert-modal-title">
                Request Withdrawal Payout
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#800000' }}
              >
                ✕
              </button>
            </div>
            
            <p style={{ fontSize: '13px', color: '#6b3a3a', margin: '0 0 20px 0' }}>
              Available Balance: <strong style={{ color: '#FF6B00' }}>₹{parseFloat(earnings?.summary?.availableForWithdrawal || 0).toFixed(2)}</strong>
            </p>

            <form onSubmit={handleWithdrawalSubmit}>
              <div className="expert-input-group">
                <label className="expert-input-label">Payout Amount (INR) *</label>
                <input
                  type="number"
                  min="10"
                  max={earnings?.summary?.availableForWithdrawal || 0}
                  required
                  className="expert-form-input"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>

              <div className="expert-input-group">
                <label className="expert-input-label">UPI ID or Bank Details *</label>
                <input
                  type="text"
                  required
                  className="expert-form-input"
                  placeholder="Enter UPI ID or bank details"
                  value={upi}
                  onChange={e => setUpi(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-expert-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-expert-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {submitting ? 'Submitting...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

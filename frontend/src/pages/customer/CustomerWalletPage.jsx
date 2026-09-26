import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  IoWalletOutline,
  IoAdd,
  IoArrowUpCircleOutline,
  IoArrowDownCircleOutline,
  IoShieldCheckmarkOutline,
  IoReceiptOutline
} from 'react-icons/io5';
import { walletService } from '../../services/api';

export default function CustomerWalletPage() {
  const { user, refreshUser, setWalletModalOpen } = useOutletContext();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const res = await walletService.getWallet();
      setWalletData(res.data?.data || null);
    } catch (err) {
      console.error('Failed to load wallet ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const transactions = walletData?.transactions || [];
  const balance = user?.walletBalance || walletData?.wallet?.balance || 0;

  return (
    <div>
      {/* Wallet Balance Hero Card */}
      <div 
        className="customer-card" 
        style={{ 
          background: 'linear-gradient(135deg, #78350f 0%, #b45309 40%, #d97706 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '30px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(180, 83, 9, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#fef3c7', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IoShieldCheckmarkOutline /> Encrypted Spiritual Wallet
            </span>
            <div style={{ fontSize: '42px', fontWeight: 900, margin: '8px 0 4px', letterSpacing: '-0.5px' }}>
              ₹{parseFloat(balance).toFixed(2)}
            </div>
            <p style={{ color: '#fef3c7', fontSize: '13.5px', margin: 0 }}>
              Available balance for live Voice Calls & Chats with certified astrologers.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setWalletModalOpen(true)}
              style={{
                background: '#ffffff',
                color: '#b45309',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.2s'
              }}
            >
              <IoAdd style={{ fontSize: '20px' }} />
              <span>Add Money Online</span>
            </button>
            <span style={{ fontSize: '11px', color: '#fef3c7', textAlign: 'center' }}>
              Instant 100% Secure via Razorpay
            </span>
          </div>
        </div>

        {/* Quick Recharge Amount Chips */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#fef3c7' }}>Quick Top-Up:</span>
          {[100, 200, 500, 1000, 2000].map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setWalletModalOpen(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '5px 14px',
                borderRadius: '16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + ₹{amt}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Passbook */}
      <div className="customer-card">
        <div className="customer-card-header">
          <h3 className="customer-card-title">
            <IoReceiptOutline style={{ color: '#b45309' }} />
            Passbook & Transaction History
          </h3>
          <button 
            type="button" 
            onClick={loadWallet}
            style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading ledger transactions...
          </div>
        ) : transactions.length > 0 ? (
          <div className="customer-table-wrap">
            <table className="customer-data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Transaction Type</th>
                  <th>Description / Details</th>
                  <th>Direction</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isCredit = tx.direction === 'CREDIT';
                  return (
                    <tr key={tx.id || tx.transactionId}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '13px' }}>
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: '#4c1d95', fontSize: '13px' }}>
                          {tx.type || 'PAYMENT'}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#475569' }}>
                          {tx.note || 'Wallet transaction'}
                        </div>
                        {tx.referenceId && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            Ref: {tx.referenceId}
                          </span>
                        )}
                      </td>
                      <td>
                        <span 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 700,
                            fontSize: '12.5px',
                            color: isCredit ? '#FF6B00' : '#b91c1c'
                          }}
                        >
                          {isCredit ? <IoArrowDownCircleOutline style={{ fontSize: '16px' }} /> : <IoArrowUpCircleOutline style={{ fontSize: '16px' }} />}
                          <span>{isCredit ? 'CREDIT' : 'DEBIT'}</span>
                        </span>
                      </td>
                      <td>
                        <strong 
                          style={{ 
                            fontSize: '14.5px', 
                            color: isCredit ? '#FF6B00' : '#dc2626' 
                          }}
                        >
                          {isCredit ? '+' : '-'}₹{parseFloat(tx.amount || 0).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <span className={`status-pill ${tx.status === 'SUCCESS' || tx.status === 'COMPLETED' ? 'completed' : 'active'}`}>
                          {tx.status || 'SUCCESS'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="customer-empty-state">
            <div className="customer-empty-icon">💳</div>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
              No Transactions Recorded
            </h4>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '18px' }}>
              Your wallet passbook is clean. Add money to talk to astrologers anytime!
            </p>
            <button
              type="button"
              onClick={() => setWalletModalOpen(true)}
              className="customer-header-consult-btn"
              style={{ display: 'inline-flex' }}
            >
              <IoAdd />
              <span>Add Balance Now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

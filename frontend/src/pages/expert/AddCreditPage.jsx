import React, { useState, useEffect } from 'react';
import {
  IoWalletOutline,
  IoAddCircleOutline,
  IoShieldCheckmarkOutline,
  IoSparklesOutline,
  IoChatbubblesOutline,
  IoCallOutline,
  IoRocketOutline,
  IoRibbonOutline,
  IoCalculatorOutline,
  IoReceiptOutline,
  IoArrowDownCircleOutline,
  IoArrowUpCircleOutline,
  IoRefreshOutline
} from 'react-icons/io5';
import { useAuth } from '../../context/AuthContext';
import { walletService } from '../../services/api';
import { processRazorpayPayment } from '../../utils/razorpay';
import { toast } from 'react-toastify';

export default function AddCreditPage() {
  const { user, refreshUser } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [amount, setAmount] = useState('200');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const res = await walletService.getWallet();
      if (res.data?.data) {
        setWalletData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentBalance = Number(
    walletData?.wallet?.balance ?? walletData?.balance ?? user?.walletBalance ?? 0
  );
  const transactions = walletData?.transactions || [];

  const handleAddCredit = async (rechargeAmt) => {
    const val = parseFloat(rechargeAmt || amount);
    if (!val || val < 10) {
      toast.error('Minimum top-up amount is ₹10.');
      return;
    }

    setProcessing(true);
    try {
      // Trigger Razorpay Payment Gateway
      const res = await processRazorpayPayment({
        amount: val,
        user,
        description: 'Expert Wallet Credit Top-up'
      });
      toast.success(res?.message || `₹${val} credit added to wallet successfully via Razorpay!`);
      await loadWallet();
      if (refreshUser) {
        await refreshUser();
      }
    } catch (err) {
      if (err.message && !err.message.includes('cancelled by user')) {
        toast.error(err.message || 'Payment failed. Please try again.');
      } else {
        toast.info('Payment was cancelled.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="expert-content-container">
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoWalletOutline style={{ color: '#FF6B00', fontSize: '24px' }} />
              Add Credit & Wallet Top-up
            </h2>
            <p className="expert-card-desc">
              Add balance to consult other astrologers via Chat/Call, sponsor listing boosts, and access practice companion tools.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', marginTop: '16px' }}>
          
          {/* Left Column: Current Balance & How Credits Can Be Used */}
          <div>
            {/* Balance Card */}
            <div style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF7ED 100%)',
              border: '1.5px solid #E2E8F0',
              borderRadius: '16px',
              padding: '24px 28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(255, 107, 0, 0.08)'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  CURRENT WALLET BALANCE
                </div>
                <div style={{ fontSize: '38px', fontWeight: 900, marginTop: '4px', color: '#FF6B00' }}>
                  ₹{currentBalance.toFixed(2)}
                </div>
                <div style={{ fontSize: '12.5px', color: '#3b502d', marginTop: '4px', fontWeight: 600 }}>
                  ● Active Credit & Consultation Balance
                </div>
              </div>
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #E2E8F0',
                padding: '14px',
                borderRadius: '50%',
                fontSize: '30px',
                display: 'flex',
                color: '#FF6B00',
                boxShadow: '0 4px 10px rgba(255, 107, 0, 0.12)'
              }}>
                <IoSparklesOutline />
              </div>
            </div>

            {/* How Can You Use Credits Box */}
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #E2E8F0',
              borderRadius: '16px',
              padding: '22px 24px',
              marginTop: '18px',
              boxShadow: '0 2px 10px rgba(255, 107, 0, 0.04)'
            }}>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IoSparklesOutline style={{ color: '#FF6B00' }} />
                What Can You Use Your Credit For?
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ background: '#FFFFFF', color: '#FF6B00', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px', fontSize: '16px', display: 'flex' }}>
                    <IoChatbubblesOutline />
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0F172A' }}>Consult Other Astrologers (Chat & Call):</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B', lineHeight: '1.5' }}>
                      Connect with fellow Vedic & Tarot experts for peer readings, case discussions, and second opinions.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ background: '#FFFFFF', color: '#FF6B00', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px', fontSize: '16px', display: 'flex' }}>
                    <IoRocketOutline />
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0F172A' }}>Search Ranking Boost:</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B', lineHeight: '1.5' }}>
                      Promote your astrologer profile at the top of category listings to attract more client consultations.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ background: '#FFFFFF', color: '#FF6B00', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px', fontSize: '16px', display: 'flex' }}>
                    <IoRibbonOutline />
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0F172A' }}>Verification Badges:</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B', lineHeight: '1.5' }}>
                      Apply for premium verified credentials to showcase your expertise and build trust with seekers.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ background: '#FFFFFF', color: '#FF6B00', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '6px', fontSize: '16px', display: 'flex' }}>
                    <IoCalculatorOutline />
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0F172A' }}>Kundali & Ephemeris Tools:</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748B', lineHeight: '1.5' }}>
                      Unlock high-precision planetary charts, Dasha timelines, and match-making reports.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Razorpay Top-Up Panel */}
          <div>
            <div style={{ background: '#ffffff', border: '1.5px solid #E2E8F0', borderRadius: '16px', padding: '24px 26px', boxShadow: '0 4px 16px rgba(255, 107, 0, 0.05)' }}>
              <label className="expert-input-label" style={{ fontSize: '13.5px', marginBottom: '10px' }}>
                Select Top-Up Amount (INR)
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '18px' }}>
                {['100', '200', '500', '1000', '2000'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '10px',
                      border: amount === val ? '2px solid #FF6B00' : '1.5px solid #E2E8F0',
                      background: amount === val ? '#FFFFFF' : '#ffffff',
                      color: amount === val ? '#FF6B00' : '#0F172A',
                      fontWeight: 800,
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    ₹{val}
                  </button>
                ))}
              </div>

              <div className="expert-input-group">
                <label className="expert-input-label">Or Enter Custom Amount (INR)</label>
                <input
                  type="number"
                  min="10"
                  className="expert-form-input"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount (e.g. 500)"
                  style={{ fontSize: '15px', fontWeight: '700' }}
                />
              </div>

              {/* Razorpay Action Button */}
              <button
                type="button"
                disabled={processing}
                onClick={() => handleAddCredit(amount)}
                className="btn-expert-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '14px',
                  fontSize: '15.5px',
                  fontWeight: 800,
                  marginTop: '8px',
                  boxShadow: '0 4px 16px rgba(255, 107, 0, 0.28)'
                }}
              >
                <IoAddCircleOutline style={{ fontSize: '22px' }} />
                {processing ? 'Connecting Razorpay...' : `Add ₹${amount || 0} via Razorpay`}
              </button>

              <div style={{
                marginTop: '18px',
                padding: '12px 14px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#64748B',
                fontSize: '12.5px',
                lineHeight: '1.45'
              }}>
                <IoShieldCheckmarkOutline style={{ color: '#FF6B00', fontSize: '24px', flexShrink: 0 }} />
                <div>
                  <strong>100% Secure via Razorpay:</strong> Supports UPI (GooglePay, PhonePe, Paytm), Credit/Debit Cards, Netbanking & Wallets.
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Transaction Passbook & Top-up History */}
        <div style={{ marginTop: '36px', borderTop: '1.5px solid #E2E8F0', paddingTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IoReceiptOutline style={{ color: '#FF6B00', fontSize: '20px' }} />
              Wallet Passbook & Credit History
            </h3>
            <button
              type="button"
              onClick={loadWallet}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#FF6B00',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <IoRefreshOutline /> Refresh
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#64748B', fontSize: '13.5px' }}>
              Loading wallet ledger...
            </div>
          ) : transactions.length > 0 ? (
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', color: '#FF6B00', fontWeight: 800 }}>
                    <th style={{ padding: '12px 16px' }}>Date & Time</th>
                    <th style={{ padding: '12px 16px' }}>Type</th>
                    <th style={{ padding: '12px 16px' }}>Reference / Note</th>
                    <th style={{ padding: '12px 16px' }}>Direction</th>
                    <th style={{ padding: '12px 16px' }}>Amount</th>
                    <th style={{ padding: '12px 16px' }}>Balance After</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const isCredit = tx.direction === 'CREDIT';
                    return (
                      <tr key={tx.id || tx.transactionId} style={{ borderBottom: '1px solid #f0e6d6', background: '#ffffff' }}>
                        <td style={{ padding: '12px 16px', color: '#0F172A', fontWeight: 600 }}>
                          <div>{new Date(tx.createdAt).toLocaleDateString()}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>
                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#FF6B00' }}>
                          {tx.type || 'TOPUP'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#64748B' }}>
                          <div>{tx.note || 'Wallet transaction'}</div>
                          {tx.referenceId && (
                            <span style={{ fontSize: '11px', color: '#88987b', fontFamily: 'monospace' }}>
                              ID: {tx.referenceId}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 700,
                            fontSize: '12px',
                            color: isCredit ? '#FF6B00' : '#c62828'
                          }}>
                            {isCredit ? <IoArrowDownCircleOutline /> : <IoArrowUpCircleOutline />}
                            {isCredit ? 'CREDIT' : 'DEBIT'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 800, fontSize: '14px', color: isCredit ? '#FF6B00' : '#c62828' }}>
                          {isCredit ? '+' : '-'}₹{parseFloat(tx.amount || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A' }}>
                          ₹{parseFloat(tx.balanceAfter || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 9px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: tx.status === 'SUCCESS' ? '#e8f5e9' : '#fff3e0',
                            color: tx.status === 'SUCCESS' ? '#FF6B00' : '#ef6c00'
                          }}>
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
            <div style={{ textAlign: 'center', padding: '24px', background: '#FFFFFF', borderRadius: '10px', color: '#64748B', fontSize: '13px' }}>
              No transactions recorded yet. When you top-up via Razorpay, your history will appear here.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}


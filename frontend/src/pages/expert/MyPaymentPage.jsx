import React, { useState, useEffect } from 'react';
import { IoCashOutline, IoPieChartOutline, IoWalletOutline, IoReceiptOutline, IoArrowForwardOutline } from 'react-icons/io5';
import { expertService } from '../../services/api';
import { Link } from 'react-router-dom';

export default function MyPaymentPage() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    expertService.getEarnings()
      .then(res => {
        if (res.data?.data) setEarnings(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="expert-content-container">
      {/* Earnings Overview */}
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoCashOutline style={{ color: '#800000', fontSize: '24px' }} />
              My Payment & Earnings Ledger
            </h2>
            <p className="expert-card-desc">
              Transparent summary of your consultation revenues, commissions, and payout ledger.
            </p>
          </div>

          <Link to="/expert/dashboard/withdrawals" className="btn-expert-primary">
            <IoReceiptOutline /> Payout Requests
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '14px' }}>
          
          <div style={{ background: '#fffef9', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.5px' }}>
              GROSS CONSULTATIONS BILLED
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#800000' }}>
              ₹{parseFloat(earnings?.summary?.totalGross || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#8a5757', marginTop: '4px' }}>
              Total seeker chat charges
            </div>
          </div>

          <div style={{ background: '#fffef9', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.5px' }}>
              PLATFORM COMMISSION (20%)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#6b3a3a' }}>
              ₹{parseFloat(earnings?.summary?.totalCommission || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#8a5757', marginTop: '4px' }}>
              Hosting, bandwidth & payments
            </div>
          </div>

          <div style={{ background: '#fffef9', padding: '18px 20px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '12px', color: '#6b3a3a', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.5px' }}>
              NET LIFETIME EARNINGS
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#800000' }}>
              ₹{parseFloat(earnings?.summary?.totalNetEarnings || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#8a5757', marginTop: '4px' }}>
              80% direct astrologer share
            </div>
          </div>

          <div style={{ background: '#F0FFF0', padding: '18px 20px', borderRadius: '10px', border: '1px solid #FFEDD5' }}>
            <div style={{ fontSize: '12px', color: '#276727', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.5px' }}>
              CURRENT AVAILABLE BALANCE
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#FF6B00' }}>
              ₹{parseFloat(earnings?.summary?.availableForWithdrawal || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '12px', color: '#276727', marginTop: '4px' }}>
              Ready for immediate bank payout
            </div>
          </div>

        </div>
      </div>

      {/* Breakdown Notice Card */}
      <div className="expert-card">
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#800000', margin: '0 0 12px 0' }}>
          Consultation Revenue Distribution Policy
        </h3>
        <div style={{ fontSize: '13.5px', color: '#6b3a3a', lineHeight: '1.6' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            • <strong>Instant Credit:</strong> Upon conclusion of each live consultation session, earnings are automatically calculated based on exact elapsed seconds minus promotional free minutes.
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            • <strong>Net 80% Payout:</strong> 80% of all paid consultation minutes are credited directly into your expert payout ledger with zero hidden deductions.
          </p>
          <p style={{ margin: 0 }}>
            • <strong>Automated Withdrawals:</strong> Submit withdrawal requests anytime via UPI or Bank IMPS. Payouts are processed smoothly by platform finance.
          </p>
        </div>
      </div>
    </div>
  );
}

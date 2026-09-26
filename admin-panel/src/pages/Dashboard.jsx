import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/api';
import {
  MdPeople,
  MdVerifiedUser,
  MdPendingActions,
  MdChat,
  MdAttachMoney,
  MdAccountBalanceWallet,
  MdArrowForward,
  MdTrendingUp,
  MdViewCarousel,
  MdCategory,
  MdGroups,
  MdCampaign,
  MdBolt
} from 'react-icons/md';
import DashboardCharts from '../components/DashboardCharts';
import ExportDropdown from '../components/ExportDropdown';
import '../assets/css/admin-dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await adminApi.getDashboardStats();
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: '#64748B', padding: 40, fontWeight: 500 }}>Loading administrative statistics...</div>;
  }

  const kpiExportData = [
    { 'Metric': 'Net Platform Revenue (20%)', 'Value': `₹${stats?.totalPlatformRevenue?.toFixed(2) || '0.00'}`, 'Category': 'Financial' },
    { 'Metric': 'Gross Consultation Volume', 'Value': `₹${stats?.totalGrossVolume?.toFixed(2) || '0.00'}`, 'Category': 'Financial' },
    { 'Metric': 'Total Completed Consultations', 'Value': stats?.totalCompletedConsultations || 0, 'Category': 'Operations' },
    { 'Metric': 'Approved Astrologers on Market', 'Value': stats?.totalApprovedExperts || 0, 'Category': 'Experts' },
    { 'Metric': 'Pending Astrologer Applications', 'Value': stats?.pendingExpertApprovals || 0, 'Category': 'Verification' },
    { 'Metric': 'Registered Customers', 'Value': stats?.totalCustomers || 0, 'Category': 'Users' },
    { 'Metric': 'Total Disbursed Payouts', 'Value': `₹${stats?.totalDisbursedPayouts?.toFixed(2) || '0.00'}`, 'Category': 'Payouts' }
  ];

  return (
    <div className="dashboard-page">
      {/* Top Header & Export Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Platform Overview & Performance
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#64748B' }}>
            Real-time consultation revenue, active experts, and system telemetry
          </p>
        </div>
        <ExportDropdown
          data={kpiExportData}
          fileName="Aakash_Platform_KPI_Summary"
          sheetName="OverviewReport"
          title="Aakash Astrology • Administrative KPI Report"
          subtitle={`Generated on ${new Date().toLocaleDateString('en-IN')}`}
        />
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard-grid">
        <div className="kpi-card gold">
          <div className="kpi-icon-wrap">
            <MdAttachMoney />
          </div>
          <div className="kpi-info">
            <span className="label">Platform Revenue</span>
            <span className="value">₹{stats?.totalPlatformRevenue?.toFixed(2) || '0.00'}</span>
            <span className="subtext">20% Net Platform Cut</span>
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-icon-wrap">
            <MdTrendingUp />
          </div>
          <div className="kpi-info">
            <span className="label">Gross Consultation Volume</span>
            <span className="value">₹{stats?.totalGrossVolume?.toFixed(2) || '0.00'}</span>
            <span className="subtext">{stats?.totalCompletedConsultations || 0} completed sessions</span>
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-icon-wrap">
            <MdVerifiedUser />
          </div>
          <div className="kpi-info">
            <span className="label">Approved Experts</span>
            <span className="value">{stats?.totalApprovedExperts || 0}</span>
            <span className="subtext">Live on Marketplace</span>
          </div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-icon-wrap">
            <MdPendingActions />
          </div>
          <div className="kpi-info">
            <span className="label">Pending Verification</span>
            <span className="value">{stats?.pendingExpertApprovals || 0}</span>
            <span className="subtext">Requires admin review</span>
          </div>
        </div>

        <div className="kpi-card cyan">
          <div className="kpi-icon-wrap">
            <MdPeople />
          </div>
          <div className="kpi-info">
            <span className="label">Registered Customers</span>
            <span className="value">{stats?.totalCustomers || 0}</span>
            <span className="subtext">Active Platform Users</span>
          </div>
        </div>

        <div className="kpi-card orange">
          <div className="kpi-icon-wrap">
            <MdChat />
          </div>
          <div className="kpi-info">
            <span className="label">Live Consultations</span>
            <span className="value">{stats?.activeConsultations || 0}</span>
            <span className="subtext">Real-time ongoing sessions</span>
          </div>
        </div>

        <div className="kpi-card pink">
          <div className="kpi-icon-wrap">
            <MdAccountBalanceWallet />
          </div>
          <div className="kpi-info">
            <span className="label">Pending Payouts</span>
            <span className="value">{stats?.pendingWithdrawals || 0}</span>
            <span className="subtext">Withdrawal requests</span>
          </div>
        </div>
      </div>

      {/* Interactive Analytics Charts */}
      <DashboardCharts stats={stats} />

      {/* Executive Quick Action Command Hub */}
      <div className="quick-actions-bar">
        <div className="quick-actions-header">
          <div className="title-group">
            <h3>
              <MdBolt style={{ color: '#EA580C', fontSize: '1.4rem' }} />
              Quick Administration Command Hub
            </h3>
            <p>Direct shortcuts and management actions for high-priority operational workflows</p>
          </div>
        </div>

        <div className="quick-actions-grid">
          {/* Card 1: Expert Approvals */}
          <Link to="/experts/pending" className="quick-action-card">
            <div>
              <div className="quick-action-top">
                <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #EA580C 100%)' }}>
                  <MdVerifiedUser />
                </div>
                <span
                  className="quick-action-pill"
                  style={
                    stats?.pendingVerification > 0
                      ? { background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }
                      : { background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA' }
                  }
                >
                  {stats?.pendingVerification ? `${stats.pendingVerification} PENDING` : 'UP TO DATE'}
                </span>
              </div>
              <div className="quick-action-body">
                <h4>Review Expert Approvals</h4>
                <p>Audit verification KYC documents, certificates, and approve pending astrologers.</p>
              </div>
            </div>
            <div className="quick-action-footer">
              <span>Review Verification Queue</span>
              <div className="arrow-btn"><MdArrowForward /></div>
            </div>
          </Link>

          {/* Card 2: Manage All Experts */}
          <Link to="/experts" className="quick-action-card">
            <div>
              <div className="quick-action-top">
                <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)' }}>
                  <MdGroups />
                </div>
                <span className="quick-action-pill" style={{ background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA' }}>
                  {stats?.totalExperts || 0} ASTROLOGERS
                </span>
              </div>
              <div className="quick-action-body">
                <h4>Manage All Experts</h4>
                <p>View the full roster, toggle market listing status, rates, and active/inactive states.</p>
              </div>
            </div>
            <div className="quick-action-footer">
              <span>Manage Directory</span>
              <div className="arrow-btn"><MdArrowForward /></div>
            </div>
          </Link>

          {/* Card 3: Upload Promotional Banners */}
          <Link to="/banners" className="quick-action-card">
            <div>
              <div className="quick-action-top">
                <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #FB923C 0%, #F59E0B 100%)' }}>
                  <MdViewCarousel />
                </div>
                <span className="quick-action-pill" style={{ background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA' }}>
                  HOMEPAGE HERO
                </span>
              </div>
              <div className="quick-action-body">
                <h4>Upload Promotional Banners</h4>
                <p>Manage live homepage slider slides, banner campaigns, and custom call-to-actions.</p>
              </div>
            </div>
            <div className="quick-action-footer">
              <span>Configure Banners</span>
              <div className="arrow-btn"><MdArrowForward /></div>
            </div>
          </Link>

          {/* Card 4: Manage Categories */}
          <Link to="/categories" className="quick-action-card">
            <div>
              <div className="quick-action-top">
                <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)' }}>
                  <MdCategory />
                </div>
                <span className="quick-action-pill" style={{ background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA' }}>
                  TAXONOMY
                </span>
              </div>
              <div className="quick-action-body">
                <h4>Manage Categories</h4>
                <p>Create & configure Vedic, Tarot, Numerology domains and URL navigation slugs.</p>
              </div>
            </div>
            <div className="quick-action-footer">
              <span>Configure Categories</span>
              <div className="arrow-btn"><MdArrowForward /></div>
            </div>
          </Link>

          {/* Card 5: Process Withdrawals */}
          <Link to="/withdrawals" className="quick-action-card">
            <div>
              <div className="quick-action-top">
                <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
                  <MdAccountBalanceWallet />
                </div>
                <span
                  className="quick-action-pill"
                  style={
                    stats?.pendingWithdrawals > 0
                      ? { background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }
                      : { background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }
                  }
                >
                  {stats?.pendingWithdrawals ? `${stats.pendingWithdrawals} TO PAY` : 'CLEARED'}
                </span>
              </div>
              <div className="quick-action-body">
                <h4>Process Withdrawals</h4>
                <p>Review and disburse expert consultation earnings to verified Bank and UPI accounts.</p>
              </div>
            </div>
            <div className="quick-action-footer">
              <span>Disburse Payouts</span>
              <div className="arrow-btn"><MdArrowForward /></div>
            </div>
          </Link>

          {/* Card 6: Expert Announcements & Broadcasts */}
          <Link to="/broadcasts" className="quick-action-card">
            <div>
              <div className="quick-action-top">
                <div className="quick-action-icon" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #FB923C 100%)' }}>
                  <MdCampaign />
                </div>
                <span className="quick-action-pill" style={{ background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA' }}>
                  NOTIFICATIONS
                </span>
              </div>
              <div className="quick-action-body">
                <h4>Announcements & Mailbox</h4>
                <p>Dispatch instant system broadcasts, festival commissions & alerts to astrologers.</p>
              </div>
            </div>
            <div className="quick-action-footer">
              <span>Dispatch Notice</span>
              <div className="arrow-btn"><MdArrowForward /></div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

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
  MdTrendingUp
} from 'react-icons/md';
import DashboardCharts from '../components/DashboardCharts';
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
    return <div style={{ color: '#fff', padding: 40 }}>Loading administrative statistics...</div>;
  }

  return (
    <div className="dashboard-page">
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

      {/* Quick Action Navigation */}
      <div className="quick-actions-bar">
        <div className="quick-actions-header">
          <h3>Quick Administration Controls</h3>
          <p>Direct shortcuts to high-priority management workflows</p>
        </div>

        <div className="action-buttons-flex">
          <Link to="/experts/pending" className="btn-primary">
            <span>Review Expert Approvals</span>
            <MdArrowForward />
          </Link>

          <Link to="/experts" className="btn-secondary">
            <span>Manage All Experts & Active State</span>
          </Link>

          <Link to="/banners" className="btn-secondary">
            <span>Upload Promotional Banners</span>
          </Link>

          <Link to="/categories" className="btn-secondary">
            <span>Manage Categories</span>
          </Link>

          <Link to="/withdrawals" className="btn-secondary">
            <span>Process Withdrawals</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

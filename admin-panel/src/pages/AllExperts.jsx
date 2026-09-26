import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import {
  MdSearch,
  MdFilterList,
  MdCheckCircle,
  MdCancel,
  MdStars,
  MdPerson,
  MdDelete
} from 'react-icons/md';
import ExportDropdown from '../components/ExportDropdown';
import '../assets/css/admin-tables.css';

export default function AllExperts() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  useEffect(() => {
    fetchExperts();
  }, [statusFilter, activeFilter]);

  const fetchExperts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.approvalStatus = statusFilter;
      if (activeFilter !== '') params.isActive = activeFilter;
      if (search) params.search = search;

      const res = await adminApi.getAllExperts(params);
      setExperts(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load experts directory');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (expert) => {
    const newActive = !expert.isActive;
    try {
      await adminApi.toggleExpertActive(expert.id, newActive);
      toast.success(
        `Expert ${expert.displayName || expert.screenName} is now ${
          newActive ? 'ACTIVE (Enabled for bookings & chat)' : 'INACTIVE (Chat & payments locked)'
        }`
      );
      // Update state locally
      setExperts((prev) =>
        prev.map((e) => (e.id === expert.id ? { ...e, isActive: newActive, isOnline: newActive ? e.isOnline : false } : e))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update active state');
    }
  };

  const handleDeleteExpert = async (expert) => {
    const expertName = expert.displayName || expert.screenName || 'this expert';
    if (!window.confirm(`⚠️ CAUTION: Are you sure you want to permanently DELETE ${expertName}? This will remove all their profile, consultations, and earnings data!`)) {
      return;
    }

    try {
      await adminApi.deleteExpert(expert.id);
      toast.success(`Expert ${expertName} deleted permanently`);
      setExperts((prev) => prev.filter((e) => e.id !== expert.id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete expert');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExperts();
  };

  const approvedTotal = experts.filter((e) => e.approvalStatus === 'APPROVED').length;
  const activeTotal = experts.filter((e) => e.isActive).length;
  const onlineTotal = experts.filter((e) => e.isOnline).length;

  return (
    <div className="all-experts-page">
      {/* Top Stat Banner Grid */}
      <div className="subpage-stats-grid">
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', color: '#EA580C', border: '1.5px solid #FED7AA' }}>
            <MdPerson />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Experts</span>
            <span className="subpage-stat-value">{experts.length}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#059669', border: '1.5px solid #A7F3D0' }}>
            <MdCheckCircle />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Approved</span>
            <span className="subpage-stat-value" style={{ color: '#059669' }}>{approvedTotal}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #F97316 100%)', color: '#FFFFFF' }}>
            <MdStars />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Active on Market</span>
            <span className="subpage-stat-value" style={{ color: '#C2410C' }}>{activeTotal}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', color: '#D97706', border: '1.5px solid #FCD34D' }}>
            <MdStars />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Online Now</span>
            <span className="subpage-stat-value" style={{ color: '#D97706' }}>{onlineTotal}</span>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
            <div className="table-search-box">
              <MdSearch />
              <input
                type="text"
                placeholder="Search experts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-filter-apply">Search</button>
          </form>

          <div className="table-filters">
            <select
              className="table-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Verification Statuses</option>
              <option value="APPROVED">Approved Only</option>
              <option value="PENDING">Pending Only</option>
              <option value="REJECTED">Rejected Only</option>
            </select>

            <select
              className="table-select"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
            >
              <option value="">All Active States</option>
              <option value="1">Active Only</option>
              <option value="0">Inactive Only</option>
            </select>

            <ExportDropdown
              data={experts.map((exp) => ({
                'Expert ID': exp.id,
                'Display Name': exp.displayName || 'Unnamed Expert',
                'Screen Name': exp.screenName ? `@${exp.screenName}` : 'N/A',
                'Email Address': exp.email || 'N/A',
                'Phone Number': exp.phoneNumber || exp.telephone || 'N/A',
                'Specialty Title': exp.title || 'Astrologer',
                'Experience (Years)': exp.experienceYears || 0,
                'Price Per Minute (INR)': `₹${parseFloat(exp.pricePerMinute || 0).toFixed(2)}`,
                'Free Minutes': exp.freeMinutes || 0,
                'Total Consultations': exp.totalConsultations || 0,
                'Rating': parseFloat(exp.rating || 5.0).toFixed(1),
                'Reviews Count': exp.totalReviews || 0,
                'Approval Status': exp.approvalStatus || 'PENDING',
                'Marketplace Active': exp.isActive ? 'Active' : 'Inactive',
                'Online Presence': exp.isOnline ? 'Online' : 'Offline'
              }))}
              fileName="Aakash_Astrologers_Directory"
              sheetName="Experts"
              title="Verified Astrologers & Psychics Directory"
              subtitle={`Total Experts: ${experts.length} | Approved: ${approvedTotal} | Active on Market: ${activeTotal}`}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#64748B', padding: 40, textAlign: 'center', fontWeight: 500 }}>Loading experts...</div>
        ) : experts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><MdPerson /></div>
            <h3>No Experts Found</h3>
            <p>Try clearing filters or checking pending registrations.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Expert Profile</th>
                  <th>Handle & Title</th>
                  <th>Approval Status</th>
                  <th>Online Presence</th>
                  <th>Active Control (Admin)</th>
                  <th>Pricing & Stats</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {experts.map((exp) => (
                  <tr key={exp.id}>
                    <td>
                      <div className="user-cell">
                        <img
                          src={exp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={exp.displayName}
                          className="table-avatar"
                        />
                        <div className="user-cell-meta">
                          <span className="name">{exp.displayName || 'Unnamed Expert'}</span>
                          <span className="sub">{exp.email}</span>
                          <span className="sub">{exp.phoneNumber || exp.telephone || 'No phone'}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>@{exp.screenName || 'expert'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exp.title || 'Astrologer'}</div>
                    </td>

                    <td>
                      {exp.approvalStatus === 'APPROVED' && (
                        <span className="badge badge-success">APPROVED</span>
                      )}
                      {exp.approvalStatus === 'PENDING' && (
                        <span className="badge badge-warning">PENDING REVIEW</span>
                      )}
                      {exp.approvalStatus === 'REJECTED' && (
                        <span className="badge badge-danger">REJECTED</span>
                      )}
                    </td>

                    <td>
                      {exp.isOnline ? (
                        <span className="badge badge-success" style={{ gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}></span>
                          ONLINE
                        </span>
                      ) : (
                        <span className="badge" style={{ gap: 6, background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94A3B8' }}></span>
                          OFFLINE
                        </span>
                      )}
                    </td>

                    {/* Active / Inactive Admin Toggle */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={Boolean(exp.isActive)}
                            onChange={() => handleToggleActive(exp)}
                          />
                          <span className="slider"></span>
                        </label>
                        <span
                          style={{
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            color: exp.isActive ? '#10B981' : '#EF4444'
                          }}
                        >
                          {exp.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 3 }}>
                        {exp.isActive ? 'Users can chat & pay' : 'Chat & payments locked'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>₹{exp.pricePerMinute?.toFixed(2) || '20.00'}/min</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--admin-primary)' }}>
                        ★ {exp.rating?.toFixed(1) || '5.0'} ({exp.totalConsultations || 0} chats)
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn-delete-expert"
                        title="Permanently Delete Expert"
                        onClick={() => handleDeleteExpert(exp)}
                      >
                        <MdDelete style={{ fontSize: '16px' }} />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

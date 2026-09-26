import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import { MdSearch, MdPeople, MdBlock, MdCheckCircle } from 'react-icons/md';
import ExportDropdown from '../components/ExportDropdown';
import '../assets/css/admin-tables.css';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await adminApi.getAllUsers(params);
      setUsers(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    if (!window.confirm(`Are you sure you want to change ${user.fullName || user.email}'s status to ${newStatus}?`)) return;

    try {
      await adminApi.updateUserStatus(user.id, newStatus);
      toast.success(`User is now ${newStatus}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
  const customersCount = users.filter((u) => u.role === 'CUSTOMER').length;
  const walletSum = users.reduce((acc, u) => acc + (parseFloat(u.walletBalance) || 0), 0);

  return (
    <div className="users-page">
      {/* Top Stat Banner Grid */}
      <div className="subpage-stats-grid">
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', color: '#EA580C', border: '1.5px solid #FED7AA' }}>
            <MdPeople />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Users</span>
            <span className="subpage-stat-value">{users.length}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#059669', border: '1.5px solid #A7F3D0' }}>
            <MdCheckCircle />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Active Users</span>
            <span className="subpage-stat-value" style={{ color: '#059669' }}>{activeUsers}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #F97316 100%)', color: '#FFFFFF' }}>
            <MdPeople />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">User Wallet Balances</span>
            <span className="subpage-stat-value" style={{ color: '#C2410C' }}>₹{walletSum.toFixed(2)}</span>
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
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-filter-apply">Search</button>
          </form>

          <div className="table-filters">
            <select
              className="table-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="CUSTOMER">Customers Only</option>
              <option value="EXPERT">Experts Only</option>
              <option value="ADMIN">Admins Only</option>
            </select>

            <select
              className="table-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
            </select>

            <ExportDropdown
              data={users.map((u) => ({
                'User ID': u.id,
                'Full Name': u.fullName || 'N/A',
                'Email Address': u.email || 'N/A',
                'Phone Number': u.phoneNumber || 'N/A',
                'Role': u.role || 'CUSTOMER',
                'Account Status': u.status || 'ACTIVE',
                'Wallet Balance (INR)': parseFloat(u.walletBalance || 0).toFixed(2),
                'Registered Date': u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'N/A'
              }))}
              fileName="Aakash_Users_Directory"
              sheetName="Users"
              title="Registered Users Directory"
              subtitle={`Total Users: ${users.length} | Active: ${activeUsers} | Customers: ${customersCount}`}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#64748B', padding: 40, textAlign: 'center', fontWeight: 500 }}>Loading users directory...</div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><MdPeople /></div>
            <h3>No Users Found</h3>
            <p>Try modifying your search or filter terms.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Role</th>
                  <th>Wallet Balance</th>
                  <th>Registered</th>
                  <th>Account Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div
                          className="table-avatar"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            color: 'var(--admin-primary)',
                            background: 'var(--admin-surface-elevated)'
                          }}
                        >
                          {u.fullName?.charAt(0) || u.email?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="user-cell-meta">
                          <span className="name">{u.fullName || 'No name provided'}</span>
                          <span className="sub">{u.email}</span>
                          {u.phoneNumber && <span className="sub">{u.phoneNumber}</span>}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          u.role === 'ADMIN'
                            ? 'badge-purple'
                            : u.role === 'EXPERT'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: '#059669', fontSize: '0.96rem' }}>
                        ₹{u.walletBalance ? parseFloat(u.walletBalance).toFixed(2) : '0.00'}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.84rem', color: '#64748B' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td>
                      <span className={`badge ${u.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {u.status}
                      </span>
                    </td>

                    <td>
                      {u.role !== 'ADMIN' && (
                        <button
                          className={`btn-icon ${u.status === 'ACTIVE' ? 'reject' : 'approve'}`}
                          title={u.status === 'ACTIVE' ? 'Suspend / Block Account' : 'Reactivate Account'}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.status === 'ACTIVE' ? <MdBlock /> : <MdCheckCircle />}
                        </button>
                      )}
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

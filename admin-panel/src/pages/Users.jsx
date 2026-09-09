import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import { MdSearch, MdPeople, MdBlock, MdCheckCircle } from 'react-icons/md';
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

  return (
    <div className="users-page">
      <div className="table-container">
        <div className="table-toolbar">
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10 }}>
            <div className="table-search-box">
              <MdSearch />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-secondary">Search</button>
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
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#fff', padding: 40, textAlign: 'center' }}>Loading users directory...</div>
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
                      <span style={{ fontWeight: 700, color: '#34d399', fontSize: '0.96rem' }}>
                        ₹{u.walletBalance ? parseFloat(u.walletBalance).toFixed(2) : '0.00'}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.84rem', color: '#9ca3af' }}>
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

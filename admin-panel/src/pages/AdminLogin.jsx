import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { toast } from 'react-toastify';
import { MdStars, MdEmail, MdLock, MdLogin } from 'react-icons/md';
import '../assets/css/admin-login.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@astrology.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Admin authentication successful');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="login-brand-header">
          <div className="login-badge-shield">
            <MdStars />
          </div>
          <h1>AAKASH</h1>
          <p>Master Administration Control Console</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Email</label>
            <div className="input-with-icon">
              <MdEmail />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Master Password</label>
            <div className="input-with-icon">
              <MdLock />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            <MdLogin />
            <span>{loading ? 'Authenticating...' : 'Sign In to Console'}</span>
          </button>
        </form>

        <div className="credentials-hint">
          Platform Admin: <strong>admin@astrology.com</strong> | Password: <strong>Admin@123</strong>
        </div>
      </div>
    </div>
  );
}

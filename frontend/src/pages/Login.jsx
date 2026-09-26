import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { IoMailOutline, IoLockClosedOutline, IoClose, IoKeyOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../assets/css/auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  // Forgot password state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = Email, 2 = OTP + New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotPasswordState, setForgotPasswordState] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      loginUser(res.data.data);
      toast.success(res.data.message || 'Login successful!');
      const redirectUrl = searchParams.get('redirect');
      navigate(redirectUrl || res.data.data.redirectRoute || '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Please enter your registered email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authService.forgotPassword(forgotEmail);
      toast.success(res.data?.message || 'Password reset OTP sent to your email!');
      setForgotStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotOtp || !newPassword) {
      toast.error('Please enter the 6-digit OTP and your new password.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await authService.resetPassword({
        email: forgotEmail,
        otp: forgotOtp,
        newPassword
      });
      toast.success(res.data?.message || 'Password reset successfully! Please sign in.');
      setForgotModalOpen(false);
      setForgotStep(1);
      setEmail(forgotEmail);
      setPassword('');
      setForgotOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Please check OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" title="Back to Home" className="auth-brand-badge">
            <span className="auth-brand-text">Aakash</span>
          </Link>
          <h2>Welcome Back</h2>
          <p>Login to your account to connect with astrologers</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                required
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="astro-flex-between" style={{ marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotStep(1);
                  setForgotModalOpen(true);
                }}
                className="auth-forgot-link"
              >
                Forgot Password?
              </button>
            </div>
            <div className="auth-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input auth-password-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary auth-submit-btn"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer-text">
          Don't have an account? <Link to="/register">Sign up as Seeker</Link>
          <div className="auth-footer-expert-link">
            Are you an astrologer? <Link to="/expert/signup">Register as Expert</Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal (For both Customers & Experts) */}
      {forgotModalOpen && (
        <div className="auth-modal-backdrop">
          <div className="auth-modal-dialog">
            <button
              onClick={() => setForgotModalOpen(false)}
              className="auth-modal-close-btn"
            >
              <IoClose style={{ fontSize: '20px' }} />
            </button>

            <div className="auth-modal-header">
              <div className="auth-modal-icon-wrap">
                <IoKeyOutline />
              </div>
              <h3 className="auth-modal-title">Reset Password</h3>
              <p className="auth-modal-desc">
                {forgotStep === 1
                  ? 'Enter your registered email (Seeker or Expert) to receive a 6-digit verification code.'
                  : `Enter the code sent to ${forgotEmail} and choose a new password.`}
              </p>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleSendResetOtp}>
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Registered Email</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn-primary auth-submit-btn"
                >
                  {forgotLoading ? 'Sending OTP...' : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">6-Digit OTP Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="form-input auth-otp-input"
                    placeholder="Enter OTP"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">New Password</label>
                  <div className="auth-password-wrapper">
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      className="form-input auth-password-input"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle-btn"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      aria-label={showForgotNewPassword ? 'Hide password' : 'Show password'}
                      title={showForgotNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showForgotNewPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Confirm New Password</label>
                  <div className="auth-password-wrapper">
                    <input
                      type={showForgotConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      className="form-input auth-password-input"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle-btn"
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      aria-label={showForgotConfirmPassword ? 'Hide password' : 'Show password'}
                      title={showForgotConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showForgotConfirmPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
                    </button>
                  </div>
                </div>

                <div className="auth-modal-btn-row">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="btn-secondary auth-btn-back"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn-primary auth-btn-confirm"
                  >
                    {forgotLoading ? 'Resetting...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

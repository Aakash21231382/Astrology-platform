import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, uploadService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import LogoImg from '../assets/images/logo.png';
import '../assets/css/expert-signup.css';

// React Icons
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiBriefcase,
  FiCalendar,
  FiPhone,
  FiMapPin,
  FiCamera,
  FiArrowLeft,
  FiArrowRight,
  FiGlobe
} from 'react-icons/fi';

export default function ExpertSignup() {
  const [formData, setFormData] = useState({
    email: '',
    userName: '',
    password: '',
    firstName: '',
    lastName: '',
    title: '',
    dob: '',
    gender: 'Male',
    address: '',
    city: '',
    state: '',
    telephone: '',
    country: 'India',
    zipCode: '',
    fax: '',
    avatarUrl: '',
    agreeToTerms: false
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB.');
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);

    try {
      const uploadedUrl = await uploadService.uploadFile(file);
      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, avatarUrl: uploadedUrl }));
        toast.success('Profile photo uploaded successfully!');
      } else {
        throw new Error('No URL returned');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }
    if (!formData.userName.trim()) {
      toast.error('Please enter your username / screen name.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    if (!formData.firstName.trim()) {
      toast.error('Please enter your first name.');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Please enter your title / specialization.');
      return;
    }
    if (!formData.telephone.trim()) {
      toast.error('Please enter your phone number.');
      return;
    }
    if (!formData.agreeToTerms) {
      toast.error('You must agree to the Terms and Conditions.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.registerExpert(formData);
      loginUser(res.data.data);
      toast.success('Registration submitted! Awaiting Admin verification.');
      navigate('/expert/verification-pending');
    } catch (err) {
      console.error('Expert registration error:', err);
      toast.error(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="expert-signup-page">
      <div className="expert-signup-container">
        
        {/* Top Navigation */}
        <div className="expert-signup-nav">
          <Link to="/" className="signup-back-link">
            <FiArrowLeft /> Back to Home
          </Link>
        </div>

        {/* Clean Header */}
        <div className="expert-signup-header">
          <Link to="/" title="VVIP Psychics Home">
            <div className="signup-logo-wrapper">
              <img src={LogoImg} alt="VVIP Psychics Expert" className="signup-logo-img" />
            </div>
          </Link>
          <h1 className="expert-signup-title">EXPERT REGISTRATION</h1>
          <p className="expert-signup-desc">
            Please enter your registration details to apply as an expert reader.
          </p>
        </div>

        {/* Clean Modern Form Card */}
        <div className="expert-signup-card">
          <form onSubmit={handleSubmit} noValidate>
            
            {/* Profile Photo Uploader */}
            <div className="expert-avatar-upload-section">
              <div 
                className="avatar-preview-wrapper"
                onClick={() => fileInputRef.current?.click()}
                title="Click to choose a photo"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="avatar-preview-img" />
                ) : (
                  <div className="avatar-placeholder-circle">
                    <FiUser />
                  </div>
                )}
                <div className="avatar-camera-badge">
                  <FiCamera />
                </div>
              </div>

              <div className="avatar-upload-info">
                <div className="avatar-upload-title">Profile Photo (Optional)</div>
                <div className="avatar-upload-sub">
                  Upload a clear portrait photo (JPG or PNG, max 5MB).
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="avatar-choose-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  <FiCamera />
                  {uploadingImage ? 'Uploading...' : imagePreview ? 'Change Photo' : 'Choose Photo'}
                </button>
              </div>
            </div>

            {/* Name Details */}
            <div className="signup-grid-2">
              <div className="signup-form-group">
                <label className="signup-input-label">
                  First Name <span className="required-star">*</span>
                </label>
                <div className="signup-input-wrapper">
                  <FiUser className="signup-input-icon" />
                  <input
                    type="text"
                    name="firstName"
                    required
                    placeholder="Enter First Name"
                    className="signup-text-input"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="signup-form-group">
                <label className="signup-input-label">Last Name</label>
                <div className="signup-input-wrapper">
                  <FiUser className="signup-input-icon" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Enter Last Name"
                    className="signup-text-input"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Email & Username */}
            <div className="signup-grid-2">
              <div className="signup-form-group">
                <label className="signup-input-label">
                  Email Address <span className="required-star">*</span>
                </label>
                <div className="signup-input-wrapper">
                  <FiMail className="signup-input-icon" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Enter email address"
                    className="signup-text-input"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="signup-form-group">
                <label className="signup-input-label">
                  UserName / Screen Name <span className="required-star">*</span>
                </label>
                <div className="signup-input-wrapper">
                  <FiUser className="signup-input-icon" />
                  <input
                    type="text"
                    name="userName"
                    required
                    placeholder="Enter username"
                    className="signup-text-input"
                    value={formData.userName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Password & Title */}
            <div className="signup-grid-2">
              <div className="signup-form-group">
                <label className="signup-input-label">
                  Password <span className="required-star">*</span>
                </label>
                <div className="signup-input-wrapper">
                  <FiLock className="signup-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="Enter password (min 6 chars)"
                    className="signup-text-input"
                    value={formData.password}
                    onChange={handleInputChange}
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="signup-form-group">
                <label className="signup-input-label">
                  Title / Specialization <span className="required-star">*</span>
                </label>
                <div className="signup-input-wrapper">
                  <FiBriefcase className="signup-input-icon" />
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g. Vedic Astrologer & Tarot Reader"
                    className="signup-text-input"
                    value={formData.title}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* DOB & Gender */}
            <div className="signup-grid-2">
              <div className="signup-form-group">
                <label className="signup-input-label">Date of Birth</label>
                <div className="signup-input-wrapper">
                  <FiCalendar className="signup-input-icon" />
                  <input
                    type="date"
                    name="dob"
                    className="signup-text-input"
                    value={formData.dob}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="signup-form-group">
                <label className="signup-input-label">Gender</label>
                <div className="signup-input-wrapper">
                  <select
                    name="gender"
                    className="signup-select-input"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Telephone & Country */}
            <div className="signup-grid-2">
              <div className="signup-form-group">
                <label className="signup-input-label">
                  Telephone / Mobile <span className="required-star">*</span>
                </label>
                <div className="signup-input-wrapper">
                  <FiPhone className="signup-input-icon" />
                  <input
                    type="tel"
                    name="telephone"
                    required
                    placeholder="Enter phone number"
                    className="signup-text-input"
                    value={formData.telephone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="signup-form-group">
                <label className="signup-input-label">Country</label>
                <div className="signup-input-wrapper">
                  <FiGlobe className="signup-input-icon" />
                  <select
                    name="country"
                    className="signup-select-input"
                    value={formData.country}
                    onChange={handleInputChange}
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Germany">Germany</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="signup-grid-1">
              <div className="signup-form-group">
                <label className="signup-input-label">Address</label>
                <div className="signup-input-wrapper">
                  <FiMapPin className="signup-input-icon" />
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter address"
                    className="signup-text-input"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* City & State */}
            <div className="signup-grid-2">
              <div className="signup-form-group">
                <label className="signup-input-label">City</label>
                <div className="signup-input-wrapper">
                  <FiMapPin className="signup-input-icon" />
                  <input
                    type="text"
                    name="city"
                    placeholder="Enter city"
                    className="signup-text-input"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="signup-form-group">
                <label className="signup-input-label">State</label>
                <div className="signup-input-wrapper">
                  <FiMapPin className="signup-input-icon" />
                  <input
                    type="text"
                    name="state"
                    placeholder="Enter state"
                    className="signup-text-input"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Zip & Fax */}
            <div className="signup-grid-2">
              <div className="signup-form-group">
                <label className="signup-input-label">ZipCode</label>
                <div className="signup-input-wrapper">
                  <FiMapPin className="signup-input-icon" />
                  <input
                    type="text"
                    name="zipCode"
                    placeholder="Enter Zip Code"
                    className="signup-text-input"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="signup-form-group">
                <label className="signup-input-label">Fax (Optional)</label>
                <div className="signup-input-wrapper">
                  <FiPhone className="signup-input-icon" />
                  <input
                    type="text"
                    name="fax"
                    placeholder="Enter Fax"
                    className="signup-text-input"
                    value={formData.fax}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="terms-agreement-card">
              <input
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
              />
              <label htmlFor="agreeToTerms" className="terms-text-label">
                I have read and agree to the <Link to="/terms" target="_blank">Terms and Conditions</Link>.
              </label>
            </div>

            {/* Submit Action */}
            <div className="signup-actions-bar">
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="expert-submit-btn-modern"
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Registration</span>
                    <FiArrowRight className="btn-arrow-icon" />
                  </>
                )}
              </button>
            </div>

            {/* Bottom Login Prompt inside the form */}
            <div className="signup-form-footer">
              <span>Already have an account?</span>
              <Link to="/login" className="signup-login-link">Login here</Link>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

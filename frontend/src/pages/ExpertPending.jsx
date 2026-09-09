import React from 'react';
import { Link } from 'react-router-dom';
import { IoHourglassOutline, IoShieldCheckmarkOutline, IoCallOutline } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';

export default function ExpertPending() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', background: '#f8fafc' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', maxWidth: '540px', width: '100%', padding: '45px 35px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', fontSize: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <IoHourglassOutline />
        </div>

        <h1 style={{ fontSize: '26px', fontFamily: 'var(--font-heading)', color: '#130a2a', marginBottom: '12px' }}>
          Application Under Verification
        </h1>

        <p style={{ color: '#475569', fontSize: '15px', lineHeight: 1.6, marginBottom: '25px' }}>
          Hello <strong>{user?.fullName || user?.userName}</strong>, your expert application has been received and is currently under review by our spiritual audit team.
        </p>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', textAlign: 'left', marginBottom: '30px' }}>
          <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b', marginBottom: '8px' }}>
            Verification Checklist:
          </div>
          <ul style={{ listStyle: 'none', fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>✓ Profile details & bio received</li>
            <li>✓ ID Proof & photo verification in progress</li>
            <li>✓ Admin manual background verification</li>
          </ul>
        </div>

        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '25px' }}>
          Approvals are typically processed within 2 to 6 business hours. Once approved, you will be able to go Online and accept live consultations.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to="/" className="btn-outline">
            Return to Homepage
          </Link>
          <a href="mailto:support@astrology.com" className="btn-primary">
            <IoCallOutline /> Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

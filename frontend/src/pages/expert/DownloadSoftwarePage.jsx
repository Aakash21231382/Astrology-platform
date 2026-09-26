import React from 'react';
import { IoDownloadOutline, IoDesktopOutline, IoPhonePortraitOutline, IoBookOutline } from 'react-icons/io5';

export default function DownloadSoftwarePage() {
  const downloadItems = [
    {
      title: 'Astrology Companion Desktop App',
      category: 'Desktop Software (Windows / Mac)',
      desc: 'Instant sound alerts for incoming consultations, background desktop notifications, and rapid Vedic Kundali calculator.',
      version: 'v2.4.1 (Stable)',
      size: '42 MB',
      icon: <IoDesktopOutline style={{ fontSize: '32px', color: '#FF6B00' }} />
    },
    {
      title: 'Astrologer Mobile Companion APK',
      category: 'Android App',
      desc: 'Answer seeker live chat consultations on the go from your Android smartphone with instant vibration and ring alerts.',
      version: 'v1.8.0',
      size: '18 MB',
      icon: <IoPhonePortraitOutline style={{ fontSize: '32px', color: '#FF6B00' }} />
    },
    {
      title: 'Consultation Ethics & Guidelines Manual',
      category: 'Official Documentation (PDF)',
      desc: 'Standard code of conduct, Vedic astrological consultation ethics, remedy guidelines, and privacy regulations.',
      version: '2026 Edition',
      size: '3.5 MB',
      icon: <IoBookOutline style={{ fontSize: '32px', color: '#800000' }} />
    }
  ];

  const handleDownload = (title) => {
    alert(`Downloading ${title}... Download starting.`);
  };

  return (
    <div className="expert-content-container">
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoDownloadOutline style={{ color: '#800000', fontSize: '24px' }} />
              Download Astrologer Software & Tools
            </h2>
            <p className="expert-card-desc">
              Essential desktop tools, mobile client applications, and official astrological practice handbooks.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '22px', marginTop: '16px' }}>
          {downloadItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(128, 0, 0, 0.04)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div style={{ background: '#fffef9', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#476115', background: '#f2f8ed', padding: '4px 10px', borderRadius: '10px', border: '1px solid #c9e2b3' }}>
                    {item.version}
                  </span>
                </div>

                <div style={{ fontSize: '11px', fontWeight: 700, color: '#7a6b58', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.04em' }}>
                  {item.category}
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#800000', margin: '0 0 8px 0' }}>
                  {item.title}
                </h3>

                <p style={{ fontSize: '13px', color: '#4a3b32', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  {item.desc}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '12px', color: '#7a6b58', fontWeight: 600 }}>Size: {item.size}</span>
                <button
                  type="button"
                  onClick={() => handleDownload(item.title)}
                  className="btn-expert-primary"
                  style={{ padding: '8px 18px', fontSize: '13px' }}
                >
                  <IoDownloadOutline /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

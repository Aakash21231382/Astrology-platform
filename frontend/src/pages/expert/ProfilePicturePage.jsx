import React, { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { IoCameraOutline, IoCloudUploadOutline, IoCheckmarkCircle } from 'react-icons/io5';
import { uploadService, expertService } from '../../services/api';
import { toast } from 'react-toastify';

export default function ProfilePicturePage() {
  const { profile, setProfile, refreshProfile } = useOutletContext();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(profile?.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB.');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadService.uploadFile(file);
      const url = typeof res === 'string' ? res : (res?.url || res?.data?.url || res?.data?.data?.url);
      if (url) {
        setPreview(url);
        toast.success('Photo uploaded to cloud! Click "Save as Profile Picture" below.');
      }
    } catch (err) {
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) {
      toast.error('Please select or upload a photo first.');
      return;
    }

    setSaving(true);
    try {
      await expertService.updateProfile({
        ...profile,
        avatarUrl: preview
      });
      setProfile(prev => ({ ...prev, avatarUrl: preview }));
      toast.success('Profile picture updated successfully!');
      if (refreshProfile) refreshProfile();
    } catch (err) {
      toast.error('Failed to save profile picture.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="expert-content-container">
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoCameraOutline style={{ color: '#800000', fontSize: '24px' }} />
              Change Profile Picture
            </h2>
            <p className="expert-card-desc">
              Upload a clear, high-resolution portrait to build trust and connection with seekers.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginTop: '16px', alignItems: 'center' }}>
          
          {/* Left Column: Avatar Studio */}
          <div style={{ textAlign: 'center', padding: '28px', background: '#fffef9', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
            <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto 20px auto' }}>
              <img
                src={preview || profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                alt="Profile Preview"
                style={{
                  width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
                  border: '4px solid #FF6B00', boxShadow: '0 8px 24px rgba(107, 142, 35, 0.2)'
                }}
              />
              {uploading && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(74, 59, 50, 0.75)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#ffffff',
                  fontSize: '13px', fontWeight: 700
                }}>
                  Uploading...
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="btn-expert-secondary"
              >
                <IoCloudUploadOutline style={{ fontSize: '18px' }} />
                {uploading ? 'Uploading...' : 'Choose Image File'}
              </button>

              <button
                type="button"
                disabled={saving || uploading || preview === profile?.avatarUrl}
                onClick={handleSave}
                className="btn-expert-primary"
              >
                <IoCheckmarkCircle style={{ fontSize: '18px' }} />
                {saving ? 'Saving...' : 'Save as Profile Picture'}
              </button>
            </div>

            <div style={{ marginTop: '16px', fontSize: '12px', color: '#7a6b58' }}>
              Recommended: Square JPG or PNG format, minimum 400x400 pixels, up to 5MB.
            </div>
          </div>

          {/* Right Column: Photo Best Practice Guidelines */}
          <div>
            <div style={{ background: '#ffffff', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '24px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#800000', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IoCameraOutline style={{ color: '#FF6B00', fontSize: '20px' }} />
                Portrait & Photo Guidelines
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#4a3b32', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', marginTop: '7px', flexShrink: 0 }}></span>
                  <span><strong>Clear Face & Natural Lighting:</strong> Astrologers with bright, professional, high-resolution headshots receive significantly higher consultation inquiries.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', marginTop: '7px', flexShrink: 0 }}></span>
                  <span><strong>Traditional or Formal Attire:</strong> Culturally appropriate or professional clothing fosters authenticity and seeker trust.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', marginTop: '7px', flexShrink: 0 }}></span>
                  <span><strong>No Watermarks or Logos:</strong> Avoid third-party branding, text overlays, or blurry smartphone screenshots.</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6B00', marginTop: '7px', flexShrink: 0 }}></span>
                  <span><strong>Live Sync:</strong> Your saved picture updates across all seeker discovery pages, chat windows, and reviews within seconds.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

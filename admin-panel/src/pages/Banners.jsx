import React, { useState, useEffect } from 'react';
import { adminApi, uploadFile } from '../services/api';
import { toast } from 'react-toastify';
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdCloudUpload,
  MdClose,
  MdImage,
  MdVisibility,
  MdChevronLeft,
  MdChevronRight,
  MdCheckCircle
} from 'react-icons/md';
import ExportDropdown from '../components/ExportDropdown';
import '../assets/css/admin-tables.css';
import '../assets/css/admin-modals.css';

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewModalImage, setPreviewModalImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activePreviewSlide, setActivePreviewSlide] = useState(0);

  const initialForm = {
    id: null,
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaText: 'Consult Now',
    ctaUrl: '/experts',
    targetPlacement: 'HOMEPAGE',
    isActive: true,
    sortOrder: 0
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBanners();
      setBanners(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  // Auto-slide live preview in Admin
  useEffect(() => {
    const activeBanners = banners.filter((b) => b.isActive);
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActivePreviewSlide((prev) => (prev + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadedUrl = await uploadFile(file);
      setForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      toast.success('Banner image uploaded to remote storage!');
    } catch (err) {
      toast.error('Image upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.imageUrl) {
      toast.error('Please upload a banner image');
      return;
    }

    try {
      await adminApi.upsertBanner(form);
      toast.success('Banner saved successfully');
      setModalOpen(false);
      setForm(initialForm);
      fetchBanners();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save banner');
    }
  };

  const handleDelete = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await adminApi.deleteBanner(bannerId);
      toast.success('Banner deleted');
      fetchBanners();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete banner');
    }
  };

  const activeBanners = banners.filter((b) => b.isActive);
  const currentPreviewBanner = activeBanners[activePreviewSlide] || activeBanners[0];

  return (
    <div className="banners-page">
      {/* Subpage Stat Banner */}
      <div className="subpage-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon">
            <MdImage />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Banners</span>
            <span className="subpage-stat-value">{banners.length}</span>
          </div>
        </div>
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon">
            <MdCheckCircle />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Live on Website</span>
            <span className="subpage-stat-value" style={{ color: '#EA580C' }}>{activeBanners.length}</span>
          </div>
        </div>
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon">
            <MdVisibility />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Active Slider Placement</span>
            <span className="subpage-stat-value">Homepage</span>
          </div>
        </div>
      </div>

      {/* Live Carousel Showcase on Admin Panel (Compact & Responsive) */}
      {activeBanners.length > 0 && (
        <div className="table-container banner-preview-card" style={{ padding: '18px 24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#0F172A', fontWeight: 800, margin: 0 }}>
                  Live Homepage Banner Slider Preview
                </h3>
                <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
                  Slide {activePreviewSlide + 1} of {activeBanners.length}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '3px 0 0' }}>
                How banners currently look and rotate on the user-facing website
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                className="btn-icon"
                title="Previous Slide"
                onClick={() =>
                  setActivePreviewSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)
                }
              >
                <MdChevronLeft />
              </button>
              <button
                type="button"
                className="btn-icon"
                title="Next Slide"
                onClick={() => setActivePreviewSlide((prev) => (prev + 1) % activeBanners.length)}
              >
                <MdChevronRight />
              </button>
            </div>
          </div>

          <div
            className="banner-preview-box"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '780px',
              height: '200px',
              maxHeight: '220px',
              margin: '0 auto',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: '#0f172a',
              boxShadow: '0 6px 20px -3px rgba(0, 0, 0, 0.2)',
              border: '1.5px solid #E2E8F0'
            }}
          >
            {currentPreviewBanner && (
              <>
                <img
                  src={currentPreviewBanner.imageUrl}
                  alt={currentPreviewBanner.title || 'Banner'}
                  className="banner-preview-img"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block'
                  }}
                />

                {currentPreviewBanner.title ? (
                  <div
                    className="banner-preview-overlay"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.45) 55%, transparent 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      padding: '18px 28px',
                      color: '#ffffff'
                    }}
                  >
                    <span className="badge badge-purple" style={{ alignSelf: 'flex-start', marginBottom: 6, fontSize: '11px', padding: '2px 8px' }}>
                      TEXT OVERLAY MODE
                    </span>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px', color: '#ffffff', textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)' }}>
                      {currentPreviewBanner.title}
                    </h2>
                    {currentPreviewBanner.subtitle && (
                      <p style={{ fontSize: '0.82rem', margin: '0 0 10px', color: '#E2E8F0', maxWidth: '440px', lineHeight: 1.4 }}>
                        {currentPreviewBanner.subtitle}
                      </p>
                    )}
                    {currentPreviewBanner.ctaText && (
                      <div style={{ alignSelf: 'flex-start' }}>
                        <span className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px' }}>
                          {currentPreviewBanner.ctaText}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      right: 12,
                      background: 'rgba(0,0,0,0.75)',
                      color: '#34d399',
                      padding: '3px 9px',
                      borderRadius: 16,
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    Full Artwork Banner (No Text Overlay)
                  </div>
                )}

                {/* Dot Pagination */}
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '6px',
                  background: 'rgba(0,0,0,0.45)',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  backdropFilter: 'blur(4px)',
                  zIndex: 2
                }}>
                  {activeBanners.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePreviewSlide(idx)}
                      style={{
                        width: idx === activePreviewSlide ? '16px' : '6px',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: idx === activePreviewSlide ? '#F97316' : 'rgba(255,255,255,0.5)',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="table-container">
        <div className="table-toolbar">
          <h2 style={{ fontSize: '1.1rem', color: '#0F172A', fontWeight: 700 }}>All Promotional Banners ({banners.length})</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExportDropdown
              data={banners.map((b) => ({
                'Banner ID': `#${b.id}`,
                'Title': b.title || 'Full Artwork Image',
                'Subtitle': b.subtitle || 'N/A',
                'Placement': b.targetPlacement || 'HOMEPAGE',
                'CTA Text': b.ctaText || 'N/A',
                'CTA URL': b.ctaUrl || 'N/A',
                'Display Order': b.sortOrder || 0,
                'Status': b.isActive ? 'Active' : 'Inactive',
                'Image URL': b.imageUrl
              }))}
              fileName="Aakash_Promotional_Banners"
              sheetName="Banners"
              title="Promotional Banners List"
              subtitle={`Total Banners: ${banners.length} | Active Live: ${activeBanners.length}`}
            />
            <button
              className="btn-primary"
              onClick={() => {
                setForm(initialForm);
                setModalOpen(true);
              }}
            >
              <MdAdd /> Add New Banner
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#64748B', padding: 40, textAlign: 'center', fontWeight: 500 }}>Loading banners...</div>
        ) : banners.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><MdImage /></div>
            <h3>No Banners Created</h3>
            <p>Upload your first hero slider or promotion banner.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
            <thead>
              <tr>
                <th>Banner Preview</th>
                <th>Type & Display Content</th>
                <th>Placement</th>
                <th>CTA Link</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id}>
                  <td style={{ width: 170 }}>
                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setPreviewModalImage(b.imageUrl)}>
                      <img
                        src={b.imageUrl}
                        alt={b.title || 'Banner'}
                        style={{ width: 140, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--admin-border)' }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 4,
                          right: 6,
                          background: 'rgba(0,0,0,0.75)',
                          color: '#fff',
                          borderRadius: '4px',
                          padding: '2px 4px',
                          fontSize: '11px'
                        }}
                      >
                        <MdVisibility />
                      </div>
                    </div>
                  </td>

                  <td>
                    {b.title ? (
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{b.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{b.subtitle || 'No subtitle'}</div>
                        <span className="badge badge-purple" style={{ marginTop: 4 }}>TEXT OVERLAY</span>
                      </div>
                    ) : (
                      <div>
                        <span className="badge badge-success" style={{ fontWeight: 600 }}>
                          FULL IMAGE (NO TEXT)
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 3 }}>
                          Banner displays clean graphic artwork full-width
                        </div>
                      </div>
                    )}
                  </td>

                  <td>
                    <span className="badge badge-info">{b.targetPlacement || 'HOMEPAGE'}</span>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.84rem', color: 'var(--admin-primary)', fontWeight: 500 }}>{b.ctaText || 'Full banner clickable'}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{b.ctaUrl || '/experts'}</div>
                  </td>

                  <td>
                    <span className={`badge ${b.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>

                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-icon"
                        title="Edit Banner"
                        onClick={() => {
                          setForm(b);
                          setModalOpen(true);
                        }}
                      >
                        <MdEdit />
                      </button>

                      <button
                        className="btn-icon reject"
                        title="Delete Banner"
                        onClick={() => handleDelete(b.id)}
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full Image Preview Lightbox */}
      {previewModalImage && (
        <div className="modal-overlay" onClick={() => setPreviewModalImage(null)}>
          <div style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              className="btn-icon"
              style={{ position: 'absolute', top: 10, right: 10, background: '#000', color: '#fff' }}
              onClick={() => setPreviewModalImage(null)}
            >
              <MdClose />
            </button>
            <img
              src={previewModalImage}
              alt="Full View"
              style={{ width: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8, border: '1px solid var(--admin-border)' }}
            />
          </div>
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{form.id ? 'Edit Banner' : 'Create New Banner'}</h3>
              <button className="btn-icon" onClick={() => setModalOpen(false)}>
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Image Upload Box */}
                <div className="form-group">
                  <label>Banner Image (Uploaded to Remote Storage) *</label>
                  <label className="image-upload-box">
                    <MdCloudUpload style={{ fontSize: '2rem', color: 'var(--admin-primary)' }} />
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      {uploading ? 'Uploading to remote storage container...' : 'Click to browse & upload banner artwork'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                  {form.imageUrl && (
                    <div style={{ textAlign: 'center' }}>
                      <img src={form.imageUrl} alt="Preview" className="preview-thumb" />
                      <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: 4, wordBreak: 'break-all' }}>
                        {form.imageUrl}
                      </div>
                    </div>
                  )}
                </div>

                {/* Helpful Banner Mode Notice */}
                <div
                  style={{
                    background: 'rgba(255, 215, 0, 0.05)',
                    border: '1px dashed rgba(255, 215, 0, 0.3)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    color: '#e2e8f0'
                  }}
                >
                  💡 <strong>Tip:</strong> Agar aapki image mein pehle se text/offer likha hua hai, toh niche diye gaye <strong>Title</strong> aur <strong>Subtitle</strong> ko khali chhod dein. Tab website par sirf <strong>Full-Width Image</strong> bina kisi text ke dikhegi!
                </div>

                <div className="form-group">
                  <label>Banner Title (Optional - Leave empty for pure image banner)</label>
                  <input
                    type="text"
                    value={form.title || ''}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Enter banner title"
                  />
                </div>

                <div className="form-group">
                  <label>Subtitle (Optional)</label>
                  <input
                    type="text"
                    value={form.subtitle || ''}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="Enter subtitle"
                  />
                </div>

                <div className="detail-grid">
                  <div className="form-group">
                    <label>CTA Button Text (Optional)</label>
                    <input
                      type="text"
                      value={form.ctaText || ''}
                      onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                      placeholder="Enter button text"
                    />
                  </div>

                  <div className="form-group">
                    <label>Target Click URL</label>
                    <input
                      type="text"
                      value={form.ctaUrl || ''}
                      onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                      placeholder="Enter target URL"
                    />
                  </div>
                </div>

                <div className="detail-grid">
                  <div className="form-group">
                    <label>Display Placement</label>
                    <select
                      value={form.targetPlacement}
                      onChange={(e) => setForm({ ...form, targetPlacement: e.target.value })}
                    >
                      <option value="HOMEPAGE">Homepage Hero Slider</option>
                      <option value="MARKETPLACE">Marketplace Top Banner</option>
                      <option value="POPUP">Promotional Popup</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Sort Order</label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={Boolean(form.isActive)}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    <span className="slider"></span>
                  </label>
                  <span style={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: 600 }}>Banner is Active and Visible in Slider</span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={uploading}>
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

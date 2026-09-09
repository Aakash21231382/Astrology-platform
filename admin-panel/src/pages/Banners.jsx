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
      {/* Live Carousel Showcase on Admin Panel */}
      {activeBanners.length > 0 && (
        <div className="table-container banner-preview-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Live Homepage Banner Slider Preview</h3>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                How banners currently look and automatically rotate on the user-facing website
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-icon"
                onClick={() =>
                  setActivePreviewSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)
                }
              >
                <MdChevronLeft />
              </button>
              <button
                className="btn-icon"
                onClick={() => setActivePreviewSlide((prev) => (prev + 1) % activeBanners.length)}
              >
                <MdChevronRight />
              </button>
            </div>
          </div>

          <div className="banner-preview-box">
            {currentPreviewBanner && (
              <>
                <img
                  src={currentPreviewBanner.imageUrl}
                  alt={currentPreviewBanner.title || 'Banner'}
                  className="banner-preview-img"
                />

                {currentPreviewBanner.title ? (
                  <div className="banner-preview-overlay">
                    <span className="badge badge-purple" style={{ alignSelf: 'flex-start', marginBottom: 10 }}>
                      TEXT OVERLAY MODE
                    </span>
                    <h2>
                      {currentPreviewBanner.title}
                    </h2>
                    {currentPreviewBanner.subtitle && (
                      <p>
                        {currentPreviewBanner.subtitle}
                      </p>
                    )}
                    {currentPreviewBanner.ctaText && (
                      <div style={{ alignSelf: 'flex-start' }}>
                        <span className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.86rem' }}>
                          {currentPreviewBanner.ctaText}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      right: 14,
                      background: 'rgba(0,0,0,0.7)',
                      color: '#34d399',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      backdropFilter: 'blur(6px)'
                    }}
                  >
                    Full Image Banner (No Text Overlay)
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="table-container">
        <div className="table-toolbar">
          <h2 style={{ fontSize: '1.1rem', color: '#fff' }}>All Promotional Banners ({banners.length})</h2>
          <button
            className="btn-primary"
            onClick={() => {
              setForm(initialForm);
              setModalOpen(true);
            }}
          >
            <MdAdd />
            <span>Add New Banner</span>
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#fff', padding: 40, textAlign: 'center' }}>Loading banners...</div>
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
                    placeholder="Leave empty if banner already contains text"
                  />
                </div>

                <div className="form-group">
                  <label>Subtitle (Optional)</label>
                  <input
                    type="text"
                    value={form.subtitle || ''}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="Optional description / subtext"
                  />
                </div>

                <div className="detail-grid">
                  <div className="form-group">
                    <label>CTA Button Text (Optional)</label>
                    <input
                      type="text"
                      value={form.ctaText || ''}
                      onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                      placeholder="e.g. Consult Now / View Offers"
                    />
                  </div>

                  <div className="form-group">
                    <label>Target Click URL</label>
                    <input
                      type="text"
                      value={form.ctaUrl || ''}
                      onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                      placeholder="/experts or /offers"
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
                  <span style={{ fontSize: '0.88rem', color: '#fff' }}>Banner is Active and Visible in Slider</span>
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

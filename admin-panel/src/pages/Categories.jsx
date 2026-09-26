import React, { useState, useEffect } from 'react';
import { adminApi, uploadFile } from '../services/api';
import { toast } from 'react-toastify';
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdCloudUpload,
  MdClose,
  MdCategory
} from 'react-icons/md';
import '../assets/css/admin-tables.css';
import '../assets/css/admin-modals.css';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initialForm = {
    id: null,
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    isActive: true,
    sortOrder: 0
  };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getCategories();
      setCategories(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (name) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setForm((prev) => ({ ...prev, name, slug: prev.id ? prev.slug : slug }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadedUrl = await uploadFile(file);
      setForm((prev) => ({ ...prev, imageUrl: uploadedUrl }));
      toast.success('Category icon uploaded!');
    } catch (err) {
      toast.error('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.upsertCategory(form);
      toast.success('Category saved successfully');
      setModalOpen(false);
      setForm(initialForm);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (category) => {
    const catName = category.name || 'this category';
    if (!window.confirm(`⚠️ Are you sure you want to permanently delete category "${catName}"?\n\nThis will remove it from the consultation marketplace and unassign it from any registered experts.`)) {
      return;
    }

    try {
      await adminApi.deleteCategory(category.id);
      toast.success(`Category "${catName}" deleted successfully`);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const activeCategoriesCount = categories.filter(c => c.isActive).length;

  const handleOpenAdd = () => {
    setForm(initialForm);
    setModalOpen(true);
  };

  return (
    <div className="categories-page">
      {/* Subpage Stat Banner */}
      <div className="subpage-stats-grid" style={{ marginBottom: '20px' }}>
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon">
            <MdCategory />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Categories</span>
            <span className="subpage-stat-value">{categories.length}</span>
          </div>
        </div>
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon">
            <MdCategory />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Active on Platform</span>
            <span className="subpage-stat-value" style={{ color: '#EA580C' }}>{activeCategoriesCount}</span>
          </div>
        </div>
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon">
            <MdCategory />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Disabled</span>
            <span className="subpage-stat-value">{categories.length - activeCategoriesCount}</span>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div>
            <h2 style={{ fontSize: '1.1rem', color: '#0F172A', fontWeight: 700 }}>Service & Astrology Categories</h2>
            <p style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Define domains of expertise like Vedic Astrology, Tarot Reading, Numerology, etc.
            </p>
          </div>
          <button className="btn-primary" onClick={handleOpenAdd}>
            <MdAdd /> Add Category
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#64748B', padding: 40, textAlign: 'center', fontWeight: 500 }}>Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><MdCategory /></div>
            <h3>No Categories Configured</h3>
            <p>Add Vedic Astrology, Tarot, Numerology, etc.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
            <thead>
              <tr>
                <th>Category Icon</th>
                <th>Name & Description</th>
                <th>Slug (URL key)</th>
                <th>Order</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td style={{ width: 80 }}>
                    <img
                      src={c.imageUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150'}
                      alt={c.name}
                      style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--admin-border)' }}
                    />
                  </td>

                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{c.description || 'No description'}</div>
                  </td>

                  <td>
                    <span className="badge badge-orange">/{c.slug}</span>
                  </td>

                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.sortOrder || 0}</td>

                  <td>
                    <span className={`badge ${c.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>

                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-icon"
                        title="Edit Category"
                        onClick={() => {
                          setForm(c);
                          setModalOpen(true);
                        }}
                      >
                        <MdEdit />
                      </button>
                      <button
                        className="btn-icon reject"
                        title={`Delete ${c.name}`}
                        onClick={() => handleDeleteCategory(c)}
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

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>{form.id ? 'Edit Category' : 'Create Category'}</h3>
              <button className="btn-icon" onClick={() => setModalOpen(false)}>
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Category Icon / Image</label>
                  <label className="image-upload-box">
                    <MdCloudUpload style={{ fontSize: '1.8rem', color: 'var(--admin-primary)' }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {uploading ? 'Uploading image...' : 'Click to upload category icon'}
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
                      <img src={form.imageUrl} alt="Preview" className="preview-thumb" style={{ maxHeight: 100 }} />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>URL Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="Enter slug"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Short Description</label>
                  <textarea
                    rows="3"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Enter category description"
                  />
                </div>

                <div className="detail-grid">
                  <div className="form-group">
                    <label>Sort Order</label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={Boolean(form.isActive)}
                        onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </label>
                    <span style={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: 600 }}>Active</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={uploading}>
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

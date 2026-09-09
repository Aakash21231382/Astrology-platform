import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import { MdSave, MdArticle, MdSettings } from 'react-icons/md';
import '../assets/css/admin-modals.css';

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commission, setCommission] = useState('20.00');
  const [supportEmail, setSupportEmail] = useState('support@astrology.com');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');

  // CMS state
  const [selectedCmsSlug, setSelectedCmsSlug] = useState('about-us');
  const [cmsData, setCmsData] = useState({ title: '', content: '', metaDescription: '' });
  const [cmsLoading, setCmsLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
    loadCms('about-us');
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSettings();
      const list = res.data?.data || [];
      setSettings(list);

      const comm = list.find((s) => s.key === 'platform_commission_percent');
      if (comm) setCommission(comm.value);

      const email = list.find((s) => s.key === 'support_email');
      if (email) setSupportEmail(email.value);

      const phone = list.find((s) => s.key === 'support_phone');
      if (phone) setSupportPhone(phone.value);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await adminApi.updateSetting('platform_commission_percent', commission, 'Platform revenue share %');
      await adminApi.updateSetting('support_email', supportEmail, 'Platform customer support email');
      await adminApi.updateSetting('support_phone', supportPhone, 'Platform customer support helpline');
      toast.success('Platform global settings updated successfully');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  const loadCms = async (slug) => {
    setSelectedCmsSlug(slug);
    setCmsLoading(true);
    try {
      const res = await adminApi.getCmsPage(slug);
      if (res.data?.data) {
        setCmsData({
          title: res.data.data.title || '',
          content: res.data.data.content || '',
          metaDescription: res.data.data.metaDescription || ''
        });
      }
    } catch (err) {
      // Create template if not found
      setCmsData({
        title: slug.replace('-', ' ').toUpperCase(),
        content: `Default content for ${slug}...`,
        metaDescription: ''
      });
    } finally {
      setCmsLoading(false);
    }
  };

  const handleSaveCms = async (e) => {
    e.preventDefault();
    try {
      await adminApi.upsertCmsPage({
        slug: selectedCmsSlug,
        title: cmsData.title,
        content: cmsData.content,
        metaDescription: cmsData.metaDescription
      });
      toast.success(`CMS Page [${selectedCmsSlug}] published successfully`);
    } catch (err) {
      toast.error('Failed to update CMS page');
    }
  };

  return (
    <div className="settings-page" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Global Configuration */}
      <div className="table-container settings-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <MdSettings style={{ fontSize: '1.4rem', color: 'var(--admin-primary)' }} />
          <h2 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 600 }}>Platform Revenue & Contact Configurations</h2>
        </div>

        <form onSubmit={handleSaveSettings}>
          <div className="detail-grid" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label>Platform Commission Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.74rem', color: '#9ca3af' }}>Current expert deduction share per minute</span>
            </div>

            <div className="form-group">
              <label>Customer Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Helpline Telephone</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">
            <MdSave />
            <span>Save Configuration</span>
          </button>
        </form>
      </div>

      {/* CMS Management */}
      <div className="table-container settings-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <MdArticle style={{ fontSize: '1.4rem', color: 'var(--admin-accent)' }} />
          <h2 style={{ fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: 600 }}>Content Management Pages (CMS)</h2>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {['about-us', 'terms-of-service', 'privacy-policy'].map((slug) => (
            <button
              key={slug}
              type="button"
              className={selectedCmsSlug === slug ? 'btn-primary' : 'btn-secondary'}
              onClick={() => loadCms(slug)}
            >
              {slug === 'about-us' ? 'About Us' : slug === 'terms-of-service' ? 'Terms & Conditions' : 'Privacy Policy'}
            </button>
          ))}
        </div>

        {cmsLoading ? (
          <div style={{ color: '#fff' }}>Loading page content...</div>
        ) : (
          <form onSubmit={handleSaveCms} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Page Title</label>
              <input
                type="text"
                value={cmsData.title}
                onChange={(e) => setCmsData({ ...cmsData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>SEO Meta Description</label>
              <input
                type="text"
                value={cmsData.metaDescription}
                onChange={(e) => setCmsData({ ...cmsData, metaDescription: e.target.value })}
                placeholder="Meta description for search engine ranking"
              />
            </div>

            <div className="form-group">
              <label>Page HTML / Markdown Body Content</label>
              <textarea
                rows="10"
                value={cmsData.content}
                onChange={(e) => setCmsData({ ...cmsData, content: e.target.value })}
                required
              />
            </div>

            <div>
              <button type="submit" className="btn-primary">
                <MdSave />
                <span>Publish Page Updates</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

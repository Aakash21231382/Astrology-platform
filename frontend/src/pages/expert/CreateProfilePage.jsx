import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { IoCreateOutline, IoCheckmarkCircle, IoSaveOutline } from 'react-icons/io5';
import { expertService, publicService } from '../../services/api';
import { toast } from 'react-toastify';

export default function CreateProfilePage() {
  const { profile, setProfile, refreshProfile } = useOutletContext();
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    displayName: '',
    title: '',
    bio: '',
    experienceYears: 5,
    languages: 'English, Hindi',
    pricePerMinute: 20,
    freeMinutes: 0,
    address: '',
    city: '',
    state: '',
    country: 'India',
    zipCode: '',
    categoryIds: []
  });

  useEffect(() => {
    publicService.getCategories()
      .then(res => {
        if (res.data?.data) setCategories(res.data.data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        title: profile.title || '',
        bio: profile.bio || '',
        experienceYears: profile.experienceYears || 0,
        languages: profile.languages || 'English, Hindi',
        pricePerMinute: profile.pricePerMinute || 20,
        freeMinutes: profile.freeMinutes || 0,
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        country: profile.country || 'India',
        zipCode: profile.zipCode || '',
        categoryIds: profile.categories ? profile.categories.map(c => c.id) : []
      });
    }
  }, [profile]);

  const toggleCategory = (catId) => {
    setFormData(prev => {
      const exists = prev.categoryIds.includes(catId);
      const nextIds = exists ? prev.categoryIds.filter(id => id !== catId) : [...prev.categoryIds, catId];
      return { ...prev, categoryIds: nextIds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await expertService.updateProfile(formData);
      if (res.data?.data) {
        setProfile(res.data.data);
      }
      toast.success('Astrologer profile updated successfully!');
      if (refreshProfile) refreshProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile changes.');
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
              <IoCreateOutline style={{ color: '#800000', fontSize: '24px' }} />
              Create & Update Professional Profile
            </h2>
            <p className="expert-card-desc">
              Your professional bio, astrological specialties, consultation charges, and verified locations.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            <div className="expert-input-group">
              <label className="expert-input-label">Public Display Name *</label>
              <input
                type="text"
                required
                className="expert-form-input"
                placeholder="Enter full name"
                value={formData.displayName}
                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>

            <div className="expert-input-group">
              <label className="expert-input-label">Professional Headline / Title *</label>
              <input
                type="text"
                required
                className="expert-form-input"
                placeholder="Enter title or specialization"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="expert-input-group">
              <label className="expert-input-label">Experience (Years) *</label>
              <input
                type="number"
                min="0"
                max="60"
                required
                className="expert-form-input"
                value={formData.experienceYears}
                onChange={e => setFormData({ ...formData, experienceYears: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            <div className="expert-input-group">
              <label className="expert-input-label">Languages Spoken *</label>
              <input
                type="text"
                required
                className="expert-form-input"
                placeholder="Enter languages spoken"
                value={formData.languages}
                onChange={e => setFormData({ ...formData, languages: e.target.value })}
              />
            </div>

            <div className="expert-input-group">
              <label className="expert-input-label">Price Per Minute (₹) *</label>
              <input
                type="number"
                min="5"
                max="1000"
                required
                className="expert-form-input"
                value={formData.pricePerMinute}
                onChange={e => setFormData({ ...formData, pricePerMinute: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="expert-input-group">
              <label className="expert-input-label">Promotional Free Minutes Allowed</label>
              <input
                type="number"
                min="0"
                max="15"
                className="expert-form-input"
                value={formData.freeMinutes}
                onChange={e => setFormData({ ...formData, freeMinutes: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            <div className="expert-input-group">
              <label className="expert-input-label">City</label>
              <input
                type="text"
                className="expert-form-input"
                placeholder="Enter city"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="expert-input-group">
              <label className="expert-input-label">State / Province</label>
              <input
                type="text"
                className="expert-form-input"
                placeholder="Enter state"
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
              />
            </div>

          </div>

          {/* Bio Description */}
          <div className="expert-input-group" style={{ marginTop: '6px' }}>
            <label className="expert-input-label">Professional Biography & Astrological Philosophy *</label>
            <textarea
              rows={4}
              required
              className="expert-form-textarea"
              placeholder="Enter your bio and experience..."
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>

          {/* Categories Selector */}
          <div style={{ marginTop: '12px', marginBottom: '24px' }}>
            <label className="expert-input-label" style={{ marginBottom: '10px' }}>
              Select Astrology Categories & Practices
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {categories.map(cat => {
                const selected = formData.categoryIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: selected ? '1.5px solid #FF6B00' : '1.5px solid #E2E8F0',
                      background: selected ? '#F0FFF0' : '#ffffff',
                      color: selected ? '#276727' : '#6b3a3a',
                      fontWeight: selected ? 800 : 600,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {selected && <IoCheckmarkCircle style={{ color: '#FF6B00' }} />}
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-expert-primary"
            >
              <IoSaveOutline style={{ fontSize: '18px' }} />
              {saving ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

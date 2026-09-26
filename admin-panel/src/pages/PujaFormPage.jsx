import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MdArrowBack, 
  MdSave, 
  MdTempleHindu, 
  MdLocationOn, 
  MdImage, 
  MdDescription,
  MdAutoAwesome,
  MdVideocam,
  MdCardGiftcard,
  MdCloudUpload
} from 'react-icons/md';
import { toast } from 'react-toastify';
import { adminApi, uploadFile } from '../services/api';
import '../assets/css/admin-ecommerce.css';

export default function PujaFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadTab, setUploadTab] = useState('FILE');

  const [form, setForm] = useState({
    title: '',
    temple: '',
    price: '',
    originalPrice: '',
    duration: '',
    pandits: '',
    date: '',
    tags: '',
    image: '',
    benefits: ''
  });

  useEffect(() => {
    const initData = async () => {
      if (!isEditing) {
        setLoading(false);
        return;
      }
      try {
        const res = await adminApi.getPujaById(id);
        const item = res.data?.data;
        if (item) {
          setForm({
            title: item.title || '',
            temple: item.temple || '',
            price: item.price !== undefined ? item.price : '',
            originalPrice: item.originalPrice !== undefined ? item.originalPrice : '',
            duration: item.duration || '',
            pandits: item.pandits || '',
            date: item.date || '',
            tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''),
            image: item.image || '',
            benefits: item.benefits || ''
          });
        } else {
          toast.error('Temple puja ritual not found in database');
          navigate('/ecommerce/pujas');
        }
      } catch (err) {
        toast.error('Failed to load puja details from database');
        navigate('/ecommerce/pujas');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [id, isEditing, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file size must be under 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const uploadedUrl = await uploadFile(file);
      setForm(prev => ({ ...prev, image: uploadedUrl }));
      toast.success('Temple image uploaded successfully!');
    } catch (err) {
      // Fallback to reading as Base64 data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, image: reader.result }));
        toast.success('Local image selected and previewed!');
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Please enter the puja title');
      return;
    }
    if (!form.temple.trim()) {
      toast.error('Please enter the temple name');
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      toast.error('Please enter a valid dakshina / booking fee');
      return;
    }

    setSubmitting(true);
    try {
      const priceNum = parseFloat(form.price);
      const originalPriceNum = form.originalPrice ? parseFloat(form.originalPrice) : Math.round(priceNum * 1.4);

      const payload = {
        ...form,
        price: priceNum,
        originalPrice: originalPriceNum
      };

      if (isEditing) {
        await adminApi.updatePuja(id, payload);
        toast.success('✅ Temple Puja successfully updated in database!');
      } else {
        await adminApi.createPuja(payload);
        toast.success('🎉 New Temple Puja published to database!');
      }

      navigate('/ecommerce/pujas');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save puja to database');
    } finally {
      setSubmitting(false);
    }
  };

  const discountPercent = form.originalPrice && form.price && Number(form.originalPrice) > Number(form.price)
    ? Math.round(((Number(form.originalPrice) - Number(form.price)) / Number(form.originalPrice)) * 100)
    : 0;

  if (loading) {
    return (
      <div className="ecommerce-page-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ color: '#EA580C', fontWeight: 600, fontSize: '16px' }}>Loading temple puja details...</div>
      </div>
    );
  }

  return (
    <div className="ecommerce-page-container">
      {/* Header */}
      <div className="ecommerce-page-header">
        <div className="ecommerce-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Link to="/ecommerce/pujas" className="btn-admin-secondary" style={{ padding: '6px 12px', fontSize: '12.5px' }}>
              <MdArrowBack /> Back to Temple Pujas
            </Link>
          </div>
          <h1>
            <MdTempleHindu style={{ color: '#EA580C' }} />
            {isEditing ? `Edit Temple Puja: ${form.title || 'Untitled'}` : 'Add New Temple Puja & Havan'}
          </h1>
          <p>
            {isEditing 
              ? 'Update temple shrine details, dakshina fees, and spiritual benefits for this ritual.' 
              : 'Add an authentic consecrated Vedic ritual or Jyotirlinga Mahapuja for devotees.'}
          </p>
        </div>
      </div>

      {/* Main 2-Column Form Layout (Dedicated Page - NO POPUP) */}
      <form onSubmit={handleSubmit}>
        <div className="ecommerce-form-layout">
          {/* Left Column: Dedicated Form Fields */}
          <div className="ecommerce-form-card">
            <div className="ecommerce-form-card-title">
              <MdDescription style={{ color: '#EA580C', fontSize: '20px' }} />
              <span>Temple Ritual Specifications</span>
            </div>

            <div className="form-group-custom">
              <label>
                Puja / Havan Title <span className="req">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter Puja Title"
                required
              />
            </div>

            <div className="form-group-custom">
              <label>
                Temple Shrine & Location <span className="req">*</span>
              </label>
              <input
                type="text"
                name="temple"
                value={form.temple}
                onChange={handleChange}
                placeholder="Enter Temple Name & Location"
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group-custom">
                <label>
                  Dakshina / Booking Fee (₹) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="Enter Dakshina / Price"
                  min="1"
                  required
                />
              </div>

              <div className="form-group-custom">
                <label>Regular Fee / M.R.P. (₹)</label>
                <input
                  type="number"
                  name="originalPrice"
                  value={form.originalPrice}
                  onChange={handleChange}
                  placeholder="Enter M.R.P. (Optional)"
                  min="1"
                />
                {discountPercent > 0 && (
                  <div className="field-helper" style={{ color: '#16A34A', fontWeight: 600 }}>
                    ✨ Devotee gets {discountPercent}% Special Blessing Discount!
                  </div>
                )}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group-custom">
                <label>Number of Vedic Acharyas / Pandits</label>
                <input
                  type="text"
                  name="pandits"
                  value={form.pandits}
                  onChange={handleChange}
                  placeholder="Enter Number of Pandits"
                />
              </div>

              <div className="form-group-custom">
                <label>Ritual Duration</label>
                <input
                  type="text"
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  placeholder="Enter Ritual Duration"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group-custom">
                <label>Auspicious Date / Muhurat Schedule</label>
                <input
                  type="text"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  placeholder="Enter Date or Day"
                />
              </div>

              <div className="form-group-custom">
                <label>Dosha / Remedy Tags (Comma Separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="Enter Tags"
                />
              </div>
            </div>

            <div className="form-group-custom">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Shrine / Ritual Image <span className="req">*</span>
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setUploadTab('FILE')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: uploadTab === 'FILE' ? 'none' : '1px solid #FED7AA',
                      background: uploadTab === 'FILE' ? 'linear-gradient(135deg, #FF6B00 0%, #F97316 100%)' : '#FFF7ED',
                      color: uploadTab === 'FILE' ? '#FFFFFF' : '#9A3412',
                      transition: 'all 0.15s'
                    }}
                  >
                    📁 Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadTab('URL')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: uploadTab === 'URL' ? 'none' : '1px solid #FED7AA',
                      background: uploadTab === 'URL' ? 'linear-gradient(135deg, #FF6B00 0%, #F97316 100%)' : '#FFF7ED',
                      color: uploadTab === 'URL' ? '#FFFFFF' : '#9A3412',
                      transition: 'all 0.15s'
                    }}
                  >
                    🔗 Image URL
                  </button>
                </div>
              </div>

              {uploadTab === 'FILE' ? (
                <div style={{
                  border: '2px dashed #FED7AA',
                  borderRadius: '12px',
                  padding: '22px 16px',
                  textAlign: 'center',
                  background: '#FFFDF9',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="file"
                    id="pujaFileInput"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="pujaFileInput"
                    style={{
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'linear-gradient(135deg, #FF6B00 0%, #F97316 100%)',
                      color: '#FFFFFF',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)'
                    }}
                  >
                    <MdCloudUpload style={{ fontSize: '20px' }} />
                    {uploadingImage ? 'Uploading Image...' : 'Choose Temple Image File from Computer'}
                  </label>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '8px' }}>
                    Supported formats: PNG, JPG, JPEG, WEBP (Max 5MB)
                  </div>
                  {form.image && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#16A34A', fontWeight: 700 }}>
                      ✓ Temple image loaded and ready
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    name="image"
                    value={form.image}
                    onChange={handleChange}
                    placeholder="Enter Image URL"
                    required
                  />
                </div>
              )}
            </div>

            <div className="form-group-custom">
              <label>Benefits & Details</label>
              <textarea
                name="benefits"
                rows="4"
                value={form.benefits}
                onChange={handleChange}
                placeholder="Enter Benefits & Details"
              />
            </div>

            <div className="form-actions-bar">
              <button
                type="button"
                className="btn-admin-secondary"
                onClick={() => navigate('/ecommerce/pujas')}
              >
                Cancel & Go Back
              </button>
              <button
                type="submit"
                className="btn-admin-primary"
                disabled={submitting}
              >
                <MdSave style={{ fontSize: '18px' }} />
                {submitting ? 'Saving to Database...' : isEditing ? 'Save Temple Puja Changes' : 'Publish Temple Puja'}
              </button>
            </div>
          </div>

          {/* Right Column: Live Devotee Preview Card */}
          <div className="preview-sticky-card">
            <div className="ecommerce-form-card" style={{ padding: '20px' }}>
              <div className="ecommerce-form-card-title" style={{ fontSize: '15px', marginBottom: '14px' }}>
                <MdAutoAwesome style={{ color: '#EA580C' }} />
                <span>Live Public Preview</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: 0, marginBottom: '14px' }}>
                This is how this ritual will appear to devotees on the <code>/puja</code> page.
              </p>

              <div className="product-preview-mock">
                <div className="preview-badge-header">
                  <span>SACRED SANKALP PUJA</span>
                  <span>🔴 LIVE VIDEO DARSHAN</span>
                </div>
                <div className="preview-image-box">
                  {form.image ? (
                    <img
                      src={form.image}
                      alt="Puja preview"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  ) : (
                    <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <MdImage style={{ fontSize: '36px' }} />
                      <span style={{ fontSize: '12px' }}>Enter Image URL</span>
                    </div>
                  )}
                </div>

                <div className="preview-content-box">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EA580C', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    <MdLocationOn />
                    <span>{form.temple || 'Sacred Temple Shrine'}</span>
                  </div>

                  <div className="preview-title">{form.title || 'Puja Title Placeholder'}</div>

                  <div className="preview-price-row">
                    <span className="preview-selling-price">
                      ₹{form.price ? Number(form.price).toLocaleString() : '0'}
                    </span>
                    {form.originalPrice && Number(form.originalPrice) > Number(form.price) && (
                      <span className="preview-mrp-price">
                        ₹{Number(form.originalPrice).toLocaleString()}
                      </span>
                    )}
                    {discountPercent > 0 && (
                      <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  <div className="preview-meta-specs">
                    <div><strong>Priests:</strong> {form.pandits || 'Vedic Acharyas'}</div>
                    <div><strong>Duration:</strong> {form.duration || 'Live Ritual'}</div>
                    <div><strong>Schedule:</strong> {form.date || 'Upcoming Auspicious Day'}</div>
                  </div>

                  <div className="preview-desc">
                    {form.benefits || 'Authentic Vedic sankalp in your name & gotra with Prasad delivery.'}
                  </div>

                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #fed7aa', display: 'flex', gap: '12px', fontSize: '11px', color: '#C2410C', fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MdVideocam /> Live Stream
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MdCardGiftcard /> Holy Prasad Courier
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

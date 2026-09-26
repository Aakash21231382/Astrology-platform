import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MdArrowBack, 
  MdSave, 
  MdShoppingBag, 
  MdCheckCircle, 
  MdImage, 
  MdAttachMoney, 
  MdDescription,
  MdAutoAwesome,
  MdCloudUpload
} from 'react-icons/md';
import { toast } from 'react-toastify';
import { adminApi, uploadFile } from '../services/api';
import '../assets/css/admin-ecommerce.css';

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadTab, setUploadTab] = useState('FILE');

  const [form, setForm] = useState({
    name: '',
    category: 'Gemstones',
    price: '',
    originalPrice: '',
    planet: '',
    weight: '',
    inStock: true,
    image: '',
    description: ''
  });

  useEffect(() => {
    const initData = async () => {
      if (!isEditing) {
        setLoading(false);
        return;
      }
      try {
        const res = await adminApi.getProductById(id);
        const item = res.data?.data;
        if (item) {
          setForm({
            name: item.name || '',
            category: item.category || 'Gemstones',
            price: item.price !== undefined ? item.price : '',
            originalPrice: item.originalPrice !== undefined ? item.originalPrice : '',
            planet: item.planet || '',
            weight: item.weight || '',
            inStock: item.inStock !== false,
            image: item.image || '',
            description: item.description || ''
          });
        } else {
          toast.error('Product not found in database');
          navigate('/ecommerce/products');
        }
      } catch (err) {
        toast.error('Failed to load product from database');
        navigate('/ecommerce/products');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [id, isEditing, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
      toast.success('Image uploaded successfully!');
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
    if (!form.name.trim()) {
      toast.error('Please enter product name');
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      toast.error('Please enter a valid selling price');
      return;
    }

    setSubmitting(true);
    try {
      const priceNum = parseFloat(form.price);
      const originalPriceNum = form.originalPrice ? parseFloat(form.originalPrice) : Math.round(priceNum * 1.35);

      const payload = {
        ...form,
        price: priceNum,
        originalPrice: originalPriceNum
      };

      if (isEditing) {
        await adminApi.updateProduct(id, payload);
        toast.success('✅ Product successfully updated in database!');
      } else {
        await adminApi.createProduct(payload);
        toast.success('🎉 New Product saved to database!');
      }

      navigate('/ecommerce/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product to database');
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
        <div style={{ color: '#EA580C', fontWeight: 600, fontSize: '16px' }}>Loading product details...</div>
      </div>
    );
  }

  return (
    <div className="ecommerce-page-container">
      {/* Top Header */}
      <div className="ecommerce-page-header">
        <div className="ecommerce-header-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Link to="/ecommerce/products" className="btn-admin-secondary" style={{ padding: '6px 12px', fontSize: '12.5px' }}>
              <MdArrowBack /> Back to Products Catalog
            </Link>
          </div>
          <h1>
            <MdShoppingBag style={{ color: '#EA580C' }} />
            {isEditing ? `Edit Product: ${form.name || 'Untitled'}` : 'Add New Astro Store Product'}
          </h1>
          <p>
            {isEditing 
              ? 'Update specifications, pricing, and astrological properties for this item.' 
              : 'Add an authentic Vedic remedy, consecrated gemstone, Rudraksha, or Yantra to your store.'}
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
              <span>Product Specifications & Details</span>
            </div>

            <div className="form-group-custom">
              <label>
                Product Title / Name <span className="req">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter Product Name"
                required
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group-custom">
                <label>Category <span className="req">*</span></label>
                <select name="category" value={form.category} onChange={handleChange}>
                  <option value="Gemstones">Gemstones</option>
                  <option value="Rudraksha">Rudraksha</option>
                  <option value="Yantras">Yantras</option>
                  <option value="Bracelets">Bracelets</option>
                  <option value="Other Remedies">Other Remedies</option>
                </select>
              </div>

              <div className="form-group-custom">
                <label>Planet / Ruling Deity</label>
                <input
                  type="text"
                  name="planet"
                  value={form.planet}
                  onChange={handleChange}
                  placeholder="Enter Planet or Deity"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group-custom">
                <label>
                  Selling Price (₹) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="Enter Selling Price"
                  min="1"
                  required
                />
              </div>

              <div className="form-group-custom">
                <label>M.R.P. (Strikethrough Price) (₹)</label>
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
                    ✨ Customer saves {discountPercent}% OFF!
                  </div>
                )}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group-custom">
                <label>Weight / Carats / Dimensions</label>
                <input
                  type="text"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="Enter Weight or Carats"
                />
              </div>

              <div className="form-group-custom">
                <label>Stock Availability</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                  <input
                    type="checkbox"
                    id="inStockCheck"
                    name="inStock"
                    checked={form.inStock}
                    onChange={handleChange}
                    style={{ width: '18px', height: '18px', accentColor: '#EA580C', cursor: 'pointer' }}
                  />
                  <label htmlFor="inStockCheck" style={{ margin: 0, cursor: 'pointer', fontSize: '13.5px' }}>
                    Item is In-Stock and ready for immediate order
                  </label>
                </div>
              </div>
            </div>

            <div className="form-group-custom">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Product Image <span className="req">*</span>
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
                    id="productFileInput"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    style={{ display: 'none' }}
                  />
                  <label
                    htmlFor="productFileInput"
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
                    {uploadingImage ? 'Uploading Image...' : 'Choose Image File from Computer'}
                  </label>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '8px' }}>
                    Supported formats: PNG, JPG, JPEG, WEBP (Max 5MB)
                  </div>
                  {form.image && (
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#16A34A', fontWeight: 700 }}>
                      ✓ Image loaded and ready
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
              <label>Product Description</label>
              <textarea
                name="description"
                rows="4"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter Product Description"
              />
            </div>

            <div className="form-actions-bar">
              <button
                type="button"
                className="btn-admin-secondary"
                onClick={() => navigate('/ecommerce/products')}
              >
                Cancel & Go Back
              </button>
              <button
                type="submit"
                className="btn-admin-primary"
                disabled={submitting}
              >
                <MdSave style={{ fontSize: '18px' }} />
                {submitting ? 'Saving to Database...' : isEditing ? 'Save Product Changes' : 'Publish Product to Store'}
              </button>
            </div>
          </div>

          {/* Right Column: Live Customer Preview Card */}
          <div className="preview-sticky-card">
            <div className="ecommerce-form-card" style={{ padding: '20px' }}>
              <div className="ecommerce-form-card-title" style={{ fontSize: '15px', marginBottom: '14px' }}>
                <MdAutoAwesome style={{ color: '#EA580C' }} />
                <span>Live Public Preview</span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: 0, marginBottom: '14px' }}>
                This is how this product will appear to customers on the <code>/shop</code> page.
              </p>

              <div className="product-preview-mock">
                <div className="preview-badge-header">
                  <span>VEDIC CERTIFIED</span>
                  <span>{form.inStock ? '🟢 IN STOCK' : '🔴 OUT OF STOCK'}</span>
                </div>
                <div className="preview-image-box">
                  {form.image ? (
                    <img
                      src={form.image}
                      alt="Product preview"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=600&q=80';
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
                  <span className="preview-cat-badge">{form.category || 'Gemstones'}</span>
                  <div className="preview-title">{form.name || 'Product Title Placeholder'}</div>

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
                    <div><strong>Planet:</strong> {form.planet || '—'}</div>
                    <div><strong>Weight/Spec:</strong> {form.weight || '—'}</div>
                  </div>

                  <div className="preview-desc">
                    {form.description || 'Authentic Vedic remedy energized with Agamic rituals and mantra chanting.'}
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

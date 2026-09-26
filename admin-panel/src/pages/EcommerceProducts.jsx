import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MdShoppingBag, 
  MdAdd, 
  MdSearch, 
  MdEdit, 
  MdDeleteOutline, 
  MdDiamond, 
  MdSpa, 
  MdAutoAwesome,
  MdCheckCircle,
  MdRemoveCircleOutline,
  MdSwapHoriz
} from 'react-icons/md';
import { toast } from 'react-toastify';
import { adminApi } from '../services/api';
import '../assets/css/admin-ecommerce.css';
import '../assets/css/admin-tables.css';

export default function EcommerceProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getProducts();
      setProducts(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load products from database');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete "${name}" from the Astro Shop?`)) {
      try {
        await adminApi.deleteProduct(id);
        toast.success(`"${name}" permanently deleted from database!`);
        fetchProducts();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete product from database.');
      }
    }
  };

  const categories = ['All', 'Gemstones', 'Rudraksha', 'Yantras', 'Bracelets'];

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.planet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const countGemstones = products.filter(p => p.category === 'Gemstones').length;
  const countRudraksha = products.filter(p => p.category === 'Rudraksha').length;
  const countYantras = products.filter(p => p.category === 'Yantras').length;

  return (
    <div className="ecommerce-page-container">
      {/* Page Header */}
      <div className="ecommerce-page-header">
        <div className="ecommerce-header-title">
          <h1><MdShoppingBag style={{ color: '#EA580C' }} /> Astro Shop Products Catalog</h1>
          <p>Manage certified gemstones, holy rudrakshas, and energized yantras available on the public website.</p>
        </div>
        <div className="ecommerce-header-actions">
          <Link to="/ecommerce/products/add" className="btn-admin-primary">
            <MdAdd style={{ fontSize: '18px' }} /> Add New Product
          </Link>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="ecommerce-stats-grid">
        <div className="ecommerce-stat-card">
          <div className="ecommerce-stat-icon">
            <MdShoppingBag />
          </div>
          <div className="ecommerce-stat-info">
            <div className="stat-label">Total Products</div>
            <div className="stat-value">{products.length} Items</div>
          </div>
        </div>

        <div className="ecommerce-stat-card">
          <div className="ecommerce-stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <MdDiamond />
          </div>
          <div className="ecommerce-stat-info">
            <div className="stat-label">Certified Gemstones</div>
            <div className="stat-value">{countGemstones} Items</div>
          </div>
        </div>

        <div className="ecommerce-stat-card">
          <div className="ecommerce-stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <MdSpa />
          </div>
          <div className="ecommerce-stat-info">
            <div className="stat-label">Nepali Rudraksha</div>
            <div className="stat-value">{countRudraksha} Items</div>
          </div>
        </div>

        <div className="ecommerce-stat-card">
          <div className="ecommerce-stat-icon" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
            <MdAutoAwesome />
          </div>
          <div className="ecommerce-stat-info">
            <div className="stat-label">Energized Yantras</div>
            <div className="stat-value">{countYantras} Items</div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search and Category Tabs */}
      <div className="ecommerce-toolbar">
        <div className="ecommerce-search-box">
          <MdSearch />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="ecommerce-filter-tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`ecommerce-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table with Horizontal Slider */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <div className="table-slider-hint">
          <MdSwapHoriz style={{ fontSize: '16px' }} /> Slide horizontally to view pricing, weight, stock & actions
        </div>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#EA580C', fontWeight: 600 }}>
            Loading products catalog...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <MdShoppingBag style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '12px' }} />
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>No products found</div>
            <p style={{ fontSize: '13px', margin: '6px 0 16px' }}>Try clearing your search query or add a new product.</p>
            <Link to="/ecommerce/products/add" className="btn-admin-primary">
              <MdAdd /> Add First Product
            </Link>
          </div>
        ) : (
          <table className="admin-table" style={{ minWidth: '1180px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '320px', minWidth: '320px' }}>PRODUCT PREVIEW</th>
                <th style={{ width: '130px', minWidth: '130px' }}>CATEGORY</th>
                <th style={{ width: '130px', minWidth: '130px' }}>PRICE & M.R.P.</th>
                <th style={{ width: '150px', minWidth: '150px' }}>PLANET / DEITY</th>
                <th style={{ width: '150px', minWidth: '150px' }}>WEIGHT / CARATS</th>
                <th style={{ width: '130px', minWidth: '130px' }}>STATUS</th>
                <th style={{ width: '170px', minWidth: '170px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(prod => (
                <tr key={prod.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img
                        src={prod.image}
                        alt={prod.name}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '10px',
                          objectFit: 'cover',
                          border: '1px solid #fed7aa',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginBottom: '2px' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      background: '#FFF7ED',
                      color: '#C2410C',
                      border: '1px solid #FED7AA',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '11.5px',
                      fontWeight: 700
                    }}>
                      {prod.category}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: '#EA580C', fontSize: '15px' }}>
                      ₹{prod.price?.toLocaleString()}
                    </div>
                    {prod.originalPrice && (
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', textDecoration: 'line-through' }}>
                        ₹{prod.originalPrice?.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                    {prod.planet || '—'}
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {prod.weight || '—'}
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: prod.inStock !== false ? '#16A34A' : '#DC2626'
                    }}>
                      {prod.inStock !== false ? <MdCheckCircle /> : <MdRemoveCircleOutline />}
                      {prod.inStock !== false ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/ecommerce/products/edit/${prod.id}`)}
                        className="btn-table-edit"
                        title="Edit product details"
                      >
                        <MdEdit /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        className="btn-table-delete"
                        title="Delete product"
                      >
                        <MdDeleteOutline /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

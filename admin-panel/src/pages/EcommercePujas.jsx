import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MdTempleHindu, 
  MdAdd, 
  MdSearch, 
  MdEdit, 
  MdDeleteOutline, 
  MdLocationOn, 
  MdEvent, 
  MdGroups,
  MdShield,
  MdSwapHoriz
} from 'react-icons/md';
import { toast } from 'react-toastify';
import { adminApi } from '../services/api';
import '../assets/css/admin-ecommerce.css';
import '../assets/css/admin-tables.css';

export default function EcommercePujas() {
  const navigate = useNavigate();
  const [pujas, setPujas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPujas();
  }, []);

  const fetchPujas = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPujas();
      setPujas(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load temple pujas from database');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePuja = async (id, title) => {
    if (window.confirm(`Are you sure you want to permanently delete the ritual "${title}"?`)) {
      try {
        await adminApi.deletePuja(id);
        toast.success(`"${title}" permanently deleted from database!`);
        fetchPujas();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete temple puja from database.');
      }
    }
  };

  const getTagsList = (tags) => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    return String(tags).split(',').map(t => t.trim()).filter(Boolean);
  };

  const filteredPujas = pujas.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const tagList = getTagsList(p.tags);
    return (
      p.title?.toLowerCase().includes(query) ||
      p.temple?.toLowerCase().includes(query) ||
      p.benefits?.toLowerCase().includes(query) ||
      tagList.some(t => t.toLowerCase().includes(query))
    );
  });

  return (
    <div className="ecommerce-page-container">
      {/* Page Header */}
      <div className="ecommerce-page-header">
        <div className="ecommerce-header-title">
          <h1><MdTempleHindu style={{ color: '#EA580C' }} /> Temple Pujas & Havans Catalog</h1>
          <p>Manage consecrated Jyotirlinga and Shakti Peeth rituals offered for online Sankalp on the platform.</p>
        </div>
        <div className="ecommerce-header-actions">
          <Link to="/ecommerce/pujas/add" className="btn-admin-primary">
            <MdAdd style={{ fontSize: '18px' }} /> Add New Temple Puja
          </Link>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="ecommerce-stats-grid">
        <div className="ecommerce-stat-card">
          <div className="ecommerce-stat-icon">
            <MdTempleHindu />
          </div>
          <div className="ecommerce-stat-info">
            <div className="stat-label">Temple Pujas</div>
            <div className="stat-value">{pujas.length} Rituals</div>
          </div>
        </div>

        <div className="ecommerce-stat-card">
          <div className="ecommerce-stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <MdLocationOn />
          </div>
          <div className="ecommerce-stat-info">
            <div className="stat-label">Sacred Shrines</div>
            <div className="stat-value">Ujjain, Trimbak, Kashi</div>
          </div>
        </div>

        <div className="ecommerce-stat-card">
          <div className="ecommerce-stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <MdGroups />
          </div>
          <div className="ecommerce-stat-info">
            <div className="stat-label">Vedic Acharyas</div>
            <div className="stat-value">Certified Pandits</div>
          </div>
        </div>

        <div className="ecommerce-stat-card">
          <div className="ecommerce-stat-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
            <MdShield />
          </div>
          <div className="ecommerce-stat-info">
            <div className="stat-label">Holy Prasad</div>
            <div className="stat-value">Doorstep Delivery</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ecommerce-toolbar">
        <div className="ecommerce-search-box" style={{ maxWidth: '500px' }}>
          <MdSearch />
          <input
            type="text"
            placeholder="Search temple pujas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Pujas Table with Horizontal Slider */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <div className="table-slider-hint">
          <MdSwapHoriz style={{ fontSize: '16px' }} /> Slide horizontally to view temple, dakshina, priests & actions
        </div>
      </div>

      <div className="admin-table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#EA580C', fontWeight: 600 }}>
            Loading temple pujas catalog...
          </div>
        ) : filteredPujas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <MdTempleHindu style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '12px' }} />
            <div style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>No temple pujas found</div>
            <p style={{ fontSize: '13px', margin: '6px 0 16px' }}>Try clearing your search query or add a new temple ritual.</p>
            <Link to="/ecommerce/pujas/add" className="btn-admin-primary">
              <MdAdd /> Add First Temple Puja
            </Link>
          </div>
        ) : (
          <table className="admin-table" style={{ minWidth: '1180px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '320px', minWidth: '320px' }}>PUJA & SHRINE DETAILS</th>
                <th style={{ width: '220px', minWidth: '220px' }}>TEMPLE LOCATION</th>
                <th style={{ width: '140px', minWidth: '140px' }}>DAKSHINA & M.R.P.</th>
                <th style={{ width: '160px', minWidth: '160px' }}>RITUAL DETAILS</th>
                <th style={{ width: '170px', minWidth: '170px' }}>MUHURAT DATE</th>
                <th style={{ width: '170px', minWidth: '170px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredPujas.map(puja => (
                <tr key={puja.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <img
                        src={puja.image}
                        alt={puja.title}
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
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px', marginBottom: '4px' }}>
                          {puja.title}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {getTagsList(puja.tags).slice(0, 2).map((t, idx) => (
                            <span key={idx} style={{
                              background: '#FFF7ED',
                              color: '#C2410C',
                              border: '1px solid #FED7AA',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 600
                            }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      <MdLocationOn style={{ color: '#EA580C' }} />
                      <span>{puja.temple}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: '#EA580C', fontSize: '15px' }}>
                      ₹{puja.price?.toLocaleString()}
                    </div>
                    {puja.originalPrice && (
                      <div style={{ fontSize: '11.5px', color: '#94a3b8', textDecoration: 'line-through' }}>
                        ₹{puja.originalPrice?.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                      {puja.pandits || 'Vedic Acharyas'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {puja.duration || 'Live Ritual'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#475569' }}>
                      <MdEvent style={{ color: '#EA580C' }} />
                      <span>{puja.date || 'Upcoming Auspicious Day'}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/ecommerce/pujas/edit/${puja.id}`)}
                        className="btn-table-edit"
                        title="Edit temple puja"
                      >
                        <MdEdit /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePuja(puja.id, puja.title)}
                        className="btn-table-delete"
                        title="Delete temple puja"
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

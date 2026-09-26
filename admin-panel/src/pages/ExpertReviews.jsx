import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import {
  MdStar,
  MdDeleteOutline,
  MdRefresh,
  MdRateReview,
  MdSearch,
  MdThumbUp
} from 'react-icons/md';
import '../assets/css/admin-tables.css';

export default function ExpertReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getReviews();
      setReviews(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load astrologer reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (review) => {
    if (!window.confirm(`Are you sure you want to remove this review by ${review.customerName}?`)) return;

    setDeletingId(review.id);
    try {
      await adminApi.deleteReview(review.id);
      toast.success('Review removed successfully');
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (err) {
      toast.error('Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const val = parseInt(rating || 5, 10);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= val ? '#F59E0B' : '#FED7AA', fontSize: 16 }}>
          ★
        </span>
      );
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>{stars}</span>;
  };

  const filteredReviews = reviews.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.customerName && r.customerName.toLowerCase().includes(q)) ||
      (r.expertName && r.expertName.toLowerCase().includes(q)) ||
      (r.comment && r.comment.toLowerCase().includes(q))
    );
  });

  const avgRating = reviews.length
    ? (reviews.reduce((acc, r) => acc + (parseFloat(r.rating) || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  const fiveStarCount = reviews.filter((r) => (parseFloat(r.rating) || 5) >= 5).length;
  const satisfactionRate = reviews.length ? Math.round((fiveStarCount / reviews.length) * 100) : 100;

  return (
    <div className="expert-reviews-page">
      {/* Top Stat Banner Grid */}
      <div className="subpage-stats-grid">
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', color: '#EA580C', border: '1.5px solid #FED7AA' }}>
            <MdRateReview />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Total Reviews</span>
            <span className="subpage-stat-value">{reviews.length}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', color: '#D97706', border: '1.5px solid #FCD34D' }}>
            <MdStar />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Average Score</span>
            <span className="subpage-stat-value" style={{ color: '#D97706' }}>{avgRating} ★</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#059669', border: '1.5px solid #A7F3D0' }}>
            <MdThumbUp />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">5-Star Satisfaction</span>
            <span className="subpage-stat-value" style={{ color: '#059669' }}>{satisfactionRate}%</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: 10, flex: 1 }}>
            <div className="table-search-box">
              <MdSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn-refresh"
            onClick={fetchReviews}
            title="Refresh reviews"
          >
            <MdRefresh /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="table-loading">Loading astrologer reviews...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', color: '#D97706', border: '1.5px solid #FCD34D' }}>
              <MdRateReview />
            </div>
            <h3>No Customer Reviews Logged</h3>
            <p>Customer feedback and star ratings will automatically show up here as consultations conclude.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Review ID</th>
                  <th>Client / Seeker</th>
                  <th>Astrologer</th>
                  <th>Rating</th>
                  <th>Seeker Review Comment</th>
                  <th>Session Reference</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 800, color: '#C2410C' }}>#{r.id}</td>
                    <td>
                      <div className="user-cell">
                        <img
                          src={r.customerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                          alt={r.customerName}
                          className="table-avatar"
                        />
                        <div className="user-cell-meta">
                          <span className="name">{r.customerName || 'Seeker'}</span>
                          <span className="sub">{r.customerEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>{r.expertName || 'Astrologer'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {renderStars(r.rating)}
                        <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#B45309' }}>
                          {r.rating || 5}.0
                        </span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: 1.45, background: '#FFFDF9', padding: '8px 12px', borderRadius: 8, border: '1px solid #FED7AA' }}>
                        {r.comment || <em style={{ color: '#94A3B8' }}>No comment text provided</em>}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-orange">
                        Session #{r.consultationId}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn-danger"
                        disabled={deletingId === r.id}
                        onClick={() => handleDeleteReview(r)}
                        title="Moderate / Delete this review"
                      >
                        <MdDeleteOutline /> {deletingId === r.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

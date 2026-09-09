import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicService } from '../services/api';
import '../assets/css/categories.css';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicService.getCategories().then((res) => {
      setCategories(res.data.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="categories-page">
      <div className="astro-container">
        <div className="section-header">
          <span className="section-tag">Explore Disciplines</span>
          <h1 className="section-title">Astrology & Psychic Categories</h1>
          <p className="categories-subtitle">
            Discover specialized advisors across ancient Vedic scriptures, mystic Tarot, Numerology and more.
          </p>
        </div>

        {loading ? (
          <p className="categories-loading-text">Loading categories...</p>
        ) : (
          <div className="astro-grid astro-grid-3">
            {categories.map((cat) => (
              <Link 
                to={`/experts?category=${cat.slug}`} 
                key={cat.id} 
                className="category-card-item"
              >
                <img 
                  src={cat.imageUrl || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80'} 
                  alt={cat.name} 
                  className="category-card-img"
                />
                <div className="category-card-body">
                  <h3 className="category-card-title">{cat.name}</h3>
                  <p className="category-card-desc">{cat.description}</p>
                  <span className="category-card-arrow">
                    Browse Experts →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

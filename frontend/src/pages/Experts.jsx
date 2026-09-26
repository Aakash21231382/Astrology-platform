import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IoSearch, IoFilterOutline } from 'react-icons/io5';
import { expertService, publicService } from '../services/api';
import ExpertCard from '../components/ExpertCard';
import WalletModal from '../components/WalletModal';
import { useAuth } from '../context/AuthContext';

export default function Experts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';

  const [experts, setExperts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('RATING');
  const [loading, setLoading] = useState(true);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [marketplaceBanners, setMarketplaceBanners] = useState([]);
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    publicService.getCategories().then((res) => {
      setCategories(res.data.data || []);
    });
    publicService.getBanners('MARKETPLACE').then((res) => {
      setMarketplaceBanners(res.data.data || []);
    }).catch(err => console.warn('Failed to load marketplace banners:', err));
  }, []);

  // Sync selected category when URL query changes from Navbar dropdown
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
  }, [searchParams]);

  useEffect(() => {
    async function fetchExperts() {
      setLoading(true);
      try {
        const res = await expertService.getApprovedList({
          category: selectedCategory || null,
          search: search || null,
          sortBy
        });
        setExperts(res.data.data || []);
      } catch (err) {
        console.error('Failed to load experts:', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchExperts, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory, search, sortBy]);

  const handleCategorySelect = (slug) => {
    const newCat = selectedCategory === slug ? '' : slug;
    setSelectedCategory(newCat);
    if (newCat) {
      setSearchParams({ category: newCat });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="experts-page-container">
      <div className="astro-container">
        {/* Marketplace Top Promotional Banner (From Admin Banners -> MARKETPLACE) */}
        {marketplaceBanners.length > 0 && (
          <div className="experts-marketplace-wrap">
            {marketplaceBanners.map((b) => (
              <a
                key={b.id}
                href={b.ctaUrl || '/experts'}
                className="experts-marketplace-card"
              >
                <img
                  src={b.imageUrl}
                  alt={b.title || 'Marketplace Promotion'}
                  className="experts-marketplace-img"
                />
                {b.title && (
                  <div className="experts-marketplace-overlay">
                    <h2 className="experts-marketplace-title">{b.title}</h2>
                    {b.subtitle && <p className="experts-marketplace-subtitle">{b.subtitle}</p>}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}

        {/* Page Title */}
        <div className="experts-header-wrap">
          <h1 className="section-title">Discover Verified Astrologers & Psychics</h1>
          <p className="experts-subtitle">
            Check availability, compare per-minute pricing, and start an instant live consultation.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="experts-filter-bar">
          <div className="search-input-group">
            <IoSearch />
            <input
              type="text"
              placeholder="Search astrologers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-selects">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select experts-sort-select"
            >
              <option value="RATING">Highest Rating</option>
              <option value="EXPERIENCE">Most Experienced</option>
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="PRICE_DESC">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Chips */}
        <div className="category-chips">
          <button
            type="button"
            className={`category-chip ${selectedCategory === '' ? 'active' : ''}`}
            onClick={() => handleCategorySelect('')}
          >
            All Disciplines
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-chip ${selectedCategory === cat.slug ? 'active' : ''}`}
              onClick={() => handleCategorySelect(cat.slug)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Expert List Grid */}
        {loading ? (
          <div className="experts-loading-wrap">
            <p className="experts-loading-text">Loading verified astrologers...</p>
          </div>
        ) : experts.length > 0 ? (
          <div className="astro-grid astro-grid-3">
            {experts.map((exp) => (
              <ExpertCard 
                key={exp.id} 
                expert={exp} 
                onOpenWallet={() => setWalletModalOpen(true)}
              />
            ))}
          </div>
        ) : (
          <div className="experts-empty-wrap">
            <h3 className="experts-empty-title">No Astrologers Found</h3>
            <p className="experts-empty-desc">Try clearing filters or search terms.</p>
          </div>
        )}
      </div>

      <WalletModal 
        isOpen={walletModalOpen} 
        onClose={() => setWalletModalOpen(false)}
        onSuccess={refreshUser}
        currentBalance={user?.walletBalance || 0}
      />
    </div>
  );
}

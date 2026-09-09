import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicService } from '../services/api';
import '../assets/css/cms.css';

export default function CmsPage({ defaultSlug }) {
  const { slug } = useParams();
  const currentSlug = slug || defaultSlug || 'about';
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    publicService.getCmsPage(currentSlug)
      .then((res) => {
        setPage(res.data.data);
      })
      .catch(() => {
        setPage({
          title: currentSlug.toUpperCase(),
          content: 'Content for this page is being updated by our editorial team.'
        });
      })
      .finally(() => setLoading(false));
  }, [currentSlug]);

  return (
    <div className="cms-page-wrapper">
      <div className="astro-container cms-page-container">
        {loading ? (
          <p className="cms-loading-text">Loading content...</p>
        ) : (
          <div className="cms-content-card">
            <h1 className="cms-page-title">
              {page?.title}
            </h1>
            <div className="cms-page-body">
              {page?.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { 
  IoShieldCheckmarkOutline, 
  IoDocumentTextOutline, 
  IoLockClosedOutline, 
  IoRefreshCircleOutline, 
  IoAlertCircleOutline,
  IoHelpCircleOutline,
  IoChevronForwardOutline,
  IoInformationCircleOutline
} from 'react-icons/io5';
import { publicService } from '../services/api';
import '../assets/css/cms.css';

const POLICY_LINKS = [
  { slug: 'terms', path: '/terms', label: 'Terms & Conditions', icon: IoDocumentTextOutline, badge: 'User Agreement' },
  { slug: 'privacy', path: '/privacy', label: 'Privacy Policy', icon: IoLockClosedOutline, badge: 'Data Confidentiality' },
  { slug: 'refund', path: '/refund', label: 'Refund & Cancellation', icon: IoRefreshCircleOutline, badge: '48-Hr Guarantee' },
  { slug: 'disclaimer', path: '/disclaimer', label: 'Spiritual Disclaimer', icon: IoAlertCircleOutline, badge: 'Vedic Guidance' },
  { slug: 'about', path: '/about', label: 'About Us', icon: IoInformationCircleOutline, badge: 'Our Sanctuary' },
  { slug: 'faq', path: '/faq', label: 'FAQ Helpdesk', icon: IoHelpCircleOutline, badge: 'Quick Answers' }
];

export default function CmsPage({ defaultSlug }) {
  const { slug } = useParams();
  const location = useLocation();
  const currentSlug = slug || defaultSlug || (location.pathname.replace('/', '') || 'terms');
  
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    publicService.getCmsPage(currentSlug)
      .then((res) => {
        if (res.data?.data) {
          setPage(res.data.data);
        }
      })
      .catch(() => {
        // Fallback title formatting
        const formattedTitle = currentSlug
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        
        setPage({
          title: formattedTitle,
          metaDescription: 'Legal and operational policies of Aakash Spiritual Marketplace.',
          content: 'Content for this policy page is actively managed and updated by our compliance department.'
        });
      })
      .finally(() => setLoading(false));
  }, [currentSlug]);

  // Helper to parse content into beautifully structured sections
  const renderFormattedContent = (contentStr) => {
    if (!contentStr) return null;

    // Split by numbered sections (e.g. "1. ", "2. ", "3. ") or double line breaks
    const sections = contentStr.split(/(?=\n(?:\d+\.|\b[A-Z0-9\s]{4,}\b:))/g);

    return (
      <div className="cms-structured-content">
        {sections.map((section, idx) => {
          const trimmed = section.trim();
          if (!trimmed) return null;

          const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
          const headerLine = lines[0];
          const isHeading = /^\d+\.\s/.test(headerLine) || headerLine.endsWith(':');
          const bodyLines = isHeading ? lines.slice(1) : lines;

          return (
            <div key={idx} className="cms-section-block">
              {isHeading ? (
                <h3 className="cms-section-heading">
                  <span className="cms-heading-accent"></span>
                  {headerLine}
                </h3>
              ) : null}

              <div className="cms-section-text">
                {bodyLines.map((line, lineIdx) => {
                  if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
                    const bulletText = line.replace(/^[•\-*]\s*/, '');
                    return (
                      <div key={lineIdx} className="cms-bullet-item">
                        <span className="cms-bullet-dot"></span>
                        <p>{bulletText}</p>
                      </div>
                    );
                  }
                  return (
                    <p key={lineIdx} className="cms-paragraph">
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const activeMeta = POLICY_LINKS.find(p => p.slug === currentSlug) || {
    badge: 'Legal & Trust Document',
    icon: IoShieldCheckmarkOutline
  };
  const IconComponent = activeMeta.icon;

  return (
    <div className="cms-page-wrapper">
      {/* Top Breadcrumb & Hero Header */}
      <section className="cms-hero-header">
        <div className="astro-container">
          <div className="cms-badge-pill">
            <IconComponent /> {activeMeta.badge || 'Platform Document'}
          </div>
          <h1 className="cms-hero-title">
            {page?.title || 'Policy & Legal Document'}
          </h1>
          <p className="cms-hero-subtitle">
            {page?.metaDescription || 'Transparent, fair, and spiritual guidelines for all devotees, users, and astrologers on Aakash.'}
          </p>
        </div>
      </section>

      {/* Main Dual-Column Content */}
      <div className="astro-container cms-layout-grid">
        {/* Left Side: Main Policy Card */}
        <main className="cms-main-card">
          {loading ? (
            <div className="cms-loading-state">
              <div className="cms-spinner"></div>
              <p>Loading document details...</p>
            </div>
          ) : (
            <article>
              <div className="cms-card-meta-bar">
                <div className="cms-last-updated">
                  <IoShieldCheckmarkOutline className="cms-meta-icon" />
                  <span>Verified Legal Document • Binding Platform Terms</span>
                </div>
                <div className="cms-version-tag">
                  Status: <strong style={{ color: '#FF6B00' }}>Active & Enforced</strong>
                </div>
              </div>

              <div className="cms-page-body">
                {renderFormattedContent(page?.content)}
              </div>

              {/* Document Footer Assurance */}
              <div className="cms-document-footer">
                <div className="cms-footer-icon">
                  <IoLockClosedOutline />
                </div>
                <div>
                  <h4>100% Confidentiality & Fair Practice Guaranteed</h4>
                  <p>
                    All spiritual consultations and transactions on Aakash are secured with 256-bit encryption. For questions regarding this policy, reach our support team at <a href="mailto:support@aakashastrology.com">support@aakashastrology.com</a>.
                  </p>
                </div>
              </div>
            </article>
          )}
        </main>

        {/* Right Side: Trust & Quick Navigation Sidebar */}
        <aside className="cms-sidebar">
          {/* Policy Navigation Card */}
          <div className="cms-sidebar-card">
            <h4 className="cms-sidebar-title">
              <IoDocumentTextOutline /> Legal & Policies
            </h4>
            <nav className="cms-nav-list">
              {POLICY_LINKS.map(item => {
                const isActive = currentSlug === item.slug;
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.slug}
                    to={item.path}
                    className={`cms-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <div className="cms-nav-link-left">
                      <ItemIcon className="cms-nav-icon" />
                      <span>{item.label}</span>
                    </div>
                    <IoChevronForwardOutline className="cms-arrow-icon" />
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Need Assistance Helpdesk Card */}
          <div className="cms-sidebar-card cms-support-card">
            <div className="cms-support-icon-wrap">
              <IoHelpCircleOutline />
            </div>
            <h4>Have Questions?</h4>
            <p>Our dedicated devotee support team is here to assist you 24x7 with any queries or refund concerns.</p>
            <div className="cms-support-contacts">
              <div className="cms-contact-row">
                <span>Email Support:</span>
                <strong>support@aakashastrology.com</strong>
              </div>
              <div className="cms-contact-row">
                <span>Resolution Time:</span>
                <strong style={{ color: '#FF6B00' }}>Within 24 Hours</strong>
              </div>
            </div>
            <Link to="/dashboard/support" className="cms-btn-support">
              Open Support Ticket
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

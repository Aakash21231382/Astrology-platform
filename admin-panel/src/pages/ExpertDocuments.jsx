import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import {
  MdFolderShared,
  MdSearch,
  MdRefresh,
  MdInsertDriveFile,
  MdOpenInNew,
  MdCheckCircle,
  MdVerifiedUser
} from 'react-icons/md';
import '../assets/css/admin-tables.css';

export default function ExpertDocuments() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getExpertDocuments();
      setExperts(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load expert documents');
    } finally {
      setLoading(false);
    }
  };

  const parseDocs = (docUrls) => {
    if (!docUrls) return [];
    try {
      const parsed = JSON.parse(docUrls);
      return Array.isArray(parsed) ? parsed : [{ name: 'Document', url: docUrls }];
    } catch (e) {
      return [{ name: 'Document', url: docUrls }];
    }
  };

  const filteredExperts = experts.filter((exp) => {
    const q = search.toLowerCase();
    return (
      (exp.displayName && exp.displayName.toLowerCase().includes(q)) ||
      (exp.email && exp.email.toLowerCase().includes(q))
    );
  });

  const verifiedCount = experts.filter((e) => e.approvalStatus === 'APPROVED').length;
  const pendingAudit = experts.filter((e) => e.approvalStatus === 'PENDING').length;

  return (
    <div className="expert-documents-page">
      {/* Top Stat Banner Grid */}
      <div className="subpage-stats-grid">
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', color: '#EA580C', border: '1.5px solid #FED7AA' }}>
            <MdFolderShared />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Document Archives</span>
            <span className="subpage-stat-value">{experts.length}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#059669', border: '1.5px solid #A7F3D0' }}>
            <MdVerifiedUser />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Verified Astrologers</span>
            <span className="subpage-stat-value" style={{ color: '#059669' }}>{verifiedCount}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', color: '#D97706', border: '1.5px solid #FCD34D' }}>
            <MdCheckCircle />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Pending Audits</span>
            <span className="subpage-stat-value" style={{ color: '#D97706' }}>{pendingAudit}</span>
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
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn-refresh"
            onClick={fetchDocuments}
            title="Refresh documents"
          >
            <MdRefresh /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="table-loading">Loading astrologer documents archive...</div>
        ) : filteredExperts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <MdFolderShared />
            </div>
            <h3>No Uploaded Documents Found</h3>
            <p>Astrologer certificates, degrees, and government proofs will automatically populate here upon submission.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Astrologer</th>
                  <th>Approval Status</th>
                  <th>Listing Status</th>
                  <th>Uploaded Credentials & Proofs</th>
                  <th>Registered Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredExperts.map((exp) => {
                  const docs = parseDocs(exp.documentUrls);
                  return (
                    <tr key={exp.id}>
                      <td>
                        <div className="user-cell">
                          <img
                            src={exp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}
                            alt={exp.displayName}
                            className="table-avatar"
                          />
                          <div className="user-cell-meta">
                            <span className="name">{exp.displayName || 'Astrologer'}</span>
                            <span className="sub">{exp.email}</span>
                            {exp.phoneNumber && <span className="sub">{exp.phoneNumber}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        {exp.approvalStatus === 'APPROVED' ? (
                          <span className="status-badge active">APPROVED</span>
                        ) : exp.approvalStatus === 'PENDING' ? (
                          <span className="status-badge pending">PENDING</span>
                        ) : (
                          <span className="status-badge danger">{exp.approvalStatus}</span>
                        )}
                      </td>
                      <td>
                        {exp.isActive ? (
                          <span className="badge badge-success">LIVE ON MARKET</span>
                        ) : (
                          <span className="badge badge-warning">OFFLINE</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {docs.map((doc, idx) => {
                            const url = typeof doc === 'string' ? doc : doc.url;
                            const name = typeof doc === 'string' ? `Document #${idx + 1}` : (doc.name || `Document #${idx + 1}`);
                            return (
                              <div
                                key={idx}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 10,
                                  background: '#FFFDF9', padding: '8px 14px', borderRadius: 8,
                                  border: '1.5px solid #FED7AA', maxWidth: 380,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                                }}
                              >
                                <MdInsertDriveFile style={{ color: '#EA580C', fontSize: 20, flexShrink: 0 }} />
                                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1E293B', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {name}
                                </span>
                                {url && (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-action view"
                                    style={{ padding: '4px 10px', fontSize: '0.76rem' }}
                                    title="Open file in new tab"
                                  >
                                    View <MdOpenInNew />
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#64748B' }}>
                        {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

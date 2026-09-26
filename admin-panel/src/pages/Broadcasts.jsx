import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import {
  MdCampaign,
  MdSend,
  MdRefresh,
  MdMailOutline,
  MdCheckCircle,
  MdSupervisorAccount,
  MdSchedule
} from 'react-icons/md';
import '../assets/css/admin-tables.css';

export default function Broadcasts() {
  const [notifications, setNotifications] = useState([]);
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('ALL_EXPERTS');
  const [selectedExpertId, setSelectedExpertId] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notifsRes, expertsRes] = await Promise.allSettled([
        adminApi.getBroadcasts(),
        adminApi.getAllExperts({ limit: 100 })
      ]);

      if (notifsRes.status === 'fulfilled') {
        setNotifications(notifsRes.value?.data?.data || []);
      } else {
        console.error('Failed to load broadcasts:', notifsRes.reason);
      }

      if (expertsRes.status === 'fulfilled') {
        setExperts(expertsRes.value?.data?.data || []);
      } else {
        console.error('Failed to load experts:', expertsRes.reason);
      }
    } catch (err) {
      console.error('Failed to load broadcasts:', err);
      toast.error('Failed to load broadcasts');
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.warn('Title and message are required');
      return;
    }

    setSending(true);
    try {
      await adminApi.sendBroadcast({
        title: title.trim(),
        message: message.trim(),
        target,
        expertId: target === 'SPECIFIC' ? selectedExpertId : null
      });
      toast.success('Broadcast notification dispatched to astrologer mailbox.');
      setTitle('');
      setMessage('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="broadcasts-page">
      {/* Top Stat Banner Grid */}
      <div className="subpage-stats-grid">
        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', color: '#EA580C', border: '1.5px solid #FED7AA' }}>
            <MdCampaign />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Broadcasts Sent</span>
            <span className="subpage-stat-value">{notifications.length}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', color: '#C2410C', border: '1.5px solid #FDBA74' }}>
            <MdSupervisorAccount />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Active Astrologers</span>
            <span className="subpage-stat-value" style={{ color: '#C2410C' }}>{experts.length}</span>
          </div>
        </div>

        <div className="subpage-stat-card">
          <div className="subpage-stat-icon" style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', color: '#059669', border: '1.5px solid #A7F3D0' }}>
            <MdCheckCircle />
          </div>
          <div className="subpage-stat-info">
            <span className="subpage-stat-label">Delivery Network</span>
            <span className="subpage-stat-value" style={{ color: '#059669' }}>100% Instant</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 28 }}>
        {/* Composer Card */}
        <div style={{ background: '#FFFFFF', border: '1.5px solid #FED7AA', borderRadius: 16, padding: 26, boxShadow: '0 4px 20px -2px rgba(249, 115, 22, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #FF6B00 0%, #F97316 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', boxShadow: '0 4px 10px rgba(249, 115, 22, 0.3)' }}>
              <MdCampaign style={{ fontSize: 22 }} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              Dispatch Expert Mailbox Announcement
            </h3>
          </div>

          <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Recipient Target Audience
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="ALL_EXPERTS">Broadcast to ALL Astrologers ({experts.length} Active)</option>
                <option value="SPECIFIC">Send to a Specific Astrologer Only</option>
              </select>
            </div>

            {target === 'SPECIFIC' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Select Astrologer *
                </label>
                <select
                  required
                  value={selectedExpertId}
                  onChange={(e) => setSelectedExpertId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Choose Expert Profile --</option>
                  {experts.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.displayName || exp.fullName || exp.screenName || 'Astrologer'} {exp.email ? `(${exp.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Announcement Subject / Title *
              </label>
              <input
                type="text"
                required
                placeholder="Enter announcement subject"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Message Content *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Enter message content"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.94rem' }}
            >
              <MdSend /> {sending ? 'Dispatching Broadcast...' : 'Dispatch to Astrologer Mailbox'}
            </button>
          </form>
        </div>

        {/* Info Card */}
        <div style={{ background: '#FFFDF9', border: '1.5px solid #FED7AA', borderRadius: 16, padding: 26, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C' }}>
              <MdMailOutline style={{ fontSize: 18 }} />
            </div>
            How Astrologer Mailbox Operates
          </h3>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.88rem', color: '#475569', lineHeight: 1.8 }}>
            <li><strong>Direct Real-time Sync:</strong> Announcements sent from this console appear immediately in each astrologer's <em>Mail Box</em> portal.</li>
            <li><strong>Read Status Tracking:</strong> When an astrologer views or acknowledges an alert, read receipts update in the system.</li>
            <li><strong>Targeted or Mass Broadcasts:</strong> You can broadcast platform-wide policy updates or address individual astrologers directly.</li>
          </ul>

          <div style={{ marginTop: 'auto', background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', border: '1.5px solid #FED7AA', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#C2410C', marginBottom: 4 }}>
              💡 Pro Tip:
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9A3412', lineHeight: 1.45 }}>
              Use broadcasts for scheduled maintenance alerts, festive commission bonuses, or guidelines updates.
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Log Table */}
      <div className="table-container">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>
              Recent Dispatched Notifications Log
            </h2>
          </div>

          <button
            type="button"
            className="btn-refresh"
            onClick={fetchData}
            title="Refresh list"
          >
            <MdRefresh /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="table-loading">Loading broadcast logs...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <MdCampaign />
            </div>
            <h3>No Announcements Dispatched Yet</h3>
            <p>Use the composer form above to send your first message to the astrologer network.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Alert ID</th>
                  <th>Recipient / Scope</th>
                  <th>Announcement Title</th>
                  <th>Message Snippet</th>
                  <th>Dispatched At</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id}>
                    <td style={{ fontWeight: 800, color: '#C2410C' }}>#{n.id}</td>
                    <td>
                      {n.userId ? (
                        <span className="badge badge-orange">
                          Expert #{n.userId}
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          All Astrologers
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>{n.title}</span>
                    </td>
                    <td style={{ maxWidth: 360 }}>
                      <div style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.45 }}>
                        {n.message}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'N/A'}
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

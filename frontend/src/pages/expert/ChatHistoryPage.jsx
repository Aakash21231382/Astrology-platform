import React, { useState, useEffect } from 'react';
import { IoTimeOutline, IoChatbubblesOutline, IoSearchOutline, IoEyeOutline } from 'react-icons/io5';
import { consultationService } from '../../services/api';
import { Link } from 'react-router-dom';

export default function ChatHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    consultationService.getHistory()
      .then(res => {
        if (res.data?.data) setHistory(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredHistory = history.filter(item => {
    const q = search.toLowerCase();
    return (
      (item.customerName && item.customerName.toLowerCase().includes(q)) ||
      (item.id && String(item.id).includes(q))
    );
  });

  return (
    <div className="expert-content-container">
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoTimeOutline style={{ color: '#800000', fontSize: '24px' }} />
              Chat Consultation History
            </h2>
            <p className="expert-card-desc">
              Audit log of all your previous seeker live chat reading sessions and accrued earnings.
            </p>
          </div>

          <div style={{ position: 'relative', minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search consultations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="expert-form-input"
              style={{ paddingLeft: '36px' }}
            />
            <IoSearchOutline style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#800000' }} />
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="expert-table-wrap">
            <table className="expert-table">
              <thead>
                <tr>
                  <th>Session ID</th>
                  <th>Client / Seeker</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Total Billed</th>
                  <th>Your Share (80%)</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map(item => {
                  const mins = Math.ceil((item.totalDurationSeconds || 0) / 60);
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 800, color: '#800000' }}>#{item.id}</td>
                      <td style={{ fontWeight: 700, color: '#800000' }}>
                        {item.customerName || 'Seeker'}
                      </td>
                      <td style={{ color: '#6b3a3a' }}>
                        {new Date(item.requestedAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td style={{ color: '#4a1212' }}>
                        {mins > 0 ? `${mins} min (${item.totalDurationSeconds}s)` : '0 min'}
                      </td>
                      <td style={{ fontWeight: 700, color: '#800000' }}>
                        ₹{parseFloat(item.grossAmount || 0).toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 800, color: '#FF6B00' }}>
                        ₹{parseFloat(item.expertEarning || 0).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge-status ${item.status === 'COMPLETED' ? 'success' : 'pending'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/consultation/${item.id}`}
                          className="btn-expert-secondary"
                          style={{ padding: '6px 12px', fontSize: '12.5px' }}
                        >
                          <IoEyeOutline /> View Room
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b3a3a' }}>
            <IoChatbubblesOutline style={{ fontSize: '42px', color: '#E2E8F0', marginBottom: '8px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No consultation history matches your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

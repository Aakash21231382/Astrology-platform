import React, { useState, useEffect } from 'react';
import { IoPeopleOutline, IoSearchOutline } from 'react-icons/io5';
import { expertService } from '../../services/api';

export default function MyClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    expertService.getClients()
      .then(res => {
        if (res.data?.data) setClients(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredClients = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      (c.customerName && c.customerName.toLowerCase().includes(q)) ||
      (c.customerEmail && c.customerEmail.toLowerCase().includes(q))
    );
  });

  return (
    <div className="expert-content-container">
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoPeopleOutline style={{ color: '#800000', fontSize: '24px' }} />
              My Clients Directory
            </h2>
            <p className="expert-card-desc">
              List of seekers who have engaged in consultation readings with you.
            </p>
          </div>

          <div style={{ position: 'relative', minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="expert-form-input"
              style={{ paddingLeft: '38px', borderRadius: '10px' }}
            />
            <IoSearchOutline style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7a6b58', fontSize: '18px' }} />
          </div>
        </div>

        {filteredClients.length > 0 ? (
          <div className="expert-table-wrap">
            <table className="expert-table">
              <thead>
                <tr>
                  <th>Client / Seeker</th>
                  <th>Contact Email</th>
                  <th>Total Consultations</th>
                  <th>Consultation Minutes</th>
                  <th>Total Spent</th>
                  <th>Last Consultation</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map(c => {
                  const mins = Math.ceil((c.totalDurationSeconds || 0) / 60);
                  return (
                    <tr key={c.customerId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={c.customerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                            alt={c.customerName}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #FF6B00' }}
                          />
                          <span style={{ fontWeight: 700, color: '#800000' }}>
                            {c.customerName || 'Seeker'}
                          </span>
                        </div>
                      </td>
                      <td style={{ color: '#7a6b58' }}>
                        {c.customerEmail || 'Hidden for Privacy'}
                      </td>
                      <td style={{ fontWeight: 700, color: '#4a3b32' }}>
                        {c.totalSessions} sessions
                      </td>
                      <td style={{ color: '#4a3b32' }}>
                        {mins} minutes
                      </td>
                      <td style={{ fontWeight: 700, color: '#FF6B00' }}>
                        ₹{parseFloat(c.totalSpent || 0).toFixed(2)}
                      </td>
                      <td style={{ color: '#7a6b58' }}>
                        {c.lastConsultationAt ? new Date(c.lastConsultationAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        }) : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7a6b58' }}>
            <IoPeopleOutline style={{ fontSize: '42px', color: '#c9bea5', marginBottom: '8px' }} />
            <p style={{ margin: 0 }}>No client records found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

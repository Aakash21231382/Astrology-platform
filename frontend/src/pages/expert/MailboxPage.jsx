import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { IoMailOutline, IoMailOpenOutline, IoCheckmarkDoneOutline, IoTimeOutline } from 'react-icons/io5';
import { expertService } from '../../services/api';
import { toast } from 'react-toastify';

export default function MailboxPage() {
  const { setUnreadMailCount } = useOutletContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMailbox();
  }, []);

  const loadMailbox = async () => {
    try {
      const res = await expertService.getMailbox();
      if (res.data?.data) {
        setMessages(res.data.data);
        if (setUnreadMailCount) setUnreadMailCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await expertService.markMailboxRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
      if (setUnreadMailCount) {
        setUnreadMailCount(count => Math.max(0, count - 1));
      }
      toast.success('Message marked as read');
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  return (
    <div className="expert-content-container">
      <div className="expert-card">
        <div className="expert-card-header">
          <div>
            <h2 className="expert-card-title">
              <IoMailOutline style={{ color: '#800000', fontSize: '24px' }} />
              Mail Box & Notifications
            </h2>
            <p className="expert-card-desc">
              Important alerts from platform administration, seeker messages, and system announcements.
            </p>
          </div>
        </div>

        {messages.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  padding: '18px 20px',
                  borderRadius: '12px',
                  background: msg.isRead ? '#ffffff' : '#f9fcf5',
                  border: msg.isRead ? '1px solid #E2E8F0' : '1.5px solid #FF6B00',
                  boxShadow: msg.isRead ? 'none' : '0 4px 12px rgba(107, 142, 35, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {!msg.isRead && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF6B00', display: 'inline-block' }} />
                    )}
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#800000', margin: 0 }}>
                      {msg.title}
                    </h3>
                    <span style={{ fontSize: '11.5px', color: '#7a6b58', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <IoTimeOutline /> {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '13.5px', color: '#4a3b32', margin: '0 0 6px 0', lineHeight: '1.5' }}>
                    {msg.message}
                  </p>
                </div>

                {!msg.isRead && (
                  <button
                    onClick={() => handleMarkRead(msg.id)}
                    className="btn-expert-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    <IoCheckmarkDoneOutline /> Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7a6b58' }}>
            <IoMailOpenOutline style={{ fontSize: '42px', color: '#c9bea5', marginBottom: '8px' }} />
            <p style={{ margin: 0 }}>Your mailbox is empty. No new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}

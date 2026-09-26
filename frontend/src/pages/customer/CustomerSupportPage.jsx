import React, { useState } from 'react';
import {
  IoHelpCircleOutline,
  IoCallOutline,
  IoChatbubblesOutline,
  IoWalletOutline,
  IoShieldCheckmarkOutline,
  IoMailOutline,
  IoLogoWhatsapp,
  IoSparkles
} from 'react-icons/io5';
import { toast } from 'react-toastify';

export default function CustomerSupportPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.warn('Please enter subject and query message.');
      return;
    }
    toast.success('Your support request has been submitted! Our divine care team will respond within 2 hours.');
    setSubject('');
    setMessage('');
    setSubmitted(true);
  };

  const faqs = [
    {
      q: 'How does live Voice Calling work?',
      a: 'Voice calls take place directly within your web browser using secure HD WebRTC voice encryption. You do not need to enter any mobile number or install third-party apps. Simply click "Call Now" and allow microphone permissions.'
    },
    {
      q: 'How is consultation talktime billed?',
      a: 'Billing starts only after the expert joins and answers. The live timer counts seconds authoritatively. If promotional free time is active, you are not charged until free seconds expire. Any unspent balance stays safely in your wallet.'
    },
    {
      q: 'Can I share my Kundali chart or photos in chat?',
      a: 'Yes! In Live Chat mode, click the paperclip attachment icon to upload your Kundali image, palm photo, or birth chart. Your astrologer can analyze it in real time during the chat.'
    },
    {
      q: 'Is my personal information and reading confidential?',
      a: '100% confidential. All readings, chats, and calls are strictly private between you and your chosen astrologer. Your birth details and contact numbers are never shared publicly.'
    },
    {
      q: 'How do wallet recharges and refunds work?',
      a: 'Recharges are processed instantly via Razorpay payment gateway. If a call drops due to technical errors or an expert is unreachable, the system automatically settles and refunds any unused amount back to your wallet balance.'
    }
  ];

  return (
    <div>
      {/* Help Header */}
      <div className="customer-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="customer-kpi-icon-wrap purple" style={{ width: '60px', height: '60px', fontSize: '30px' }}>
            <IoHelpCircleOutline />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#130a2a', margin: '0 0 4px' }}>
              Seeker Support & Spiritual Guidance FAQ
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
              Find quick answers or get in touch with our 24/7 dedicated divine support assistance.
            </p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="customer-card">
        <h3 className="customer-card-title" style={{ marginBottom: '18px' }}>
          <IoSparkles style={{ color: '#FF6B00' }} />
          Frequently Asked Questions
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px 20px'
              }}
            >
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                {faq.q}
              </h4>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support Form */}
      <div className="customer-card">
        <h3 className="customer-card-title" style={{ marginBottom: '18px' }}>
          <IoMailOutline style={{ color: '#2563eb' }} />
          Contact Support Team
        </h3>

        {submitted ? (
          <div style={{ background: '#FFEDD5', border: '1px solid #FED7AA', borderRadius: '12px', padding: '20px', color: '#FF6B00', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800 }}>Inquiry Received!</h4>
            <p style={{ margin: 0, fontSize: '13.5px' }}>
              Thank you for reaching out. Our support agent will assist you shortly via registered email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitTicket}>
            <div className="customer-form-group">
              <label className="customer-form-label">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject"
                required
                className="customer-form-input"
              />
            </div>

            <div className="customer-form-group">
              <label className="customer-form-label">Your Message / Query Details</label>
              <textarea
                rows="4"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                required
                className="customer-form-textarea"
              />
            </div>

            <button
              type="submit"
              className="customer-header-consult-btn"
              style={{ border: 'none', cursor: 'pointer', padding: '10px 26px', display: 'inline-flex' }}
            >
              Submit Support Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

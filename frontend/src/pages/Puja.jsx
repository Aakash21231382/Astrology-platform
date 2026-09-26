import React, { useState, useEffect } from 'react';
import { 
  IoSparkles, 
  IoCalendarOutline, 
  IoLocationOutline, 
  IoShieldCheckmarkOutline, 
  IoFlameOutline, 
  IoGiftOutline, 
  IoVideocamOutline,
  IoCheckmarkCircle
} from 'react-icons/io5';
import { processRazorpayPayment } from '../utils/razorpay';
import { publicService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const PUJAS = [
  {
    id: 'puja-1',
    title: 'Mahakaleshwar Kaal Sarp & Shani Shanti Mahapuja',
    temple: 'Shri Mahakaleshwar Jyotirlinga, Ujjain (M.P.)',
    benefits: 'Nullifies malefic effects of Rahu-Ketu, Kaal Sarp Dosha, and delays in career or marriage.',
    price: 3100,
    originalPrice: 5100,
    duration: '2 Hours Live Ritual',
    pandits: '5 Vedic Acharyas',
    date: 'Next Auspicious Amavasya / Somwar',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    tags: ['Kaal Sarp Dosha', 'Shani Sade Sati', 'Jyotirlinga']
  },
  {
    id: 'puja-2',
    title: 'Kashi Vishwanath Rudra Abhishek & Mahamrityunjaya Havan',
    temple: 'Kashi Vishwanath Jyotirlinga, Varanasi (U.P.)',
    benefits: 'Bestows longevity, miraculous health recovery, destruction of chronic illnesses, and spiritual peace.',
    price: 2500,
    originalPrice: 4200,
    duration: '90 Minutes Ritual',
    pandits: '3 Kashi Vedic Brahmins',
    date: 'Every Monday & Pradosh Vrat',
    image: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=600&q=80',
    tags: ['Health & Longevity', 'Rudra Abhishek', 'Lord Shiva']
  },
  {
    id: 'puja-3',
    title: 'Maa Kamakhya Devi Mangal & Vivah Badha Nivaran',
    temple: 'Shakti Peeth Maa Kamakhya, Guwahati (Assam)',
    benefits: 'Removes Manglik Dosha, delays in marriage matchmaking, marital discord, and relationship misunderstandings.',
    price: 3500,
    originalPrice: 5500,
    duration: '2.5 Hours Tantrokta Puja',
    pandits: 'Siddha Shakta Priests',
    date: 'Auspicious Shukla Ashtami',
    image: 'https://images.unsplash.com/photo-1609137144822-4822d0c242c7?auto=format&fit=crop&w=600&q=80',
    tags: ['Manglik Dosha', 'Marriage Harmony', 'Shakti Peeth']
  },
  {
    id: 'puja-4',
    title: 'Trimbakeshwar Narayan Nagbali & Pitru Dosha Shanti',
    temple: 'Trimbakeshwar Jyotirlinga, Nashik (Maharashtra)',
    benefits: 'Cleanses ancestral curses, Pitru Rin, unexpected business losses, and obstacles in childbirth.',
    price: 4500,
    originalPrice: 7000,
    duration: '3 Hours Vedic Vidhi',
    pandits: 'Specialized Trimbak Priests',
    date: 'Next Sarva Pitru & Amavasya',
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
    tags: ['Pitru Dosha', 'Family Prosperity', 'Ancestral Peace']
  },
  {
    id: 'puja-5',
    title: 'Maa Baglamukhi Shatru Vinashak & Vijay Sankalp Puja',
    temple: 'Maa Baglamukhi Temple, Nalkheda (M.P.)',
    benefits: 'Impenetrable shield against jealous competitors, court cases, business rivals, and black-energy ill will.',
    price: 3900,
    originalPrice: 6000,
    duration: '2 Hours Havan with Haldi & Peeli Sarson',
    pandits: '3 Peeth Acharyas',
    date: 'Auspicious Chaturdashi',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    tags: ['Legal & Court Victory', 'Shatru Shanti', 'Protection']
  }
];

export default function Puja() {
  const { user } = useAuth();
  const [pujasList, setPujasList] = useState(PUJAS);
  const [selectedPuja, setSelectedPuja] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLivePujas = async () => {
      try {
        const res = await publicService.getPujas();
        if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setPujasList(res.data.data);
        }
      } catch (err) {
        // Fallback to initial pujas quietly
      }
    };
    fetchLivePujas();
  }, []);

  const [bookingForm, setBookingForm] = useState({
    devoteeName: '',
    gotra: '',
    dob: '',
    birthNakshatra: '',
    sankalpWish: '',
    phone: '',
    address: ''
  });

  const handleOpenBooking = (puja) => {
    setSelectedPuja(puja);
    setBookingForm({
      devoteeName: user?.fullName || '',
      gotra: '',
      dob: '',
      birthNakshatra: '',
      sankalpWish: 'Good health, career success, and family prosperity',
      phone: user?.phone || '',
      address: ''
    });
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingForm.devoteeName.trim() || !bookingForm.phone.trim() || !bookingForm.address.trim()) {
      toast.error('Please provide devotee name, mobile number, and home delivery address for Prasad');
      return;
    }

    setSubmitting(true);
    try {
      await processRazorpayPayment({
        amount: selectedPuja.price,
        user,
        description: `Temple Puja: ${selectedPuja.title} (Sankalp: ${bookingForm.devoteeName})`
      });

      toast.success('🙏 Har Har Mahadev! Your Sankalp Puja has been successfully booked!');
      setBookingModalOpen(false);
    } catch (err) {
      toast.error('Booking payment was not completed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="astro-tool-page">
      {/* Hero Section */}
      <section className="astro-tool-hero" style={{ background: 'linear-gradient(135deg, #9A3412 0%, #C2410C 50%, #EA580C 100%)', padding: '52px 20px', textAlign: 'center', color: '#ffffff' }}>
        <div className="astro-container" style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div className="astro-tool-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.18)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.35)', padding: '6px 18px', borderRadius: '50px', fontSize: '13px', fontWeight: 700, backdropFilter: 'blur(8px)', marginBottom: '14px' }}>
            <IoSparkles style={{ color: '#FFE58F', fontSize: '16px' }} /> Consecrated Jyotirlinga & Shakti Peeth Pujas
          </div>
          <h1 style={{ color: '#FFFFFF', fontSize: '32px', fontWeight: 800, margin: '0 0 14px 0', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            Online Sankalp Temple Puja & Havan
          </h1>
          <p style={{ color: '#E4F4E0', fontSize: '15px', lineHeight: 1.6, margin: '0 auto', maxWidth: '720px' }}>
            Perform sacred Pujas and Vedic Havans in your name and Gotra at India's most venerated Jyotirlingas and Shakti Peeths. Receive live video darshan and holy Prasad delivered directly to your doorstep.
          </p>

          {/* Value Propositions */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '24px', flexWrap: 'wrap', color: '#FFFFFF', fontSize: '13.5px', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.14)', padding: '7px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.22)', color: '#FFFFFF' }}>
              <IoShieldCheckmarkOutline style={{ fontSize: '18px', color: '#FFE58F' }} /> Authentic Sankalp in your Name & Gotra
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.14)', padding: '7px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.22)', color: '#FFFFFF' }}>
              <IoVideocamOutline style={{ fontSize: '18px', color: '#FFE58F' }} /> Live Ritual Video Recording & Darshan
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.14)', padding: '7px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.22)', color: '#FFFFFF' }}>
              <IoGiftOutline style={{ fontSize: '18px', color: '#FFE58F' }} /> Sanctified Prasad, Bhasma & Yantra Courier
            </span>
          </div>
        </div>
      </section>

      {/* Puja Cards Grid */}
      <section className="astro-container" style={{ padding: '40px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
          {pujasList.map(puja => (
            <div
              key={puja.id}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.04)';
              }}
            >
              <div>
                <div style={{ position: 'relative', height: '200px' }}>
                  <img
                    src={puja.image}
                    alt={puja.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(31, 43, 24, 0.85)',
                    color: '#E2E8F0',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <IoLocationOutline /> {puja.temple}
                  </div>
                </div>

                <div style={{ padding: '24px' }}>
                  {/* Tags */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {(Array.isArray(puja.tags) ? puja.tags : (puja.tags ? puja.tags.split(',').map(s => s.trim()).filter(Boolean) : [])).map(t => (
                      <span key={t} style={{
                        background: '#FFFFFF',
                        color: '#FF6B00',
                        border: '1px solid #E2E8F0',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>

                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                    {puja.title}
                  </h3>

                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 18px 0' }}>
                    {puja.benefits}
                  </p>

                  <div style={{
                    background: '#f8fafc',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: '12.5px',
                    color: '#475569',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Ritual Duration:</span>
                      <strong style={{ color: '#0F172A' }}>{puja.duration}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Vedic Priests:</span>
                      <strong style={{ color: '#0F172A' }}>{puja.pandits}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Auspicious Muhurat:</span>
                      <strong style={{ color: '#FF6B00' }}>{puja.date}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 24px 24px 24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Complete Dakshina:</span>
                    <span style={{ fontSize: '22px', fontWeight: 900, color: '#FF6B00' }}>
                      ₹{puja.price.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '8px' }}>
                      ₹{puja.originalPrice.toLocaleString()}
                    </span>
                  </div>
                  <span style={{ background: '#ecfdf5', color: '#C2410C', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    Prasad Included
                  </span>
                </div>

                <button
                  onClick={() => handleOpenBooking(puja)}
                  style={{
                    width: '100%',
                    background: '#FF6B00',
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#0F172A'}
                  onMouseLeave={e => e.currentTarget.style.background = '#FF6B00'}
                >
                  <IoFlameOutline style={{ fontSize: '18px' }} />
                  Book Sankalp Puja
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking Modal */}
      {bookingModalOpen && selectedPuja && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '520px',
            width: '100%',
            padding: '30px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#FF6B00', fontWeight: 700, textTransform: 'uppercase' }}>
                  Vedic Sankalp Registration
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '4px 0 0 0' }}>
                  {selectedPuja.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Devotee Name (Yajman) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={bookingForm.devoteeName}
                  onChange={e => setBookingForm({ ...bookingForm, devoteeName: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Gotra (if known)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kashyap (or Shiva Gotra)"
                    value={bookingForm.gotra}
                    onChange={e => setBookingForm({ ...bookingForm, gotra: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Birth Nakshatra (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rohini / Ashwini"
                    value={bookingForm.birthNakshatra}
                    onChange={e => setBookingForm({ ...bookingForm, birthNakshatra: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Sankalp Wish / Prayer Intent
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Peaceful career transition and marriage obstacle removal"
                  value={bookingForm.sankalpWish}
                  onChange={e => setBookingForm({ ...bookingForm, sankalpWish: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    WhatsApp Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={bookingForm.phone}
                    onChange={e => setBookingForm({ ...bookingForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={bookingForm.dob}
                    onChange={e => setBookingForm({ ...bookingForm, dob: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Prasad Delivery Postal Address *
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="Full delivery address with Pincode for sacred Prasad dispatch"
                  value={bookingForm.address}
                  onChange={e => setBookingForm({ ...bookingForm, address: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              {/* Price Breakdown */}
              <div style={{ background: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', marginTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#78716c', marginBottom: '4px' }}>
                  <span>Temple Havan & Priests Dakshina:</span>
                  <span>₹{selectedPuja.price}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#78716c', marginBottom: '6px' }}>
                  <span>Prasad Express Courier:</span>
                  <span style={{ color: '#FF6B00', fontWeight: 700 }}>FREE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900, color: '#FF6B00', borderTop: '1px dashed #E2E8F0', paddingTop: '6px' }}>
                  <span>Total Dakshina:</span>
                  <span>₹{selectedPuja.price.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1.5,
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: '#FF6B00',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  {submitting ? 'Connecting...' : `Pay ₹${selectedPuja.price.toLocaleString()} & Confirm`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

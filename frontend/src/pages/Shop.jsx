import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  IoCartOutline, 
  IoSparkles, 
  IoShieldCheckmarkOutline, 
  IoRibbonOutline, 
  IoAirplaneOutline, 
  IoClose, 
  IoAdd, 
  IoRemove,
  IoCheckmarkCircle
} from 'react-icons/io5';
import { processRazorpayPayment } from '../utils/razorpay';
import { publicService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const PRODUCTS = [
  {
    id: 'gem-1',
    name: 'Natural Ceylon Yellow Sapphire (Pukhraj)',
    category: 'Gemstones',
    price: 8500,
    originalPrice: 12500,
    rating: 4.9,
    reviews: 142,
    planet: 'Jupiter (Guru)',
    weight: '4.25 Carats',
    image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=600&q=80',
    description: '100% untreated Ceylon Yellow Sapphire, energized by Vedic Brahmins for prosperity, wisdom, and marriage harmony.'
  },
  {
    id: 'gem-2',
    name: 'Certified Burmese Ruby (Manikya)',
    category: 'Gemstones',
    price: 6800,
    originalPrice: 9500,
    rating: 4.8,
    reviews: 98,
    planet: 'Sun (Surya)',
    weight: '3.5 Carats',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80',
    description: 'Vibrant Pigeon Blood Red Ruby for leadership, vitality, government career success, and royal confidence.'
  },
  {
    id: 'gem-3',
    name: 'Italian Red Coral (Moonga)',
    category: 'Gemstones',
    price: 4200,
    originalPrice: 6000,
    rating: 4.9,
    reviews: 187,
    planet: 'Mars (Mangal)',
    weight: '6.15 Carats',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=600&q=80',
    description: 'Authentic triangular Italian Moonga for pacifying Manglik Dosha, building physical vitality and courage.'
  },
  {
    id: 'rud-1',
    name: 'Original 5-Mukhi Nepali Rudraksha Mala (108+1)',
    category: 'Rudraksha',
    price: 1499,
    originalPrice: 2499,
    rating: 5.0,
    reviews: 320,
    planet: 'Lord Shiva',
    weight: 'Selected 8mm Beads',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
    description: 'Siddha energized Nepali 5-Mukhi beads strung in holy silk thread. Ideal for daily japa, peace of mind, and BP balance.'
  },
  {
    id: 'rud-2',
    name: 'Rare 1-Mukhi Half-Moon (Kaju) Rudraksha',
    category: 'Rudraksha',
    price: 5999,
    originalPrice: 8999,
    rating: 4.9,
    reviews: 76,
    planet: 'Supreme Consciousness',
    weight: 'Certified Collector Grade',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    description: 'The most sacred bead ruled by Lord Shiva Himself. Grants heightened intuition, super-consciousness, and liberation.'
  },
  {
    id: 'rud-3',
    name: '7-Mukhi Mahalaxmi Nepali Rudraksha',
    category: 'Rudraksha',
    price: 2199,
    originalPrice: 3499,
    rating: 4.8,
    reviews: 112,
    planet: 'Goddess Lakshmi',
    weight: 'Authentic Nepal Bead',
    image: 'https://images.unsplash.com/photo-1615655406736-b37c4fabf923?auto=format&fit=crop&w=600&q=80',
    description: 'Ruled by Goddess Lakshmi and Saturn. Nullifies financial blockages, bad luck, and attracts continuous wealth flow.'
  },
  {
    id: 'yan-1',
    name: '24K Gold-Plated Meru Shree Yantra (Solid Brass)',
    category: 'Yantras',
    price: 3499,
    originalPrice: 5200,
    rating: 5.0,
    reviews: 215,
    planet: 'Sri Vidya / Tripura Sundari',
    weight: '850 grams',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    description: '3D geometrical pyramid casting of ancient Sri Chakra according to Agamic scriptures. Bestows Vastu dosha correction.'
  },
  {
    id: 'yan-2',
    name: 'Vedic Kuber Dhan Varsha Yantra Chowki',
    category: 'Yantras',
    price: 2499,
    originalPrice: 3999,
    rating: 4.8,
    reviews: 154,
    planet: 'Lord Kubera',
    weight: '620 grams',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
    description: 'Holy brass chowki with Kuber idol, coin, and yantra plate. Perfect for placement in cash lockers and business desks.'
  },
  {
    id: 'brac-1',
    name: '7-Chakra Natural Lava Energy Healing Bracelet',
    category: 'Bracelets',
    price: 799,
    originalPrice: 1499,
    rating: 4.7,
    reviews: 430,
    planet: 'All 7 Chakras',
    weight: 'Elastic Standard Fit',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
    description: 'Natural Amethyst, Lapis, Turquoise, Imperial Stone, Tiger Eye, Amber, and Onyx. Rebalances subtle energy centers.'
  }
];

export default function Shop() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [productsList, setProductsList] = useState(PRODUCTS);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await publicService.getProducts();
        if (res?.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setProductsList(res.data.data);
        }
      } catch (err) {
        // Fallback to default catalog quietly
      }
    };
    fetchCatalog();
  }, []);

  const categories = ['All', 'Gemstones', 'Rudraksha', 'Yantras', 'Bracelets'];

  const filteredProducts = selectedCategory === 'All'
    ? productsList
    : productsList.filter(p => p.category === selectedCategory);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart!`);
    setIsCartOpen(true);
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    altPhone: '',
    addressLine: '',
    landmark: '',
    city: '',
    state: '',
    pincode: ''
  });

  const handleOpenCheckoutAddress = () => {
    if (cart.length === 0) return;
    setShippingForm(prev => ({
      ...prev,
      fullName: prev.fullName || user?.fullName || '',
      phone: prev.phone || user?.phone || ''
    }));
    setIsCartOpen(false);
    setAddressModalOpen(true);
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!shippingForm.fullName.trim()) {
      toast.error('Please enter the recipient full name');
      return;
    }
    const cleanPhone = shippingForm.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number for courier dispatch');
      return;
    }
    if (!shippingForm.addressLine.trim() || !shippingForm.city.trim() || !shippingForm.state.trim()) {
      toast.error('Please enter complete street address, city, and state');
      return;
    }
    const cleanPincode = shippingForm.pincode.replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      toast.error('Please enter a valid 6-digit postal PIN code');
      return;
    }

    setCheckingOut(true);
    try {
      const fullDeliveryAddress = `${shippingForm.addressLine}, ${shippingForm.landmark ? `Near ${shippingForm.landmark}, ` : ''}${shippingForm.city}, ${shippingForm.state} - ${shippingForm.pincode}`;

      await processRazorpayPayment({
        amount: cartTotal,
        user: {
          ...user,
          fullName: shippingForm.fullName,
          phone: shippingForm.phone
        },
        description: `Astro Store Order (${cartCount} items) to ${shippingForm.city}, PIN ${cleanPincode}`
      });

      toast.success(`🎉 Order Placed Successfully! Will be dispatched to ${shippingForm.city}, PIN ${cleanPincode}`);
      setCart([]);
      setAddressModalOpen(false);
    } catch (err) {
      toast.error('Payment was not completed');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="astro-tool-page">
      {/* Hero Section */}
      <section className="astro-tool-hero" style={{ background: 'linear-gradient(135deg, #9A3412 0%, #C2410C 50%, #EA580C 100%)', padding: '52px 20px', textAlign: 'center', color: '#ffffff' }}>
        <div className="astro-container" style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div className="astro-tool-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.18)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.35)', padding: '6px 18px', borderRadius: '50px', fontSize: '13px', fontWeight: 700, backdropFilter: 'blur(8px)', marginBottom: '14px' }}>
            <IoSparkles style={{ color: '#FFE58F', fontSize: '16px' }} /> 100% Certified Vedic Remedies
          </div>
          <h1 style={{ color: '#FFFFFF', fontSize: '32px', fontWeight: 800, margin: '0 0 14px 0', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            Vedic Astro-Remedies Store
          </h1>
          <p style={{ color: '#E4F4E0', fontSize: '15px', lineHeight: 1.6, margin: '0 auto', maxWidth: '720px' }}>
            Lab-certified precious gemstones, authentic Nepali Rudrakshas, and Agamic consecrated Yantras, fully energized with Vedic rituals by certified Acharyas before dispatch.
          </p>

          {/* Guarantee Badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '24px', flexWrap: 'wrap', color: '#FFFFFF', fontSize: '13.5px', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.14)', padding: '7px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.22)', color: '#FFFFFF' }}>
              <IoShieldCheckmarkOutline style={{ fontSize: '18px', color: '#FFE58F' }} /> Certified Gemological Lab Testing
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.14)', padding: '7px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.22)', color: '#FFFFFF' }}>
              <IoRibbonOutline style={{ fontSize: '18px', color: '#FFE58F' }} /> Vedic Pran Pratishtha Energization
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.14)', padding: '7px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.22)', color: '#FFFFFF' }}>
              <IoAirplaneOutline style={{ fontSize: '18px', color: '#FFE58F' }} /> Free Pan-India Insured Express Delivery
            </span>
          </div>
        </div>
      </section>

      {/* Floating Cart Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: '#FF6B00',
          color: '#ffffff',
          border: 'none',
          borderRadius: '50px',
          padding: '14px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 800,
          fontSize: '15px',
          cursor: 'pointer',
          boxShadow: '0 8px 25px rgba(255, 107, 0, 0.4)',
          zIndex: 999,
          transition: 'transform 0.2s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <IoCartOutline style={{ fontSize: '22px' }} />
        <span>Cart</span>
        {cartCount > 0 && (
          <span style={{
            background: '#E2E8F0',
            color: '#0F172A',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 800
          }}>
            {cartCount}
          </span>
        )}
      </button>

      {/* Category Tabs & Banner */}
      <section className="astro-container" style={{ padding: '40px 20px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '25px',
                  border: selectedCategory === cat ? '2px solid #FF6B00' : '1px solid #e2e8f0',
                  background: selectedCategory === cat ? '#FF6B00' : '#ffffff',
                  color: selectedCategory === cat ? '#ffffff' : '#0F172A',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Astrologer Recommendation Link */}
          <Link
            to="/experts"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#FF6B00',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              background: '#F0F9F1',
              padding: '10px 18px',
              borderRadius: '25px',
              border: '1px solid #D6EAD8'
            }}
          >
            <IoSparkles /> Need gemstone guidance? Consult an Astrologer →
          </Link>
        </div>

        {/* Product Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '28px'
        }}>
          {filteredProducts.map(product => (
            <div
              key={product.id}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
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
              <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(31, 43, 24, 0.85)',
                  color: '#E2E8F0',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backdropFilter: 'blur(4px)'
                }}>
                  {product.category}
                </span>
                <span style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  background: '#FFFFFF',
                  color: '#FF6B00',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  border: '1px solid #E2E8F0'
                }}>
                  {product.planet}
                </span>
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '13px', marginBottom: '6px' }}>
                    <span>★ {product.rating}</span>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>({product.reviews} reviews)</span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                    {product.name}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                    {product.description}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#FF6B00' }}>
                      ₹{product.price.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'line-through' }}>
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                    <span style={{ fontSize: '12px', color: '#FF6B00', fontWeight: 700 }}>
                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                    </span>
                  </div>

                  <button
                    onClick={() => addToCart(product)}
                    style={{
                      width: '100%',
                      background: '#FF6B00',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '10px',
                      fontWeight: 700,
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
                    <IoCartOutline style={{ fontSize: '18px' }} />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 3000,
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <div style={{
            background: '#ffffff',
            width: '100%',
            maxWidth: '420px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.15)'
          }}>
            {/* Cart Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#FFFFFF'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IoCartOutline style={{ fontSize: '24px', color: '#FF6B00' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  Your Sacred Basket ({cartCount})
                </h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
                  <p style={{ fontWeight: 600, fontSize: '16px', color: '#475569' }}>Your cart is empty</p>
                  <p style={{ fontSize: '13px' }}>Explore certified gemstones, rudrakshas, and yantras.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      alignItems: 'center'
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#FF6B00', marginTop: '4px' }}>
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', borderRadius: '8px', padding: '4px 8px' }}>
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                      >
                        <IoRemove />
                      </button>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                      >
                        <IoAdd />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#64748b' }}>
                  <span>Vedic Energization & Puja:</span>
                  <span style={{ color: '#FF6B00', fontWeight: 700 }}>FREE (Complimentary)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
                  <span>Insured Express Shipping:</span>
                  <span style={{ color: '#FF6B00', fontWeight: 700 }}>FREE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>
                  <span>Total Payable:</span>
                  <span style={{ color: '#FF6B00' }}>₹{cartTotal.toLocaleString()}</span>
                </div>

                <button
                  onClick={handleOpenCheckoutAddress}
                  style={{
                    width: '100%',
                    background: '#FF6B00',
                    color: '#ffffff',
                    border: 'none',
                    padding: '16px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  Proceed to Delivery Address →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shipping Address & Contact Modal Before Payment */}
      {addressModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#FFFFFF'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  Delivery Address & Contact Details
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#78716c' }}>
                  Please provide the destination address for sacred insured express courier.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddressModalOpen(false);
                  setIsCartOpen(true);
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProceedToPayment} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Recipient Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohit Sharma"
                    value={shippingForm.fullName}
                    onChange={e => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength="10"
                    placeholder="10-digit mobile number"
                    value={shippingForm.phone}
                    onChange={e => setShippingForm({ ...shippingForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Flat / House No., Apartment & Street Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g. Flat 402, Sunshine Heights, Andheri West"
                  value={shippingForm.addressLine}
                  onChange={e => setShippingForm({ ...shippingForm, addressLine: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Nearby Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Opposite City Hospital"
                    value={shippingForm.landmark}
                    onChange={e => setShippingForm({ ...shippingForm, landmark: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Alternate Mobile / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Optional backup phone"
                    value={shippingForm.altPhone}
                    onChange={e => setShippingForm({ ...shippingForm, altPhone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    City / Town <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    value={shippingForm.city}
                    onChange={e => setShippingForm({ ...shippingForm, city: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    State <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharashtra"
                    value={shippingForm.state}
                    onChange={e => setShippingForm({ ...shippingForm, state: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    PIN Code <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    placeholder="6 digits"
                    value={shippingForm.pincode}
                    onChange={e => setShippingForm({ ...shippingForm, pincode: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Order Amount & Guarantee Box */}
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#78716c', marginBottom: '6px' }}>
                  <span>Total Ordered Items:</span>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>{cartCount} Items</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#78716c', marginBottom: '6px' }}>
                  <span>Express Insured Shipping:</span>
                  <span style={{ color: '#FF6B00', fontWeight: 700 }}>FREE (₹0)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 900, color: '#0F172A', borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginTop: '8px' }}>
                  <span>Grand Total to Pay:</span>
                  <span style={{ color: '#FF6B00' }}>₹{cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setAddressModalOpen(false);
                    setIsCartOpen(true);
                  }}
                  style={{
                    flex: 1,
                    background: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  ← Back to Cart
                </button>
                <button
                  type="submit"
                  disabled={checkingOut}
                  style={{
                    flex: 2,
                    background: '#FF6B00',
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '15px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(255, 107, 0, 0.35)'
                  }}
                >
                  {checkingOut ? 'Opening Secure Gateway...' : `Proceed to Pay ₹${cartTotal.toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

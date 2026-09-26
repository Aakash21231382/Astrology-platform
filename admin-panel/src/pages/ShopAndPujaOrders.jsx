import React, { useState, useMemo } from 'react';
import { 
  MdShoppingBag, 
  MdSearch, 
  MdFilterList, 
  MdRefresh, 
  MdEdit, 
  MdClose,
  MdAttachMoney,
  MdTempleHindu,
  MdCheckCircle,
  MdLocalShipping,
  MdSwapHoriz
} from 'react-icons/md';
import ExportDropdown from '../components/ExportDropdown';
import { toast } from 'react-toastify';
import '../assets/css/admin-tables.css';

// Initial Mock Orders with address & phone
const INITIAL_ORDERS = [
  {
    id: 'ORD-8821',
    customerName: 'Rohit Sharma',
    phone: '+91 98765 43210',
    item: 'Natural Ceylon Yellow Sapphire (4.25ct)',
    type: 'STORE_PRODUCT',
    category: 'Gemstones',
    amount: 8500,
    status: 'CONFIRMED',
    orderDate: '2026-09-12 14:30',
    shippingAddress: 'Flat 402, Sunshine Heights, Andheri West, Mumbai, Maharashtra - 400053',
    trackingNumber: 'DELHIVERY-994821',
    fulfillmentNotes: 'Gemstone certified by GIA lab, energized with Guru Beej Mantra.'
  },
  {
    id: 'PUJA-4419',
    customerName: 'Priya Mehra',
    phone: '+91 98111 22334',
    item: 'Mahakaleshwar Kaal Sarp & Shani Shanti Mahapuja',
    type: 'TEMPLE_PUJA',
    temple: 'Shri Mahakaleshwar Jyotirlinga, Ujjain',
    amount: 3100,
    status: 'CONFIRMED',
    orderDate: '2026-09-12 11:15',
    shippingAddress: 'House 12, Sector 14, Gurugram, Haryana - 122001',
    devoteeName: 'Priya Mehra (Kashyap Gotra)',
    sankalpWish: 'Removal of career obstacles and health blessing',
    liveStreamUrl: 'https://youtube.com/live/ujjain-mahakal-stream-4419',
    fulfillmentNotes: 'Sankalp performed by 5 Acharyas. Holy Bhasma and dry Prasad dispatched.'
  },
  {
    id: 'ORD-8819',
    customerName: 'Amit Verma',
    phone: '+91 97654 32109',
    item: '24K Gold-Plated Meru Shree Yantra (Solid Brass)',
    type: 'STORE_PRODUCT',
    category: 'Yantras',
    amount: 3499,
    status: 'DISPATCHED',
    orderDate: '2026-09-11 16:45',
    shippingAddress: 'B-104, Green Park Society, Bannerghatta Road, Bangalore, Karnataka - 560076',
    trackingNumber: 'BLUEDART-8839210',
    fulfillmentNotes: 'Packed in protective wooden box with certification certificate.'
  },
  {
    id: 'PUJA-4418',
    customerName: 'Vikram Malhotra',
    phone: '+91 99887 76655',
    item: 'Maa Baglamukhi Shatru Vinashak & Vijay Havan',
    type: 'TEMPLE_PUJA',
    temple: 'Maa Baglamukhi Mandir, Nalkheda',
    amount: 4500,
    status: 'COMPLETED',
    orderDate: '2026-09-10 09:30',
    shippingAddress: 'Plot 45, Civil Lines, Jaipur, Rajasthan - 302006',
    devoteeName: 'Vikram Malhotra & Family (Vashistha Gotra)',
    sankalpWish: 'Victory in high court property dispute',
    liveStreamUrl: 'https://youtube.com/live/baglamukhi-havan-4418',
    fulfillmentNotes: 'Ritual successfully concluded. Sealed copper yantra and yellow mustard prasad delivered.'
  }
];

export default function ShopAndPujaOrders() {
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [search, setSearch] = useState('');
  const [activeOrderTab, setActiveOrderTab] = useState('ALL'); // 'ALL' | 'STORE_PRODUCT' | 'TEMPLE_PUJA'
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Edit Order Fulfillment Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
  const [fulfillForm, setFulfillForm] = useState({
    status: '',
    trackingNumber: '',
    liveStreamUrl: '',
    fulfillmentNotes: ''
  });

  const handleOpenFulfillModal = (order) => {
    setSelectedOrder(order);
    setFulfillForm({
      status: order.status,
      trackingNumber: order.trackingNumber || '',
      liveStreamUrl: order.liveStreamUrl || '',
      fulfillmentNotes: order.fulfillmentNotes || ''
    });
    setFulfillModalOpen(true);
  };

  const handleSaveFulfill = (e) => {
    e.preventDefault();
    setOrders(prev => prev.map(o => {
      if (o.id === selectedOrder.id) {
        return {
          ...o,
          status: fulfillForm.status,
          trackingNumber: fulfillForm.trackingNumber,
          liveStreamUrl: fulfillForm.liveStreamUrl,
          fulfillmentNotes: fulfillForm.fulfillmentNotes
        };
      }
      return o;
    }));
    toast.success(`Order ${selectedOrder.id} status updated to ${fulfillForm.status}`);
    setFulfillModalOpen(false);
  };

  // Orders Filter
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (activeOrderTab !== 'ALL' && o.type !== activeOrderTab) return false;
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          o.id.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.item.toLowerCase().includes(q) ||
          o.phone.includes(q) ||
          o.shippingAddress?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, activeOrderTab, statusFilter, search]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
        return <span className="status-badge active">{status}</span>;
      case 'CONFIRMED':
      case 'ENERGIZING':
        return <span className="status-badge pending">{status}</span>;
      case 'DISPATCHED':
        return (
          <span className="status-badge" style={{ background: '#E0F2FE', color: '#0369A1', border: '1px solid #BAE6FD' }}>
            {status}
          </span>
        );
      case 'CANCELLED':
        return <span className="status-badge rejected">{status}</span>;
      default:
        return <span className="status-badge inactive">{status}</span>;
    }
  };

  return (
    <div className="admin-page-container">
      {/* Top Banner / Breadcrumb */}
      <div className="admin-page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MdShoppingBag style={{ color: '#EA580C' }} /> Store & Puja Orders Directory
          </h1>
          <p>Track customer purchases of consecrated remedies, temple puja bookings, address dispatch, and video darshan links.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <ExportDropdown
            data={filteredOrders}
            filename="Store_And_Puja_Orders"
            title="Astro Store & Temple Puja Orders Report"
            columns={[
              { header: 'Order ID', key: 'id' },
              { header: 'Customer Name', key: 'customerName' },
              { header: 'Phone Number', key: 'phone' },
              { header: 'Ordered Item / Puja', key: 'item' },
              { header: 'Type', key: 'type' },
              { header: 'Amount (INR)', key: 'amount' },
              { header: 'Fulfillment Status', key: 'status' },
              { header: 'Order Date', key: 'orderDate' },
              { header: 'Delivery Address', key: 'shippingAddress' },
              { header: 'Tracking / Stream URL', key: (row) => row.trackingNumber || row.liveStreamUrl || 'N/A' }
            ]}
          />
        </div>
      </div>

      {/* Top Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #fed7aa',
          boxShadow: '0 4px 16px -2px rgba(249, 115, 22, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#FFF7ED',
            color: '#EA580C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px'
          }}>
            <MdShoppingBag />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9A3412', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Orders
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              {orders.length}
            </div>
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #fed7aa',
          boxShadow: '0 4px 16px -2px rgba(249, 115, 22, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px'
          }}>
            <MdLocalShipping />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Physical Shipments
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              {orders.filter(o => o.type === 'STORE_PRODUCT').length} Orders
            </div>
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #fed7aa',
          boxShadow: '0 4px 16px -2px rgba(249, 115, 22, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px'
          }}>
            <MdTempleHindu />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Temple Rituals
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              {orders.filter(o => o.type === 'TEMPLE_PUJA').length} Bookings
            </div>
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid #fed7aa',
          boxShadow: '0 4px 16px -2px rgba(249, 115, 22, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: '#DCFCE7',
            color: '#15803D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px'
          }}>
            <MdAttachMoney />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Revenue
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
              ₹{totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* ORDERS TOOLBAR */}
      <div className="admin-filters-card" style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #fed7aa',
        marginBottom: '24px',
        boxShadow: '0 4px 16px -2px rgba(249, 115, 22, 0.08)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '280px', maxWidth: '450px' }}>
            <MdSearch style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
              fontSize: '20px'
            }} />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 42px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Type Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { label: 'All Orders', value: 'ALL' },
              { label: 'Store Products', value: 'STORE_PRODUCT' },
              { label: 'Temple Pujas', value: 'TEMPLE_PUJA' }
            ].map(tab => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveOrderTab(tab.value)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: activeOrderTab === tab.value ? 'none' : '1px solid #E2E8F0',
                  background: activeOrderTab === tab.value ? 'linear-gradient(135deg, #FF6B00 0%, #F97316 100%)' : '#FFFFFF',
                  color: activeOrderTab === tab.value ? '#FFFFFF' : '#475569',
                  boxShadow: activeOrderTab === tab.value ? '0 2px 8px rgba(249, 115, 22, 0.3)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MdFilterList style={{ color: '#EA580C', fontSize: '18px' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '10px',
                border: '1.5px solid #CBD5E1',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#334155',
                outline: 'none',
                background: '#FFFFFF'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed / Energizing</option>
              <option value="DISPATCHED">Dispatched / In-Transit</option>
              <option value="DELIVERED">Delivered / Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table with Horizontal Slider */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <div className="table-slider-hint">
          <MdSwapHoriz style={{ fontSize: '16px' }} /> Slide horizontally to view complete address, amount & fulfillment actions
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table" style={{ minWidth: '1180px', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '160px', minWidth: '160px' }}>ORDER & DATE</th>
              <th style={{ width: '180px', minWidth: '180px' }}>CUSTOMER & PHONE</th>
              <th style={{ width: '270px', minWidth: '270px' }}>ITEM / PUJA DETAILS</th>
              <th style={{ width: '270px', minWidth: '270px' }}>DELIVERY ADDRESS</th>
              <th style={{ width: '120px', minWidth: '120px' }}>AMOUNT</th>
              <th style={{ width: '130px', minWidth: '130px' }}>STATUS</th>
              <th style={{ width: '150px', minWidth: '150px', textAlign: 'right' }}>FULFILLMENT</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                  <MdShoppingBag style={{ fontSize: '42px', color: '#cbd5e1', marginBottom: '8px' }} />
                  <div>No orders match your criteria.</div>
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: '#EA580C', fontSize: '0.92rem' }}>
                      {order.id}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '3px' }}>
                      {order.orderDate}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                      {order.customerName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                      {order.phone}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>
                      {order.item}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>
                      {order.type === 'TEMPLE_PUJA' ? (
                        <span style={{ color: '#D97706', fontWeight: 600 }}>🛕 {order.temple}</span>
                      ) : (
                        <span style={{ color: '#2563EB', fontWeight: 600 }}>📦 Category: {order.category}</span>
                      )}
                    </div>
                    {order.devoteeName && (
                      <div style={{ fontSize: '0.74rem', color: '#EA580C', fontStyle: 'italic', marginTop: '2px' }}>
                        Sankalp: {order.devoteeName}
                      </div>
                    )}
                  </td>
                  <td style={{ maxWidth: '270px', width: '270px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                    <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: '1.4' }}>
                      {order.shippingAddress || 'N/A'}
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', minWidth: '120px' }}>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>
                      ₹{order.amount.toLocaleString()}
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(order.status)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenFulfillModal(order)}
                      className="btn-table-edit"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      <MdEdit /> Update Status
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Fulfillment Status Modal */}
      {fulfillModalOpen && selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '540px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#FFF7ED'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#9A3412' }}>
                Fulfill Order: {selectedOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setFulfillModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748B' }}
              >
                <MdClose />
              </button>
            </div>

            <form onSubmit={handleSaveFulfill} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Fulfillment Status
                </label>
                <select
                  value={fulfillForm.status}
                  onChange={(e) => setFulfillForm(prev => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                >
                  <option value="CONFIRMED">CONFIRMED (Order Received)</option>
                  <option value="ENERGIZING">ENERGIZING (Vedic Rituals in Progress)</option>
                  <option value="DISPATCHED">DISPATCHED (Courier Handover)</option>
                  <option value="DELIVERED">DELIVERED (Completed)</option>
                  <option value="COMPLETED">COMPLETED (Puja Done & Prasad Sent)</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              {selectedOrder.type === 'STORE_PRODUCT' ? (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Courier Tracking Number / AWB
                  </label>
                  <input
                    type="text"
                    value={fulfillForm.trackingNumber}
                    onChange={(e) => setFulfillForm(prev => ({ ...prev, trackingNumber: e.target.value }))}
                    placeholder="Enter Tracking Number"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Live Video Streaming Link / Darshan URL
                  </label>
                  <input
                    type="text"
                    value={fulfillForm.liveStreamUrl}
                    onChange={(e) => setFulfillForm(prev => ({ ...prev, liveStreamUrl: e.target.value }))}
                    placeholder="Enter Live Stream Link"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Fulfillment Notes & Dispatch Details
                </label>
                <textarea
                  rows="3"
                  value={fulfillForm.fulfillmentNotes}
                  onChange={(e) => setFulfillForm(prev => ({ ...prev, fulfillmentNotes: e.target.value }))}
                  placeholder="Enter Fulfillment Notes"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setFulfillModalOpen(false)}
                  className="btn-admin-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-admin-primary"
                >
                  Save & Notify Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

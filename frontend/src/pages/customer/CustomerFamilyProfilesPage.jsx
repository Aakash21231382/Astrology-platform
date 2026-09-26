import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  IoPersonAddOutline, 
  IoTrashOutline, 
  IoCreateOutline, 
  IoSparkles, 
  IoCalendarOutline, 
  IoTimeOutline, 
  IoLocationOutline,
  IoCheckmarkCircle
} from 'react-icons/io5';
import { toast } from 'react-toastify';
import { calculateKundali } from '../../utils/kundaliCalculator';

export default function CustomerFamilyProfilesPage() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState(() => {
    try {
      const saved = localStorage.getItem('seeker_family_profiles');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          name: 'Self',
          relation: 'Self',
          gender: 'Male',
          dob: '1995-08-15',
          tob: '07:45',
          pob: 'New Delhi, India'
        }
      ];
    } catch {
      return [];
    }
  });

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedKundali, setSelectedKundali] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relation: 'Spouse',
    gender: 'Female',
    dob: '',
    tob: '',
    pob: ''
  });

  useEffect(() => {
    localStorage.setItem('seeker_family_profiles', JSON.stringify(profiles));
  }, [profiles]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      relation: 'Spouse',
      gender: 'Female',
      dob: '',
      tob: '12:00',
      pob: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      relation: p.relation,
      gender: p.gender,
      dob: p.dob,
      tob: p.tob,
      pob: p.pob
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this family member profile?')) {
      setProfiles(prev => prev.filter(p => p.id !== id));
      toast.info('Profile removed');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.dob || !formData.pob.trim()) {
      toast.error('Please enter name, birth date, and birthplace');
      return;
    }

    if (editingId) {
      setProfiles(prev => prev.map(p => p.id === editingId ? { ...p, ...formData } : p));
      toast.success('Family profile updated!');
    } else {
      const newProfile = {
        id: Date.now(),
        ...formData
      };
      setProfiles(prev => [...prev, newProfile]);
      toast.success('Family member added to your Birth Vault!');
    }
    setShowModal(false);
  };

  const handleGenerateKundali = (profile) => {
    const k = calculateKundali({
      name: profile.name,
      dob: profile.dob,
      tob: profile.tob || '12:00',
      pob: profile.pob
    });
    setSelectedKundali(k);
    toast.success(`Kundali generated for ${profile.name}! 🔮`);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #FF6B00 0%, #0F172A 100%)',
        borderRadius: '16px',
        padding: '28px',
        color: '#ffffff',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#E2E8F0', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
            <IoSparkles /> Vedic Kundali Vault
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0 4px 0', color: '#ffffff' }}>
            Family Birth Profiles
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#e2e8f0', maxWidth: '520px' }}>
            Save birth details of family members for instant Kundali generation and 1-click sharing during astrologer consultations.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            background: '#E2E8F0',
            color: '#0F172A',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease'
          }}
        >
          <IoPersonAddOutline style={{ fontSize: '18px' }} />
          Add Family Member
        </button>
      </div>

      {/* Profiles Grid */}
      {profiles.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍👩‍👧‍👦</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
            No Family Profiles Saved Yet
          </h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
            Add birth charts for your spouse, children, or parents to quickly consult astrologers without typing repeatedly.
          </p>
          <button
            onClick={handleOpenAdd}
            style={{
              background: '#FF6B00',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + Add First Profile
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {profiles.map(p => (
            <div
              key={p.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '22px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span style={{
                      background: '#FFFFFF',
                      color: '#FF6B00',
                      border: '1px solid #E2E8F0',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      {p.relation}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: '8px 0 2px 0' }}>
                      {p.name}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {p.gender}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleOpenEdit(p)}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '6px',
                        cursor: 'pointer',
                        color: '#64748b'
                      }}
                      title="Edit Profile"
                    >
                      <IoCreateOutline style={{ fontSize: '16px' }} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fee2e2',
                        borderRadius: '8px',
                        padding: '6px',
                        cursor: 'pointer',
                        color: '#ef4444'
                      }}
                      title="Delete Profile"
                    >
                      <IoTrashOutline style={{ fontSize: '16px' }} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IoCalendarOutline style={{ color: '#FF6B00' }} />
                    <span>DOB: <strong>{p.dob}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IoTimeOutline style={{ color: '#FF6B00' }} />
                    <span>Time: <strong>{p.tob || '12:00'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IoLocationOutline style={{ color: '#FF6B00' }} />
                    <span>Place: <strong>{p.pob}</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleGenerateKundali(p)}
                style={{
                  marginTop: '16px',
                  background: '#FFFFFF',
                  border: '1.5px solid #FB923C',
                  color: '#FF6B00',
                  padding: '10px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#FF6B00';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.color = '#FF6B00';
                }}
              >
                <IoSparkles /> Generate Vedic Kundali
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Profile Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {editingId ? 'Edit Family Profile' : 'Add Family Member'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Relation *
                  </label>
                  <select
                    value={formData.relation}
                    onChange={e => setFormData({ ...formData, relation: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="Self">Self</option>
                    <option value="Spouse">Spouse (Wife / Husband)</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Friend">Friend</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Gender *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Time of Birth
                  </label>
                  <input
                    type="time"
                    value={formData.tob}
                    onChange={e => setFormData({ ...formData, tob: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Place of Birth (City, Country) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai, Maharashtra, India"
                  value={formData.pob}
                  onChange={e => setFormData({ ...formData, pob: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
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
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#FF6B00',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {editingId ? 'Update Profile' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kundali Details Modal */}
      {selectedKundali && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  🔮 {selectedKundali.name}'s Vedic Kundali
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  DOB: {selectedKundali.dob} • {selectedKundali.pob}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedKundali(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#78716c', textTransform: 'uppercase' }}>Ascendant (Lagna)</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FF6B00' }}>{selectedKundali.lagna?.sign}</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#78716c', textTransform: 'uppercase' }}>Moon Sign (Rashi)</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FF6B00' }}>{selectedKundali.moonSign}</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#78716c', textTransform: 'uppercase' }}>Sun Sign</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FF6B00' }}>{selectedKundali.sunSign}</div>
              </div>
              <div style={{ background: '#FFFFFF', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '11px', color: '#78716c', textTransform: 'uppercase' }}>Nakshatra</span>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#FF6B00' }}>{selectedKundali.nakshatra}</div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#334155', marginBottom: '8px' }}>
                Dosha Analysis
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Manglik Dosha:</span>
                  <span style={{ fontWeight: 700, color: selectedKundali.manglik?.isManglik ? '#ef4444' : '#FF6B00' }}>
                    {selectedKundali.manglik?.isManglik ? 'Active' : 'Not Present'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Shani Sade Sati:</span>
                  <span style={{ fontWeight: 700, color: selectedKundali.sadeSati?.active ? '#f59e0b' : '#FF6B00' }}>
                    {selectedKundali.sadeSati?.active ? selectedKundali.sadeSati.phase : 'No Active Sade Sati'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Kaal Sarp Yoga:</span>
                  <span style={{ fontWeight: 700, color: selectedKundali.kaalSarp?.detected ? '#ef4444' : '#FF6B00' }}>
                    {selectedKundali.kaalSarp?.detected ? selectedKundali.kaalSarp.type : 'Clean'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedKundali(null)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: '#FF6B00',
                color: '#ffffff',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Close Kundali
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

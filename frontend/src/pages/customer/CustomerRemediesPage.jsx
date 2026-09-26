import React, { useState, useEffect } from 'react';
import { 
  IoSparkles, 
  IoCheckmarkCircle, 
  IoEllipseOutline, 
  IoStar, 
  IoFlameOutline, 
  IoGiftOutline, 
  IoCalendarOutline,
  IoAddOutline,
  IoTrashOutline
} from 'react-icons/io5';
import { toast } from 'react-toastify';

export default function CustomerRemediesPage() {
  const [remedies, setRemedies] = useState(() => {
    try {
      const saved = localStorage.getItem('seeker_remedies_list');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          title: 'Surya Arghya at Sunrise',
          type: 'RITUAL',
          frequency: 'Daily (7:00 AM)',
          day: 'Sunday',
          mantra: 'Om Suryaya Namaha (11 times)',
          completed: true,
          expertName: 'Acharya Sharma'
        },
        {
          id: 2,
          title: 'Mahamrityunjaya Mantra Chanting',
          type: 'MANTRA',
          frequency: '108 Repetitions (Mala)',
          day: 'Monday',
          mantra: 'Om Tryambakam Yajamahe Sugandhim Pushtivardhanam...',
          completed: false,
          expertName: 'Dr. Radhika Shastri'
        },
        {
          id: 3,
          title: 'Feed Green Fodder to Cows (Gau Seva)',
          type: 'CHARITY',
          frequency: 'Weekly',
          day: 'Wednesday',
          mantra: 'Removes Budh (Mercury) Dosha',
          completed: false,
          expertName: 'Pt. Rameshwar'
        },
        {
          id: 4,
          title: 'Light Mustard Oil Lamp under Peepal Tree',
          type: 'SHANI_REMEDY',
          frequency: 'Weekly Evening',
          day: 'Saturday',
          mantra: 'Om Sham Shanaishcharaye Namah',
          completed: false,
          expertName: 'Pt. Rameshwar'
        }
      ];
    } catch {
      return [];
    }
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newRemedy, setNewRemedy] = useState({
    title: '',
    type: 'MANTRA',
    frequency: 'Daily',
    day: 'All Days',
    mantra: '',
    expertName: 'Personal / Consultation'
  });

  useEffect(() => {
    localStorage.setItem('seeker_remedies_list', JSON.stringify(remedies));
  }, [remedies]);

  const toggleComplete = (id) => {
    setRemedies(prev => prev.map(r => {
      if (r.id === id) {
        const nextState = !r.completed;
        if (nextState) {
          toast.success('Punya Karma logged! Remedy marked as completed 🙏');
        }
        return { ...r, completed: nextState };
      }
      return r;
    }));
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this remedy from your tracker?')) {
      setRemedies(prev => prev.filter(r => r.id !== id));
      toast.info('Remedy removed');
    }
  };

  const handleAddRemedy = (e) => {
    e.preventDefault();
    if (!newRemedy.title.trim()) {
      toast.error('Please enter a remedy title');
      return;
    }
    const created = {
      id: Date.now(),
      ...newRemedy,
      completed: false
    };
    setRemedies(prev => [created, ...prev]);
    toast.success('Sacred remedy added to your daily tracker!');
    setShowAddModal(false);
    setNewRemedy({
      title: '',
      type: 'MANTRA',
      frequency: 'Daily',
      day: 'All Days',
      mantra: '',
      expertName: 'Personal'
    });
  };

  const completedCount = remedies.filter(r => r.completed).length;
  const progressPercent = remedies.length > 0 ? Math.round((completedCount / remedies.length) * 100) : 0;

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
            <IoSparkles /> Vedic Upay & Sadhana
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0 4px 0', color: '#ffffff' }}>
            Sacred Remedies Tracker
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: '#e2e8f0', maxWidth: '520px' }}>
            Keep track of all astrologer-suggested Upays, daily mantras, and charitable remedies to balance your planetary doshas.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
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
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)'
          }}
        >
          <IoAddOutline style={{ fontSize: '18px' }} />
          Add Custom Remedy
        </button>
      </div>

      {/* Progress & Stats Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid #e2e8f0',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '2px solid #FF6B00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: '#FF6B00',
            fontSize: '15px'
          }}>
            {progressPercent}%
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '16px' }}>
              Karma Sadhana Progress
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              {completedCount} of {remedies.length} remedies completed today
            </div>
          </div>
        </div>

        <div style={{
          width: '260px',
          height: '10px',
          background: '#f1f5f9',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: 'linear-gradient(90deg, #FB923C, #FF6B00)',
            transition: 'width 0.4s ease'
          }} />
        </div>
      </div>

      {/* Remedies List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {remedies.map(r => (
          <div
            key={r.id}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '20px',
              border: r.completed ? '1px solid #FB923C' : '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              transition: 'all 0.2s ease',
              opacity: r.completed ? 0.9 : 1
            }}
          >
            <button
              onClick={() => toggleComplete(r.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '28px',
                color: r.completed ? '#FF6B00' : '#cbd5e1',
                marginTop: '2px',
                padding: 0,
                display: 'flex'
              }}
              title={r.completed ? 'Mark pending' : 'Mark completed'}
            >
              {r.completed ? <IoCheckmarkCircle /> : <IoEllipseOutline />}
            </button>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <span style={{
                  background: '#FFFFFF',
                  color: '#FF6B00',
                  border: '1px solid #E2E8F0',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {r.type}
                </span>

                <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IoCalendarOutline /> {r.day} • {r.frequency}
                </span>

                {r.expertName && (
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Advised by {r.expertName}
                  </span>
                )}
              </div>

              <h3 style={{
                fontSize: '16px',
                fontWeight: 700,
                color: r.completed ? '#64748b' : '#0F172A',
                textDecoration: r.completed ? 'line-through' : 'none',
                margin: '0 0 6px 0'
              }}>
                {r.title}
              </h3>

              {r.mantra && (
                <div style={{
                  background: '#f8fafc',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  color: '#475569',
                  fontStyle: 'italic',
                  borderLeft: '3px solid #E2E8F0'
                }}>
                  "{r.mantra}"
                </div>
              )}
            </div>

            <button
              onClick={() => handleDelete(r.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px'
              }}
              title="Delete Remedy"
            >
              <IoTrashOutline />
            </button>
          </div>
        ))}
      </div>

      {/* Add Remedy Modal */}
      {showAddModal && (
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
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Add Sacred Remedy
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRemedy} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Remedy / Upay Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gayatri Mantra Chanting 24 times"
                  value={newRemedy.title}
                  onChange={e => setNewRemedy({ ...newRemedy, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Type
                  </label>
                  <select
                    value={newRemedy.type}
                    onChange={e => setNewRemedy({ ...newRemedy, type: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="MANTRA">Mantra Japa</option>
                    <option value="RITUAL">Puja / Ritual</option>
                    <option value="CHARITY">Daan / Charity</option>
                    <option value="GEMSTONE">Gemstone Upay</option>
                    <option value="FASTING">Vrat / Fasting</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Auspicious Day
                  </label>
                  <select
                    value={newRemedy.day}
                    onChange={e => setNewRemedy({ ...newRemedy, day: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value="All Days">Daily / All Days</option>
                    <option value="Sunday">Sunday (Surya)</option>
                    <option value="Monday">Monday (Chandra / Shiva)</option>
                    <option value="Tuesday">Tuesday (Mangal / Hanuman)</option>
                    <option value="Wednesday">Wednesday (Budh / Ganesha)</option>
                    <option value="Thursday">Thursday (Brihaspati / Vishnu)</option>
                    <option value="Friday">Friday (Shukra / Lakshmi)</option>
                    <option value="Saturday">Saturday (Shani Dev)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Frequency / Count
                </label>
                <input
                  type="text"
                  placeholder="e.g. 108 Times / Daily at Sunrise"
                  value={newRemedy.frequency}
                  onChange={e => setNewRemedy({ ...newRemedy, frequency: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Mantra / Instructions
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Om Bhur Bhuvah Svah..."
                  value={newRemedy.mantra}
                  onChange={e => setNewRemedy({ ...newRemedy, mantra: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  Save Remedy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

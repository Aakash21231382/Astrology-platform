import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';
import { toast } from 'react-toastify';
import { 
  MdSave, 
  MdSettings, 
  MdAdd, 
  MdDeleteOutline, 
  MdEdit, 
  MdOpenInNew, 
  MdRefresh, 
  MdHelpOutline,
  MdLocalOffer,
  MdFormatQuote,
  MdTimeline,
  MdGavel,
  MdCheckCircle,
  MdClose
} from 'react-icons/md';
import '../assets/css/admin-modals.css';
import '../assets/css/admin-cms.css';

export default function Settings() {
  // Navigation active tab: 'all' | 'faq' | 'offers' | 'about' | 'how-it-works' | 'policies' | 'platform'
  const [activeTab, setActiveTab] = useState('all');

  // 1. Platform Global Settings State
  const [commission, setCommission] = useState('20.00');
  const [supportEmail, setSupportEmail] = useState('support@astrology.com');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [savingPlatform, setSavingPlatform] = useState(false);

  // 2. FAQ Card State
  const [faqTitle, setFaqTitle] = useState('Frequently Asked Questions (FAQ)');
  const [faqMeta, setFaqMeta] = useState('Find answers to frequently asked questions regarding live consultations, wallet billing, and privacy.');
  const [faqList, setFaqList] = useState([]);
  const [faqForm, setFaqForm] = useState({ category: 'Consultations', question: '', answer: '' });
  const [editingFaqIdx, setEditingFaqIdx] = useState(null);
  const [savingFaq, setSavingFaq] = useState(false);

  // 3. Offers Card State
  const [offersTitle, setOffersTitle] = useState('Special Consultation Offers');
  const [offersMeta, setOffersMeta] = useState('Exclusive deals to begin your spiritual clarity journey with our verified psychics and astrologers.');
  const [offersList, setOffersList] = useState([]);
  const [offerForm, setOfferForm] = useState({ title: '', desc: '', code: '', tag: 'New Seekers' });
  const [editingOfferIdx, setEditingOfferIdx] = useState(null);
  const [savingOffers, setSavingOffers] = useState(false);

  // 4. About Us Card State
  const [aboutTitle, setAboutTitle] = useState("Guiding Your Life's Journey with Authentic Wisdom & Clarity");
  const [aboutMeta, setAboutMeta] = useState("We are a dedicated spiritual consultation platform bringing together genuine Vedic astrologers, intuitive tarot readers, numerologists, and psychic masters to help you navigate love, career, and life's deepest crossroads.");
  const [aboutContent, setAboutContent] = useState("");
  const [savingAbout, setSavingAbout] = useState(false);

  // 5. How It Works Card State
  const [howTitle, setHowTitle] = useState("How Live Consultations Work");
  const [howMeta, setHowMeta] = useState("Transparent, secure, and private guidance in just a few simple steps.");
  const [howSteps, setHowSteps] = useState([
    { step: 1, title: 'Select an Astrologer', desc: 'Filter by specialties such as Vedic, Tarot, or Numerology. Look for the green Active & Online badge.' },
    { step: 2, title: 'Recharge Wallet', desc: 'Add money safely with Razorpay. Funds stay in your wallet and are deducted strictly per minute of live session.' },
    { step: 3, title: 'Live Consultation', desc: 'Enjoy transparent real-time chat with countdown timers and promotional free minutes. End whenever you wish!' }
  ]);
  const [stepForm, setStepForm] = useState({ title: '', desc: '' });
  const [editingStepIdx, setEditingStepIdx] = useState(null);
  const [savingHow, setSavingHow] = useState(false);

  // 6. Policies State
  const [selectedPolicySlug, setSelectedPolicySlug] = useState('terms');
  const [policyData, setPolicyData] = useState({ title: '', metaDescription: '', content: '' });
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    loadAllPageData();
  }, []);

  const loadAllPageData = async () => {
    fetchPlatformSettings();
    loadFaqData();
    loadOffersData();
    loadAboutData();
    loadHowItWorksData();
    loadPolicyData('terms');
  };

  // ----------------------------------------------------
  // 1. Platform Settings
  // ----------------------------------------------------
  const fetchPlatformSettings = async () => {
    try {
      const res = await adminApi.getSettings();
      const list = res.data?.data || [];
      const comm = list.find((s) => s.key === 'platform_commission_percent');
      if (comm) setCommission(comm.value);
      const email = list.find((s) => s.key === 'support_email');
      if (email) setSupportEmail(email.value);
      const phone = list.find((s) => s.key === 'support_phone');
      if (phone) setSupportPhone(phone.value);
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingPlatform(true);
    try {
      await adminApi.updateSetting('platform_commission_percent', commission, 'Platform revenue share %');
      await adminApi.updateSetting('support_email', supportEmail, 'Platform customer support email');
      await adminApi.updateSetting('support_phone', supportPhone, 'Platform customer support helpline');
      toast.success('Platform configurations saved successfully!');
    } catch (err) {
      toast.error('Failed to update platform settings');
    } finally {
      setSavingPlatform(false);
    }
  };

  // ----------------------------------------------------
  // 2. FAQ Manager Handlers
  // ----------------------------------------------------
  const loadFaqData = async () => {
    try {
      const res = await adminApi.getCmsPage('faq');
      if (res.data?.data) {
        const item = res.data.data;
        if (item.title) setFaqTitle(item.title);
        if (item.metaDescription) setFaqMeta(item.metaDescription);
        if (item.content) {
          try {
            const parsed = JSON.parse(item.content);
            if (Array.isArray(parsed)) {
              setFaqList(parsed);
              return;
            }
          } catch (e) {
            // Not JSON
          }
        }
      }
    } catch (err) {
      console.warn('FAQ not seeded yet:', err);
    }
  };

  const handleAddOrUpdateFaq = (e) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      toast.warning('Please enter both question and answer');
      return;
    }

    if (editingFaqIdx !== null) {
      const updated = [...faqList];
      updated[editingFaqIdx] = { ...faqForm };
      setFaqList(updated);
      setEditingFaqIdx(null);
      toast.info('FAQ item updated in list');
    } else {
      setFaqList([...faqList, { ...faqForm }]);
      toast.success('New question added to list');
    }
    setFaqForm({ category: faqForm.category || 'Consultations', question: '', answer: '' });
  };

  const handleEditFaq = (idx) => {
    setEditingFaqIdx(idx);
    setFaqForm({ ...faqList[idx] });
  };

  const handleDeleteFaq = (idx) => {
    if (window.confirm('Delete this question from list?')) {
      const updated = faqList.filter((_, i) => i !== idx);
      setFaqList(updated);
      if (editingFaqIdx === idx) {
        setEditingFaqIdx(null);
        setFaqForm({ category: 'Consultations', question: '', answer: '' });
      }
      toast.info('Question removed from list');
    }
  };

  const handleSaveAllFaqs = async () => {
    setSavingFaq(true);
    try {
      await adminApi.upsertCmsPage({
        slug: 'faq',
        title: faqTitle.trim(),
        metaDescription: faqMeta.trim(),
        content: JSON.stringify(faqList, null, 2)
      });
      toast.success(`All ${faqList.length} FAQs published to live website!`);
    } catch (err) {
      toast.error('Failed to publish FAQ page');
    } finally {
      setSavingFaq(false);
    }
  };

  // ----------------------------------------------------
  // 3. Offers Manager Handlers
  // ----------------------------------------------------
  const loadOffersData = async () => {
    try {
      const res = await adminApi.getCmsPage('offers');
      if (res.data?.data) {
        const item = res.data.data;
        if (item.title) setOffersTitle(item.title);
        if (item.metaDescription) setOffersMeta(item.metaDescription);
        if (item.content) {
          try {
            const parsed = JSON.parse(item.content);
            if (Array.isArray(parsed)) {
              setOffersList(parsed);
              return;
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Offers not seeded yet:', err);
    }
  };

  const handleAddOrUpdateOffer = (e) => {
    e.preventDefault();
    if (!offerForm.title.trim() || !offerForm.desc.trim()) {
      toast.warning('Please enter offer title and description');
      return;
    }

    if (editingOfferIdx !== null) {
      const updated = [...offersList];
      updated[editingOfferIdx] = { ...offerForm };
      setOffersList(updated);
      setEditingOfferIdx(null);
      toast.info('Offer updated in list');
    } else {
      setOffersList([...offersList, { ...offerForm }]);
      toast.success('New offer deal added to list');
    }
    setOfferForm({ title: '', desc: '', code: '', tag: 'Special Offer' });
  };

  const handleEditOffer = (idx) => {
    setEditingOfferIdx(idx);
    setOfferForm({ ...offersList[idx] });
  };

  const handleDeleteOffer = (idx) => {
    if (window.confirm('Delete this promotional offer?')) {
      const updated = offersList.filter((_, i) => i !== idx);
      setOffersList(updated);
      if (editingOfferIdx === idx) {
        setEditingOfferIdx(null);
        setOfferForm({ title: '', desc: '', code: '', tag: 'Special Offer' });
      }
      toast.info('Offer removed from list');
    }
  };

  const handleSaveAllOffers = async () => {
    setSavingOffers(true);
    try {
      await adminApi.upsertCmsPage({
        slug: 'offers',
        title: offersTitle.trim(),
        metaDescription: offersMeta.trim(),
        content: JSON.stringify(offersList, null, 2)
      });
      toast.success(`All ${offersList.length} offers published to live website!`);
    } catch (err) {
      toast.error('Failed to publish Offers page');
    } finally {
      setSavingOffers(false);
    }
  };

  // ----------------------------------------------------
  // 4. About Us Handlers
  // ----------------------------------------------------
  const loadAboutData = async () => {
    try {
      const res = await adminApi.getCmsPage('about');
      if (res.data?.data) {
        const item = res.data.data;
        if (item.title) setAboutTitle(item.title);
        if (item.metaDescription) setAboutMeta(item.metaDescription);
        if (item.content) setAboutContent(item.content);
      }
    } catch (err) {
      console.warn('About page load error:', err);
    }
  };

  const handleSaveAbout = async (e) => {
    e.preventDefault();
    setSavingAbout(true);
    try {
      await adminApi.upsertCmsPage({
        slug: 'about',
        title: aboutTitle.trim(),
        metaDescription: aboutMeta.trim(),
        content: aboutContent.trim()
      });
      toast.success('About Us page updated and published!');
    } catch (err) {
      toast.error('Failed to update About Us page');
    } finally {
      setSavingAbout(false);
    }
  };

  // ----------------------------------------------------
  // 5. How It Works Handlers
  // ----------------------------------------------------
  const loadHowItWorksData = async () => {
    try {
      const res = await adminApi.getCmsPage('how-it-works');
      if (res.data?.data) {
        const item = res.data.data;
        if (item.title) setHowTitle(item.title);
        if (item.metaDescription) setHowMeta(item.metaDescription);
        if (item.content) {
          try {
            const parsed = JSON.parse(item.content);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setHowSteps(parsed);
              return;
            }
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('How It Works page load error:', err);
    }
  };

  const handleAddOrUpdateStep = (e) => {
    e.preventDefault();
    if (!stepForm.title.trim() || !stepForm.desc.trim()) {
      toast.warning('Please enter step title and description');
      return;
    }

    if (editingStepIdx !== null) {
      const updated = [...howSteps];
      updated[editingStepIdx] = { 
        step: editingStepIdx + 1, 
        title: stepForm.title.trim(), 
        desc: stepForm.desc.trim() 
      };
      setHowSteps(updated);
      setEditingStepIdx(null);
      toast.info('Step updated');
    } else {
      setHowSteps([...howSteps, { 
        step: howSteps.length + 1, 
        title: stepForm.title.trim(), 
        desc: stepForm.desc.trim() 
      }]);
      toast.success('New step added to guide');
    }
    setStepForm({ title: '', desc: '' });
  };

  const handleEditStep = (idx) => {
    setEditingStepIdx(idx);
    setStepForm({ title: howSteps[idx].title, desc: howSteps[idx].desc });
  };

  const handleDeleteStep = (idx) => {
    if (window.confirm('Delete this step?')) {
      const updated = howSteps
        .filter((_, i) => i !== idx)
        .map((st, i) => ({ ...st, step: i + 1 }));
      setHowSteps(updated);
      if (editingStepIdx === idx) {
        setEditingStepIdx(null);
        setStepForm({ title: '', desc: '' });
      }
      toast.info('Step removed');
    }
  };

  const handleSaveHowItWorks = async () => {
    setSavingHow(true);
    try {
      await adminApi.upsertCmsPage({
        slug: 'how-it-works',
        title: howTitle.trim(),
        metaDescription: howMeta.trim(),
        content: JSON.stringify(howSteps, null, 2)
      });
      toast.success(`How It Works guide published with ${howSteps.length} steps!`);
    } catch (err) {
      toast.error('Failed to update How It Works page');
    } finally {
      setSavingHow(false);
    }
  };

  // ----------------------------------------------------
  // 6. Policy Pages Handlers
  // ----------------------------------------------------
  const loadPolicyData = async (slug) => {
    setSelectedPolicySlug(slug);
    try {
      const res = await adminApi.getCmsPage(slug);
      if (res.data?.data) {
        setPolicyData({
          title: res.data.data.title || '',
          metaDescription: res.data.data.metaDescription || '',
          content: res.data.data.content || ''
        });
      }
    } catch (err) {
      setPolicyData({
        title: slug.toUpperCase().replace(/-/g, ' '),
        metaDescription: '',
        content: `Default legal terms for ${slug}...`
      });
    }
  };

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    setSavingPolicy(true);
    try {
      await adminApi.upsertCmsPage({
        slug: selectedPolicySlug,
        title: policyData.title.trim(),
        metaDescription: policyData.metaDescription.trim(),
        content: policyData.content.trim()
      });
      toast.success(`[${selectedPolicySlug}] policy published successfully!`);
    } catch (err) {
      toast.error('Failed to update policy');
    } finally {
      setSavingPolicy(false);
    }
  };

  // Helper live URL
  const getLivePageUrl = (slug) => {
    const frontendBase = window.location.origin.includes('5174') 
      ? window.location.origin.replace('5174', '5173') 
      : 'http://localhost:5173';
    return `${frontendBase}/${slug}`;
  };

  return (
    <div className="settings-page" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60 }}>
      {/* Top Filter & Card Jump Navigation Bar */}
      <div className="cms-card-nav-bar">
        <button 
          type="button" 
          className={`cms-nav-pill-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          📑 View All Cards
        </button>

        <button 
          type="button" 
          className={`cms-nav-pill-btn ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
        >
          <MdHelpOutline /> ❓ FAQ Page Card
        </button>

        <button 
          type="button" 
          className={`cms-nav-pill-btn ${activeTab === 'offers' ? 'active' : ''}`}
          onClick={() => setActiveTab('offers')}
        >
          <MdLocalOffer /> 🏷️ Special Offers Card
        </button>

        <button 
          type="button" 
          className={`cms-nav-pill-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          <MdFormatQuote /> 📖 About Us Card
        </button>

        <button 
          type="button" 
          className={`cms-nav-pill-btn ${activeTab === 'how-it-works' ? 'active' : ''}`}
          onClick={() => setActiveTab('how-it-works')}
        >
          <MdTimeline /> 🚀 How It Works Card
        </button>

        <button 
          type="button" 
          className={`cms-nav-pill-btn ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <MdGavel /> ⚖️ Legal & Policy Pages
        </button>

        <button 
          type="button" 
          className={`cms-nav-pill-btn ${activeTab === 'platform' ? 'active' : ''}`}
          onClick={() => setActiveTab('platform')}
        >
          <MdSettings /> ⚙️ Platform Global Settings
        </button>
      </div>

      {/* ============================================================ */}
      {/* CARD 1: PLATFORM GLOBAL SETTINGS                             */}
      {/* ============================================================ */}
      {(activeTab === 'all' || activeTab === 'platform') && (
        <div className="cms-dedicated-card">
          <div className="cms-card-header">
            <div className="cms-card-header-left">
              <div className="cms-card-icon-box">
                <MdSettings />
              </div>
              <div>
                <h2 className="cms-card-title">Platform Revenue & Contact Configurations</h2>
                <p className="cms-card-subtitle">Commission percentage and customer support helpline contacts</p>
              </div>
            </div>
          </div>

          <div className="cms-card-body">
            <form onSubmit={handleSaveSettings}>
              <div className="cms-form-row">
                <div className="form-group">
                  <label>Platform Commission Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Current expert deduction share per minute</span>
                </div>

                <div className="form-group">
                  <label>Customer Support Email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Helpline Telephone</label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="cms-btn-save-card" disabled={savingPlatform}>
                <MdSave />
                <span>{savingPlatform ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CARD 2: DEDICATED FAQ MANAGER CARD                            */}
      {/* ============================================================ */}
      {(activeTab === 'all' || activeTab === 'faq') && (
        <div className="cms-dedicated-card">
          <div className="cms-card-header">
            <div className="cms-card-header-left">
              <div className="cms-card-icon-box" style={{ background: 'rgba(84, 107, 65, 0.15)' }}>
                <MdHelpOutline />
              </div>
              <div>
                <h2 className="cms-card-title">Frequently Asked Questions (FAQ) Page Card</h2>
                <p className="cms-card-subtitle">
                  Visual form to add, edit, or delete questions. No JSON required! (Live at /faq)
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a 
                href={getLivePageUrl('faq')} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="cms-live-link-btn"
              >
                <MdOpenInNew /> View Live FAQ Page
              </a>
            </div>
          </div>

          <div className="cms-card-body">
            {/* Header info inputs */}
            <div className="cms-form-row" style={{ marginBottom: 20 }}>
              <div className="form-group">
                <label>Page Title</label>
                <input
                  type="text"
                  value={faqTitle}
                  onChange={(e) => setFaqTitle(e.target.value)}
                  placeholder="Frequently Asked Questions (FAQ)"
                />
              </div>
              <div className="form-group">
                <label>SEO Subtitle / Description</label>
                <input
                  type="text"
                  value={faqMeta}
                  onChange={(e) => setFaqMeta(e.target.value)}
                  placeholder="Find answers regarding live consultations and billing..."
                />
              </div>
            </div>

            {/* Sub-form: Add / Edit FAQ */}
            <div className="cms-subform-box">
              <div className="cms-subform-title">
                {editingFaqIdx !== null ? <MdEdit /> : <MdAdd />}
                <span>{editingFaqIdx !== null ? `Edit Question #${editingFaqIdx + 1}` : 'Add New Question to FAQ'}</span>
              </div>

              <form onSubmit={handleAddOrUpdateFaq}>
                <div className="cms-form-row">
                  <div className="form-group">
                    <label>Category (e.g. Consultations, Billing & Wallet, Privacy, Astrologers)</label>
                    <input
                      type="text"
                      list="faq-categories-list"
                      value={faqForm.category}
                      onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                      placeholder="Enter or select category..."
                      required
                    />
                    <datalist id="faq-categories-list">
                      <option value="Consultations" />
                      <option value="Billing & Wallet" />
                      <option value="Privacy & Security" />
                      <option value="Astrologers" />
                      <option value="General" />
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label>Question Title</label>
                    <input
                      type="text"
                      value={faqForm.question}
                      onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                      placeholder="Enter Question Title"
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Detailed Answer</label>
                  <textarea
                    rows="3"
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    placeholder="Provide a clear, helpful answer for your seekers..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    type="submit" 
                    className="cms-btn-save-card"
                    style={{ background: 'var(--admin-primary-gradient, linear-gradient(135deg, #FF6B00 0%, #F97316 100%))', padding: '8px 18px', fontSize: '0.88rem' }}
                  >
                    {editingFaqIdx !== null ? <MdCheckCircle /> : <MdAdd />}
                    <span>{editingFaqIdx !== null ? 'Update Question' : '+ Add Question to List'}</span>
                  </button>
                  {editingFaqIdx !== null && (
                    <button
                      type="button"
                      className="cms-action-btn-del"
                      onClick={() => {
                        setEditingFaqIdx(null);
                        setFaqForm({ category: 'Consultations', question: '', answer: '' });
                      }}
                    >
                      <MdClose /> Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List of Active FAQs */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, color: '#0F172A', fontSize: '1rem', fontWeight: 800 }}>
                  Active Questions on Website ({faqList.length})
                </h4>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Click Edit to modify or Delete to remove
                </span>
              </div>

              {faqList.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: 8 }}>
                  No questions in list yet. Use the form above to add your first FAQ question!
                </div>
              ) : (
                <div className="cms-items-list">
                  {faqList.map((item, idx) => (
                    <div key={idx} className="cms-item-card">
                      <div className="cms-item-card-content">
                        <span className="cms-item-badge">{item.category || 'General'}</span>
                        <h4 className="cms-item-card-title">{idx + 1}. {item.question}</h4>
                        <p className="cms-item-card-desc">{item.answer}</p>
                      </div>
                      <div className="cms-item-actions">
                        <button
                          type="button"
                          className="cms-action-btn-edit"
                          onClick={() => handleEditFaq(idx)}
                        >
                          <MdEdit /> Edit
                        </button>
                        <button
                          type="button"
                          className="cms-action-btn-del"
                          onClick={() => handleDeleteFaq(idx)}
                        >
                          <MdDeleteOutline /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button for FAQ */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={handleSaveAllFaqs}
                disabled={savingFaq}
                className="cms-btn-save-card"
                style={{ padding: '12px 28px', fontSize: '1rem' }}
              >
                <MdSave />
                <span>{savingFaq ? 'Publishing FAQs...' : 'Save All FAQs to Live Website'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CARD 3: DEDICATED SPECIAL OFFERS & DISCOUNTS CARD             */}
      {/* ============================================================ */}
      {(activeTab === 'all' || activeTab === 'offers') && (
        <div className="cms-dedicated-card">
          <div className="cms-card-header">
            <div className="cms-card-header-left">
              <div className="cms-card-icon-box" style={{ background: 'rgba(153, 173, 122, 0.2)' }}>
                <MdLocalOffer />
              </div>
              <div>
                <h2 className="cms-card-title">Offers & Promotions Page Card</h2>
                <p className="cms-card-subtitle">
                  Visual form to manage promotional deals and discount coupon cards. (Live at /offers)
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a 
                href={getLivePageUrl('offers')} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="cms-live-link-btn"
              >
                <MdOpenInNew /> View Live Offers Page
              </a>
            </div>
          </div>

          <div className="cms-card-body">
            {/* Header info inputs */}
            <div className="cms-form-row" style={{ marginBottom: 20 }}>
              <div className="form-group">
                <label>Page Title</label>
                <input
                  type="text"
                  value={offersTitle}
                  onChange={(e) => setOffersTitle(e.target.value)}
                  placeholder="Special Consultation Offers"
                />
              </div>
              <div className="form-group">
                <label>SEO Subtitle / Description</label>
                <input
                  type="text"
                  value={offersMeta}
                  onChange={(e) => setOffersMeta(e.target.value)}
                  placeholder="Exclusive deals to begin your spiritual clarity journey..."
                />
              </div>
            </div>

            {/* Sub-form: Add / Edit Offer */}
            <div className="cms-subform-box">
              <div className="cms-subform-title">
                {editingOfferIdx !== null ? <MdEdit /> : <MdAdd />}
                <span>{editingOfferIdx !== null ? `Edit Offer #${editingOfferIdx + 1}` : 'Create New Promotional Offer Card'}</span>
              </div>

              <form onSubmit={handleAddOrUpdateOffer}>
                <div className="cms-form-row">
                  <div className="form-group">
                    <label>Offer Title</label>
                    <input
                      type="text"
                      value={offerForm.title}
                      onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                      placeholder="Enter Offer Title"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Coupon Code (Optional)</label>
                    <input
                      type="text"
                      value={offerForm.code}
                      onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })}
                      placeholder="Enter Coupon Code"
                    />
                  </div>
                  <div className="form-group">
                    <label>Badge / Tag (e.g. New Seekers, Limited Period)</label>
                    <input
                      type="text"
                      value={offerForm.tag}
                      onChange={(e) => setOfferForm({ ...offerForm, tag: e.target.value })}
                      placeholder="New Seekers"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Offer Description</label>
                  <textarea
                    rows="2"
                    value={offerForm.desc}
                    onChange={(e) => setOfferForm({ ...offerForm, desc: e.target.value })}
                    placeholder="Brief description of who gets the offer and how to use it..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    type="submit" 
                    className="cms-btn-save-card"
                    style={{ background: 'var(--admin-primary-gradient, linear-gradient(135deg, #FF6B00 0%, #F97316 100%))', padding: '8px 18px', fontSize: '0.88rem' }}
                  >
                    {editingOfferIdx !== null ? <MdCheckCircle /> : <MdAdd />}
                    <span>{editingOfferIdx !== null ? 'Update Offer' : '+ Add Offer to List'}</span>
                  </button>
                  {editingOfferIdx !== null && (
                    <button
                      type="button"
                      className="cms-action-btn-del"
                      onClick={() => {
                        setEditingOfferIdx(null);
                        setOfferForm({ title: '', desc: '', code: '', tag: 'Special Offer' });
                      }}
                    >
                      <MdClose /> Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List of Active Offers */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, color: '#0F172A', fontSize: '1rem', fontWeight: 800 }}>
                  Active Promotional Cards ({offersList.length})
                </h4>
              </div>

              {offersList.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#64748B', background: '#F8FAFC', borderRadius: 8 }}>
                  No active offers. Use the form above to add a new deal!
                </div>
              ) : (
                <div className="cms-offers-grid">
                  {offersList.map((offer, idx) => (
                    <div key={idx} className="cms-offer-item-card">
                      <div>
                        <span className="cms-item-badge">{offer.tag || 'Offer'}</span>
                        <h4 style={{ margin: '6px 0', fontSize: '1.05rem', color: '#0F172A', fontWeight: 800 }}>
                          {offer.title}
                        </h4>
                        <p style={{ margin: '0 0 10px 0', fontSize: '0.86rem', color: '#475569', lineHeight: 1.5 }}>
                          {offer.desc}
                        </p>
                        {offer.code && (
                          <span className="cms-offer-code-tag">
                            CODE: <strong>{offer.code}</strong>
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
                        <button
                          type="button"
                          className="cms-action-btn-edit"
                          onClick={() => handleEditOffer(idx)}
                        >
                          <MdEdit /> Edit
                        </button>
                        <button
                          type="button"
                          className="cms-action-btn-del"
                          onClick={() => handleDeleteOffer(idx)}
                        >
                          <MdDeleteOutline /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Button for Offers */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={handleSaveAllOffers}
                disabled={savingOffers}
                className="cms-btn-save-card"
                style={{ padding: '12px 28px', fontSize: '1rem' }}
              >
                <MdSave />
                <span>{savingOffers ? 'Publishing Offers...' : 'Save All Offers to Live Website'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CARD 4: DEDICATED ABOUT US CARD                               */}
      {/* ============================================================ */}
      {(activeTab === 'all' || activeTab === 'about') && (
        <div className="cms-dedicated-card">
          <div className="cms-card-header">
            <div className="cms-card-header-left">
              <div className="cms-card-icon-box" style={{ background: 'rgba(220, 204, 172, 0.4)' }}>
                <MdFormatQuote />
              </div>
              <div>
                <h2 className="cms-card-title">About Us Page Card</h2>
                <p className="cms-card-subtitle">
                  Configure brand purpose, story, and mission in a simple form. (Live at /about)
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a 
                href={getLivePageUrl('about')} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="cms-live-link-btn"
              >
                <MdOpenInNew /> View Live About Page
              </a>
            </div>
          </div>

          <div className="cms-card-body">
            <form onSubmit={handleSaveAbout}>
              <div className="cms-form-row">
                <div className="form-group">
                  <label>Hero Main Title</label>
                  <input
                    type="text"
                    value={aboutTitle}
                    onChange={(e) => setAboutTitle(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label>Lead Intro Text (Displayed prominently on top)</label>
                <textarea
                  rows="3"
                  value={aboutMeta}
                  onChange={(e) => setAboutMeta(e.target.value)}
                  placeholder="Introductory overview of your sanctuary..."
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>Our Purpose & Story Content (Paragraphs)</label>
                <textarea
                  rows="7"
                  value={aboutContent}
                  onChange={(e) => setAboutContent(e.target.value)}
                  placeholder="Explain why the platform was founded, transparency in billing, verified astrologers, etc."
                />
                <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                  Write normal paragraphs. Line breaks will automatically format into clean paragraphs on the live site.
                </span>
              </div>

              <button type="submit" className="cms-btn-save-card" disabled={savingAbout}>
                <MdSave />
                <span>{savingAbout ? 'Publishing About Us...' : 'Save & Publish About Us Page'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CARD 5: DEDICATED HOW IT WORKS CARD                           */}
      {/* ============================================================ */}
      {(activeTab === 'all' || activeTab === 'how-it-works') && (
        <div className="cms-dedicated-card">
          <div className="cms-card-header">
            <div className="cms-card-header-left">
              <div className="cms-card-icon-box">
                <MdTimeline />
              </div>
              <div>
                <h2 className="cms-card-title">How It Works User Guide Card</h2>
                <p className="cms-card-subtitle">
                  Configure the 3-step consultation guide cards with direct form inputs. (Live at /how-it-works)
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a 
                href={getLivePageUrl('how-it-works')} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="cms-live-link-btn"
              >
                <MdOpenInNew /> View Live How It Works
              </a>
            </div>
          </div>

          <div className="cms-card-body">
            <div className="cms-form-row" style={{ marginBottom: 20 }}>
              <div className="form-group">
                <label>Guide Header Title</label>
                <input
                  type="text"
                  value={howTitle}
                  onChange={(e) => setHowTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Guide Subtitle</label>
                <input
                  type="text"
                  value={howMeta}
                  onChange={(e) => setHowMeta(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Sub-form: Add / Edit Step */}
            <div className="cms-subform-box">
              <div className="cms-subform-title">
                {editingStepIdx !== null ? <MdEdit /> : <MdAdd />}
                <span>{editingStepIdx !== null ? `Edit Step #${editingStepIdx + 1}` : 'Add Next Guide Step'}</span>
              </div>

              <form onSubmit={handleAddOrUpdateStep}>
                <div className="cms-form-row">
                  <div className="form-group">
                    <label>Step Title (e.g. Select Astrologer, Recharge Wallet)</label>
                    <input
                      type="text"
                      value={stepForm.title}
                      onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })}
                      placeholder="Enter Step Title"
                      required
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Step Description</label>
                  <textarea
                    rows="2"
                    value={stepForm.desc}
                    onChange={(e) => setStepForm({ ...stepForm, desc: e.target.value })}
                    placeholder="Short instructions for the seeker..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    type="submit" 
                    className="cms-btn-save-card"
                    style={{ background: 'var(--admin-primary-gradient, linear-gradient(135deg, #FF6B00 0%, #F97316 100%))', padding: '8px 18px', fontSize: '0.88rem' }}
                  >
                    {editingStepIdx !== null ? <MdCheckCircle /> : <MdAdd />}
                    <span>{editingStepIdx !== null ? 'Update Step' : '+ Add Step Card'}</span>
                  </button>
                  {editingStepIdx !== null && (
                    <button
                      type="button"
                      className="cms-action-btn-del"
                      onClick={() => {
                        setEditingStepIdx(null);
                        setStepForm({ title: '', desc: '' });
                      }}
                    >
                      <MdClose /> Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List of Steps */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#1E293B', fontSize: '1rem', fontWeight: 700 }}>
                Active Steps in Sequence ({howSteps.length})
              </h4>
              <div className="cms-items-list">
                {howSteps.map((item, idx) => (
                  <div key={idx} className="cms-item-card">
                    <div className="cms-item-card-content">
                      <span className="cms-item-badge">STEP {idx + 1}</span>
                      <h4 className="cms-item-card-title">{item.title}</h4>
                      <p className="cms-item-card-desc">{item.desc}</p>
                    </div>
                    <div className="cms-item-actions">
                      <button
                        type="button"
                        className="cms-action-btn-edit"
                        onClick={() => handleEditStep(idx)}
                      >
                        <MdEdit /> Edit
                      </button>
                      <button
                        type="button"
                        className="cms-action-btn-del"
                        onClick={() => handleDeleteStep(idx)}
                      >
                        <MdDeleteOutline /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button for How It Works */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={handleSaveHowItWorks}
                disabled={savingHow}
                className="cms-btn-save-card"
                style={{ padding: '12px 28px', fontSize: '1rem' }}
              >
                <MdSave />
                <span>{savingHow ? 'Publishing...' : 'Save & Publish How It Works Guide'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CARD 6: DEDICATED LEGAL & POLICY PAGES CARD                   */}
      {/* ============================================================ */}
      {(activeTab === 'all' || activeTab === 'policies') && (
        <div className="cms-dedicated-card">
          <div className="cms-card-header">
            <div className="cms-card-header-left">
              <div className="cms-card-icon-box">
                <MdGavel />
              </div>
              <div>
                <h2 className="cms-card-title">Legal & Trust Policies Card</h2>
                <p className="cms-card-subtitle">
                  Edit Terms & Conditions, Privacy Policy, Refund Policy, and Spiritual Disclaimer.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <a 
                href={getLivePageUrl(selectedPolicySlug)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="cms-live-link-btn"
              >
                <MdOpenInNew /> View Live [{selectedPolicySlug}]
              </a>
            </div>
          </div>

          <div className="cms-card-body">
            {/* Policy Selector Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {[
                { slug: 'terms', label: 'Terms & Conditions' },
                { slug: 'privacy', label: 'Privacy Policy' },
                { slug: 'refund', label: 'Refund Policy' },
                { slug: 'disclaimer', label: 'Spiritual Disclaimer' }
              ].map((pol) => (
                <button
                  key={pol.slug}
                  type="button"
                  onClick={() => loadPolicyData(pol.slug)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    fontSize: '0.85rem',
                    fontWeight: selectedPolicySlug === pol.slug ? 700 : 500,
                    background: selectedPolicySlug === pol.slug ? 'var(--admin-primary-gradient, linear-gradient(135deg, #FF6B00 0%, #F97316 100%))' : '#FFF7ED',
                    color: selectedPolicySlug === pol.slug ? '#FFFFFF' : '#9A3412',
                    border: selectedPolicySlug === pol.slug ? '1px solid #F97316' : '1px solid #FED7AA',
                    cursor: 'pointer'
                  }}
                >
                  {pol.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSavePolicy}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Policy Title</label>
                <input
                  type="text"
                  value={policyData.title}
                  onChange={(e) => setPolicyData({ ...policyData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>SEO Meta Description</label>
                <input
                  type="text"
                  value={policyData.metaDescription}
                  onChange={(e) => setPolicyData({ ...policyData, metaDescription: e.target.value })}
                  placeholder="Short description for legal search..."
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label>Policy Body Content (Paragraphs)</label>
                <textarea
                  rows="10"
                  value={policyData.content}
                  onChange={(e) => setPolicyData({ ...policyData, content: e.target.value })}
                  placeholder="Enter policy legal clauses..."
                  required
                />
              </div>

              <button type="submit" className="cms-btn-save-card" disabled={savingPolicy}>
                <MdSave />
                <span>{savingPolicy ? 'Publishing Policy...' : `Save & Publish [${selectedPolicySlug}] Policy`}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

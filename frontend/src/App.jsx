import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import PromotionalPopup from './components/PromotionalPopup';
import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import Experts from './pages/Experts';
import ExpertDetail from './pages/ExpertDetail';
import Categories from './pages/Categories';
import Offers from './pages/Offers';
import HowItWorks from './pages/HowItWorks';
import Login from './pages/Login';
import Register from './pages/Register';
import ExpertSignup from './pages/ExpertSignup';
import ExpertPending from './pages/ExpertPending';
import ConsultationRoom from './pages/ConsultationRoom';
import CmsPage from './pages/CmsPage';
import About from './pages/About';
import Faq from './pages/Faq';

// Astro Store & Temple Puja
import Shop from './pages/Shop';
import Puja from './pages/Puja';

// Customer Modular Portal Components
import CustomerLayout from './pages/customer/CustomerLayout';
import CustomerOverviewPage from './pages/customer/CustomerOverviewPage';
import CustomerConsultationsPage from './pages/customer/CustomerConsultationsPage';
import CustomerWalletPage from './pages/customer/CustomerWalletPage';
import CustomerAstrologersPage from './pages/customer/CustomerAstrologersPage';
import CustomerProfilePage from './pages/customer/CustomerProfilePage';
import CustomerSupportPage from './pages/customer/CustomerSupportPage';
import CustomerFamilyProfilesPage from './pages/customer/CustomerFamilyProfilesPage';
import CustomerRemediesPage from './pages/customer/CustomerRemediesPage';

// Expert Modular Portal Components
import ExpertLayout from './pages/expert/ExpertLayout';
import DashboardPage from './pages/expert/DashboardPage';
import MyProfilesPage from './pages/expert/MyProfilesPage';
import AccountDetailsPage from './pages/expert/AccountDetailsPage';
import CreateProfilePage from './pages/expert/CreateProfilePage';
import ChangePasswordPage from './pages/expert/ChangePasswordPage';
import WithdrawalsPage from './pages/expert/WithdrawalsPage';
import MyPaymentPage from './pages/expert/MyPaymentPage';
import LiveChatPage from './pages/expert/LiveChatPage';
import LiveCallPage from './pages/expert/LiveCallPage';
import ChatHistoryPage from './pages/expert/ChatHistoryPage';
import MailboxPage from './pages/expert/MailboxPage';
import MyClientsPage from './pages/expert/MyClientsPage';
import PaymentOptionsPage from './pages/expert/PaymentOptionsPage';
import ProfilePicturePage from './pages/expert/ProfilePicturePage';
import AddCreditPage from './pages/expert/AddCreditPage';
import ManageDocumentsPage from './pages/expert/ManageDocumentsPage';
import AccountClosePage from './pages/expert/AccountClosePage';
import DownloadSoftwarePage from './pages/expert/DownloadSoftwarePage';
import LiveSchedulePage from './pages/expert/LiveSchedulePage';

import './assets/css/global.css';
import './assets/css/navbar.css';
import './assets/css/footer.css';
import './assets/css/home.css';
import './assets/css/experts.css';
import './assets/css/expert-profile.css';

export default function App() {
  const location = useLocation();
  const isChatRoom = location.pathname.startsWith('/consultation/');
  const isExpertPortal = location.pathname.startsWith('/expert/dashboard');
  const isCustomerPortal = location.pathname.startsWith('/dashboard');
  const isAuthPage = [
    '/login',
    '/register',
    '/expert/signup',
    '/expert/verification-pending'
  ].includes(location.pathname);

  const hideHeaderFooter = isChatRoom || isAuthPage || isExpertPortal || isCustomerPortal;

  return (
    <div className="app-layout">
      {/* Global Scroll to Top on Route Change & Floating Back to Top Button */}
      <ScrollToTop />

      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {/* Hide Navbar on Auth Pages, Consultation Room, Expert Portal & Customer Portal */}
      {!hideHeaderFooter && <Navbar />}

      {/* Global Promotional Popup Modal (From Admin Banners -> POPUP) */}
      {!isChatRoom && !isExpertPortal && !isCustomerPortal && <PromotionalPopup />}

      <main className="main-content">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/experts" element={<Experts />} />
          <Route path="/expert/:id" element={<ExpertDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/how-it-works" element={<HowItWorks />} />

          {/* Astro Remedies Store & Temple Puja */}
          <Route path="/shop" element={<Shop />} />
          <Route path="/puja" element={<Puja />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/expert/signup" element={<ExpertSignup />} />
          <Route path="/expert/verification-pending" element={<ExpertPending />} />

          {/* Customer Protected Modular Portal Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CustomerOverviewPage />} />
            <Route path="consultations" element={<CustomerConsultationsPage />} />
            <Route path="wallet" element={<CustomerWalletPage />} />
            <Route path="family-profiles" element={<CustomerFamilyProfilesPage />} />
            <Route path="remedies" element={<CustomerRemediesPage />} />
            <Route path="astrologers" element={<CustomerAstrologersPage />} />
            <Route path="profile" element={<CustomerProfilePage />} />
            <Route path="support" element={<CustomerSupportPage />} />
          </Route>

          {/* Expert Protected Modular Portal Routes */}
          <Route
            path="/expert/dashboard"
            element={
              <ProtectedRoute allowedRoles={['EXPERT']}>
                <ExpertLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="my-profiles" element={<MyProfilesPage />} />
            <Route path="account-details" element={<AccountDetailsPage />} />
            <Route path="schedule" element={<LiveSchedulePage />} />
            <Route path="create-profile" element={<CreateProfilePage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
            <Route path="withdrawals" element={<WithdrawalsPage />} />
            <Route path="payments" element={<MyPaymentPage />} />
            <Route path="live-chat" element={<LiveChatPage />} />
            <Route path="live-call" element={<LiveCallPage />} />
            <Route path="chat-history" element={<ChatHistoryPage />} />
            <Route path="mailbox" element={<MailboxPage />} />
            <Route path="clients" element={<MyClientsPage />} />
            <Route path="payment-options" element={<PaymentOptionsPage />} />
            <Route path="profile-picture" element={<ProfilePicturePage />} />
            <Route path="add-credit" element={<AddCreditPage />} />
            <Route path="documents" element={<ManageDocumentsPage />} />
            <Route path="account-close" element={<AccountClosePage />} />
            <Route path="software" element={<DownloadSoftwarePage />} />
          </Route>

          {/* Real-time Consultation Room */}
          <Route
            path="/consultation/:id"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'EXPERT', 'ADMIN']}>
                <ConsultationRoom />
              </ProtectedRoute>
            }
          />

          {/* CMS & Core Information Pages */}
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/terms" element={<CmsPage defaultSlug="terms" />} />
          <Route path="/privacy" element={<CmsPage defaultSlug="privacy" />} />
          <Route path="/refund" element={<CmsPage defaultSlug="refund" />} />
          <Route path="/disclaimer" element={<CmsPage defaultSlug="disclaimer" />} />
          <Route path="/page/:slug" element={<CmsPage />} />
        </Routes>
      </main>

      {/* Hide Footer on Auth Pages (Login, Sign Up, Expert Sign Up) & Consultation Room */}
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import PromotionalPopup from './components/PromotionalPopup';

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
import CustomerDashboard from './pages/CustomerDashboard';
import ExpertDashboard from './pages/ExpertDashboard';
import ConsultationRoom from './pages/ConsultationRoom';
import CmsPage from './pages/CmsPage';
import About from './pages/About';

import './assets/css/global.css';
import './assets/css/navbar.css';
import './assets/css/footer.css';
import './assets/css/home.css';
import './assets/css/experts.css';
import './assets/css/expert-profile.css';

export default function App() {
  const location = useLocation();
  const isChatRoom = location.pathname.startsWith('/consultation/');
  const isAuthPage = [
    '/login',
    '/register',
    '/expert/signup',
    '/expert/verification-pending'
  ].includes(location.pathname);

  const hideHeaderFooter = isChatRoom || isAuthPage;

  return (
    <div className="app-layout">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      {/* Hide Navbar on Auth Pages (Login, Sign Up, Expert Sign Up) & Consultation Room */}
      {!hideHeaderFooter && <Navbar />}

      {/* Global Promotional Popup Modal (From Admin Banners -> POPUP) */}
      {!isChatRoom && <PromotionalPopup />}

      <main className="main-content">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/experts" element={<Experts />} />
          <Route path="/expert/:id" element={<ExpertDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/how-it-works" element={<HowItWorks />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/expert/signup" element={<ExpertSignup />} />
          <Route path="/expert/verification-pending" element={<ExpertPending />} />

          {/* Customer Protected Pages */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Expert Protected Pages */}
          <Route
            path="/expert/dashboard"
            element={
              <ProtectedRoute allowedRoles={['EXPERT']}>
                <ExpertDashboard />
              </ProtectedRoute>
            }
          />

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

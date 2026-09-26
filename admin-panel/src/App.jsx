import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AdminAuthProvider } from './context/AdminAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import PendingExperts from './pages/PendingExperts';
import AllExperts from './pages/AllExperts';
import Users from './pages/Users';
import Banners from './pages/Banners';
import Categories from './pages/Categories';
import Withdrawals from './pages/Withdrawals';
import Settings from './pages/Settings';
import Consultations from './pages/Consultations';
import LiveChat from './pages/LiveChat';
import LiveCall from './pages/LiveCall';
import AccountCloseRequests from './pages/AccountCloseRequests';
import ExpertReviews from './pages/ExpertReviews';
import Broadcasts from './pages/Broadcasts';
import ExpertDocuments from './pages/ExpertDocuments';
import ShopAndPujaOrders from './pages/ShopAndPujaOrders';
import EcommerceProducts from './pages/EcommerceProducts';
import ProductFormPage from './pages/ProductFormPage';
import EcommercePujas from './pages/EcommercePujas';
import PujaFormPage from './pages/PujaFormPage';

import './assets/css/global.css';

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          theme="dark"
        />
        <Routes>
          <Route path="/login" element={<AdminLogin />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="experts/pending" element={<PendingExperts />} />
            <Route path="experts" element={<AllExperts />} />
            <Route path="live-chat" element={<LiveChat />} />
            <Route path="live-call" element={<LiveCall />} />
            <Route path="consultations" element={<Consultations />} />
            <Route path="experts/close-requests" element={<AccountCloseRequests />} />
            <Route path="experts/reviews" element={<ExpertReviews />} />
            <Route path="experts/documents" element={<ExpertDocuments />} />
            <Route path="broadcasts" element={<Broadcasts />} />
            <Route path="users" element={<Users />} />
            
            {/* E-Commerce & Pujas Dedicated Pages */}
            <Route path="orders" element={<ShopAndPujaOrders />} />
            <Route path="ecommerce/products" element={<EcommerceProducts />} />
            <Route path="ecommerce/products/add" element={<ProductFormPage />} />
            <Route path="ecommerce/products/edit/:id" element={<ProductFormPage />} />
            <Route path="ecommerce/pujas" element={<EcommercePujas />} />
            <Route path="ecommerce/pujas/add" element={<PujaFormPage />} />
            <Route path="ecommerce/pujas/edit/:id" element={<PujaFormPage />} />

            <Route path="banners" element={<Banners />} />
            <Route path="categories" element={<Categories />} />
            <Route path="withdrawals" element={<Withdrawals />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}

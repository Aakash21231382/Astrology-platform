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
            <Route path="users" element={<Users />} />
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

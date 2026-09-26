import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../services/api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('astrology_admin_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('astrology_admin_user');
    const savedToken = localStorage.getItem('astrology_admin_token');
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.role === 'ADMIN') {
          setAdminUser(parsed);
          setToken(savedToken);
        } else {
          logout();
        }
      } catch (e) {
        logout();
      }
    } else {
      logout();
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await adminApi.login(email, password);
    const { user, token: jwtToken } = response.data.data;

    if (user.role !== 'ADMIN') {
      throw new Error('Access denied. Admin credentials required.');
    }

    localStorage.setItem('astrology_admin_token', jwtToken);
    localStorage.setItem('astrology_admin_user', JSON.stringify(user));
    setToken(jwtToken);
    setAdminUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('astrology_admin_token');
    localStorage.removeItem('astrology_admin_user');
    setToken(null);
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, token, isAuthenticated: Boolean(token), login, logout, loading }}>
      {!loading && children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

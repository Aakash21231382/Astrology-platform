import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('astrology_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('astrology_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!localStorage.getItem('astrology_token') ? false : !localStorage.getItem('astrology_user'));

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await authService.getMe();
          const userData = res.data.data;
          setUser(userData);
          localStorage.setItem('astrology_user', JSON.stringify(userData));
          connectSocket();
        } catch (err) {
          console.error('[AuthContext] Failed to load authenticated user:', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const loginUser = (authData) => {
    localStorage.setItem('astrology_token', authData.token);
    if (authData.user) {
      localStorage.setItem('astrology_user', JSON.stringify(authData.user));
    }
    setToken(authData.token);
    setUser(authData.user);
    setLoading(false);
    connectSocket();
  };

  const logout = () => {
    localStorage.removeItem('astrology_token');
    localStorage.removeItem('astrology_user');
    setToken(null);
    setUser(null);
    setLoading(false);
    disconnectSocket();
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const res = await authService.getMe();
        const userData = res.data.data;
        setUser(userData);
        localStorage.setItem('astrology_user', JSON.stringify(userData));
      } catch (e) {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isCustomer: user?.role === 'CUSTOMER',
        isExpert: user?.role === 'EXPERT',
        isAdmin: user?.role === 'ADMIN',
        loginUser,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('astrology_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await authService.getMe();
          setUser(res.data.data);
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
    setToken(authData.token);
    setUser(authData.user);
    connectSocket();
  };

  const logout = () => {
    localStorage.removeItem('astrology_token');
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const res = await authService.getMe();
        setUser(res.data.data);
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

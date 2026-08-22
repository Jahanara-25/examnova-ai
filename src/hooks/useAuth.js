import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

const AuthContext = createContext(null);


export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('examnova-user');
    const token = localStorage.getItem('examnova-token');
    if (!storedUser || !token) return null;
    try { return JSON.parse(storedUser); } catch { localStorage.removeItem('examnova-user'); return null; }
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      localStorage.setItem('examnova-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('examnova-user');
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) return { ok: false, message: 'Invalid email or password.' };
        if (response.status >= 500) return { ok: false, message: 'Authentication server error. Please try again.' };
        return { ok: false, message: data.message || 'Unable to sign in.' };
      }
      if (!data.token || !data.user) return { ok: false, message: 'Authentication server returned an invalid response.' };
      localStorage.setItem('examnova-token', data.token);
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch {
      return { ok: false, message: 'Unable to reach the authentication service. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('examnova-token');
    setUser(null);
    navigate('/');
  };

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user && localStorage.getItem('examnova-token')), login, logout, refreshProfile: () => api('/auth/me').then(({ user: current }) => { setUser(current); return current; }) }),
    [user],
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  return useContext(AuthContext);
}

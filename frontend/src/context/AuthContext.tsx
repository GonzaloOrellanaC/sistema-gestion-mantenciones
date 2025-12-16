import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';
import * as authApi from '../api/auth';
import type { User } from '../api/types';

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | void>;
  register: (payload: authApi.RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(!!token);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // try to fetch current user
      authApi.me()
        .then((u) => setUser(u))
        .catch(() => {
          console.error('Failed to fetch user with stored token');
          // invalid token: clear
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      delete api.defaults.headers.common['Authorization'];
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const t = res.token;
      // persist token first so subsequent /me call is authorized
      console.log(res)
      // Persist token to localStorage; if unavailable, fallback to cookie
      try {
        localStorage.setItem(TOKEN_KEY, t);
      } catch {
        try {
          // fallback: store short-lived cookie
          document.cookie = `${TOKEN_KEY}=${t}; path=/`;
        } catch {
          // swallow - persistence failed
        }
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
      setToken(t);
      // Fetch full user (with role/permissions) from /me
      try {
        const fullUser = await authApi.me();
        setUser(fullUser);
      } catch {
        // fallback to minimal user returned by login response
        try { setUser(res.user as unknown as User); } catch { setUser(null); }
      }
      return t;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: authApi.RegisterPayload) => {
    setLoading(true);
    await authApi.register(payload);
    setLoading(false);
  };

  const logout = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const u = await authApi.me();
      setUser(u);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;

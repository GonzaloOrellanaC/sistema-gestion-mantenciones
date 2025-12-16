import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setAuthToken } from '../api/axios';
import { loginApi, meApi } from '../api/auth';

type User = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  orgId?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthToken(token);
    if (!token) {
      setLoading(false);
      return;
    }
    // fetch current user
    meApi()
      .then((data) => setUser(data))
      .catch(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        setAuthToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function login(email: string, password: string) {
    const t = await loginApi(email, password);
    if (!t) throw new Error('No token returned');
    localStorage.setItem('token', t);
    setToken(t);
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setAuthToken(null);
  }

  async function refreshUser() {
    try {
      const data = await meApi();
      setUser(data);
    } catch (err) {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

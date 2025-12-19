import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setAuthToken } from '../api/axios';
import { loginApi, meApi } from '../api/auth';
import { io, Socket } from 'socket.io-client';
import { getNotifications, getUnreadCount } from '../api/notifications';
import { registerForPush } from '../utils/push';

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
  latestNotification?: any | null;
  clearLatestNotification?: () => void;
  unreadCount?: number;
  setUnread?: (n: number) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latestNotification, setLatestNotification] = useState<any | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // initial notifications load helper (stores in localStorage)
  async function loadInitialNotifications() {
    try {
      const items = await getNotifications();
      localStorage.setItem('notifications', JSON.stringify(items || []));
      const uc = await getUnreadCount();
      setUnreadCount(uc || 0);
    } catch (e) {
      console.error('failed to load notifications', e);
    }
  }

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

  // Setup socket when user is available
  useEffect(() => {
    if (!user || !token) return;
    const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || '';
    const s = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    setSocket(s);

    s.on('connect', () => {
      // join rooms
      s.emit('joinUser', (user as any).id || (user as any)._id);
      if ((user as any).orgId) s.emit('joinOrg', (user as any).orgId);
    });

    // listen for incoming notifications
    s.on('notifications.new', (notif: any) => {
      try {
        const current = JSON.parse(localStorage.getItem('notifications') || '[]');
        current.unshift(notif);
        localStorage.setItem('notifications', JSON.stringify(current));
        setLatestNotification(notif);
        setUnreadCount((c) => c + 1);
      } catch (e) {
        console.error('store notif err', e);
      }
    });

    // load initial notifications once
    loadInitialNotifications();

    // register for native push when user present
    try {
      registerForPush().catch(() => null);
    } catch (e) {
      // ignore
    }

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user, token]);

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

  function clearLatestNotification() {
    setLatestNotification(null);
  }

  function setUnread(n: number) {
    setUnreadCount(n);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser, latestNotification, clearLatestNotification, unreadCount, setUnread }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

import React, { createContext, useContext, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { useAuth } from './AuthContext';
import { useLocation, useHistory } from 'react-router-dom';

type MainLayoutContextType = {};

const MainLayoutContext = createContext<MainLayoutContextType | undefined>(undefined);

export const MainLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const location = useLocation();
  const history = useHistory();

  const hideMenuPaths = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot'
  ];

  const shouldHideMenu = () => {
    const path = location.pathname || '/';
    if (hideMenuPaths.includes(path)) return true;
    // handle /auth/reset/:token
    if (path.startsWith('/auth/reset')) return true;
    return false;
  };

  useEffect(() => {
    // If user is on login page but already authenticated, redirect to dashboard
    if (location.pathname === '/auth/login' && token) {
      history.replace('/dashboard');
    }
  }, [location.pathname, token, history]);

  // If the current path requires hiding the menu, render children plain
  if (shouldHideMenu()) {
    return <>{children}</>;
  }

  // Otherwise, if user has a token, render children inside MainLayout (with IonMenu/sidebar)
  if (token) {
    return (
      <MainLayout>
        {children}
      </MainLayout>
    );
  }

  // Default: render children plain (no menu)
  return <>{children}</>;
};

export function useMainLayout() {
  const ctx = useContext(MainLayoutContext);
  if (ctx === undefined) {
    // not strictly needed, but keep API consistent
    throw new Error('useMainLayout must be used within MainLayoutProvider');
  }
  return ctx;
}

export default MainLayoutContext;

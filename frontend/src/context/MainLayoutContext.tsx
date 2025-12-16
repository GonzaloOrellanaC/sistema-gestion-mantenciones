import React, { createContext, useContext } from 'react';
import MainLayout from '../components/MainLayout';
import { useAuth } from './AuthContext';

type MainLayoutContextType = {};

const MainLayoutContext = createContext<MainLayoutContextType | undefined>(undefined);

export const MainLayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();

  // If user has a token, render children inside MainLayout (with IonMenu/sidebar)
  if (token) {
    return (
      <MainLayout>
        {children}
      </MainLayout>
    );
  }

  // Otherwise render children plain (no menu)
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

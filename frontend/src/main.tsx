import React from 'react';
import './i18n';
import { createRoot } from 'react-dom/client';
import App from './App';
import { NotificationProvider } from './context/NotificationContext';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </React.StrictMode>
);
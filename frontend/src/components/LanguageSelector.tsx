import React from 'react';
import '../i18n';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const change = (lng: string) => {
    try { localStorage.setItem('appLanguage', lng); } catch {};
    i18n.changeLanguage(lng);
  };

  return (
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 1000 }}>
      <button onClick={() => change('es')} style={{ marginRight: 6 }}>ES</button>
      <button onClick={() => change('en')}>EN</button>
    </div>
  );
};

export default LanguageSelector;

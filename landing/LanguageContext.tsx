import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from './translations';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Detect PC language
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'es') {
      setLanguage('es');
    } else {
      setLanguage('en');
    }
  }, []);

  useEffect(() => {
    const t = translations[language];
    const desc = `${t.contact.metaBase} ${t.contact.email}`;

    const setMeta = (selector: string) => {
      const el = document.querySelector(selector) as HTMLMetaElement | null;
      if (el) el.setAttribute('content', desc);
    };

    setMeta('meta[name="description"]');
    setMeta('meta[property="og:description"]');
    setMeta('meta[name="twitter:description"]');

    const ld = document.querySelector('script[type="application/ld+json"]');
    if (ld) {
      const data = {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "name": "SGM - OM Tecnología",
            "url": "https://sgm.omtecnologia.cl/",
            "description": t.contact.metaBase
          },
          {
            "@type": "Organization",
            "name": "OM Tecnología",
            "url": "https://omtecnologia.cl/",
            "logo": "https://sgm.omtecnologia.cl/sgm-logo.svg",
            "contactPoint": [{
              "@type": "ContactPoint",
              "contactType": "customer support",
              "email": t.contact.emailHref
            }]
          }
        ]
      };
      ld.textContent = JSON.stringify(data, null, 2);
    }
  }, [language]);

  const value = {
    language,
    setLanguage,
    t: translations[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
/* import enFlat from './locales/en.json';
import esFlat from './locales/es.json'; */

function detectInitialLang() {
  try {
    const stored = localStorage.getItem('appLanguage');
    if (stored) return stored;
  } catch (e) {
    // ignore
  }
  const nav = typeof navigator !== 'undefined' && navigator.language ? navigator.language : null;
  if (nav) {
    if (nav.startsWith('es')) return 'es';
    if (nav.startsWith('en')) return 'en';
  }
  return 'es';
}

const initialLang = detectInitialLang();

function buildResources() {
  const resources: Record<string, { translation: any }> = {
    en: { translation: {} },
    es: { translation: {} }
  };

  // Load flat files (legacy single-file locales)
  /* Object.assign(resources.en.translation, enFlat);
  Object.assign(resources.es.translation, esFlat); */

  // Load per-component files under locales/{lang}/*.json (Vite import)
  const modules = import.meta.glob('./locales/*/*.json', { eager: true }) as Record<string, any>;
  for (const path in modules) {
    const m = modules[path];
    const content = m && m.default ? m.default : m;
    const match = path.match(/locales\/(.*?)\/([^/]+)\.json$/);
    if (!match) continue;
    const locale = match[1];
    if (!resources[locale]) resources[locale] = { translation: {} };
    Object.assign(resources[locale].translation, content);
  }

  return resources;
}

const resources = buildResources();

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: 'es',
  interpolation: { escapeValue: false }
});

export default i18n;

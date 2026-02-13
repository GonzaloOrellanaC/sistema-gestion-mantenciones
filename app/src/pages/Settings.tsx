import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IonPage, IonContent, IonList, IonItem, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';
import { useHistory } from 'react-router';

const STORAGE_KEY = 'app_settings';

type SettingsState = {
  pushEnabled: boolean;
  useBrowserLanguage: boolean;
  preventBrowserTranslate: boolean;
  language: string;
};

const defaultSettings: SettingsState = {
  pushEnabled: false,
  useBrowserLanguage: true,
  preventBrowserTranslate: true,
  language: 'en'
};

function applyPreventBrowserTranslate(flag: boolean) {
  try {
    if (flag) {
      let meta = document.querySelector('meta[name="google"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'google');
        meta.setAttribute('content', 'notranslate');
        document.head.appendChild(meta);
      }
      document.documentElement.setAttribute('translate', 'no');
      document.documentElement.classList.add('notranslate');
    } else {
      const meta = document.querySelector('meta[name="google"]');
      if (meta && meta.parentNode) meta.parentNode.removeChild(meta);
      document.documentElement.removeAttribute('translate');
      document.documentElement.classList.remove('notranslate');
    }
  } catch (e) {
    // ignore
  }
}

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const history = useHistory();
  const [state, setState] = useState<SettingsState>(defaultSettings);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const initial = parsed ? { ...defaultSettings, ...parsed } : defaultSettings;
      // always start using browser language unless user previously selected one
      if (!parsed || initial.useBrowserLanguage) {
        const nav = (navigator.language || (navigator as any).userLanguage || 'en').split('-')[0];
        initial.language = nav;
        initial.useBrowserLanguage = true;
      }
      // enforce preventBrowserTranslate always
      initial.preventBrowserTranslate = true;
      setState(initial);
      applyPreventBrowserTranslate(true);
      i18n.changeLanguage(initial.language).catch(() => {});
    } catch (e) {
      setState({ ...defaultSettings, preventBrowserTranslate: true });
      applyPreventBrowserTranslate(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist immediately on changes
  useEffect(() => {
    try {
      const toStore = { ...state, preventBrowserTranslate: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {}
  }, [state]);

  // always ensure the browser-translate prevention is active
  useEffect(() => {
    applyPreventBrowserTranslate(true);
  }, []);

  useEffect(() => {
    // if using browser language, pick navigator language, otherwise use selected
    if (state.useBrowserLanguage) {
      const nav = (navigator.language || (navigator as any).userLanguage || 'en').split('-')[0];
      i18n.changeLanguage(nav).catch(() => {});
    } else {
      i18n.changeLanguage(state.language).catch(() => {});
    }
  }, [state.useBrowserLanguage, state.language, i18n]);

  return (
    <IonPage>
      <IonContent>
        <div style={{ padding: 18, maxWidth: 720, margin: '10px auto', background: 'var(--ion-background-color)', borderRadius: 8 }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0288D1' }}>{t('settings_title') || 'Settings'}</div>
            <div style={{ marginTop: 6, color: '#334155', fontSize: 14 }}>{t('settings_subtitle') || 'Configure app preferences'}</div>
          </div>

          <IonList lines="full">
            {/** push notifications disabled for web version */}

            <IonItem lines="full">
              <IonLabel style={{ fontWeight: 600, color: '#0f172a' }}>{t('settings_language_label') || 'App language'}</IonLabel>
              <IonSelect value={state.language} onIonChange={e => {
                const newLang = e.detail.value;
                const newState = { ...state, language: newLang, useBrowserLanguage: false };
                setState(newState);
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...newState, preventBrowserTranslate: true })); } catch (err) {}
              }} interface="popover" style={{ minWidth: 140 }}>
                <IonSelectOption value="en">English</IonSelectOption>
                <IonSelectOption value="es">Español</IonSelectOption>
              </IonSelect>
            </IonItem>

            <div style={{ marginTop: 14, fontSize: 13, color: '#475569' }}>{t('settings_autosave_note') || 'Los cambios se guardan automáticamente.'}</div>
          </IonList>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Settings;

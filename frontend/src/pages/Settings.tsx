import React, { useState, useEffect } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonToggle, IonText } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import '../i18n';

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState<string>(() => {
    try { return localStorage.getItem('appLanguage') || (i18n.language ?? 'es'); } catch { return i18n.language ?? 'es'; }
  });
  const [emailEnabled, setEmailEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem('emailEnabled') === 'true'; } catch { return false; }
  });
  const [currency, setCurrency] = useState<string>(() => {
    try { return localStorage.getItem('appCurrency') || 'CLP'; } catch { return 'CLP'; }
  });

  useEffect(() => {
    try { localStorage.setItem('appLanguage', language); } catch {}
    if (i18n.language !== language) i18n.changeLanguage(language);
  }, [language, i18n]);

  useEffect(() => {
    try { localStorage.setItem('emailEnabled', emailEnabled ? 'true' : 'false'); } catch {}
  }, [emailEnabled]);

  useEffect(() => {
    try { localStorage.setItem('appCurrency', currency); } catch {}
  }, [currency]);

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar style={{paddingLeft: 10}}>
          <IonTitle>{t('settings.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonItem>
            <IonLabel>{t('settings.language')}</IonLabel>
            <IonSelect value={language} placeholder={t('settings.language')} onIonChange={e => setLanguage(e.detail.value!)}>
              <IonSelectOption value="es">🇪🇸 {t('common.languages.spanish')}</IonSelectOption>
              <IonSelectOption value="en">🇺🇸 {t('common.languages.english')}</IonSelectOption>
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel>{t('settings.emailNotifications')}</IonLabel>
            <IonToggle checked={emailEnabled} onIonChange={e => setEmailEnabled(!!e.detail.checked)} />
          </IonItem>

          <IonItem>
            <IonLabel>{t('settings.currency')}</IonLabel>
            <IonSelect value={currency} placeholder={t('settings.currency')} onIonChange={e => setCurrency(e.detail.value!)}>
              <IonSelectOption value="USD">USD</IonSelectOption>
              <IonSelectOption value="CLP">CLP</IonSelectOption>
            </IonSelect>
          </IonItem>

        </IonList>
        <div style={{ padding: 16 }}>
          <IonText color="medium">{t('settings.savedToast')}</IonText>
        </div>
      </IonContent>
    </IonPage>
  );
}

export default Settings;

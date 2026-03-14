import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
} from '@ionic/react';
import AppButton from '../components/Widgets/Button.widget';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../components/Widgets/LanguageToggle.widget';
import * as authApi from '../api/auth';
import { Input } from '../components/Widgets/Input.widget';
import '../styles/login.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const history = useHistory();
  const { t } = useTranslation();

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await authApi.forgotPassword(email);
      setMessage('Si el email existe, se ha enviado un correo con instrucciones.');
    } catch (err: unknown) {
      console.error(err);
      type ErrWithResponse = { response?: { data?: { message?: string } } };
      const msg = (err as ErrWithResponse)?.response?.data?.message ?? 'Ocurrió un error al solicitar el reinicio.';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent>
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol sizeXl="5" sizeLg="6" sizeMd="8" sizeSm="10" sizeXs="12">
              <div className="auth-card" style={{ position: 'relative' }}>
                <div className="auth-logo"><img src="/assets/sgm-logo.svg" alt="SGM" style={{ height: 36 }} /></div>
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <LanguageToggle size={16} />
                </div>
                <h3>{t('auth.forgot_title')}</h3>
                <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)' }}>{t('auth.forgot_instructions')}</p>
                <form onSubmit={submit}>
                  <div className="form-field">
                      <Input label={t('auth.email_label')} type="email" value={email} onInput={(e: any) => setEmail(e.detail?.value ?? '')} name="email" />
                  </div>
                  <div style={{ margin: 16 }}>
                    <AppButton variant="primary" expand="block" type="submit" disabled={loading} onClick={submit}>
                      {t('auth.send_instructions')}
                    </AppButton>
                    <AppButton variant="secondary" expand="block" fill="clear" onClick={() => history.push('/auth/login')}>
                      {t('auth.back_to_login')}
                    </AppButton>
                  </div>
                  {message && (
                    <div style={{ padding: 8 }}>
                      <IonText color="primary">{message}</IonText>
                    </div>
                  )}
                </form>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;

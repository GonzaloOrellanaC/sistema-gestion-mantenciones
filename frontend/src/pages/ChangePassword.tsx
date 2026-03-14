import React, { useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
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

const ChangePassword: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const history = useHistory();
  const { t } = useTranslation();

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!token) return setMessage(t('errors.invalid_token'));
    if (password.length < 6) return setMessage(t('errors.password_too_short'));
    if (password !== confirm) return setMessage(t('errors.passwords_mismatch'));
    setLoading(true);
    setMessage(null);
    try {
      await authApi.resetPassword(token, password);
      setMessage(t('auth.reset_success'));
      setTimeout(() => history.push('/auth/login'), 1500);
    } catch (err: unknown) {
      console.error(err);
      type ErrWithResponse = { response?: { data?: { message?: string } } };
      const msg = (err as ErrWithResponse)?.response?.data?.message ?? 'Error al restablecer la contraseña';
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
                <h3>{t('auth.reset_title')}</h3>
                <form onSubmit={submit}>
                  <div className="form-field">
                      <Input label={t('auth.new_password_label')} type="password" value={password} onInput={(e: any) => setPassword(e.detail?.value ?? '')} name="password" />
                  </div>
                  <div className="form-field">
                      <Input label={t('auth.confirm_password_label')} type="password" value={confirm} onInput={(e: any) => setConfirm(e.detail?.value ?? '')} name="confirm" />
                  </div>
                  <div style={{ margin: 16 }}>
                    <AppButton variant="primary" expand="block" type="submit" disabled={loading} onClick={submit}>
                      {t('auth.reset_button')}
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

export default ChangePassword;

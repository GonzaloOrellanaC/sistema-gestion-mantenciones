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
import { Input } from '../components/Widgets/Input.widget';
import * as authApi from '../api/auth';
import '../styles/login.css';
import AppButton from '../components/Widgets/Button.widget';
import LanguageToggle from '../components/Widgets/LanguageToggle.widget';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../context/NotificationContext';

const Register: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();
  const history = useHistory();
  const { t } = useTranslation();

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    // clear previous
    if (password !== confirmPassword) {
      await notify(false, { title: t('errors.passwords_mismatch') });
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ firstName, lastName, email, password, companyName });
      await notify(true, { title: t('auth.register_success') });
      history.push('/auth/login');
    } catch (err: unknown) {
      console.error(err);
      type ErrWithResponse = { response?: { data?: { message?: string } } };
      const msg = (err as ErrWithResponse)?.response?.data?.message ?? t('errors.register_failed');
      await notify(false, { title: String(msg) });
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
                <div className="auth-logo"><img src="/assets/sgm-logo.svg" alt="SGM" style={{ height: 84 }} /></div>
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <LanguageToggle size={18} />
                </div>
                <h3>{t('auth.register_title')}</h3>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }} dangerouslySetInnerHTML={{ __html: t('auth.register_trial_info') }} />
                <form onSubmit={submit} onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    submit();
                  }
                }}>
                  <div className="form-field">
                    <Input label={t('form.first_name')} type="text" value={firstName} onInput={(e: any) => setFirstName(e.detail?.value ?? '')} name="firstName" />
                  </div>

                  <div className="form-field">
                    <Input label={t('form.last_name')} type="text" value={lastName} onInput={(e: any) => setLastName(e.detail?.value ?? '')} name="lastName" />
                  </div>

                  <div className="form-field">
                    <Input label={t('form.company')} type="text" value={companyName} onInput={(e: any) => setCompanyName(e.detail?.value ?? '')} name="companyName" />
                  </div>

                  <div className="form-field">
                    <Input label={t('form.email')} type="email" value={email} onInput={(e: any) => setEmail(e.detail?.value ?? '')} name="email" />
                  </div>

                  <div className="form-field">
                    <Input label={t('form.password')} type="password" value={password} onInput={(e: any) => setPassword(e.detail?.value ?? '')} name="password" />
                  </div>

                  <div className="form-field">
                    <Input label={t('form.confirm_password')} type="password" value={confirmPassword} onInput={(e: any) => setConfirmPassword(e.detail?.value ?? '')} name="confirmPassword" />
                  </div>

                  <div style={{ margin: '16px 0' }}>
                    <AppButton variant="primary" expand="block" type="submit" disabled={loading}>
                      {t('auth.register_button')}
                    </AppButton>
                    <AppButton variant="secondary" expand="block" fill="clear" onClick={() => history.push('/auth/login')}>
                      {t('auth.register_back')}
                    </AppButton>
                  </div>

                  <div className="auth-links">
                    <span>{t('form.already_account')} <a onClick={() => history.push('/auth/login')}>{t('form.sign_in')}</a></span>
                  </div>
                </form>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Register;

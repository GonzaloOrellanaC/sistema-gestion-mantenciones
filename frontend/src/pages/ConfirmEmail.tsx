import { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import api from '../api/axios';
import { confirmEmail } from '../api';
import '../i18n';
import { useTranslation } from 'react-i18next';

export const ConfirmEmail = () => {
  const params: any = useParams();
  const history = useHistory();
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'missing'>('loading');
  const [message, setMessage] = useState<string>(t('confirm.validating') || 'Validando...');

  const changeLang = (lng: string) => {
    try { localStorage.setItem('appLanguage', lng); } catch (e) {}
    i18n.changeLanguage(lng);
  };

  useEffect(() => {
    if (!params.token) {
      setStatus('missing');
      setMessage(t('confirm.missing_token') || 'Token no proporcionado');
      return;
    }
    const token = params.token;

    const confirm = async () => {
      try {
        const response = await confirmEmail(token);
        console.log('Confirm email response:', response);
        setStatus('success');
        setMessage(t('confirm.success') || 'Usuario confirmado. Será redirigido en 5 segundos');
        setTimeout(() => {
            // redirect to login page
            history.replace('/auth/login');
        }, 5000);
      } catch (e: any) {
        const resp = e?.response;
        const txt = resp?.data || resp?.statusText || e?.message;
        setStatus('error');
        setMessage(txt || (t('confirm.network_error') || 'Error comunicándose con el servidor'));
      }
    };

    confirm();
  }, [params.token, history]);

  return (
    <div style={{ maxWidth: '520px', margin: '50px auto', padding: '20px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button onClick={() => changeLang('es')} style={{ marginRight: 8 }}>ES</button>
        <button onClick={() => changeLang('en')}>EN</button>
      </div>
      <div style={{ borderRadius: 12, padding: 24, background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
        <h1>{t('confirm.title') || 'Confirmar correo electrónico'}</h1>
        <p style={{ color: status === 'error' ? '#B91C1C' : '#334155' }}>{message}</p>
        {status === 'loading' && <p style={{ color: '#64748B' }}>{t('confirm.please_wait') || 'Por favor espera...'}</p>}
        {status === 'success' && <p style={{ fontSize: 14, color: '#0f766e' }}>{t('confirm.redirect_help') || 'Si no eres redirigido automáticamente, '}<a href="/login">{t('confirm.login_link') || 'haz clic aquí'}</a>.</p>}
      </div>
    </div>
  );
};

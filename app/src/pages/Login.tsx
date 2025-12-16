import React, { useState } from 'react';
import { IonPage, IonContent, IonButton, IonLoading, IonToast } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { Redirect } from 'react-router-dom';
import { isotype } from '../images';

const Login: React.FC = () => {
  const { login, token } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (token) return <Redirect to="/my-assignations" />;

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <IonPage className="view-login">
      <IonContent className="ion-padding" style={{ background: 'transparent' }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="text-center" style={{ marginBottom: '2.5rem' }}>
            <div style={{ width: 90, height: 90, background: 'white', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', color: 'var(--primary)' }}>
              <img src={isotype} height={50} />
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>SGM</h1>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500, marginTop: 8 }}>Sistema de Gestión de Mantenciones</p>
          </div>

          <div className="login-card">
            <div className="input-group">
              <input value={email} onChange={e => setEmail((e.target as any).value)} type="text" placeholder="Usuario" className="input-field" />
            </div>
            <div className="input-group" style={{ marginBottom: '2rem' }}>
              <input value={password} onChange={e => setPassword((e.target as any).value)} type="password" placeholder="Contraseña" className="input-field" />
            </div>
            <IonButton expand="block" className="btn-primary" onClick={onSubmit}>Ingresar</IonButton>
            <div style={{ marginTop: 12 }}>
              <IonButton expand="block" onClick={() => { setEmail('demo@demo.com'); setPassword('demo'); onSubmit(); }}>Entrar con mock</IonButton>
            </div>
          </div>
        </div>

        <IonLoading isOpen={loading} />
        <IonToast isOpen={!!error} message={error || ''} onDidDismiss={() => setError(null)} duration={3000} />
      </IonContent>
    </IonPage>
  );
};

export default Login;

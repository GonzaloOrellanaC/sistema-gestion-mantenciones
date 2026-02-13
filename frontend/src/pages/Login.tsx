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
  IonButton,
  IonText,
  IonIcon,
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Widgets/Input.widget';
import '../styles/login.css';
import { phonePortraitOutline } from 'ionicons/icons';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const history = useHistory();

  const submit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    // debug: mark submit
    // console.log('Login submit start');
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      history.push('/dashboard');
    } catch (err: unknown) {
      console.error(err);
      type ErrWithResponse = { response?: { data?: { message?: string } } };
      const msg = (err as ErrWithResponse)?.response?.data?.message ?? 'Credenciales inválidas';
      setError(msg);
    } finally {
      setLoading(false);
      // console.log('Login submit end');
    }
  };

  const openMobileVersion = () => {
    const devUrl = 'http://localhost:5101';
    try {
      if (process.env.NODE_ENV === 'development') {
        window.open(devUrl, '_blank', 'noopener');
        return;
      }
    } catch (e) {
      // fallback when process isn't available
      try {
        if (window && window.location && window.location.hostname === 'localhost') {
          window.open(devUrl, '_blank', 'noopener');
          return;
        }
      } catch (er) {}
    }
    // production fallback
    window.open('/landing', '_blank', 'noopener');
  };

  return (
    <IonPage>
      <IonContent>
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol sizeXl="5" sizeLg="6" sizeMd="8" sizeSm="10" sizeXs="12">
              <div className="auth-card">
                <div className="auth-logo"><img src="/assets/sgm-logo.svg" alt="SGM" style={{ height: 100 }} /></div>
                <h3>Bienvenido de nuevo</h3>
                <form onSubmit={submit} onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // call submit programmatically
                  // eslint-disable-next-line @typescript-eslint/no-floating-promises
                  submit();
                }
              }}>
                <div className="form-field">
                  <Input label="Correo electrónico" type="email" value={email} onInput={(e: any) => setEmail(e.detail?.value ?? '')} name="email" />
                </div>
                <div className="form-field">
                  <Input label="Contraseña" type="password" value={password} onInput={(e: any) => setPassword(e.detail?.value ?? '')} name="password" />
                </div>
                <div style={{ margin: '16px 0' }}>
                  <IonButton className="btn btn-primary" expand="block" type="submit" disabled={loading}>
                    Iniciar sesión
                  </IonButton>
                  <IonButton className="btn btn-secondary" expand="block" fill="clear" onClick={() => history.push('/auth/forgot')}>
                    ¿Olvidaste tu contraseña?
                  </IonButton>
                  <br />
                  <br />
                  <IonButton className="btn btn-secondary" expand="block" fill="clear" onClick={openMobileVersion}>
                    <IonIcon icon={phonePortraitOutline} />
                    Abrir versión móvil
                  </IonButton>
                </div>
                <div className="auth-links">
                  <span>¿No tienes cuenta? <a onClick={() => history.push('/auth/register')}>Regístrate aquí</a></span>
                </div>
                {error && (
                  <div style={{ padding: 8 }}>
                    <IonText color="danger">{error}</IonText>
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

export default Login;

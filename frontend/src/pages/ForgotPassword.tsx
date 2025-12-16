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
} from '@ionic/react';
import * as authApi from '../api/auth';
import { Input } from '../components/Widgets/Input.widget';
import '../styles/login.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const history = useHistory();

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
              <div className="auth-card">
                <div className="auth-logo"><img src="/assets/sgm-logo.svg" alt="SGM" style={{ height: 36 }} /></div>
                <h3>Recuperar Contraseña</h3>
                <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)' }}>Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
                <form onSubmit={submit}>
                  <div className="form-field">
                    <Input label="Correo electrónico" type="email" value={email} onInput={(e: any) => setEmail(e.detail?.value ?? '')} name="email" />
                  </div>
                  <div style={{ margin: 16 }}>
                    <IonButton className="btn btn-primary" expand="block" type="submit" disabled={loading} onClick={submit}>
                      Enviar instrucciones
                    </IonButton>
                    <IonButton className="btn btn-secondary" expand="block" fill="clear" onClick={() => history.push('/auth/login')}>
                      Volver al login
                    </IonButton>
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

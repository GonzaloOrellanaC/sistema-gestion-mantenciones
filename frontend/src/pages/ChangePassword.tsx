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
  IonButton,
  IonText,
} from '@ionic/react';
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

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!token) return setMessage('Token inválido');
    if (password.length < 6) return setMessage('La contraseña debe tener al menos 6 caracteres');
    if (password !== confirm) return setMessage('Las contraseñas no coinciden');
    setLoading(true);
    setMessage(null);
    try {
      await authApi.resetPassword(token, password);
      setMessage('Contraseña restablecida. Puedes iniciar sesión ahora.');
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
              <div className="auth-card">
                <div className="auth-logo"><img src="/assets/sgm-logo.svg" alt="SGM" style={{ height: 36 }} /></div>
                <h3>Cambiar contraseña</h3>
                <form onSubmit={submit}>
                  <div className="form-field">
                    <Input label="Nueva contraseña" type="password" value={password} onInput={(e: any) => setPassword(e.detail?.value ?? '')} name="password" />
                  </div>
                  <div className="form-field">
                    <Input label="Confirmar contraseña" type="password" value={confirm} onInput={(e: any) => setConfirm(e.detail?.value ?? '')} name="confirm" />
                  </div>
                  <div style={{ margin: 16 }}>
                    <IonButton className="btn btn-primary" expand="block" type="submit" disabled={loading} onClick={submit}>
                      Cambiar contraseña
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

export default ChangePassword;

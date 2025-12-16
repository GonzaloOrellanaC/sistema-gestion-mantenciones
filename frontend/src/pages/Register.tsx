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
import { Input } from '../components/Widgets/Input.widget';
import * as authApi from '../api/auth';
import '../styles/login.css';

const Register: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const history = useHistory();

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMessage(null);
    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ firstName, lastName, email, password, companyName });
      setMessage('Registro exitoso. Revisa tu correo o inicia sesión.');
      setTimeout(() => history.push('/auth/login'), 1200);
    } catch (err: unknown) {
      console.error(err);
      type ErrWithResponse = { response?: { data?: { message?: string } } };
      const msg = (err as ErrWithResponse)?.response?.data?.message ?? 'Ocurrió un error al registrar.';
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
                <div className="auth-logo"><img src="/assets/sgm-logo.svg" alt="SGM" style={{ height: 84 }} /></div>
                <h3>Crea tu cuenta</h3>
                <form onSubmit={submit} onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    submit();
                  }
                }}>
                  <div className="form-field">
                    <Input label="Nombre" type="text" value={firstName} onInput={(e: any) => setFirstName(e.detail?.value ?? '')} name="firstName" />
                  </div>

                  <div className="form-field">
                    <Input label="Apellido" type="text" value={lastName} onInput={(e: any) => setLastName(e.detail?.value ?? '')} name="lastName" />
                  </div>

                  <div className="form-field">
                    <Input label="Empresa / Organización" type="text" value={companyName} onInput={(e: any) => setCompanyName(e.detail?.value ?? '')} name="companyName" />
                  </div>

                  <div className="form-field">
                    <Input label="Correo electrónico" type="email" value={email} onInput={(e: any) => setEmail(e.detail?.value ?? '')} name="email" />
                  </div>

                  <div className="form-field">
                    <Input label="Contraseña" type="password" value={password} onInput={(e: any) => setPassword(e.detail?.value ?? '')} name="password" />
                  </div>

                  <div className="form-field">
                    <Input label="Confirmar contraseña" type="password" value={confirmPassword} onInput={(e: any) => setConfirmPassword(e.detail?.value ?? '')} name="confirmPassword" />
                  </div>

                  <div style={{ margin: '16px 0' }}>
                    <IonButton className="btn btn-primary" expand="block" type="submit" disabled={loading}>
                      Crear cuenta
                    </IonButton>
                    <IonButton className="btn btn-secondary" expand="block" fill="clear" onClick={() => history.push('/auth/login')}>
                      Volver al login
                    </IonButton>
                  </div>

                  <div className="auth-links">
                    <span>¿Ya tienes cuenta? <a onClick={() => history.push('/auth/login')}>Inicia sesión</a></span>
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

export default Register;

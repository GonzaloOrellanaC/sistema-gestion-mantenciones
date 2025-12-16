import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../api/users';

const EditarPerfil: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const history = useHistory();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEmail(user?.email || '');
  }, [user]);

  async function onSave() {
    if (!user?._id) return;
    setSaving(true);
    try {
      await updateUser((user as any)._id, { firstName, lastName, email });
      setMessage('Perfil actualizado');
      await refreshUser();
      setTimeout(() => history.push('/profile'), 600);
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Editar Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '1rem' }}>
          <IonList>
            <IonItem>
              <IonLabel position="stacked">Nombre</IonLabel>
              <IonInput value={firstName} onIonChange={e => setFirstName((e.detail && e.detail.value) ? (e.detail.value as string) : '')} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Apellido</IonLabel>
              <IonInput value={lastName} onIonChange={e => setLastName((e.detail && e.detail.value) ? (e.detail.value as string) : '')} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput type="email" value={email} onIonChange={e => setEmail((e.detail && e.detail.value) ? (e.detail.value as string) : '')} />
            </IonItem>
            <div style={{ padding: '1rem' }}>
              <IonButton expand="block" onClick={onSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</IonButton>
              <IonButton expand="block" fill="clear" onClick={() => history.push('/profile')}>Cancelar</IonButton>
            </div>
          </IonList>
          <IonToast isOpen={!!message} message={message || ''} duration={2000} onDidDismiss={() => setMessage(null)} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EditarPerfil;

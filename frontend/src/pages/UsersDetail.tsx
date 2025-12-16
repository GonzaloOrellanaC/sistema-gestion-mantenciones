import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonAvatar, IonItem, IonLabel, IonButton, IonText, IonSpinner } from '@ionic/react';
import * as usersApi from '../api/users';

const UsersDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      try {
        const u = await usersApi.getUser(id);
        if (mounted) setUser(u);
      } catch (e) {
        console.error('fetch user', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <IonPage><IonContent className="ion-padding"><IonSpinner /></IonContent></IonPage>;

  if (!user) return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Usuario no encontrado</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div>No se encontró el usuario.</div>
        <div style={{ marginTop: 12 }}>
          <IonButton onClick={() => history.push('/users')} fill="clear">Volver</IonButton>
        </div>
      </IonContent>
    </IonPage>
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{user.firstName} {user.lastName}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IonAvatar style={{ width: 64, height: 64 }}>{(user.firstName?.[0]||'U') + (user.lastName?.[0]||'')}</IonAvatar>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{user.firstName} {user.lastName}</div>
            <div style={{ color: 'var(--text-secondary)' }}>{user.email}</div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <IonItem>
            <IonLabel><strong>Rol</strong></IonLabel>
            <IonText slot="end">{user.roleId || '-'}</IonText>
          </IonItem>
          <IonItem>
            <IonLabel><strong>Creado</strong></IonLabel>
            <IonText slot="end">{user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</IonText>
          </IonItem>
          {user.phone && (
            <IonItem>
              <IonLabel><strong>Teléfono</strong></IonLabel>
              <IonText slot="end">{user.phone}</IonText>
            </IonItem>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <IonButton onClick={() => history.push('/users')} fill="clear">Volver a usuarios</IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default UsersDetail;

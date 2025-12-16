import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonToast, IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../api/users';
import { logOutOutline, personOutline, settingsOutline } from 'ionicons/icons';
import { useHistory } from 'react-router';

const Profile: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<{ done: number; pending: number }>({ done: 0, pending: 0 });
  const history = useHistory()

  useEffect(() => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEmail(user?.email || '');
  }, [user]);

  useEffect(() => {
    async function loadStats() {
      if (!user?._id) return;
      try {
        const orgId = (user as any)?.orgId;
        const mod = await import('../api/workOrders');
        const data = await mod.getWorkOrders({ page: 1, limit: 1000, filters: { assigneeId: (user as any)._id } });
        const list = data.items || data.data || data;
        if (Array.isArray(list)) {
          const done = list.filter((w: any) => (w.state || '').toLowerCase() === 'terminado').length;
          const pending = list.length - done;
          setStats({ done, pending });
        } else {
          setStats({ done: 0, pending: 0 });
        }
      } catch (err) {
        setStats({ done: 0, pending: 0 });
      }
    }
    loadStats();
  }, [user]);

  async function onSave() {
    if (!user?._id) return;
    setSaving(true);
    try {
      await updateUser((user as any)._id, { firstName, lastName, email });
      setMessage('Perfil actualizado');
      await refreshUser();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  }

  const initials = `${(user?.firstName || firstName || '').charAt(0)}${(user?.lastName || lastName || '').charAt(0)}`.toUpperCase();
  const roleLabel = (user as any)?.role?.name || (user as any)?.role || 'Usuario';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mi Perfil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: 92,
              height: 92,
              borderRadius: 46,
              background: 'linear-gradient(135deg, #81D4FA, #0288D1)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 800,
              boxShadow: '0 10px 25px rgba(2,136,209,0.18)',
              marginBottom: '0.6rem'
            }}>{initials}</div>

            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user ? `${user.firstName} ${user.lastName}` : `${firstName} ${lastName}`}</div>
            <p style={{ color: '#78909C', fontWeight: 500, margin: '6px 0 12px' }}>{roleLabel}</p>
            <div style={{
              background: '#E8F5E9', color: '#2E7D32', padding: '6px 14px',
              borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF50' }}></div>
              Online
            </div>
          </div>

          <IonGrid>
            <IonRow>
              <IonCol size="6">
                <IonCard style={{ textAlign: 'center', margin: 0 }}>
                  <IonCardContent>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0288D1' }}>{stats.done}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B0BEC5', textTransform: 'uppercase' }}>Finalizadas</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="6">
                <IonCard style={{ textAlign: 'center', margin: 0 }}>
                  <IonCardContent>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFA726' }}>{stats.pending}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#B0BEC5', textTransform: 'uppercase' }}>Pendientes</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          <IonList>
            <IonItem button onClick={() => history.push('/editar-perfil')}>
              <IonIcon icon={personOutline} slot="start" color="medium" />
              <IonLabel>Editar Perfil</IonLabel>
            </IonItem>
            <IonItem button>
              <IonIcon icon={settingsOutline} slot="start" color="medium" />
              <IonLabel>Configuración</IonLabel>
            </IonItem>
            <IonItem button onClick={() => logout()} style={{ '--background': '#FFEBEE' } as any}>
              <IonIcon icon={logOutOutline} slot="start" color="danger" />
              <IonLabel color="danger">Cerrar Sesión</IonLabel>
            </IonItem>
          </IonList>

          <IonToast isOpen={!!message} message={message || ''} duration={2000} onDidDismiss={() => setMessage(null)} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;

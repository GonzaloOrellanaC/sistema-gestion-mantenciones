import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonSpinner } from '@ionic/react';
import { getUsers, UserDTO } from '../api/users';
import { useAuth } from '../context/AuthContext';

const UsersList: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const orgId = (user as any)?.orgId;
      const data = await getUsers({ orgId, page: 1, limit: 50 });
      const list = data.items || data.data || data;
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Usuarios</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {loading ? <div style={{ padding: 16 }}><IonSpinner /></div> : (
            <IonList>
              {users.length === 0 && <div style={{ padding: 16 }}>No hay usuarios.</div>}
              {users.map(u => (
                <IonItem key={u._id} button>
                  <IonLabel>
                    <h3>{u.firstName} {u.lastName}</h3>
                    <p>{u.email}</p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          )}
          <div style={{ padding: 16 }}>
            <IonButton routerLink="/users/create">Crear usuario</IonButton>
          </div>
        </IonContent>
      </IonPage>
  );
};

export default UsersList;

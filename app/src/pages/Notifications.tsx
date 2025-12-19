import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonBadge } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { markAsRead } from '../api/notifications';
import { useHistory } from 'react-router';

const Notifications: React.FC = () => {
  const { user, setUnread } = useAuth() as any;
  const [items, setItems] = useState<any[]>([]);
  const history = useHistory();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('notifications');
      const list = raw ? JSON.parse(raw) : [];
      setItems(list);
    } catch (e) {
      setItems([]);
    }
  }, [user]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Notificaciones</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: 12 }}>
          <IonList>
            {items.length === 0 && <div>No hay notificaciones.</div>}
            {items.map((n: any) => (
              <IonItem key={n._id || n.id || Math.random()} button onClick={async () => {
                try {
                  if (!n.read) {
                    await markAsRead(n._id || n.id);
                    const updated = items.map(it => it._id === n._id ? { ...it, read: true } : it);
                    setItems(updated);
                    localStorage.setItem('notifications', JSON.stringify(updated));
                    // recompute unread and set
                    try { const raw = localStorage.getItem('notifications'); const arr = raw ? JSON.parse(raw) : []; setUnread && setUnread(arr.filter((x:any)=>!x.read).length); } catch(e){}
                  }
                } catch (e) {
                  console.error('mark read err', e);
                }
                // navigate to work order if provided
                try {
                  const workId = n.meta?.workOrderId || n.meta?.workOrderId;
                  if (workId) history.push(`/work-orders/${workId}`);
                } catch (e) {}
              }}>
                <IonLabel>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>{n.message}</div>
                    <div style={{ marginLeft: 12 }}>
                      <IonBadge color={n.read ? 'medium' : 'danger'}>{new Date(n.createdAt || Date.now()).toLocaleString()}</IonBadge>
                    </div>
                  </div>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;

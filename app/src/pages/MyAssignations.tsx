import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonContent, IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonList, IonItem, IonLabel } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { getWorkOrders } from '../api/workOrders';
import OrderCard from '../components/OrderCard';
import { useHistory } from 'react-router';

const MyAssignations: React.FC = () => {
  const { user, logout } = useAuth();
  const [lastOrder, setLastOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [search, setSearch] = useState('');
  const history = useHistory();

  useEffect(() => {
    console.log({user})
    async function loadLast() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const orgId = (user as any)?.orgId;
        const userId = (user as any)?.id;
        const data = await getWorkOrders({ page: 1, limit: 20, filters: { assigneeId: userId } });
        console.log('Loaded orders:', data);
        const list = data.items || data.data || data;
        if (Array.isArray(list) && list.length > 0) {
          setLastOrder(list[0]);
          setOrders(list);
        } else {
          setLastOrder(null);
          setOrders([]);
        }
      } catch (err) {
        console.error('Error loading orders:', err);
        setLastOrder(null);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    loadLast();
  }, [user]);

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar style={{padding: 10}}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Mis Órdenes</h1>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #81D4FA, #0288D1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{user?.firstName ? user.firstName.charAt(0) : 'U'}</div>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div>
            {loading ? (
              <div style={{ padding: 16 }}>Cargando...</div>
            ) : (
              <div style={{ padding: '1rem' }}>
                {orders.filter(o => !search || (o.client || '').toLowerCase().includes(search.toLowerCase()) || (o.id || '').toLowerCase().includes(search.toLowerCase())).map((order) => (
                  <OrderCard key={order._id || order.id} order={{ id: order.orgSeq || order.id || order._id, client: order.client || order.name || '', address: order.address, status: order.state || order.status, date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : order.date, type: order.type || '' }} onClick={() => { history.push(`/work-orders/${order._id || order.id}`); }} />
                ))}
                {orders.length === 0 && <div style={{ padding: 16 }}>No hay órdenes.</div>}
              </div>
            )}
          </div>
      </IonContent>
    </IonPage>
  );
};

export default MyAssignations;

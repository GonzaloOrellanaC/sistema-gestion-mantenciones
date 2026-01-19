import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonContent, IonRefresher, IonRefresherContent, IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonList, IonItem, IonLabel, IonTitle, IonFab, IonFabButton, IonIcon } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { getWorkOrders } from '../api/workOrders';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router';
import { scanOutline, locationOutline } from 'ionicons/icons';

const MyAssignations: React.FC = () => {
  const { user, logout } = useAuth();
  const [lastOrder, setLastOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [search, setSearch] = useState('');
  const history = useHistory();
  const { t } = useTranslation();
  const fullName = `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim();

  const loadLast = async () => {
    console.log({ user });
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
  };

  useEffect(() => {
    loadLast();
  }, [user]);

  return (
    <IonPage>
      {
        loading ?
        <IonContent>
        
        </IonContent>
        :
        <>
        <IonHeader className='ion-no-border'>
          {/* Header card like design */}
              <div style={{
                margin: 0,
                borderRadius: '0px 0px 20px 20px',
                padding: 18,
                background: 'var(--ion-color-primary)',
                color: 'white',
                position: 'relative',
                boxShadow: '0 6px 18px rgba(2,40,71,0.12)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{fullName || t('hello_technician')}</div>
                    <div style={{ marginTop: 8, fontSize: 14, opacity: 0.95 }}>{t('pending_orders', { count: orders.length })}</div>
                  </div>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                    {user?.firstName ? user.firstName.charAt(0) : 'U'}
                  </div>
                </div>
              </div>
        </IonHeader>
          <IonContent>
            <IonRefresher slot="fixed" onIonRefresh={async (e: any) => { try { await loadLast(); } catch (err) { console.error(err); } finally { e.detail.complete(); } }}>
              <IonRefresherContent />
            </IonRefresher>
            {/* Orders list */}
            <div style={{ padding: '0 16px' }}>
                {orders.filter(o => !search || (o.client || '').toLowerCase().includes(search.toLowerCase()) || (o.id || '').toLowerCase().includes(search.toLowerCase())).map((order, idx) => {
                  const cardId = order._id || order.id || order.orgSeq || idx;
                  const getPriorityLevel = (it: any) => {
                    // prefer nested data.priority (e.g. order.data.priority) or top-level priority
                    const raw = it?.urgency;
                    if (raw == 'Media') return 2;
                    if (raw == 'Baja') return 1;
                    // anything else treat as high/urgent
                    return 3;
                  };
                  const priority = getPriorityLevel(order);
                  const priorityColorMap: Record<number,string> = {
                    1: '#A5D6A7', // low - green
                    2: '#FFD54F', // normal - amber
                    3: '#FF7043'  // high/urgent - red/orange
                  };
                  const accent = priorityColorMap[priority] || priorityColorMap[2];
                  const title = order.name || order.client || order.type || 'Orden';
                  const client = order.client || '';
                  const address = order.address || '';
                  const displayId = order.orgSeq || order.id || order._id || '';
                  return (
                    <div key={cardId} onClick={() => { history.push(`/work-orders/${order._id || order.id}`); }} style={{ display: 'flex', alignItems: 'center', marginBottom: 14, cursor: 'pointer' }}>
                      <div style={{ width: 6, height: 80, borderRadius: 6, background: accent, marginRight: 12 }} />
                      <div style={{ flex: 1 }}>
                        <IonCard style={{ borderRadius: 12, boxShadow: '0 6px 18px rgba(2,40,71,0.06)' }}>
                          <IonCardContent style={{ padding: '14px 16px' }}>
                            <div style={{ color: '#9aa4b2', fontSize: 12, marginBottom: 6 }}>{t('ot_prefix', { id: displayId })}</div>
                            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{title}</div>
                            <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: 13 }}>
                              <IonIcon icon={locationOutline} style={{ marginRight: 8, fontSize: 16 }} />
                              <div>{address || client || t('no_location')}</div>
                            </div>
                          </IonCardContent>
                        </IonCard>
                      </div>
                    </div>
                  );
                })}

                {orders.length === 0 && <div style={{ padding: 16 }}>{t('no_orders')}</div>}
              </div>
        </IonContent>
        </>
      }
      {/* <IonContent> */}
        {/* <div>
          {loading ? (
            <div style={{ padding: 16 }}>Cargando...</div>
          ) : (
            <div style={{ paddingBottom: 100 }}>
              
            </div>
          )}
        </div> */}

        {/* Floating scan button centered */}
        {/* <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton style={{ width: 64, height: 64, borderRadius: 32, boxShadow: '0 10px 24px rgba(2,40,71,0.18)', background: '#2E3B47' }} onClick={() => { console.log('Scan pressed'); }}>
            <IonIcon icon={scanOutline} />
          </IonFabButton>
        </IonFab> */}
      {/* </IonContent> */}
    </IonPage>
  );
};

export default MyAssignations;

import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonContent, IonRefresher, IonRefresherContent, IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonList, IonItem, IonLabel, IonTitle, IonFab, IonFabButton, IonIcon, IonModal, IonButton, IonCheckbox } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { getWorkOrders } from '../api/workOrders';
import { useTranslation } from 'react-i18next';
import { WORK_ORDER_STATES } from '../constants/workOrderStates';
import { useHistory } from 'react-router';
import { scanOutline, locationOutline, filterOutline } from 'ionicons/icons';

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
      const data = await getWorkOrders({ page: 1, limit: 20, filters: { assigneeId: userId, excludeStates: WORK_ORDER_STATES.APPROVED } });
      console.log('Loaded orders:', data);
      const list = data.items || data.data || data;
      if (Array.isArray(list) && list.length > 0) {
        setLastOrder(list[0] || null);
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

  const [showFilter, setShowFilter] = useState(false);
  const [urgencyFilters, setUrgencyFilters] = useState<Set<string>>(new Set(['Alta', 'Media', 'Baja']));

  const toggleUrgency = (u: string) => {
    setUrgencyFilters(prev => {
      const next = new Set(Array.from(prev));
      if (next.has(u)) next.delete(u); else next.add(u);
      return next;
    });
  };

  const applyFilters = () => {
    if (urgencyFilters.size === 0) {
      // if user applied with none selected, treat as all selected
      setUrgencyFilters(new Set(['Alta', 'Media', 'Baja']));
    }
    setShowFilter(false);
  };

  // prepare filtered and ordered list: by priority desc, then by proximity of scheduled start to now
  const filteredOrders = orders.filter(o => {
    if (search) {
      const s = search.toLowerCase();
      if (!((o.client || '').toLowerCase().includes(s) || (o.id || '').toLowerCase().includes(s))) return false;
    }
    if (urgencyFilters.size > 0) {
      const raw = o?.urgency || o?.data?.urgency || '';
      if (!urgencyFilters.has(raw)) return false;
    }
    return true;
  });
  const sortedOrders = [...filteredOrders].sort((a: any, b: any) => {
    const getPriorityLevel = (it: any) => {
      const raw = it?.urgency;
      if (raw == 'Media') return 2;
      if (raw == 'Baja') return 1;
      return 3;
    };
    const pa = getPriorityLevel(a);
    const pb = getPriorityLevel(b);
    if (pa !== pb) return pb - pa; // higher priority first

    const pickScheduled = (it: any) => {
      const raw = it?.dates?.scheduledStart || it?.scheduledStart || it?.dates?.start || it?.createdAt || null;
      if (!raw) return null;
      const d = new Date(raw);
      return Number.isNaN(d.getTime()) ? null : d.getTime();
    };
    const ta = pickScheduled(a);
    const tb = pickScheduled(b);
    const now = Date.now();
    const da = ta == null ? Number.MAX_SAFE_INTEGER : Math.abs(ta - now);
    const db = tb == null ? Number.MAX_SAFE_INTEGER : Math.abs(tb - now);
    if (da !== db) return da - db; // closer to now first
    if (ta != null && tb != null) return ta - tb; // tie: earlier scheduled first
    // fallback to createdAt order
    const ca = new Date(a.createdAt || 0).getTime();
    const cb = new Date(b.createdAt || 0).getTime();
    return ca - cb;
  });

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
                {sortedOrders.map((order, idx) => {
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
                  const stateRaw = order.state || order.status || '';
                  const humanState = (s: string) => {
                    if (!s) return t('unknown');
                    return String(s).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                  };
                  const displayId = order.orgSeq || order.id || order._id || '';
                  const progressRaw = (order && (order.progress ?? (order.data && order.data.progress))) || 0;
                  const progress = Math.max(0, Math.min(100, Number(progressRaw || 0)));
                  // determine scheduled start (prefer dates.scheduledStart -> scheduledStart -> dates.start -> createdAt)
                  const scheduledRaw = order?.dates?.scheduledStart || order?.scheduledStart || order?.dates?.start || order?.createdAt || null;
                  let scheduledDisplay = '';
                  let scheduledColor = '#37474F';
                  if (scheduledRaw) {
                    try {
                      const d = new Date(scheduledRaw);
                      if (!Number.isNaN(d.getTime())) {
                        scheduledDisplay = d.toLocaleDateString();
                        const today = new Date();
                        const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const s0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
                        if (s0.getTime() === t0.getTime()) {
                          scheduledColor = '#F9A825'; // today -> yellow
                        } else if (s0.getTime() < t0.getTime()) {
                          scheduledColor = '#D32F2F'; // overdue -> red
                        }
                      }
                    } catch (e) {
                      scheduledDisplay = '';
                    }
                  }

                  return (
                    <div key={cardId} onClick={() => { history.push(`/work-orders/${order._id || order.id}`); }} style={{ display: 'flex', alignItems: 'center', marginBottom: 14, cursor: 'pointer' }}>
                      <div style={{ width: 6, height: 80, borderRadius: 6, background: accent, marginRight: 12 }} />
                      <div style={{ flex: 1 }}>
                        <IonCard style={{ borderRadius: 12, boxShadow: '0 6px 18px rgba(2,40,71,0.06)' }}>
                          <IonCardContent style={{ padding: '14px 16px' }}>
                            <div style={{ color: '#9aa4b2', fontSize: 12, marginBottom: 6 }}>{t('ot_prefix', { id: displayId })}</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <div style={{ fontSize: 12, padding: '4px 8px', borderRadius: 12, background: 'rgba(0,0,0,0.06)', color: '#37474F' }}>{humanState(stateRaw)}</div>
                                  <div style={{ fontSize: 12, padding: '4px 8px', borderRadius: 12, background: 'rgba(0,0,0,0.03)', color: '#37474F' }}>Progreso: {progress}%</div>
                                  
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: 13 }}>
                              <IonIcon icon={locationOutline} style={{ marginRight: 8, fontSize: 16 }} />
                              <div>{address || client || t('no_location')}</div>
                              {scheduledDisplay ? (
                                <div style={{ fontSize: 12, padding: '4px 8px', borderRadius: 12, background: 'rgba(0,0,0,0.02)', color: scheduledColor }}>{scheduledDisplay}</div>
                              ) : null}
                            </div>
                          </IonCardContent>
                        </IonCard>
                      </div>
                    </div>
                  );
                })}

                {sortedOrders.length === 0 && <div style={{ padding: 16 }}>{t('no_orders')}</div>}
              </div>

            <IonFab vertical="bottom" horizontal="end" slot="fixed">
              <IonFabButton onClick={() => setShowFilter(true)}>
                <IonIcon icon={filterOutline} />
              </IonFabButton>
            </IonFab>

            <IonModal isOpen={showFilter} onDidDismiss={() => setShowFilter(false)}>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{t('filters.filter_by_urgency') || 'Filtrar por urgencia'}</div>
                  <IonButton fill="clear" onClick={() => setShowFilter(false)} aria-label={t('filters.close') || 'Cerrar'}>{t('filters.close') || 'X'}</IonButton>
                </div>
                <IonList>
                  {['Alta', 'Media', 'Baja'].map(u => (
                    <IonItem key={u}>
                      <IonLabel>{u === 'Alta' ? t('urgency.high') : u === 'Media' ? t('urgency.medium') : t('urgency.low')}</IonLabel>
                      <IonCheckbox slot="end" checked={urgencyFilters.has(u)} onIonChange={(e: any) => {
                        const checked = !!e?.detail?.checked;
                        setUrgencyFilters(prev => {
                          const next = new Set(Array.from(prev));
                          if (checked) next.add(u); else next.delete(u);
                          return next;
                        });
                      }} />
                    </IonItem>
                  ))}
                </IonList>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <IonButton onClick={() => { setUrgencyFilters(new Set()); }}>{t('filters.clear') || 'Limpiar'}</IonButton>
                  <IonButton onClick={() => applyFilters()}>{t('filters.apply') || 'Aplicar'}</IonButton>
                </div>
              </div>
            </IonModal>

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

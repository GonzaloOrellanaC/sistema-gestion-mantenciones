import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonSpinner } from '@ionic/react';
import { getWorkOrders, WorkOrder } from '../api/workOrders';
import { onWorkOrderUpdated } from '../utils/eventBus';
import { useAuth } from '../context/AuthContext';

const WorkOrdersList: React.FC = () => {
  const { user } = useAuth();
  const perms = (user as any)?.role?.permissions || (user as any)?.roleId?.permissions || {};
  const hasPermission = (key?: string) => {
    if (!key) return true;
    if ((user as any)?.isSuperAdmin) return true;
    if (Object.prototype.hasOwnProperty.call(perms, key)) return !!perms[key];
    return false;
  };
  const [items, setItems] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    load();
    // subscribe to updates from other pages/components
    const unsub = onWorkOrderUpdated((e: any) => {
      try {
        const d = e && e.detail;
        if (!d || !d.id) return;
        setItems(prev => {
          const idx = prev.findIndex(it => it._id === d.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...(d.workOrder || {}) };
            return updated;
          }
          // if not present in current page, reload list to reflect changes
          load();
          return prev;
        });
      } catch (err) { /* ignore */ }
    });
    return () => { try { unsub(); } catch (e) { /* ignore */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, user]);

  async function load() {
    setLoading(true);
    try {
      const orgId = (user as any)?.orgId;
      const userId = (user as any)?._id;
      const data = await getWorkOrders({ page, limit, filters: { assigneeId: userId } });
      // support different response shapes
      const list = data.items || data.data || data;
      setItems(Array.isArray(list) ? list : []);
      if (data.total != null) setTotal(data.total);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Órdenes de trabajo</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="view-content">
          <div className="app-container">
            {loading ? (
              <div style={{ padding: 16 }}><IonSpinner /></div>
            ) : (
              <IonList>
                {items.length === 0 && <div style={{ padding: 16 }}>No hay órdenes.</div>}
                {items.map((it) => (
                  <IonItem key={it._id} button routerLink={`/work-orders/${it._id}`}>
                    <IonLabel>
                      <h3>#{it.orgSeq ?? ''} — {it.title || 'Sin título'}</h3>
                      <p>Estado: {it.state || '—'}</p>
                      {(hasPermission('verOT') || hasPermission('supervisar')) && (
                        <p>Progreso: {typeof (it as any).progress === 'number' ? `${(it as any).progress}%` : '—'}</p>
                      )}
                      <p>Creada: {it.createdAt ? new Date(it.createdAt).toLocaleString() : '—'}</p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}

            <div style={{ display: 'flex', gap: 8, padding: 16 }}>
              <IonButton onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</IonButton>
              <div style={{ flex: 1, textAlign: 'center', alignSelf: 'center' }}>Página {page}{total ? ` — ${total} resultados` : ''}</div>
              <IonButton onClick={() => setPage(p => p + 1)} disabled={items.length < limit}>Siguiente</IonButton>
            </div>
          </div>
        </IonContent>
      </IonPage>
  );
};

export default WorkOrdersList;

import React, { useEffect, useMemo, useState } from 'react';
import { IonPage, IonContent, IonButton, IonToast, IonIcon, IonPopover, IonList, IonItem, IonListHeader } from '@ionic/react';
import workOrdersApi from '../api/workOrders';
import * as usersApi from '../api/users';
import type { WorkOrder } from '../api/types';
import { useHistory, useLocation } from 'react-router-dom';
import { personOutline, eyeOutline } from 'ionicons/icons';
import type { User } from '../api/types';

function formatDateOnly(d?: string | Date | null) {
  if (!d) return '';
  if (typeof d === 'string') {
    // if already date-only like 'YYYY-MM-DD', return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const dt = d as Date;
  if (Number.isNaN(dt.getTime())) return '';
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

const WorkOrdersList: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(monthStart(new Date()));
  const [assignees, setAssignees] = useState<Record<string, string>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const location = useLocation();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [popoverOrderId, setPopoverOrderId] = useState<string | null>(null);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const history = useHistory();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // request first page with reasonable limit
        const res = await workOrdersApi.listWorkOrders({ page: 1, limit: 100 });
        console.log('Loaded work orders', res);
        if (!mounted) return;
        setOrders(res.items || []);

        // if url contains ?new=<id> highlight it
        try {
          const params = new URLSearchParams(location.search);
          const newId = params.get('new');
          if (newId) setHighlightId(newId);
        } catch (e) {
          // ignore
        }

        // resolve assignee names in batch
        const ids = Array.from(new Set((res.items || []).map((w: any) => w.assigneeId).filter(Boolean)));
        const map: Record<string, string> = {};
        await Promise.all(ids.map(async (id: string) => {
          try {
            const u = await usersApi.getUser(id);
            map[id] = `${u.firstName || ''} ${u.lastName || ''}`.trim();
          } catch (e) {
            map[id] = id;
          }
        }));
        if (mounted) setAssignees(map);
        // also load users list for assignment popover
        try {
          const ul = await usersApi.listUsers({ limit: 500 });
          if (mounted) setUsersList(ul.items || []);
        } catch (e) {
          // ignore users list error
        }
      } catch (err) {
        console.error('load work orders', err);
        setToast({ show: true, message: 'Error cargando órdenes' });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // build date -> orders map using dates.start or createdAt
  const dateMap = useMemo(() => {
    const m: Record<string, WorkOrder[]> = {};
    orders.forEach((w) => {
      const d = (w as any).dates?.start || w.createdAt;
      const key = formatDateOnly(d);
      if (!m[key]) m[key] = [];
      m[key].push(w);
    });
    return m;
  }, [orders]);

  const daysInMonth = useMemo(() => {
    const start = monthStart(currentMonth);
    const year = start.getFullYear();
    const month = start.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [] as Date[];
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }, [currentMonth]);

  async function handleAssign(userId: string) {
    if (!popoverOrderId) return;
    try {
      const updated = await workOrdersApi.assignWorkOrder(popoverOrderId, userId);
      // update orders list
      setOrders((prev) => prev.map(o => (o._id === updated._id ? updated : o)));
      // update assignees map using usersList cache
      const u = usersList.find(x => x._id === userId);
      setAssignees((prev) => ({ ...prev, [userId]: u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : userId }));
      setToast({ show: true, message: 'Asignación actualizada' });
    } catch (e) {
      console.error('assign err', e);
      setToast({ show: true, message: 'Error asignando orden' });
    } finally {
      setPopoverOrderId(null);
      setPopoverEvent(null);
    }
  }

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0 }}>Órdenes de Trabajo</h2>
              <div>
                <IonButton onClick={() => history.push('/work-orders/create')}>Crear OT</IonButton>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              {loading ? <div>Cargando órdenes...</div> : (
                <div className="table-container">
                  <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                    <thead>
                      <tr>
                        <th style={{ background: '#1976d2', color: '#fff', padding: '10px 8px', borderRadius: 4 }}>#</th>
                        <th style={{ background: '#1976d2', color: '#fff', padding: '10px 8px' }}>Fecha</th>
                        <th style={{ background: '#1976d2', color: '#fff', padding: '10px 8px' }}>Estado</th>
                        <th style={{ background: '#1976d2', color: '#fff', padding: '10px 8px' }}>Asignado</th>
                        <th style={{ background: '#1976d2', color: '#fff', padding: '10px 8px', borderRadius: 4 }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((w) => {
                        const highlight = highlightId && highlightId === w._id;
                        return (
                          <tr
                            key={w._id}
                            style={{ cursor: 'pointer', background: highlight ? '#FFF9C4' : '#fff', boxShadow: highlight ? '0 4px 10px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)' }}
                            onClick={() => history.push(`/work-orders/edit/${w._id}`)}
                          >
                            <td style={{ padding: '12px 8px' }}>{w.orgSeq ?? '-'}</td>
                            <td style={{ padding: '12px 8px' }}>{
                              (() => {
                                const raw = (w as any).dates?.start || w.createdAt;
                                const key = formatDateOnly(raw);
                                if (!key) return '';
                                // show localized date only (no time)
                                try {
                                  const d = new Date(key + 'T00:00:00');
                                  return d.toLocaleDateString();
                                } catch (e) {
                                  return key;
                                }
                              })()
                            }</td>
                            <td style={{ padding: '12px 8px' }}>{w.status || (w as any).state || '-'}</td>
                            <td style={{ padding: '12px 8px' }}>{w.assigneeId ? (assignees[w.assigneeId] || w.assigneeId) : '-'}</td>
                            <td style={{ padding: '12px 8px', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                              <IonButton size="small" fill="clear" onClick={(e) => { e.stopPropagation(); history.push(`/work-orders/edit/${w._id}`); }} aria-label="Ver">
                                <IonIcon icon={eyeOutline} />
                              </IonButton>
                              <IonButton size="small" fill="clear" onClick={(e) => { e.stopPropagation(); setPopoverOrderId(w._id || null); setPopoverEvent(e.nativeEvent); }} aria-label="Asignar">
                                <IonIcon icon={personOutline} />
                              </IonButton>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div style={{ width: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <strong>{currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</strong>
              <div style={{ display: 'flex', gap: 8 }}>
                <IonButton size="small" onClick={() => setCurrentMonth(monthStart(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)))}>◀</IonButton>
                <IonButton size="small" onClick={() => setCurrentMonth(monthStart(new Date()))}>Hoy</IonButton>
                <IonButton size="small" onClick={() => setCurrentMonth(monthStart(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)))}>▶</IonButton>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 12 }}>
              {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((d) => (
                <div key={d} style={{ fontSize: 12, textAlign: 'center', color: '#607D8B' }}>{d}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {daysInMonth.map((day) => {
                const key = formatDateOnly(day);
                const list = dateMap[key] || [];
                const today = new Date();
                const dayOnly = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const isPast = dayOnly < todayOnly;
                const isToday = dayOnly.getTime() === todayOnly.getTime();
                return (
                  <div
                    key={key}
                    onClick={() => { if (!isPast) setSelectedDate(key); }}
                    style={{
                      minHeight: 64,
                      padding: 8,
                      border: selectedDate === key ? '2px solid #1976d2' : isToday ? '2px solid #FFB74D' : '1px solid #e0e0e0',
                      borderRadius: 6,
                      background: selectedDate === key ? undefined : (isToday ? '#FFF3E0' : (list.length ? '#F1F8FF' : undefined)),
                      cursor: isPast ? 'not-allowed' : 'pointer',
                      opacity: isPast ? 0.5 : 1,
                      color: isPast ? '#9e9e9e' : undefined,
                    }}
                    title={isPast ? 'Día anterior - deshabilitado' : undefined}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13 }}>{day.getDate()}</div>
                      {list.length > 0 && <div style={{ background: '#1976d2', color: '#fff', padding: '2px 6px', borderRadius: 12, fontSize: 12 }}>{list.length}</div>}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12 }}>
                      {list.slice(0,2).map((l) => (
                        <div key={l._id} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{'#'+(l.orgSeq||'')+' '+((l as any).state||l.status||'')}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedDate && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Órdenes en {selectedDate}</div>
                {(dateMap[selectedDate] || []).map((w) => (
                  <div key={w._id} style={{ padding: 8, border: '1px solid #eee', borderRadius: 6, marginBottom: 8, cursor: 'pointer' }} onClick={() => history.push(`/work-orders/${w._id}`)}>
                    <div style={{ fontWeight: 700 }}>#{w.orgSeq || ''} - {(w as any).state || w.status || ''}</div>
                    <div style={{ fontSize: 13, color: '#607D8B' }}>{w.assigneeId ? (assignees[w.assigneeId] || w.assigneeId) : 'Sin asignar'}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <IonPopover isOpen={!!popoverOrderId} event={popoverEvent} onDidDismiss={() => { setPopoverOrderId(null); setPopoverEvent(null); }}>
          <IonList>
            <IonListHeader>Asignar usuario</IonListHeader>
            {usersList.length === 0 && <IonItem>No hay usuarios</IonItem>}
            {usersList.map(u => (
              <IonItem button key={u._id} onClick={() => handleAssign(u._id || '')}>{u.firstName} {u.lastName} {u.email ? `(${u.email})` : ''}</IonItem>
            ))}
          </IonList>
        </IonPopover>
        <IonToast isOpen={toast.show} message={toast.message} duration={3000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
    </IonPage>
  );
};

export default WorkOrdersList;

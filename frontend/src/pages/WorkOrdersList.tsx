import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IonPage, IonContent, IonButton, IonToast, IonIcon, IonPopover, IonList, IonItem, IonListHeader, IonGrid, IonRow, IonCol, IonHeader, IonToolbar, IonTitle, IonAvatar, IonLabel } from '@ionic/react';
import workOrdersApi from '../api/workOrders';
import templatesApi from '../api/templates';
import * as usersApi from '../api/users';
import inventoryApi from '../api/inventory';
import { useAuth } from '../context/AuthContext';
import type { WorkOrder } from '../api/types';
import sortByName from '../utils/sort';
import { useHistory, useLocation } from 'react-router-dom';
import { personOutline, eyeOutline, chevronBackOutline, pencilOutline, checkmarkOutline } from 'ionicons/icons';
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
  const [page, setPage] = useState<number>(1);
  const [pages, setPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(monthStart(new Date()));
  const [assignees, setAssignees] = useState<Record<string, string>>({});
  const [templatesMap, setTemplatesMap] = useState<Record<string, string>>({});
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [orderAvailability, setOrderAvailability] = useState<Record<string, { ok: boolean; shortages: Array<{ name?: string; required: number; available: number }> }>>({});
  const location = useLocation();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [popoverOrderId, setPopoverOrderId] = useState<string | null>(null);
  const [popoverEvent, setPopoverEvent] = useState<any>(null);
  const history = useHistory();
  const { t } = useTranslation();
  const { user } = useAuth();
  const perms = (user as any)?.role?.permissions || (user as any)?.roleId?.permissions || {};
  const hasPermission = (key?: string) => {
    if (!key) return true;
    if ((user as any)?.isSuperAdmin) return true;
    if (Object.prototype.hasOwnProperty.call(perms, key)) return !!perms[key];
    return false;
  };
  const [noPermMsg, setNoPermMsg] = useState<string | null>(null);

  const showNoPerm = (msg: string) => {
    setNoPermMsg(msg);
    window.setTimeout(() => setNoPermMsg(null), 3000);
  };

  useEffect(() => {
    console.log({orders})
  }, [orders])
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // request current page with limit
        const res = await workOrdersApi.listWorkOrders({ page, limit: 10 });
        console.log('Loaded work orders', res);
        if (!mounted) return;
        // ensure default ordering: descending by orgSeq (order number)
        const items = (res.items || []).slice();
        items.sort((a: any, b: any) => (Number(b.orgSeq || 0) - Number(a.orgSeq || 0)));
        setOrders(items);
        // compute stock availability for loaded items
        checkAvailability(items).catch(e => console.warn('availability check failed', e));
        setTotal(Number(res.total) || 0);
        setPages(Number(res.page) || 1);

        // if url contains ?new=<id> highlight it
        try {
          const params = new URLSearchParams(location.search);
          const newId = params.get('new');
          if (newId) setHighlightId(newId);
        } catch (e) {
          // ignore
        }

        // resolve assignee names in batch
        // if assigneeId is populated object, extract _id; otherwise it's id string
        const ids = Array.from(new Set((res.items || []).map((w: any) => (w.assigneeId && typeof w.assigneeId === 'object' ? (w.assigneeId._id || w.assigneeId.id) : w.assigneeId)).filter(Boolean)));
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
        // load templates map (names) to display pauta name
        try {
          const tplRes = await templatesApi.listTemplates({ limit: 1000 });
          const tplItems = tplRes.items || [];
          const tmap: Record<string,string> = {};
          tplItems.forEach((tp: any) => { if (tp && tp._id) tmap[String(tp._id)] = tp.name || tp.title || '' });
          if (mounted) setTemplatesMap(tmap);
        } catch (e) {
          // ignore template loading errors
        }
        // also load users list for assignment popover
        try {
          const ul = await usersApi.listUsers({ limit: 500 });
          if (mounted) setUsersList(sortByName(ul.items || []));
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

  useEffect(() => {
    // reload when page changes
    let mounted = true;
    const loadPage = async () => {
      setLoading(true);
      try {
        const res = await workOrdersApi.listWorkOrders({ page, limit: 10 });
        if (!mounted) return;
        const items = (res.items || []).slice();
        items.sort((a: any, b: any) => (Number(b.orgSeq || 0) - Number(a.orgSeq || 0)));
        setOrders(items);
        // compute availability for this page
        checkAvailability(items).catch(e => console.warn('availability check failed', e));
        setTotal(Number(res.total) || 0);
        setPages(Number(res.page) || 1);
        // update assignees map as before
        const ids = Array.from(new Set((res.items || []).map((w: any) => (w.assigneeId && typeof w.assigneeId === 'object' ? (w.assigneeId._id || w.assigneeId.id) : w.assigneeId)).filter(Boolean)));
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
        // ensure templates map exists (in case not loaded yet)
        try {
          const tplRes = await templatesApi.listTemplates({ limit: 1000 });
          const tplItems = tplRes.items || [];
          const tmap: Record<string,string> = {};
          tplItems.forEach((tp: any) => { if (tp && tp._id) tmap[String(tp._id)] = tp.name || tp.title || '' });
          if (mounted) setTemplatesMap(tmap);
        } catch (e) {
          // ignore
        }
      } catch (e) {
        console.error('load page err', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadPage();
    return () => { mounted = false; };
  }, [page]);

  async function checkAvailability(items: WorkOrder[]) {
    const map: Record<string, { ok: boolean; shortages: Array<{ name?: string; required: number; available: number }> }> = {};
    await Promise.all(items.map(async (w) => {
      try {
        const oid = String((w as any)._id || '');
        const parts = (w as any).selectedParts || (w as any).parts || (w as any).data && ((w as any).data.selectedParts || (w as any).data.parts) || [];
        if (!oid) return;
        if (!Array.isArray(parts) || parts.length === 0) {
          map[oid] = { ok: true, shortages: [] };
          return;
        }
        const shortages: Array<{ name?: string; required: number; available: number }> = [];
        await Promise.all(parts.map(async (p: any) => {
          const partId = p.partId || p.part || p._id || p.id;
          const req = Number(p.qty || p.quantity || p.qtyRequested || 1) || 1;
          try {
            const stockLines = await inventoryApi.listStock({ orgId: (w as any).orgId, partId });
            const available = (stockLines || []).reduce((acc: number, s: any) => {
              const q = Number(s.quantity || 0);
              const r = Number(s.reserved || 0);
              return acc + Math.max(0, q - r);
            }, 0);
            if (available < req) shortages.push({ name: p.name || p.label || partId, required: req, available });
          } catch (e) {
            // on error assume unavailable
            shortages.push({ name: p.name || partId, required: req, available: 0 });
          }
        }));
        map[oid] = { ok: shortages.length === 0, shortages };
      } catch (e) {
        const oid = String((w as any)._id || '');
        if (oid) map[oid] = { ok: true, shortages: [] };
      }
    }));
    setOrderAvailability(map);
  }

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
      setToast({ show: true, message: t('workOrdersList.toasts.assignUpdated') });
    } catch (e) {
      console.error('assign err', e);
      setToast({ show: true, message: t('workOrdersList.toasts.assignError') });
    } finally {
      setPopoverOrderId(null);
      setPopoverEvent(null);
    }
  }

  // compute current assignee id for the order shown in popover
  const currentAssigneeId = (() => {
    if (!popoverOrderId) return null;
    const ord = orders.find(o => String(o._id) === String(popoverOrderId));
    if (!ord) return null;
    const aid = (ord as any).assigneeId;
    if (!aid) return null;
    return typeof aid === 'object' ? (aid._id || aid.id || null) : String(aid);
  })();

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{padding: '0px 10px'}}>
          <IonTitle>{t('workOrdersList.title')}</IonTitle>
          <div className="toolbar-sub">{t('workOrdersList.subtitle')}</div>
          <IonButton slot={'end'} onClick={() => {
            if (!hasPermission('crearOT')) { showNoPerm(t('workOrdersList.noPermission.create')); return; }
            history.push('/work-orders/create');
          }}>{t('workOrdersList.createButton')}</IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ marginBottom: 12 }}>
          {loading ? <div>{t('workOrdersList.loading')}</div> : (
            <div className="table-container">
              <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                <thead>
                      <tr>
                        <th style={{ background: 'var(--ion-color-primary)', color: 'var(--ion-color-primary-contrast)', padding: '10px 8px', borderRadius: 4 }}>{t('workOrdersList.headers.number')}</th>
                        <th style={{ background: 'var(--ion-color-primary)', color: 'var(--ion-color-primary-contrast)', padding: '10px 8px' }}>{t('workOrdersList.headers.start')}</th>
                        <th style={{ background: 'var(--ion-color-primary)', color: 'var(--ion-color-primary-contrast)', padding: '10px 8px' }}>Pauta</th>
                        <th style={{ background: 'var(--ion-color-primary)', color: 'var(--ion-color-primary-contrast)', padding: '10px 8px' }}>{t('workOrdersList.headers.end')}</th>
                        <th style={{ background: 'var(--ion-color-primary)', color: 'var(--ion-color-primary-contrast)', padding: '10px 8px' }}>{t('workOrdersList.headers.asset')}</th>
                        <th style={{ background: 'var(--ion-color-primary)', color: 'var(--ion-color-primary-contrast)', padding: '10px 8px' }}>{t('workOrdersList.headers.state')}</th>
                        <th style={{ background: 'var(--ion-color-primary)', color: 'var(--ion-color-primary-contrast)', padding: '10px 8px' }}>{t('workOrdersList.headers.assigned')}</th>
                        <th style={{ background: 'var(--ion-color-primary)', color: 'var(--ion-color-primary-contrast)', padding: '10px 8px', borderRadius: 4 }}>{t('workOrdersList.headers.actions')}</th>
                      </tr>
                </thead>
                <tbody>
                  {orders.map((w) => {
                    const highlight = highlightId && highlightId === w._id;
                    const isHover = hoveredRow === w._id;
                    return (
                      <tr
                        key={w._id}
                        onMouseEnter={() => setHoveredRow(String(w._id))}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          cursor: 'pointer',
                          background: highlight ? '#FFF9C4' : (isHover ? '#f0f8ff' : '#fff'),
                          boxShadow: highlight ? '0 4px 10px rgba(0,0,0,0.08)' : (isHover ? '0 6px 14px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)')
                        }}
                        onClick={() => history.push(`/work-orders/view/${w._id}`)}
                      >
                        <td style={{ padding: '6px 8px' }}>{w.orgSeq ?? '-'}</td>
                        <td style={{ padding: '6px 8px' }}>{(() => {
                          const raw = (w as any).dates?.scheduledStart || (w as any).scheduledStart || (w as any).dates?.start || w.createdAt;
                          const key = formatDateOnly(raw);
                          if (!key) return '';
                          try { return new Date(key + 'T00:00:00').toLocaleDateString(); } catch (e) { return key; }
                        })()}</td>
                        <td style={{ padding: '6px 8px' }}>{(() => {
                          // show template name: prefer populated object, otherwise use templatesMap
                          const tp = (w as any).templateId;
                          if (!tp) return templatesMap[(w as any).templateId] || '-';
                          if (typeof tp === 'object') return tp.name || tp.title || tp._id || '-';
                          return templatesMap[String(tp)] || tp || '-';
                        })()}</td>
                        <td style={{ padding: '6px 8px' }}>{(() => {
                          const raw = (w as any).dates?.estimatedEnd || (w as any).estimatedEnd || (w as any).dates?.end;
                          const key = formatDateOnly(raw);
                          if (!key) return '';
                          try { return new Date(key + 'T00:00:00').toLocaleDateString(); } catch (e) { return key; }
                        })()}</td>
                        <td style={{ padding: '6px 8px' }}>{(w as any).assetId ? (typeof (w as any).assetId === 'object' ? ((w as any).assetId.name || (w as any).assetId._id) : (w as any).assetId) : '-'}</td>
                        <td style={{ padding: '6px 8px' }}>{w.status || (w as any).state || '-'}</td>
                        <td style={{ padding: '6px 8px' }}>
                          {(() => {
                            if (!w.assigneeId) return '-';
                            // populated object
                            if (typeof (w.assigneeId) === 'object') {
                              const obj: any = w.assigneeId;
                              const name = `${obj.firstName || ''} ${obj.lastName || ''}`.trim();
                              return name || (obj._id || obj.id) || '-';
                            }
                            // id string - try map lookup
                            return assignees[w.assigneeId] || w.assigneeId;
                          })()}
                        </td>
                        <td style={{ padding: '6px 8px', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                          <IonButton size="small" fill="clear" onClick={(e) => { e.stopPropagation(); if (!hasPermission('editarOT')) { showNoPerm(t('workOrdersList.noPermission.edit')); return; } history.push(`/work-orders/edit/${w._id}`); }} aria-label="Ver">
                            <IonIcon icon={pencilOutline} />
                          </IonButton>
                          <IonButton size="small" fill="clear" onClick={(e) => { e.stopPropagation(); if (!hasPermission('asignarOT')) { showNoPerm(t('workOrdersList.noPermission.assign')); return; } setPopoverOrderId(w._id || null); setPopoverEvent(e.nativeEvent); }} aria-label="Asignar">
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
        <div style={{ flex: 1 }}>
          <div style={{ padding: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <IonButton disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</IonButton>
            <div style={{ alignSelf: 'center' }}>Página {page} / {pages} · Total: {total}</div>
            <IonButton disabled={page >= pages} onClick={() => setPage((p) => Math.min(p + 1, pages))}>Next</IonButton>
          </div>
        </div>
        <IonPopover isOpen={!!popoverOrderId} event={popoverEvent} onDidDismiss={() => { setPopoverOrderId(null); setPopoverEvent(null); }}>
          <IonContent className='ion-padding'>
            <IonList>
              <IonListHeader>Asignar usuario</IonListHeader>
              {usersList.length === 0 && <IonItem>No hay usuarios</IonItem>}
              {usersList.map((u: User) => {
                const isSelected = !!(u._id && currentAssigneeId && String(u._id) === String(currentAssigneeId));
                return (
                  <IonItem
                    button
                    key={u._id}
                    onClick={() => handleAssign(u._id || '')}
                    style={{ background: isSelected ? '#e8f5e9' : undefined, fontWeight: isSelected ? 700 : undefined }}
                    aria-current={isSelected ? 'true' : undefined}
                  >
                    <IonAvatar slot="start" style={{ marginRight: 10 }}>
                      <img src={u.photoUrl || '/assets/default-profile.svg'} alt="avatar" />
                    </IonAvatar>
                    <IonLabel>
                      {u.firstName} {u.lastName}
                    </IonLabel>
                    {isSelected && <IonIcon slot="end" icon={checkmarkOutline} style={{ color: '#2e7d32', fontSize: 18 }} />}
                  </IonItem>
                );
              })}
            </IonList>
          </IonContent>
        </IonPopover>
        <IonToast isOpen={toast.show} message={toast.message} duration={3000} onDidDismiss={() => setToast({ show: false, message: '' })} />
        <IonToast isOpen={!!noPermMsg} message={noPermMsg || ''} duration={3000} color="danger" onDidDismiss={() => setNoPermMsg(null)} />
      </IonContent>
    </IonPage>
  );
};

export default WorkOrdersList;

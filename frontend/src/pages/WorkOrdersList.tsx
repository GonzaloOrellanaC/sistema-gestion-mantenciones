import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IonPage, IonContent, IonButton, IonToast, IonIcon, IonPopover, IonList, IonItem, IonListHeader, IonGrid, IonRow, IonCol, IonHeader, IonToolbar, IonTitle, IonAvatar, IonLabel, IonFooter, IonSelect, IonSelectOption, IonInput } from '@ionic/react';
import workOrdersApi from '../api/workOrders';
import templatesApi from '../api/templates';
import * as usersApi from '../api/users';
import { WORK_ORDER_STATES, getLocaleKeyForState } from '../constants/workOrderStates';
import inventoryApi from '../api/inventory';
import assetsApi from '../api/assets';
import * as branchesApi from '../api/branches';
import { useAuth } from '../context/AuthContext';
import type { WorkOrder } from '../api/types';
import sortByName from '../utils/sort';
import { useHistory, useLocation } from 'react-router-dom';
import { personOutline, eyeOutline, chevronBackOutline, pencilOutline, checkmarkOutline, shareSocialOutline } from 'ionicons/icons';
import type { User } from '../api/types';
import './WorkOrdersList.css';

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
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [branchFilter, setBranchFilter] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [templateFilter, setTemplateFilter] = useState<string | null>(null);
  const [templateQuery, setTemplateQuery] = useState<string>('');
  const [assetFilter, setAssetFilter] = useState<string | null>(null);
  const [assetOptions, setAssetOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [templatesList, setTemplatesList] = useState<any[]>([]);
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

  // stop events robustly to avoid parent row click handling (prevents double navigation)
  const stopEvents = (e: any) => {
    try {
      e.preventDefault?.();
    } catch (err) {}
    try {
      e.stopPropagation?.();
    } catch (err) {}
    try {
      const ne: any = (e as any).nativeEvent;
      if (ne && typeof ne.stopImmediatePropagation === 'function') ne.stopImmediatePropagation();
    } catch (err) {}
  };

  useEffect(() => {
    console.log({orders})
  }, [orders])
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // centralized fetch function so we can force reload when returning from create/edit
  async function fetchOrders(pageToLoad = page) {
    setLoading(true);
    try {
      const filters: any = {};
      if (assigneeFilter) filters.assigneeId = assigneeFilter;
      if (stateFilter) filters.state = stateFilter;
      // prefer template id filter; if not set, allow free-text template query
      if (templateFilter) {
        filters.templateId = templateFilter;
      } else if (templateQuery && String(templateQuery).trim()) {
        const q = String(templateQuery).trim().toLowerCase();
        // try to resolve matching template ids locally to send stronger filter to backend
        try {
          const matches = (templatesList || []).filter((tpl: any) => (String(tpl.name || tpl.title || '').toLowerCase().indexOf(q) !== -1));
          if (matches.length === 1) {
            filters.templateId = matches[0]._id || matches[0].id;
          } else if (matches.length > 1) {
            filters.templateIds = matches.map((m: any) => (m._id || m.id)).join(',');
          }
        } catch (e) {
          // fallback to sending templateName if matching fails
        }
        filters.templateName = q;
      }
      if (assetFilter) filters.assetId = assetFilter;
      if (branchFilter) filters.branchId = branchFilter;
      const res = await workOrdersApi.listWorkOrders({ page: pageToLoad, limit: 10, filters });
      // ensure default ordering: descending by orgSeq (order number)
      const items = (res.items || []).slice();
      items.sort((a: any, b: any) => (Number(b.orgSeq || 0) - Number(a.orgSeq || 0)));
      setOrders(items);
      // compute stock availability for loaded items
      checkAvailability(items).catch(e => console.warn('availability check failed', e));
      setTotal(Number(res.total) || 0);
      setPages(Number(res.pages) || 1);

      // if url contains ?new=<id> highlight it
      try {
        const params = new URLSearchParams(location.search);
        const newId = params.get('new');
        if (newId) setHighlightId(newId);
      } catch (e) {
        // ignore
      }

      // resolve assignee names in batch
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
      setAssignees(map);

      // load templates map (names) to display pauta name
      try {
        const tplRes = await templatesApi.listTemplates({ limit: 1000 });
        const tplItems = tplRes.items || [];
        const tmap: Record<string,string> = {};
        tplItems.forEach((tp: any) => { if (tp && tp._id) tmap[String(tp._id)] = tp.name || tp.title || '' });
        setTemplatesMap(tmap);
      } catch (e) {
        // ignore template loading errors
      }
      // also load users list for assignment popover
      try {
        const ul = await usersApi.listUsers({ limit: 500 });
        setUsersList(sortByName(ul.items || []));
      } catch (e) {
        // ignore users list error
      }
    } catch (err) {
      console.error('load work orders', err);
      setToast({ show: true, message: 'Error cargando órdenes' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchOrders(page); /* initial load */ }, []);

  // load all assets for the org to populate the asset filter (optionally filtered by branch)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const params: any = { limit: 1000 };
        if (branchFilter) params.branchId = branchFilter;
        const res: any = await assetsApi.listAssets(params);
        if (!mounted) return;
        const items = res && res.items ? res.items : [];
        const aset = items.map((a: any) => ({ id: String(a._id || a.id || ''), name: a.name || a.tag || String(a._id || a.id || '') })).filter((x: any) => x.id);
        setAssetOptions(aset);
      } catch (e) {
        console.warn('failed loading assets for filter', e);
      }
    })();
    return () => { mounted = false; };
  }, [branchFilter]);

  // load branches list for branch filter
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res: any = await branchesApi.listBranches({ limit: 500 });
        if (!mounted) return;
        setBranchesList(res && res.items ? res.items : []);
      } catch (e) {
        console.warn('failed loading branches for filter', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // load templates list for pauta filter
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res: any = await templatesApi.listTemplates({ limit: 1000 });
        if (!mounted) return;
        setTemplatesList(res && res.items ? res.items : []);
      } catch (e) {
        console.warn('failed loading templates for filter', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // reload when page changes
    fetchOrders(page);
    return () => { /* no-op cleanup */ };
  }, [page]);

  // when filters change, reset to first page and reload from server
  useEffect(() => {
    setPage(1);
    fetchOrders(1);
  }, [assigneeFilter, stateFilter, assetFilter, branchFilter, templateFilter]);

  // reload when navigating back from create/edit: the creator pushes { reload: true, new: id }
  useEffect(() => {
    try {
      const st: any = (location && (location as any).state) || {};
      if (st && st.reload) {
        fetchOrders(page).then(() => {
          // highlight newly created/updated item if provided
          if (st.new) setHighlightId(st.new);
          // clear history state to avoid repeated reloads
          try { history.replace({ pathname: location.pathname, search: location.search, state: {} as any }); } catch (e) { /* ignore */ }
        }).catch(() => {});
      }
    } catch (e) {
      // ignore
    }
  }, [location]);

  async function checkAvailability(items: WorkOrder[]) {
    const map: Record<string, { ok: boolean; shortages: Array<{ name?: string; required: number; available: number }> }> = {};
    if (!Array.isArray(items) || items.length === 0) {
      setOrderAvailability({});
      return;
    }

    await Promise.all(items.map(async (w: any) => {
      try {
        const oid = String((w as any)._id || '');
        const parts = (w as any).selectedParts || (w as any).parts || ((w as any).data && ((w as any).data.selectedParts || (w as any).data.parts)) || [];
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
            const stockLines: any[] = await inventoryApi.listStock({ orgId: (w as any).orgId, partId });
            const available = (stockLines || []).reduce((acc: number, s: any) => {
              const q = Number(s.quantity || 0);
              const r = Number(s.reserved || 0);
              return acc + Math.max(0, q - r);
            }, 0);
            if (available < req) shortages.push({ name: p.name || p.label || partId, required: req, available });
          } catch (e) {
            shortages.push({ name: p.name || partId, required: req, available: 0 });
          }
        }));
        map[oid] = { ok: shortages.length === 0, shortages };
      } catch (e) {
        const oid = String((w as any)?._id || '');
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

  async function handleShare(orderId?: string) {
    if (!orderId) return;
    stopEvents(new MouseEvent('click'));
    try {
      const res: any = await workOrdersApi.shareWorkOrder(orderId);
      const url = res?.url || res?.data?.url || (res && typeof res === 'string' ? res : undefined);
      if (url) {
        try { await navigator.clipboard.writeText(url); } catch (e) { /* ignore */ }
        setToast({ show: true, message: t('workOrdersList.toasts.shareCopied') || 'Enlace creado y copiado al portapapeles' });
        console.log('Share URL:', url);
      } else {
        setToast({ show: true, message: t('workOrdersList.toasts.shareError') || 'No se pudo generar enlace' });
      }
    } catch (e) {
      console.error('share err', e);
      setToast({ show: true, message: t('workOrdersList.toasts.shareError') || 'Error al generar enlace' });
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
        <IonGrid>
          <IonRow>
            <IonCol size='10'>
              <div style={{ marginBottom: 12, fontSize: 12 }}>
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
                          <th style={{ background: 'var(--ion-color-primary)', color: 'var(--ion-color-primary-contrast)', padding: '10px 8px' }}>Insumos/Repuestos</th>
                          <th style={{ background: 'var(--ion-color-primary)', color: 'var(--ion-color-primary-contrast)', padding: '10px 8px' }}>{t('workOrdersList.headers.state')}</th>
                          <th style={{ background: 'var(--ion-color-primary)', color: 'var(--ion-color-primary-contrast)', padding: '10px 8px' }}>{t('workOrdersList.headers.progress')}</th>
                          <th style={{ background: 'var(--ion-color-primary)', color: 'var(--ion-color-primary-contrast)', padding: '10px 8px' }}>{t('workOrdersList.headers.assigned')}</th>
                          <th style={{ background: 'var(--ion-color-primary)', color: 'var(--ion-color-primary-contrast)', padding: '10px 8px', borderRadius: 4 }}>{t('workOrdersList.headers.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          return orders.map((w) => {
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
                              onClick={(e) => { e.stopPropagation(); if (!hasPermission('supervisar')) { showNoPerm(t('workOrdersList.noPermission.supervise')); return; } history.push(`/work-orders/view/${w._id}`); }}
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
                              <td style={{ padding: '6px 8px' }}>
                                {(() => {
                                  const hasRepuesto = !!((w as any).hasRepuestos);
                                  const hasInsumo = !!((w as any).hasInsumos);
                                  const parts = Array.isArray((w as any)._parts) ? (w as any)._parts : [];
                                  if (!hasRepuesto && !hasInsumo && parts.length === 0) return '-';
                                  const title = parts.length > 0 ? parts.map((p: any) => (p && (p.name || p.label || p._id || '') )).filter(Boolean).join(', ') : '';
                                  return (
                                    <div title={title} style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                                      {hasRepuesto && <span className="wo-badge wo-badge-r">R</span>}
                                      {hasInsumo && <span className="wo-badge wo-badge-i">I</span>}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td style={{ padding: '6px 8px' }}>{(() => {
                                const s = (w as any).status || (w as any).state;
                                if (!s) return '-';
                                try {
                                  const key = getLocaleKeyForState(s);
                                  const label = t(String(key));
                                  // highlight rejected in red, approved in green
                                  let badgeStyle: React.CSSProperties = { display: 'inline-block', padding: '4px 8px', borderRadius: 12 };
                                  if (String(s) === WORK_ORDER_STATES.REJECTED) {
                                    badgeStyle = { ...badgeStyle, background: '#ffebee', color: '#c62828', fontWeight: 600 };
                                  } else if (String(s) === WORK_ORDER_STATES.APPROVED) {
                                    badgeStyle = { ...badgeStyle, background: '#e8f5e9', color: '#2e7d32', fontWeight: 600 };
                                  } else if (String(s) === WORK_ORDER_STATES.UNDER_REVIEW) {
                                    // celeste (light blue) for under review
                                    badgeStyle = { ...badgeStyle, background: '#e1f5fe', color: '#0277bd', fontWeight: 600 };
                                  } else if (String(s) === WORK_ORDER_STATES.STARTED) {
                                    // brown tone for "En progreso"
                                    badgeStyle = { ...badgeStyle, background: '#efebe9', color: '#6d4c41', fontWeight: 600 };
                                  } else if (String(s) === WORK_ORDER_STATES.ASSIGNED) {
                                    // highlighted as yellow for assigned
                                    badgeStyle = { ...badgeStyle, background: '#fff8e1', color: '#f57f17', fontWeight: 600 };
                                  } else if (String(s) === WORK_ORDER_STATES.CREATED) {
                                    // highlighted as yellow for created
                                    badgeStyle = { ...badgeStyle, background: '#fff8cb', color: '#f9c937', fontWeight: 600 };
                                  }
                                  return <span style={badgeStyle}>{label}</span>;
                                } catch (e) {
                                  return String(s);
                                }
                              })()}</td>
                              <td style={{ padding: '6px 8px', minWidth: 140 }}>
                                {(() => {
                                  const raw = (w as any).progress ?? (w as any).progressPercent ?? (w as any).progression ?? (w as any).progressionPercent;
                                  let num = 0;
                                  if (raw != null) {
                                    const parsed = Number(raw);
                                    if (!Number.isNaN(parsed)) {
                                      num = parsed;
                                    }
                                  }
                                  // convert fractional values to percent
                                  let pct = 0;
                                  if (num > 0 && num <= 1) pct = Math.round(num * 100);
                                  else pct = Math.round(num || 0);
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                      <div style={{ fontSize: 12 }}>{pct}%</div>
                                      <div style={{ width: 90, background: '#e0e0e0', height: 8, borderRadius: 6 }}>
                                        <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: 'var(--ion-color-primary)', height: '100%', borderRadius: 6 }} />
                                      </div>
                                    </div>
                                  );
                                })()}
                              </td>
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
                              <td style={{ padding: '6px 8px', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'flex-start' }}>
                                <IonButton size="small" fill="clear" onClick={(e) => { stopEvents(e); if (!hasPermission('editarOT')) { showNoPerm(t('workOrdersList.noPermission.edit')); return; } history.push(`/work-orders/edit/${w._id}`); }} aria-label="Ver">
                                  <IonIcon icon={pencilOutline} />
                                </IonButton>
                                <IonButton size="small" fill="clear" onClick={(e) => { stopEvents(e); if (!hasPermission('asignarOT')) { showNoPerm(t('workOrdersList.noPermission.assign')); return; } setPopoverOrderId(w._id || null); setPopoverEvent((e as any).nativeEvent); }} aria-label="Asignar">
                                  <IonIcon icon={personOutline} />
                                </IonButton>
                                <IonButton size="small" fill="clear" onClick={(e) => { stopEvents(e); if (!hasPermission('verOT')) { showNoPerm(t('workOrdersList.noPermission.share') || 'No tiene permiso'); return; } handleShare(w._id); }} aria-label="Compartir">
                                  <IonIcon icon={shareSocialOutline} />
                                </IonButton>
                                {/* Review button: only show when status/state is 'En revisión' - placed at the end (right) */}
                                {(((w.status || (w as any).state) as string) === WORK_ORDER_STATES.UNDER_REVIEW) && (
                                  <IonButton size="small" fill="clear" onClick={(e) => { stopEvents(e); if (!hasPermission('supervisar')) { showNoPerm(t('workOrdersList.noPermission.review')); return; } history.push(`/work-orders/review/${w._id}`); }} aria-label="Revisar">
                                    <IonIcon icon={eyeOutline} />
                                  </IonButton>
                                )}
                              </td>
                            </tr>
                          );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </IonCol>
            <IonCol size='2'>
                <div style={{ padding: 8, fontSize: 10 }}>
                  <IonList>
                    <IonListHeader>Filtros</IonListHeader>
                    <IonItem>
                      <IonLabel>Asignado</IonLabel>
                      <IonSelect value={assigneeFilter || ''} onIonChange={(e) => setAssigneeFilter(e.detail.value || null)} interface="popover">
                        <IonSelectOption value="">-- Todos --</IonSelectOption>
                        {usersList && usersList.length > 0 && usersList.map((u) => (
                          <IonSelectOption key={u._id || `${u.firstName}-${u.lastName}-${Math.random()}`} value={u._id || ''}>{`${u.firstName || ''} ${u.lastName || ''}`.trim() || (u._id || '')}</IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                    <IonItem>
                      <IonLabel>Estado</IonLabel>
                      <IonSelect value={stateFilter || ''} onIonChange={(e) => setStateFilter(e.detail.value || null)} interface="popover">
                        <IonSelectOption value="">-- Todos --</IonSelectOption>
                        {Object.values(WORK_ORDER_STATES).map((s) => (
                          <IonSelectOption key={s} value={s}>{t(getLocaleKeyForState(s))}</IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                    <IonItem>
                      <IonLabel>Pauta</IonLabel>
                      <IonSelect value={templateFilter || ''} onIonChange={(e) => setTemplateFilter(e.detail.value || null)} interface="popover">
                        <IonSelectOption value="">-- Todos --</IonSelectOption>
                        {templatesList && templatesList.length > 0 && templatesList.map((tpl) => (
                          <IonSelectOption key={tpl._id || tpl.id} value={tpl._id || tpl.id}>{tpl.name || tpl.title || tpl._id || tpl.id}</IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                    <IonItem>
                      <IonLabel>Buscar pauta</IonLabel>
                      <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                        <IonInput value={templateQuery} placeholder="Nombre de pauta" onIonChange={(e) => setTemplateQuery(e.detail.value || '')} />
                        <IonButton onClick={() => { setTemplateFilter(null); setPage(1); fetchOrders(1); }}>Buscar</IonButton>
                      </div>
                    </IonItem>
                    <IonItem>
                      <IonLabel>Sucursal</IonLabel>
                      <IonSelect value={branchFilter || ''} onIonChange={(e) => setBranchFilter(e.detail.value || null)} interface="popover">
                        <IonSelectOption value="">-- Todos --</IonSelectOption>
                        {branchesList.map((b) => (
                          <IonSelectOption key={b._id || b.id} value={b._id || b.id}>{b.name || b._id || b.id}</IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                    <IonItem>
                      <IonLabel>Activo</IonLabel>
                      <IonSelect value={assetFilter || ''} onIonChange={(e) => setAssetFilter(e.detail.value || null)} interface="popover">
                        <IonSelectOption value="">-- Todos --</IonSelectOption>
                        {assetOptions.map((a) => (<IonSelectOption key={a.id} value={a.id}>{a.name}</IonSelectOption>))}
                      </IonSelect>
                    </IonItem>
                    <IonItem style={{ display: 'flex', gap: 8 }}>
                      <IonButton onClick={() => { setAssigneeFilter(null); setStateFilter(null); setAssetFilter(null); setBranchFilter(null); setTemplateFilter(null); setTemplateQuery(''); }}>{t('workOrdersList.filters.clear') || 'Limpiar'}</IonButton>
                    </IonItem>
                  </IonList>
                </div>
            </IonCol>
          </IonRow>
        </IonGrid>
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
      <IonFooter style={{backgroundColor: '#fff'}}>
        <div style={{ flex: 1 }}>
          <div style={{ padding: 12, display: 'flex', justifyContent: 'center', gap: 8 }}>
            <IonButton disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</IonButton>
            <div style={{ alignSelf: 'center' }}>Página {page} / {pages} · Total: {total}</div>
            <IonButton disabled={page >= pages} onClick={() => setPage((p) => Math.min(p + 1, pages))}>Next</IonButton>
          </div>
        </div>
      </IonFooter>
    </IonPage>
  );
};

export default WorkOrdersList;

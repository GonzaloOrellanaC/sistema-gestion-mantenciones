import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonTextarea,
  IonSpinner,
  IonToast,
  IonInput,
  IonIcon,
  IonPopover,
  IonList,
  IonNote,
  IonGrid,
  IonRow,
  IonCol,
  IonFooter,
  IonInfiniteScroll
} from '@ionic/react';

import templatesApi from '../api/templates';
import usersApi from '../api/users';
import rolesApi from '../api/roles';
import assetsApi from '../api/assets';
import workOrdersApi from '../api/workOrders';
import partsApi from '../api/parts';
import inventoryApi from '../api/inventory';
import { useAuth } from '../context/AuthContext';
import * as branchesApi from '../api/branches';
import { useHistory } from 'react-router-dom';
import type { Template, User, Role } from '../api/types';
import sortByName from '../utils/sort';
import { chevronBackOutline, helpCircleOutline } from 'ionicons/icons';
import TemplatePartsAvailability from '../components/TemplatePartsAvailability';
import '../i18n';
import { useTranslation } from 'react-i18next';
import './calendar.css';

// Module-level caches to deduplicate work order fetches (prevents double requests in StrictMode)
const workOrderCache: Record<string, any> = {};
const workOrderPromises: Record<string, Promise<any>> = {};

const WorkOrdersCreate: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [assets, setAssets] = useState<any[]>([]);
  const [assetId, setAssetId] = useState<string | undefined>(undefined);
  const [parts, setParts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedParts, setSelectedParts] = useState<Array<{ partId: string; qty: number; warehouseId?: string }>>([]);
  const [addPartId, setAddPartId] = useState<string | undefined>(undefined);
  const [addQty, setAddQty] = useState<number>(1);
  const [addWarehouseId, setAddWarehouseId] = useState<string | undefined>(undefined);
  const { user } = useAuth();
  const [templateId, setTemplateId] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [assigneeRole, setAssigneeRole] = useState<string | undefined>(undefined);
  // Friendly fields instead of raw JSON
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low'|'normal'|'high'>('normal');
  const [urgency, setUrgency] = useState<'Baja'|'Media'|'Alta'>('Media');
  const [scheduledStart, setScheduledStart] = useState<string | undefined>(undefined);
  const [estimatedEnd, setEstimatedEnd] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [partsShortage, setPartsShortage] = useState<Array<{ name?: string; required: number; available: number }>>([]);
  const [workOrderOrgSeq, setWorkOrderOrgSeq] = useState<number | string | undefined>(undefined);
  // Calendar state for center column
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const history = useHistory();
  const { id } = useParams<{ id?: string }>();
  const { t } = useTranslation();
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<any | undefined>(undefined);

  // crea un llamado para obtener el listado de pautas
  useEffect(() => {
    const load = async () => {
      const responseTemplate = await templatesApi.listTemplates()
      setTemplates(sortByName(responseTemplate.items || []))
      const responseUsers = await usersApi.listUsers({ limit: 500 });
      setUsers(sortByName(responseUsers.items || []));
      const responseBranches = await branchesApi.listBranches({ limit: 200 });
      setBranches(sortByName(responseBranches.items || []));
      const responseAssets = await assetsApi.listAssets({ limit: 500 });
      setAssets(sortByName(responseAssets.items || []));
    }
    load();
  }, [])

  // If editing an existing work order, load its data (deduplicated)
  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const load = async () => {
      try {
        let wo: any = null;
        console.log('work order cahe', workOrderCache)
        if (workOrderCache[id]) {
          wo = workOrderCache[id];
        } else {
          workOrderPromises[id] = (async () => {
            const resp = await workOrdersApi.getWorkOrder(id);
            console.log('fetched work order for edit', resp);
            return resp;
          })();
          wo = await workOrderPromises[id];
        }
        console.log({wo});

        if (!mounted || !wo) return;

        // populate basic fields
        setTemplateId(typeof wo.templateId === 'object' ? (wo.templateId._id || wo.templateId.id) : wo.templateId || '');
        setAssetId(typeof wo.assetId === 'object' ? (wo.assetId._id || wo.assetId.id) : wo.assetId || undefined);
        try {
          const bid = wo.branchId ? (wo.branchId._id ? wo.branchId._id : wo.branchId) : null;
          if (bid) setBranchId(String(bid));
        } catch (e) { /* ignore */ }
        // friendly fields from data
        if (wo.data) {
          setTitle(wo.data.title || wo.data.name || title);
          setDescription(wo.data.description || '');
          setPriority(wo.data.priority || 'normal');
          setUrgency((wo.data && wo.data.urgency) || wo.urgency || 'Media');
        }
        // scheduled start may be date-only, ISO or stored in dates.start
        const sched = wo.scheduledStart || (wo.dates && (wo.dates.start || wo.dates.scheduledStart));
        if (sched) setScheduledStart(typeof sched === 'string' ? sched : new Date(sched).toISOString());
        // estimated end (from wo.dates.estimatedEnd)
        const est = (wo.dates && (wo.dates.estimatedEnd || wo.dates.end)) || wo.estimatedEnd;
        if (est) setEstimatedEnd(typeof est === 'string' ? est : new Date(est).toISOString());
        // if dates exist, show calendar month that contains scheduledStart or estimatedEnd
        try {
          const target = sched || est;
          if (target) {
            const dt = typeof target === 'string' ? new Date(target) : new Date(target);
            if (!Number.isNaN(dt.getTime())) setCurrentMonth(monthStart(dt));
          }
        } catch (e) {
          // ignore invalid date
        }
        if (wo.assigneeId) setAssigneeId(typeof wo.assigneeId === 'object' ? (wo.assigneeId._id || wo.assigneeId.id) : wo.assigneeId);
        if (wo.assigneeRole) setAssigneeRole(typeof wo.assigneeRole === 'object' ? (wo.assigneeRole._id || wo.assigneeRole.id) : wo.assigneeRole);
        // selected parts: try several possible locations where this info may live
        const partsFromWo = wo.selectedParts || wo.parts || (wo.data && (wo.data.selectedParts || wo.data.parts));
        if (Array.isArray(partsFromWo) && partsFromWo.length > 0) {
          const normalized = partsFromWo.map((p: any) => ({ partId: p.partId || p.part || p._id || p.id, qty: Number(p.qty || p.quantity || p.qtyRequested || 1) || 1, warehouseId: p.warehouseId || p.warehouse || undefined }));
          setSelectedParts(normalized as any);
        }
        // record orgSeq for title when editing
        if (wo.orgSeq) setWorkOrderOrgSeq(wo.orgSeq);
      } catch (e) {
        console.warn('failed loading work order for edit', e);
        setToast({ show: true, message: t('workOrdersCreate.toasts.loadError') });
      }
    };

    load();
    return () => { mounted = false; };
  }, [id]);

  function monthStart(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  function formatDateOnly(d?: string | Date | null) {
    if (!d) return '';
    if (typeof d === 'string') {
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

  const daysInMonth = useMemo(() => {
    const start = monthStart(currentMonth);
    const year = start.getFullYear();
    const month = start.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const days: Date[] = [];
    for (let d = 1; d <= lastDay; d++) days.push(new Date(year, month, d));
    return days;
  }, [currentMonth]);

  function pickDate(day: Date) {
    // prevent past dates
    const today = new Date();
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dayMid = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    if (dayMid < todayMid) {
      setToast({ show: true, message: t('workOrdersCreate.toasts.pastDate') });
      return;
    }
    // store as date-only string YYYY-MM-DD to ignore time component
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, '0');
    const d = String(day.getDate()).padStart(2, '0');
    setScheduledStart(`${y}-${m}-${d}`);
  }

  async function handleSubmit() {
    if (!templateId) {
      setToast({ show: true, message: t('workOrdersCreate.toasts.selectTemplate') });
      return;
    }

    if (!scheduledStart) {
      setToast({ show: true, message: t('workOrdersCreate.toasts.selectStart') });
      return;
    }

    // Build structured data from friendly fields
    const parsedData: any = {
      title: title || undefined,
      description: description || undefined,
      priority: priority || undefined,
      urgency: urgency || undefined,
    };

    const payload: any = { templateId, data: parsedData };
    // scheduledStart expected as ISO string
    if (scheduledStart) payload.scheduledStart = scheduledStart;
    if (assigneeId) payload.assigneeId = assigneeId;
    if (assigneeRole) payload.assigneeRole = assigneeRole;
    if (branchId) payload.branchId = branchId;
    // asset is required
    if (!assetId) {
      setToast({ show: true, message: t('workOrdersCreate.toasts.selectAsset') });
      setLoading(false);
      return;
    }
    payload.assetId = assetId;

    setLoading(true);
    try {
        let wo: any = null;
        if (id) {
          // update existing work order
          wo = await workOrdersApi.updateWorkOrder(id, payload);
        } else {
          wo = await workOrdersApi.createWorkOrder(payload);
        }
        // After successful create/update navigate back to list
        if (wo && wo._id) {
          // reserve selected parts (if any) only on create
          if (!id && selectedParts.length > 0) {
            for (const sp of selectedParts) {
              try {
                await inventoryApi.reservePart({ orgId: user?.orgId, partId: sp.partId, warehouseId: sp.warehouseId, qty: sp.qty, referenceId: wo._id });
              } catch (e) {
                console.warn('reserve failed for', sp, e);
              }
            }
          }
          history.push(`/work-orders`);
          return;
        }
    } catch (err: any) {
      console.error('create wo err', err);
      setToast({ show: true, message: err?.response?.data?.message || err?.message || t('workOrdersCreate.toasts.errorCreatingOrder') });
    } finally {
      setLoading(false);
    }
  }

  return (
    <IonPage>
      <IonHeader className='ion-no-border'>
        <IonToolbar>
          <IonButton color={'dark'} slot="start" fill="clear" onClick={() => { if (history && typeof (history as any).goBack === 'function') (history as any).goBack(); else window.history.back(); }}>
            <IonIcon icon={chevronBackOutline} slot='icon-only' />
          </IonButton>
          <IonTitle>{id ? t('workOrdersCreate.title.edit', { num: workOrderOrgSeq ?? id }) : t('workOrdersCreate.title.create')}</IonTitle>
          <IonButton color={'dark'} style={{marginRight: 10}} slot="end" fill="clear" onClick={(e) => { setPopoverEvent(e.nativeEvent); setShowPopover(true); }}>
            <IonIcon size={'large'} icon={helpCircleOutline} slot='icon-only' />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonPopover style={{'--width': 320}} isOpen={showPopover} event={popoverEvent} onDidDismiss={() => setShowPopover(false)}>
        <div style={{ padding: 12, minWidth: 320 }}>
          <div style={{ padding: 12, border: '1px dashed #e0e0e0', borderRadius: 6 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{t('workOrdersCreate.popover.heading')}</div>
            <div style={{ fontSize: 13, color: '#555' }}>
              <ul style={{ marginTop: 6 }}>
                <li><strong>{t('workOrdersCreate.popover.items.title').split(':')[0]}</strong>: {t('workOrdersCreate.popover.items.title').split(':').slice(1).join(':')}</li>
                <li><strong>{t('workOrdersCreate.popover.items.description').split(':')[0]}</strong>: {t('workOrdersCreate.popover.items.description').split(':').slice(1).join(':')}</li>
                <li><strong>{t('workOrdersCreate.popover.items.priority').split(':')[0]}</strong>: {t('workOrdersCreate.popover.items.priority').split(':').slice(1).join(':')}</li>
                <li><strong>{t('workOrdersCreate.popover.items.location').split(':')[0]}</strong>: {t('workOrdersCreate.popover.items.location').split(':').slice(1).join(':')}</li>
                <li><strong>{t('workOrdersCreate.popover.items.attachments').split(':')[0]}</strong>: {t('workOrdersCreate.popover.items.attachments').split(':').slice(1).join(':')}</li>
                <li><strong>{t('workOrdersCreate.popover.items.templateFields').split(':')[0]}</strong>: {t('workOrdersCreate.popover.items.templateFields').split(':').slice(1).join(':')}</li>
              </ul>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <IonButton size="small" onClick={() => setShowPopover(false)}>{t('workOrdersCreate.popover.close')}</IonButton>
          </div>
        </div>
      </IonPopover>
      <IonContent className='ion-padding'>
        <IonGrid>
          <IonRow>
            <IonCol>
              <div style={{ display: 'grid', gap: 12, padding: '0px 16px', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
                <IonItem>
                  <IonLabel position="stacked">{t('workOrdersCreate.labels.template')}</IonLabel>
                  <IonSelect value={templateId} placeholder={t('workOrdersCreate.labels.template')} onIonChange={e => setTemplateId(e.detail.value)}>
                    {templates.map(t => (
                      <IonSelectOption key={t._id} value={t._id}>{t.name}</IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">{t('workOrdersCreate.labels.branch')}</IonLabel>
                  <IonSelect value={branchId} placeholder={t('workOrdersCreate.labels.branch')} onIonChange={e => setBranchId(e.detail.value)}>
                    <IonSelectOption value="">{t('workOrdersCreate.labels.allBranches')}</IonSelectOption>
                    {branches.map(b => <IonSelectOption key={b._id} value={b._id}>{b.name}</IonSelectOption>)}
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">{t('workOrdersCreate.labels.asset')}</IonLabel>
                  <IonSelect value={assetId} placeholder={t('workOrdersCreate.labels.asset')} onIonChange={e => setAssetId(e.detail.value)}>
                    {assets.map(a => <IonSelectOption key={a._id} value={a._id}>{a.name}</IonSelectOption>)}
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">{t('workOrdersCreate.labels.title')}</IonLabel>
                  <IonInput value={title} placeholder={t('workOrdersCreate.labels.titlePlaceholder')} onIonChange={e => setTitle(e.detail.value || '')} />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">{t('workOrdersCreate.labels.description')}</IonLabel>
                  <IonTextarea value={description} onIonChange={e => setDescription(e.detail.value || '')} placeholder={t('workOrdersCreate.labels.descriptionPlaceholder')} rows={6} />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked">{t('workOrdersCreate.labels.urgency')}</IonLabel>
                  <IonSelect value={urgency} onIonChange={e => setUrgency(e.detail.value)}>
                    <IonSelectOption value="Baja">{t('workOrdersCreate.labels.urgencyLow')}</IonSelectOption>
                    <IonSelectOption value="Media">{t('workOrdersCreate.labels.urgencyNormal')}</IonSelectOption>
                    <IonSelectOption value="Alta">{t('workOrdersCreate.labels.urgencyHigh')}</IonSelectOption>
                  </IonSelect>
                </IonItem>

                {/* Parts reservation section */}
                <div style={{ marginTop: 8, padding: 8, border: '1px solid #eee', borderRadius: 6 }}>
                        {(() => {
                          const sel = templates.find(t => t._id === templateId);
                          const hasParts = sel && sel.structure && Array.isArray((sel.structure as any).components) && (sel.structure as any).components.some((c: any) => c && c.type === 'parts');
                          if (!hasParts) return <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('workOrdersCreate.labels.partsHeader')}</div>;
                          // when template defines parts, render availability and auto-populate selectedParts via callback
                          return (
                            <TemplatePartsAvailability
                              template={sel}
                              onResolved={(results) => {
                                // autofill selectedParts with required quantities (kept for internal use)
                                const autofill = results.map(r => ({ partId: r.part._id || r.part.id || r.part.partId, qty: r.required, warehouseId: undefined }));
                                setSelectedParts(autofill as any);
                                // compute shortages
                                const shortages = results.filter(r => r.available < r.required).map(r => ({ name: r.part.name || r.part.label || r.part._id, required: r.required, available: r.available }));
                                setPartsShortage(shortages);
                                if (shortages.length > 0) {
                                  setToast({ show: true, message: t('workOrdersCreate.toasts.partsShortageAlert') });
                                }
                              }}
                            />
                          );
                        })()}

                        {partsShortage.length > 0 && (
                          <div style={{ marginBottom: 8, color: '#b71c1c', fontWeight: 600 }}>
                            {t('workOrdersCreate.toasts.partsShortageAlert')}: {partsShortage.map(p => `${p.name} (req ${p.required}, avail ${p.available})`).join(', ')}
                          </div>
                        )}
                </div>

                {/* <div style={{ marginTop: 16 }}>
                  <IonButton expand="block" onClick={handleSubmit} disabled={loading}>
                    {loading ? <><IonSpinner name="dots" /> Creando...</> : 'Crear Orden'}
                  </IonButton>
                </div> */}
              </div>
            </IonCol>
            <IonCol>
              <div style={{padding: '0px 16px'}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong>{currentMonth.toLocaleString((t('app.locale') || undefined) as any, { month: 'long', year: 'numeric' })}</strong>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(() => {
                      const minMonth = monthStart(new Date());
                      const canPrev = monthStart(currentMonth) > minMonth;
                      return (
                        <IonButton size="small" disabled={!canPrev} onClick={() => { if (canPrev) setCurrentMonth(monthStart(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))); }}>◀</IonButton>
                      );
                    })()}
                    <IonButton size="small" onClick={() => setCurrentMonth(monthStart(new Date()))}>{t('workOrdersCreate.buttons.today') || 'Today'}</IonButton>
                    <IonButton size="small" onClick={() => setCurrentMonth(monthStart(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)))}>▶</IonButton>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 8 }}>
                  {(t('workOrdersCreate.calendar.weekdays', { returnObjects: true }) as string[]).map((d: string) => (
                    <div key={d} style={{ fontSize: 12, textAlign: 'center', color: '#607D8B' }}>{d}</div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                  {daysInMonth.map(day => {
                    const key = formatDateOnly(day);
                    const isStart = scheduledStart ? formatDateOnly(scheduledStart) === key : false;
                    const isEnd = estimatedEnd ? formatDateOnly(estimatedEnd) === key : false;
                    // determine if day is within start..end (exclusive of labels)
                    let isInRange = false;
                    try {
                      if (scheduledStart && estimatedEnd) {
                        const s = new Date(scheduledStart);
                        const e = new Date(estimatedEnd);
                        const dMid = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
                        const sMid = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
                        const eMid = new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime();
                        if (!Number.isNaN(sMid) && !Number.isNaN(eMid)) {
                          isInRange = dMid > sMid && dMid < eMid;
                        }
                      }
                    } catch (err) {
                      isInRange = false;
                    }

                    const border = isStart ? '2px solid var(--ion-color-primary)' : isEnd ? '2px dashed var(--ion-color-medium)' : '1px solid #e0e0e0';
                    const bg = isStart ? 'var(--ion-color-primary-variant)' : isEnd ? 'rgba(0,0,0,0.02)' : isInRange ? 'rgba(63,81,181,0.06)' : undefined;
                    const today = new Date();
                    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                    const dayMid = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
                    const isPast = dayMid < todayMid;
                    const isToday = formatDateOnly(today) === key;
                    const cls = `calendar-day ${isPast ? 'calendar-day-disabled' : ''} ${isToday ? 'calendar-day-today' : ''}`;
                    return (
                      <div key={key} onClick={() => { if (!isPast) pickDate(day); }} className={cls} style={{ minHeight: 72, padding: 8, border, borderRadius: 6, cursor: isPast ? 'not-allowed' : 'pointer', background: bg }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                          <div style={{ fontSize: 13 }}>{day.getDate()}</div>
                          {isStart && <div style={{ fontSize: 11, color: 'var(--ion-color-primary)', marginTop: 6 }}>{t('workOrdersCreate.calendar.startLabel')}</div>}
                          {isEnd && <div style={{ fontSize: 11, color: '#666', marginTop: 6 }}>{t('workOrdersCreate.calendar.endLabel')}</div>}
                          {isInRange && !isStart && !isEnd && <div style={{ fontSize: 11, color: '#455a64', marginTop: 6 }}>{t('workOrdersCreate.calendar.periodLabel')}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
        <IonToast isOpen={toast.show} message={toast.message} duration={3000} onDidDismiss={() => setToast({ show: false, message: '' })} />
      </IonContent>
      <IonFooter>
        <IonToolbar>
          <IonButton slot={'end'} onClick={handleSubmit} disabled={loading}>
            {loading ? <><IonSpinner name="dots" /> {id ? t('workOrdersCreate.buttons.editing') : t('workOrdersCreate.buttons.creating')}</> : (id ? t('workOrdersCreate.buttons.editOrder') : t('workOrdersCreate.buttons.createOrder'))}
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
};

export default WorkOrdersCreate;
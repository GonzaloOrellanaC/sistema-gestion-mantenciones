import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonSpinner, IonGrid, IonRow, IonCol, IonItem, IonLabel, IonSelect, IonSelectOption, IonIcon, IonPopover, IonList, IonRadioGroup, IonRadio, IonItemDivider, IonItemGroup, IonButtons, IonSegment, IonSegmentButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { listWorkOrders, getWorkOrder } from '../api/workOrders';
import api from '../api/axios';
import WorkOrderDetailModal from '../components/Modals/WorkOrderDetailModal';
import { ellipsisVerticalOutline } from 'ionicons/icons';
import { useAuth } from '../context/AuthContext';

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

const WorkOrdersCalendar: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [current, setCurrent] = useState<Date>(startOfMonth(new Date()));
    const [loading, setLoading] = useState(false);
    const [eventsMap, setEventsMap] = useState<Record<string, Array<{ id: string; orgSeq?: number; code?: string; dates?: any }>>>({});
    const [hoveredWO, setHoveredWO] = useState<string | null>(null);
    const [hoveredDates, setHoveredDates] = useState<any>(null);
    const [displayMode, setDisplayMode] = useState<string>('created'); // 'created' | 'assigned' | 'scheduled' | 'assignee:<id>'
    const [assigneeOptions, setAssigneeOptions] = useState<Array<{ id: string; label: string }>>([]);
    const [firstDayOfWeek, setFirstDayOfWeek] = useState<number>(1); // 1 = Monday (default), 0 = Sunday
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [popoverEvent, setPopoverEvent] = useState<any>(undefined);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalWO, setModalWO] = useState<any | null>(null);
    const history = useHistory();
    const { user } = useAuth();

    const perms = (user as any)?.role?.permissions || (user as any)?.roleId?.permissions || {};
    const hasPermission = (key?: string) => {
        if (!key) return true;
        if ((user as any)?.isSuperAdmin) return true;
        if (Object.prototype.hasOwnProperty.call(perms, key)) return !!perms[key];
        return false;
    };

    const canViewWO = hasPermission('verOT');
    const canViewLots = hasPermission('verLotes');
    const [contentType, setContentType] = useState<string>('none');

    useEffect(() => {
        // Set default content type after user is available to avoid using stale/initial permission state
        if (!user) return;
        if (hasPermission('verOT')) setContentType('workOrders');
        else if (hasPermission('verLotes')) setContentType('lots');
        else setContentType('none');
    }, [user]);

    function renderEntityLabel(entity: any) {
        if (!entity) return '-';
        if (typeof entity === 'string') return entity;
        if (typeof entity === 'object') {
            // user-like
            if (entity.firstName || entity.lastName) return `${entity.firstName || ''} ${entity.lastName || ''}`.trim() || (entity.email || entity._id || '-');
            if (entity.email) return entity.email;
            // asset-like: prefer readable fields
            if (entity.name) return entity.name;
            if (entity.serial) return entity.serial;
            if (entity.patente) return entity.patente;
            if (entity.identifier) return entity.identifier;
            if (entity.code) return entity.code;
            // fallback to id
            if (entity._id) return entity._id.toString();
            try {
                return JSON.stringify(entity);
            } catch (e) {
                return '-';
            }
        }
        return String(entity);
    }

    function extractAssigneeId(w: any) {
        const a = w.assigneeId || w.assignee;
        if (!a) return null;
        if (typeof a === 'string') return a;
        if (typeof a === 'object') return (a._id || a.id || a.toString()).toString();
        return null;
    }

    const API_BASE = ((import.meta as any).env.VITE_API_URL || '').replace(/\/$/, '');

    function getAssetAvatarUrl(asset: any) {
        if (!asset) return null;
        const docs = asset.docs || [];
        if (!docs.length) return null;
        const doc = docs[0];
        // prefer meta.thumbnailPath if exists
        const thumb = doc.meta && (doc.meta.thumbnailPath || doc.meta.thumbnail);
        const pathVal = thumb || doc.path || null;
        if (pathVal) {
            // normalize backslashes to slashes
            const p = pathVal.replace(/\\/g, '/');
            const idx = p.indexOf('/files/images/');
            if (idx !== -1) {
                const rel = p.substring(idx + '/files/images/'.length);
                return `${API_BASE}/images/${rel}`;
            }
            // if path already under images
            const idx2 = p.indexOf('/images/');
            if (idx2 !== -1) {
                const rel = p.substring(idx2 + '/images/'.length);
                return `${API_BASE}/images/${rel}`;
            }
        }
        // fallback: try filename under org and misc folder
        if (doc.filename && asset.orgId) {
            return `${API_BASE}/images/${asset.orgId}/misc/${doc.filename}`;
        }
        return null;
    }


    useEffect(() => {
        let mounted = true;
        const from = startOfMonth(current);
        const to = endOfMonth(current);

        const loadWorkOrders = async () => {
            setLoading(true);
            try {
                const res = await listWorkOrders({ page: 1, limit: 2000 });
                if (!mounted) return;
                const items: any[] = Array.isArray(res.items) ? res.items : [];
                // collect assignees for selector (handle populated objects or raw ids)
                const assigneesMap = new Map<string, string>();
                for (const w of items) {
                    const aid = extractAssigneeId(w);
                    if (aid) {
                        const aObj = (w as any).assigneeId || (w as any).assignee;
                        let label = aObj && typeof aObj === 'object'
                            ? (aObj.firstName && aObj.lastName ? `${aObj.firstName} ${aObj.lastName}` : aObj.email || aObj.name || `Usuario ${aid}`)
                            : `Usuario ${aid}`;
                        if (label === `Usuario ${aid}`) label = t('calendar.user', { id: aid });
                        assigneesMap.set(aid.toString(), label);
                    }
                }
                setAssigneeOptions(Array.from(assigneesMap.entries()).map(([id, label]) => ({ id, label })));
                const map: Record<string, Array<{ id: string; orgSeq?: number; dates?: any }>> = {};
                for (const w of items) {
                    let dateValue: string | Date | undefined;
                    if (displayMode.startsWith('assignee:')) {
                        const selId = displayMode.split(':')[1];
                        const aid = extractAssigneeId(w);
                        if (!aid || aid.toString() !== selId) continue;
                        dateValue = (w.dates && w.dates.scheduledStart) || (w.dates && w.dates.assignedAt) || w.createdAt;
                    } else if (displayMode === 'scheduled') {
                        dateValue = (w.dates && w.dates.scheduledStart) || (w.dates && w.dates.assignedAt) || (w.dates && w.dates.created) || w.createdAt;
                    } else if (displayMode === 'assigned') {
                        dateValue = (w.dates && w.dates.assignedAt) || (w.dates && w.dates.created) || w.createdAt;
                    } else {
                        dateValue = (w.dates && w.dates.created) || w.createdAt;
                    }
                    if (!dateValue) continue;
                    const dt = new Date(dateValue as string);
                    if (dt >= from && dt <= to) {
                        const key = dt.toISOString().slice(0, 10);
                        map[key] = map[key] || [];
                        map[key].push({ id: w._id!, orgSeq: w.orgSeq, dates: (w as any).dates || {} });
                    }
                }
                setEventsMap(map);
            } catch (e) {
                console.error('load calendar err', e);
            } finally {
                setLoading(false);
            }
        };

        const loadLots = async () => {
            setLoading(true);
            try {
                const res = await api.get('/api/lots', { params: { page: 1, limit: 2000 } });
                const data = res.data;
                const items: any[] = Array.isArray(data) ? data : (data.items || []);
                const map: Record<string, Array<{ id: string; code?: string; dates?: any }>> = {};
                for (const l of items) {
                    // choose which date to show for lots depending on displayMode
                    const usePurchase = displayMode === 'purchase';
                    const rawDate = usePurchase ? (l.purchaseDate || l.createdAt) : (l.createdAt || l.purchaseDate);
                    if (!rawDate) continue;
                    const dt = new Date(rawDate);
                    if (isNaN(dt.getTime())) continue;
                    if (dt >= from && dt <= to) {
                        const key = dt.toISOString().slice(0, 10);
                        map[key] = map[key] || [];
                        map[key].push({ id: l._id, code: l.code, dates: { purchaseDate: l.purchaseDate, createdAt: l.createdAt } });
                    }
                }
                setEventsMap(map);
            } catch (e) {
                console.error('load lots err', e);
            } finally {
                setLoading(false);
            }
        };

        if (contentType === 'workOrders') loadWorkOrders();
        else if (contentType === 'lots') loadLots();

        return () => { mounted = false; };
    }, [current, displayMode, contentType]);

    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
    const startWeekDay = (firstDay.getDay() - firstDayOfWeek + 7) % 7; // offset relative to selected first day
    const daysInMonth = endOfMonth(current).getDate();

    const cells: Array<{ date: Date | null }> = [];
    for (let i = 0; i < startWeekDay; i++) cells.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(current.getFullYear(), current.getMonth(), d) });
    const todayKey = new Date().toISOString().slice(0, 10);

    return (
        <IonPage>
            <IonContent className="ion-padding">
                <IonGrid>
                    <IonRow>
                        <IonCol sizeXs='9'>
                            <IonToolbar style={{ padding: '0 12px' }}>
                                <IonButton slot='start' onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))}>{t('calendar.prev')}</IonButton>
                                <IonTitle style={{textAlign: 'center'}}>{new Intl.DateTimeFormat(i18n?.language || undefined, { month: 'long', year: 'numeric' }).format(current)} {contentType === 'lots' ? ` - ${t('calendar.lots') || 'Lotes'}` : ''}</IonTitle>
                                <IonButton style={{marginRight: 10}} slot='end' onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))}>{t('calendar.next')}</IonButton>
                                <IonButton slot='end' onClick={(e) => { setPopoverEvent(e.nativeEvent); setPopoverOpen(true); }}>
                                    <IonIcon icon={ellipsisVerticalOutline} />
                                </IonButton>
                                <IonPopover isOpen={popoverOpen} event={popoverEvent} onDidDismiss={() => setPopoverOpen(false)}>
                                <IonList>
                                    <IonRadioGroup value={firstDayOfWeek} onIonChange={ev => { setFirstDayOfWeek(Number(ev.detail.value)); setPopoverOpen(false); }}>
                                    <IonItem>
                                        <IonLabel>{t('calendar.firstDay.monday')}</IonLabel>
                                        <IonRadio slot="start" value={1} />
                                    </IonItem>
                                    <IonItem>
                                        <IonLabel>{t('calendar.firstDay.sunday')}</IonLabel>
                                        <IonRadio slot="start" value={0} />
                                    </IonItem>
                                    </IonRadioGroup>
                                </IonList>
                                </IonPopover>
                            </IonToolbar>
                            {loading ? <div style={{ textAlign: 'center' }}><IonSpinner name="crescent" /></div> : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                                    {(() => {
                                    const names = (t('calendar.weekdaysShort', { returnObjects: true }) as string[]) || ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                                    const out: string[] = [];
                                    for (let i = 0; i < 7; i++) out.push(names[(firstDayOfWeek + i) % 7]);
                                    return out.map(h => (<div key={h} style={{ fontWeight: 700, textAlign: 'center' }}>{h}</div>));
                                    })()}
                                    {cells.map((c, idx) => {
                                    if (!c.date) return <div key={idx} style={{ minHeight: 80, background: '#fafafa' }} />;
                                    const key = c.date.toISOString().slice(0, 10);
                                    const events = eventsMap[key] || [];
                                    const isToday = key === todayKey;
                                    return (
                                        <div key={key} style={{ minHeight: 80, border: '1px solid #eee', padding: 6, borderRadius: 6, background: isToday ? '#fff8e1' : undefined, boxShadow: isToday ? 'inset 0 0 0 2px rgba(255,193,7,0.15)' : undefined }}>
                                        <div style={{ fontWeight: 700, color: isToday ? '#b35f00' : undefined }}>{c.date.getDate()}</div>
                                        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {(() => {
                                                const bg = displayMode === 'created' ? '#ffe6e6' : displayMode === 'assigned' ? '#e8f0ff' : displayMode === 'scheduled' ? '#e6ffea' : '#e8f0ff';
                                                const textColor = displayMode === 'created' ? '#8b1c1c' : displayMode === 'assigned' ? '#1f4fa3' : displayMode === 'scheduled' ? '#1b7a3a' : '#1f4fa3';
                                                return events.slice(0,5).map(ev => (
                                                    <div key={ev.id} style={{ position: 'relative' }}>
                                                            <div
                                                                onMouseEnter={() => { setHoveredWO(ev.id); setHoveredDates(ev.dates || {}); }}
                                                                onMouseLeave={() => { setHoveredWO(prev => (prev === ev.id ? null : prev)); setHoveredDates(null); }}
                                                                onClick={async () => {
                                                                    if (contentType === 'workOrders') {
                                                                        setModalOpen(true);
                                                                        setModalLoading(true);
                                                                        try {
                                                                            const data = await getWorkOrder(ev.id);
                                                                            setModalWO(data);
                                                                        } catch (err) {
                                                                            console.error('failed load wo', err);
                                                                            setModalWO(null);
                                                                        } finally {
                                                                            setModalLoading(false);
                                                                        }
                                                                    } else {
                                                                        // navigate to lot detail/edit
                                                                        history.push(`/logistics/lots/edit/${ev.id}`);
                                                                    }
                                                                }}
                                                                style={{ background: bg, color: textColor, padding: '2px 6px', borderRadius: 4, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                                                            >
                                                                {contentType === 'workOrders' ? (
                                                                    <>{t('workOrderDetail.labels.number')} {ev.orgSeq}</>
                                                                ) : (
                                                                    <>{t('lots.headers.code') || 'Lote'} {ev.code || ev.id}</>
                                                                )}
                                                            </div>
                                                        {hoveredWO === ev.id && hoveredDates && (
                                                            <div style={{ position: 'absolute', top: '28px', right: 0, background: '#fff', border: '1px solid #eee', padding: 8, borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 40, minWidth: 160 }}>
                                                                {contentType === 'workOrders' ? (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <div style={{ width: 10, height: 10, background: '#ffe6e6', borderRadius: 2 }} />
                                                                            <div style={{ marginLeft: 8, flex: 1, fontSize: 12, color: '#333' }}>{t('calendar.hover.created')}</div>
                                                                            <div style={{ marginLeft: 8, fontSize: 12, color: '#8b1c1c' }}>{hoveredDates.created ? new Date(hoveredDates.created).toLocaleString() : '-'}</div>
                                                                        </div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <div style={{ width: 10, height: 10, background: '#e8f0ff', borderRadius: 2 }} />
                                                                            <div style={{ marginLeft: 8, flex: 1, fontSize: 12, color: '#333' }}>{t('calendar.hover.assigned')}</div>
                                                                            <div style={{ marginLeft: 8, fontSize: 12, color: '#1f4fa3' }}>{hoveredDates.assignedAt ? new Date(hoveredDates.assignedAt).toLocaleString() : '-'}</div>
                                                                        </div>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <div style={{ width: 10, height: 10, background: '#e6ffea', borderRadius: 2 }} />
                                                                            <div style={{ marginLeft: 8, flex: 1, fontSize: 12, color: '#333' }}>{t('calendar.hover.scheduledStart')}</div>
                                                                            <div style={{ marginLeft: 8, fontSize: 12, color: '#1b7a3a' }}>{hoveredDates.scheduledStart ? new Date(hoveredDates.scheduledStart).toLocaleDateString() : '-'}</div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <div style={{ width: 10, height: 10, background: '#e8f0ff', borderRadius: 2 }} />
                                                                            <div style={{ marginLeft: 8, flex: 1, fontSize: 12, color: '#333' }}>{t('lots.headers.purchaseDate') || 'Fecha compra'}</div>
                                                                            <div style={{ marginLeft: 8, fontSize: 12, color: '#1f4fa3' }}>{hoveredDates.purchaseDate ? new Date(hoveredDates.purchaseDate).toLocaleDateString() : '-'}</div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ));
                                            })()}
                                            {events.length > 5 && <div style={{ fontSize: 12, color: '#666' }}>{t('calendar.moreCount', { count: events.length - 5 })}</div>}
                                        </div>
                                        </div>
                                    );
                                    })}
                                </div>
                                )}
                            </IonCol>
                        <IonCol sizeXs='3'>
                            <IonTitle>{t('calendar.filters')}</IonTitle>
                            {/* Content selector: show segment only if user can view both Work Orders and Lots */}
                            {canViewWO && canViewLots && (
                                <div style={{ marginBottom: 8 }}>
                                    <IonSegment value={contentType} onIonChange={(e) => {
                                        const v = e.detail.value;
                                        if (v === 'lots') {
                                            setContentType('lots');
                                        } else {
                                            setContentType('workOrders');
                                        }
                                    }}>
                                        <IonSegmentButton value="workOrders">{t('calendar.segment.workOrders') || 'Ordenes'}</IonSegmentButton>
                                        <IonSegmentButton value="lots">{t('calendar.segment.lots') || 'Lotes'}</IonSegmentButton>
                                    </IonSegment>
                                </div>
                            )}
                            <IonLabel>{t('calendar.showBy')}</IonLabel>
                            <IonRadioGroup value={displayMode} onIonChange={e => setDisplayMode(e.detail.value)}>
                                <IonList>
                                    <IonItemGroup>
                                        <IonItemDivider>
                                            {t('calendar.section.dates')}
                                        </IonItemDivider>
                                        <IonItem>
                                            <IonRadio slot="start" value="created" />
                                            <IonLabel>{t('calendar.created')}</IonLabel>
                                        </IonItem>
                                        {contentType !== 'lots' && (
                                            <>
                                                <IonItem>
                                                    <IonRadio slot="start" value="assigned" />
                                                    <IonLabel>{t('calendar.assigned')}</IonLabel>
                                                </IonItem>
                                                <IonItem>
                                                    <IonRadio slot="start" value="scheduled" />
                                                    <IonLabel>{t('calendar.scheduledStart')}</IonLabel>
                                                </IonItem>
                                            </>
                                        )}
                                        {contentType === 'lots' && (
                                            <IonItem>
                                                <IonRadio slot="start" value="purchase" />
                                                <IonLabel>{t('calendar.purchaseDate') || 'Purchase Date'}</IonLabel>
                                            </IonItem>
                                        )}
                                    </IonItemGroup>
                                    
                                    {contentType !== 'lots' && (
                                        <IonItemGroup>
                                            <IonItemDivider>
                                                {t('calendar.section.users')}
                                            </IonItemDivider>
                                            {assigneeOptions.map(a => (
                                                <IonItem key={a.id}>
                                                    <IonRadio slot="start" value={`assignee:${a.id}`} />
                                                    <IonLabel>{a.label}</IonLabel>
                                                </IonItem>
                                            ))}
                                        </IonItemGroup>
                                    )}
                                </IonList>
                            </IonRadioGroup>
                        </IonCol>
                    </IonRow>
                </IonGrid>
                <WorkOrderDetailModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    loading={modalLoading}
                    workOrder={modalWO}
                    renderEntityLabel={renderEntityLabel}
                    getAssetAvatarUrl={getAssetAvatarUrl}
                />
            </IonContent>
        </IonPage>
    );
}

export default WorkOrdersCalendar;

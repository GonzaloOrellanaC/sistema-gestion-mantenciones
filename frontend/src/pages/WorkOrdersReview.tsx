import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonBadge,
  IonToast,
  IonRadioGroup,
  IonRadio,
  IonAlert,
  IonIcon
} from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { saveReviewState, loadReviewState, clearReviewState } from '../utils/reviewLocalStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import workOrdersApi from '../api/workOrders';
import templatesApi from '../api/templates';
import assetsApi from '../api/assets';
import usersApi from '../api/users';
import TemplateReviewRenderer from '../components/TemplateReviewRenderer';
import { chevronBackOutline } from 'ionicons/icons';
import { WORK_ORDER_STATES } from '../constants/workOrderStates';

const WorkOrdersReview: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [wo, setWo] = useState<any | null>(null);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [templateStructure, setTemplateStructure] = useState<any | null>(null);
  const [assetName, setAssetName] = useState<string | null>(null);
  const [assigneeName, setAssigneeName] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const swiperRef = useRef<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fieldStatuses, setFieldStatuses] = useState<Record<string, string>>({});
  const [fieldComments, setFieldComments] = useState<Record<string, string>>({});
  const [fieldHistory, setFieldHistory] = useState<Record<string, Array<any>>>({});
  const { user } = useAuth();
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [showConfirmApproveAlert, setShowConfirmApproveAlert] = useState(false);
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [pageStatuses, setPageStatuses] = useState<Record<number, string>>({});
  const saveTimerRef = useRef<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  // Robust DEV detection: prefer Vite's import.meta.env, fallback to NODE_ENV or localhost
  const isDev = (() => {
    try {
      const metaDev = (import.meta as any) && (import.meta as any).env && (import.meta as any).env.DEV;
      if (metaDev === true || metaDev === 'true') return true;
    } catch (e) { /* ignore */ }
    try {
      if (typeof process !== 'undefined' && (process.env as any) && (process.env.NODE_ENV === 'development' || (process.env as any).VITE_DEV === 'true')) return true;
    } catch (e) { /* ignore */ }
    try {
      if (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) return true;
    } catch (e) { /* ignore */ }
    return false;
  })();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const load = async () => {
      try {
        const resp: any = await workOrdersApi.getWorkOrder(id);
        if (!mounted) return;
        setWo(resp);
        // template
        try {
          const tid = resp && resp.templateId ? (typeof resp.templateId === 'object' ? (resp.templateId._id || resp.templateId.id) : resp.templateId) : null;
          if (tid) {
            const tpl = await templatesApi.getTemplate(tid);
            if (mounted) setTemplateName(tpl?.name || null);
            if (mounted) setTemplateStructure(tpl?.structure || null);
          } else if (resp && typeof resp.templateId === 'object' && resp.templateId.name) {
            if (mounted) setTemplateName(resp.templateId.name);
            if (mounted) setTemplateStructure(resp.templateId.structure || null);
          }
        } catch (e) {
          // ignore
        }
        // asset
        try {
          if (resp && resp.assetId) {
            const aid = typeof resp.assetId === 'object' ? (resp.assetId._id || resp.assetId.id) : resp.assetId;
            if (aid) {
              const a = await assetsApi.getAsset(aid);
              if (mounted) setAssetName(a?.name || aid);
            }
          }
        } catch (e) {
          // ignore
        }
        // assignee
        try {
          if (resp && resp.assigneeId) {
            const aid = typeof resp.assigneeId === 'object' ? (resp.assigneeId._id || resp.assigneeId.id) : resp.assigneeId;
            if (aid) {
              const u = await usersApi.getUser(aid);
              if (mounted) setAssigneeName(u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : aid);
            } else if (typeof resp.assigneeId === 'object') {
              if (mounted) setAssigneeName(`${(resp.assigneeId.firstName || '')} ${(resp.assigneeId.lastName || '')}`.trim() || null);
            }
          }
        } catch (e) {
          // ignore
        }

        setLoading(false);
        // try to load any saved review state from IndexedDB
        try {
          const saved = await loadReviewState(id);
          if (mounted && saved) {
            if (saved.fieldStatuses) setFieldStatuses(saved.fieldStatuses);
            if (saved.fieldComments) setFieldComments(saved.fieldComments);
            if (saved.fieldHistory) setFieldHistory(saved.fieldHistory);
            if (typeof saved.decision !== 'undefined') setDecision(saved.decision || null);
          }
        } catch (e) {
          // ignore load errors
        }
      } catch (e) {
        console.warn('failed loading work order for review', e);
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id]);

  // Reproduce FormRenderer pagination split so we compute identical uids
  const splitIntoPages = (components: any[] = []) => {
    const safeSchema = Array.isArray(components) ? components : [];
    const result: any[] = [];
    let current: any[] = [];
    for (const f of safeSchema) {
      if (f && (f.type === 'division' || f.component === 'division')) {
        result.push(current);
        current = [];
      } else {
        current.push(f);
      }
    }
    result.push(current);
    if (!result.length) result.push([]);
    return result;
  };

  // compute pages for Swiper slides (memoized so reference is stable)
  const pages = useMemo(() => {
    return templateStructure
      ? splitIntoPages(Array.isArray(templateStructure) ? templateStructure : (templateStructure.components || []))
      : [];
  }, [templateStructure]);

  const recomputePageStatus = (pidx: number, statuses?: Record<string,string>) => {
    const s = statuses || fieldStatuses;
    const page = pages[pidx] || [];
    const uids = page.map((f: any, fidx: number) => `${(f.id || 'field')}-${pidx}-${fidx}`);
    if (!uids.length) {
      setPageStatuses(prev => ({ ...prev, [pidx]: 'none' }));
      return;
    }
    // rejected > approved_observations > approved > none
    let foundRejected = false;
    let foundObservations = false;
    let allApproved = true;
    for (const uid of uids) {
      const st = s[uid];
      if (st === 'rejected') { foundRejected = true; allApproved = false; break; }
      if (st === 'approved_observations') { foundObservations = true; allApproved = false; }
      if (st !== 'approved') { allApproved = false; }
    }
    const newStatus = foundRejected ? 'rejected' : (foundObservations ? 'approved_observations' : (allApproved ? 'approved' : 'none'));
    setPageStatuses(prev => ({ ...prev, [pidx]: newStatus }));
  };

  const handleFieldStatusChange = (uid: string, status: string, pageIndex: number, comment?: string) => {
    setFieldStatuses(prev => {
      const next = { ...prev, [uid]: status };
      recomputePageStatus(pageIndex, next);
      return next;
    });
    if (typeof comment !== 'undefined') {
      setFieldComments(prev => ({ ...prev, [uid]: comment }));
    }
    // add history entry with timestamp and user id
    try {
      const entry = { status, comment: comment || null, userId: user ? user._id : null, timestamp: new Date().toISOString() };
      setFieldHistory(prev => ({ ...(prev || {}), [uid]: [...(prev[uid] || []), entry] }));
    } catch (e) {
      // ignore
    }
  };

  const submitDecision = async (finalState: string) => {
    if (!id) return;
    setSubmittingDecision(true);
    try {
      if (finalState === WORK_ORDER_STATES.REJECTED) {
        // On reject: only update state to avoid touching data payload
        const updated = await workOrdersApi.updateWorkOrder(id, { state: finalState });
        console.log('Work order rejected, updated:', updated);
        if (updated) setWo(updated);
        // keep local draft so reviewer comments/reviews are not lost
        setToastMsg('Orden marcada como rechazada');
        setShowToast(true);
      } else {
        // approve: send reviews and merge safely
        const currentWo = wo;
        const existingData = (currentWo && currentWo.data) ? { ...currentWo.data } : {};
        const reviews = Object.keys(fieldStatuses || {}).map(uid => {
          const status = fieldStatuses[uid];
          const comment = fieldComments[uid] || null;
          const history = fieldHistory[uid] || [];
          const parts = uid.split('-');
          const fieldId = parts.length ? parts[0] : uid;
          return { uid, fieldId, status, comment, history };
        });
        const mergedData = { ...existingData, reviews };
        const payload: any = { state: finalState, data: mergedData };
        const updated = await workOrdersApi.updateWorkOrder(id, payload);
        if (updated) setWo(updated);
        try { await clearReviewState(id); } catch (e) { /* ignore */ }
        setToastMsg('Decisión guardada y reviews sincronizados');
        setShowToast(true);
      }
    } catch (e) {
      console.error('Failed to update work order state', e);
      setToastMsg('Error al guardar decisión');
      setShowToast(true);
    } finally {
      setSubmittingDecision(false);
    }
  };

  // persist review state to IndexedDB (debounced)
  useEffect(() => {
    if (!id) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        saveReviewState(id, { fieldStatuses, fieldComments, fieldHistory, decision });
      } catch (e) { /* ignore */ }
    }, 400);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldStatuses, fieldComments, fieldHistory, decision, id]);

  // also save on page unload
  useEffect(() => {
    const onBeforeUnload = () => {
      if (!id) return;
      try {
        // synchronous-ish best-effort save
        // IndexedDB is async; call without awaiting
        saveReviewState(id, { fieldStatuses, fieldComments, fieldHistory, decision });
      } catch (e) { /* ignore */ }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fieldStatuses, fieldComments, fieldHistory, decision]);

  useEffect(() => {
    // recompute all page statuses when pages list changes
    pages.forEach((_, idx) => recomputePageStatus(idx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages]);

  // Ensure pageStatuses reflect current fieldStatuses (including loaded drafts)
  useEffect(() => {
    if (!pages || !pages.length) return;
    pages.forEach((_, idx) => recomputePageStatus(idx));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldStatuses, pages]);

  if (loading) return <IonPage><IonContent className="ion-padding"><IonSpinner /></IonContent></IonPage>;

  if (!wo) return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('workOrdersReview.notFoundTitle') || 'Orden no encontrada'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div>{t('workOrdersReview.notFoundBody') || 'No se encontró la orden solicitada.'}</div>
      </IonContent>
      <IonAlert
        isOpen={showConfirmApproveAlert}
        header={'Confirmar aprobación'}
        message={'Se aprobará una orden de trabajo con observaciones o rechazos. ¿Continuar?'}
        buttons={[
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => setShowConfirmApproveAlert(false)
          },
          {
            text: 'Confirmar',
            handler: () => { setShowConfirmApproveAlert(false); submitDecision(WORK_ORDER_STATES.APPROVED); }
          }
        ]}
      />
    </IonPage>
  );

  const values = (wo.data && wo.data.values) ? wo.data.values : {};
  const photos = (wo.data && wo.data.photos) ? wo.data.photos : {};
  const filesMap = (wo.data && wo.data.filesMap) ? wo.data.filesMap : {};
  const dynamicLists = (wo.data && wo.data.dynamicLists) ? wo.data.dynamicLists : {};
  const locations = (wo.data && wo.data.locations) ? wo.data.locations : {};

  // Helper: robust lookup for values/photos/files considering several storage patterns
  const findByUidIn = (obj: any, uid: string) => {
    if (!obj) return undefined;
    if (Object.prototype.hasOwnProperty.call(obj, uid)) return obj[uid];
    const keys = Object.keys(obj || {});
    // exact match
    let k = keys.find(k => k === uid);
    if (k) return obj[k];
    // common nested/prefixed patterns
    k = keys.find(k => k.startsWith(uid + '-') || k.includes(`${uid}-`) || k.endsWith(`-${uid}`));
    if (k) return obj[k];
    // fallback: any key that contains uid
    k = keys.find(k => k.indexOf(uid) >= 0);
    if (k) return obj[k];
    return undefined;
  };

  const unwrapValue: any = (v: any) => {
    if (v === undefined || v === null) return v;
    if (typeof v === 'object') {
      if (Array.isArray(v)) return v.map(unwrapValue).join(', ');
      if ('value' in v) return unwrapValue(v.value);
      if ('text' in v) return unwrapValue(v.text);
      if ('label' in v) return unwrapValue(v.label);
      return JSON.stringify(v);
    }
    return v;
  };

  const getValueForUid = (uid: string) => {
    // 1) direct values map
    let v = findByUidIn(values, uid);
    if (v !== undefined) return unwrapValue(v);
    // 2) direct data map (some payloads store values at top level)
    v = findByUidIn(wo.data || {}, uid);
    if (v !== undefined) return unwrapValue(v);
    // 3) check for grouped subkeys in values (columns / inner uids)
    const subkeys = Object.keys(values || {}).filter(k => k === uid || k.startsWith(uid + '-') || k.includes(`${uid}-`) || k.endsWith(`-${uid}`));
    if (subkeys.length) return subkeys.map(sk => ({ key: sk, val: unwrapValue(values[sk]) }));
    // 4) dynamicLists may contain the data inside items
    for (const dlk of Object.keys(dynamicLists || {})) {
      const items = dynamicLists[dlk];
      if (Array.isArray(items)) {
        for (const item of items) {
          if (item && typeof item === 'object') {
            if (Object.prototype.hasOwnProperty.call(item, uid)) return unwrapValue(item[uid]);
            // also try nested
            const nested = findByUidIn(item, uid);
            if (nested !== undefined) return unwrapValue(nested);
          }
        }
      }
    }
    return undefined;
  };

  const getPhotosForUid = (uid: string) => {
    let p = findByUidIn(photos, uid);
    if (p) return p;
    // try filesMap where images could be saved
    let f = findByUidIn(filesMap, uid);
    if (f) return f;
    // prefixed keys
    const pkeys = Object.keys(photos || {}).filter(k => k === uid || k.startsWith(uid + '-') || k.includes(`${uid}-`) || k.endsWith(`-${uid}`));
    if (pkeys.length) return pkeys.map(k => photos[k]);
    const fkeys = Object.keys(filesMap || {}).filter(k => k === uid || k.startsWith(uid + '-') || k.includes(`${uid}-`) || k.endsWith(`-${uid}`));
    if (fkeys.length) return fkeys.map(k => filesMap[k]);
    return undefined;
  };

  const getFileForUid = (uid: string) => {
    let f = findByUidIn(filesMap, uid);
    if (f) return f;
    // try photos as well
    let p = findByUidIn(photos, uid);
    if (p) return p;
    // prefixed
    const fkeys = Object.keys(filesMap || {}).filter(k => k === uid || k.startsWith(uid + '-') || k.includes(`${uid}-`) || k.endsWith(`-${uid}`));
    if (fkeys.length) return fkeys.map(k => filesMap[k]);
    return undefined;
  };

 

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ padding: '0 12px' }}>
          <IonButton color={'dark'} fill={'clear'} slot={'start'} onClick={() => { history.goBack(); }}>
            <IonIcon icon={chevronBackOutline} slot='icon-only' />
          </IonButton>
          <IonTitle style={{ marginLeft: 8 }}>Revisión · {wo.orgSeq || ''}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid>
          <IonRow>
            <IonCol size="6">
              <div style={{ padding: 12, height: 'calc(100vh - 56px - 44px)' }}>
                {templateStructure && pages && pages.length > 0 ? (
                  <Swiper
                    modules={[Pagination]}
                    pagination={{ clickable: true }}
                    slidesPerView={1}
                    spaceBetween={10}
                    style={{height: '100%'}}
                    onSwiper={(s) => { swiperRef.current = s; setCurrentSlide(s?.activeIndex || 0); }}
                    onSlideChange={(s) => setCurrentSlide(s?.activeIndex || 0)}
                  >
                    {
                      pages.map((pageComponents, idx) => {
                        return (
                          <SwiperSlide key={idx} style={{height: '100%'}}>
                            <div style={{ padding: 8, paddingBottom: 24, height: '100%', border: '1px solid #eee', borderRadius: 6, boxSizing: 'border-box', background: '#fff', overflowY: 'auto' }}>
                              <TemplateReviewRenderer
                                templateStructure={templateStructure}
                                wo={wo}
                                pageIndex={idx}
                                style={{height: '100%'}}
                                fieldStatuses={fieldStatuses}
                                fieldComments={fieldComments}
                                onStatusChange={handleFieldStatusChange}
                              />
                            </div>
                          </SwiperSlide>
                        )
                      })
                    }
                  </Swiper>
                ) : (
                  <TemplateReviewRenderer templateStructure={templateStructure} wo={wo} fieldStatuses={fieldStatuses} fieldComments={fieldComments} onStatusChange={handleFieldStatusChange} />
                )}
                {
                  pages.length > 1 && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                      <IonButton
                        size="small"
                        onClick={() => swiperRef.current && swiperRef.current.slidePrev()}
                        disabled={!swiperRef.current || !!swiperRef.current?.isBeginning}
                        color="medium"
                      >
                        Prev
                      </IonButton>
                      <div style={{ fontSize: 13, color: '#444' }}>{`${currentSlide + 1} / ${pages.length}`}</div>
                      <IonButton
                        size="small"
                        onClick={() => swiperRef.current && swiperRef.current.slideNext()}
                        disabled={!!swiperRef.current?.isEnd}
                        color="medium"
                      >
                        Next
                      </IonButton>
                    </div>
                  )
                }
              </div>
            </IonCol>
            <IonCol size="2">
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Páginas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {pages.map((pg, pidx) => {
                    const st = pageStatuses[pidx] || 'none';
                    const color = st === 'rejected' ? '#dc3545' : st === 'approved_observations' ? '#ffc107' : st === 'approved' ? '#28a745' : '#cfcfcf';
                    const isActive = pidx === currentSlide;
                    const containerStyle: React.CSSProperties = {
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      padding: isActive ? '6px 8px' : undefined,
                      borderRadius: 8,
                      background: isActive ? 'rgba(38,128,235,0.06)' : undefined,
                    };
                    const circleStyle: React.CSSProperties = {
                      width: isActive ? 18 : 14,
                      height: isActive ? 18 : 14,
                      borderRadius: 14,
                      background: color,
                      boxShadow: isActive ? '0 0 0 4px rgba(38,128,235,0.08)' : undefined,
                      transition: 'all 150ms ease',
                    };
                    const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: isActive ? 700 : 400, color: isActive ? '#174ea6' : '#000' };
                    return (
                      <div key={`nav-${pidx}`} style={containerStyle} onClick={() => { if (swiperRef.current) swiperRef.current.slideTo(pidx); }}>
                        <div style={circleStyle} />
                        <div style={labelStyle}>Página {pidx + 1}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </IonCol>
            <IonCol size="4">
              <div style={{ padding: 12 }}>
                <IonCard style={{ borderRadius: 10, boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
                  <IonCardHeader style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600 }}>{wo.orgSeq || 'Orden'}</div>
                        <div style={{ fontSize: 13, color: '#666' }}>{templateName || (wo.templateId && (wo.templateId.name || wo.templateId)) || '-'}</div>
                      </div>
                      <IonBadge color="primary" style={{ fontSize: 12, padding: '6px 10px' }}>{(wo.state || wo.status || '-')}</IonBadge>
                    </div>
                  </IonCardHeader>
                  <IonCardContent style={{ padding: '8px 16px' }}>
                    <IonList lines="none">
                      <IonItem>
                        <IonLabel>
                          <div style={{ fontSize: 13, color: '#333' }}>Activo</div>
                          <div style={{ fontSize: 14 }}>{assetName || (typeof wo.assetId === 'object' ? (wo.assetId.name || wo.assetId._id) : wo.assetId) || '-'}</div>
                        </IonLabel>
                      </IonItem>
                      <IonItem>
                        <IonLabel>
                          <div style={{ fontSize: 13, color: '#333' }}>Asignado</div>
                          <div style={{ fontSize: 14 }}>{assigneeName || wo.assigneeId || '-'}</div>
                        </IonLabel>
                      </IonItem>
                    </IonList>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Decisión</div>
                      <IonRadioGroup value={decision} onIonChange={(e) => setDecision((e.detail.value as any) || null)}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IonRadio value="approve" />Aprobar</label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IonRadio value="reject" />Rechazar</label>
                        </div>
                      </IonRadioGroup>
                      <div style={{ marginTop: 8 }}>
                        <IonButton onClick={() => {
                          if (decision === 'approve') {
                            // check for any rejections or observations
                            const hasIssues = Object.values(fieldStatuses || {}).some(s => s === 'rejected' || s === 'approved_observations');
                            if (hasIssues) {
                              setShowConfirmApproveAlert(true);
                              return;
                            }
                            submitDecision(WORK_ORDER_STATES.APPROVED);
                          } else if (decision === 'reject') {
                            submitDecision(WORK_ORDER_STATES.REJECTED);
                          }
                        }} disabled={!decision || submittingDecision}>
                          Guardar decisión
                        </IonButton>
                      </div>
                    </div>
                    {isDev && (
                      <div style={{ marginTop: 12 }}>
                        <IonButton size="small" onClick={() => setShowJson(s => !s)} fill="clear">{showJson ? 'Ocultar JSON' : 'Ver JSON'}</IonButton>
                        {showJson && (
                          <div style={{ marginTop: 8, maxHeight: 360, overflow: 'auto', background: '#fafafa', border: '1px solid #eee', padding: 8 }}>
                            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12 }}>{JSON.stringify({ wo, values, photos, filesMap, dynamicLists, locations, templateStructure }, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    )}
                  </IonCardContent>
                </IonCard>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMsg}
        duration={2500}
      />
    </IonPage>
  );
};

export default WorkOrdersReview;

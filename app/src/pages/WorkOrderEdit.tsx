import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonButtons, IonButton, IonIcon, IonFooter, IonModal, IonText } from '@ionic/react';
import { getWorkOrder, updateWorkOrder, startWorkOrder, offlineSaveWorkOrder, submitForReview } from '../api/workOrders';
import { emitWorkOrderUpdated } from '../utils/eventBus';
import { getTemplate } from '../api/templates';
import FormRenderer from '../components/FormRenderer';
import { useWorkOrder } from '../context/WorkOrderContext';
import { useAuth } from '../context/AuthContext';
import { normalizeStructure } from '../utils/structure';
import { chevronBackOutline, cloudUploadOutline, saveOutline } from 'ionicons/icons';
import { LoadingModal } from '../components/modals/LoadingModal';
import { WORK_ORDER_STATES } from '../constants/workOrderStates';

// Prevent duplicate startWorkOrder requests across component remounts (Strict Mode)
const _startWorkOrderLocks = new Set<string>();

type RouteParams = {
  id: string;
};

const WorkOrderEdit: React.FC = () => {
  const { struct, setStruct } = useWorkOrder();
  const { user } = useAuth() as any;
  const history = useHistory();
  const params = useParams<RouteParams>();
  const [loading, setLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState('Cargando orden de trabajo...');
  const [progress, setProgress] = useState(0);
  const [orderData, setOrderData] = useState<any>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const _startModalShown = React.useRef(false);
  const saveTriggerRef = React.useRef<() => void>(() => {});
  const [syncing, setSyncing] = useState(false);
  const [formActiveIndex, setFormActiveIndex] = useState(0);
  const [formPagesCount, setFormPagesCount] = useState(1);

  useEffect(() => {
    // show start modal once when entering edit if order not started
    if (!orderData) return;
    if (_startModalShown.current) return;
    try {
      const status = orderData.status || (orderData as any).state;
      const s = String(status || '').toLowerCase();
      if (!s || s !== String(WORK_ORDER_STATES.STARTED).toLowerCase()) {
        setShowStartModal(true);
        _startModalShown.current = true;
      }
    } catch (e) {
      // ignore
    }
  }, [orderData]);

  useEffect(() => {
    // always attempt to reconcile server/local data when loading the page
    const load = async () => {
      setLoading(true);
      try {
        const order = await getWorkOrder(params.id);
        setOrderData(order);
        // DEBUG: log assignee and current user to help debug start permissions
        try { console.log('[DEBUG] fetched order.assigneeId:', order && order.assigneeId, ' current user:', user); } catch (e) { }
        // templateId can be populated object or just an id string
        const tmpl = order.templateId;
        if (tmpl && typeof tmpl === 'object' && tmpl.structure) {
          setStruct(normalizeStructure(tmpl.structure));
        } else if (tmpl && typeof tmpl === 'string') {
          const template = await getTemplate(tmpl);
          setStruct(normalizeStructure(template?.structure || null));
        } else {
          // progress is calculated inside FormRenderer and passed via onProgress.
        }
        // After structure loaded, reconcile server data and local backup

        
        try {
          const backupKey = `wo-backup:${params.id}`;
          const localBackup = await idbGet(backupKey).catch(() => null);
          const serverData = order && order.data ? order.data : null;

          // helper to count filled entries (simple heuristic)
          const countFilled = (p: any) => {
            if (!p) return 0;
            let c = 0;
            if (p.values) c += Object.keys(p.values).filter(k => p.values[k] !== undefined && p.values[k] !== '').length;
            if (p.photos) c += Object.keys(p.photos).filter(k => p.photos[k]).length;
            if (p.filesMap) c += Object.keys(p.filesMap).filter(k => p.filesMap[k] && (p.filesMap[k].url || p.filesMap[k].name)).length;
            if (p.dynamicLists) {
              Object.keys(p.dynamicLists).forEach(k => { c += (p.dynamicLists[k] || []).length; });
            }
            if (p.locations) c += Object.keys(p.locations).filter(k => p.locations[k]).length;
            return c;
          };

          // Decision flow:
          // 1) If server has data -> use server data as initial (and update local last-saved/backup)
          // 2) If server lacks data but local backup exists -> use local and, if online, push to server
          // 3) If both exist, prefer the more complete (higher filled count). If local more complete and online, push local to server. Else prefer server and update local.

          let initialDataToUse = null as any;
          if (serverData && Object.keys(serverData).length > 0) {
            initialDataToUse = serverData;
            // update local store (single source of truth locally)
            await idbPut(backupKey, serverData).catch(() => {});
          } else if (!serverData && localBackup) {
            initialDataToUse = localBackup;
            // push to server if online
            if (navigator.onLine) {
              // push local backup to server (use fetched order info)
              try { await handleSaveAsync(localBackup, order); } catch (e) { console.error('auto-sync push err', e); }
            }
          } else if (serverData && localBackup) {
            const sCount = countFilled(serverData);
            const lCount = countFilled(localBackup);
            if (lCount > sCount && navigator.onLine) {
              initialDataToUse = localBackup;
              try { await handleSaveAsync(localBackup, order); } catch (e) { console.error('auto-sync push err', e); }
            } else {
              initialDataToUse = serverData;
              await idbPut(backupKey, serverData).catch(() => {});
            }
          }

          // pass initialData to FormRenderer via state
          if (initialDataToUse) {
            // attach to orderData so render passes it
            setOrderData((prev: any) => ({ ...(prev || {}), _initialDataFromSync: initialDataToUse }));
          }
        } catch (e) {
          console.error('reconcile err', e);
        }
      } catch (err) {
        console.error('Error loading work order/template for edit', err);
        setStruct(null);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // debounce sending progress to backend to avoid spamming updates
  useEffect(() => {
    let timer: any = null;
    if (progress !== null && progress !== undefined) {
      timer = setTimeout(async () => {
        try {
          await updateWorkOrder(params.id, { progress });
        } catch (e) {
          // ignore update errors
          console.warn('Failed to persist progress', e);
        }
      }, 2000);
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [progress, params.id]);

  const handleSave = () => {
    // placeholder - replaced by async handler below when FormRenderer calls onSave
  }

  const handleManualSave = async () => {
    // Trigger form save which also stores to IndexedDB
    try {
      try { saveTriggerRef.current && saveTriggerRef.current(); } catch (e) { console.error('form save trigger err', e); }
      // small delay to allow idbPut to complete
      await new Promise(r => setTimeout(r, 250));
      const backupKey = `wo-backup:${params.id}`;
      const localBackup = await idbGet(backupKey).catch(() => null);
      if (!localBackup) {
        console.warn('No local backup found for', backupKey);
        return;
      }
      if (!navigator.onLine) {
        console.warn('Offline: will not sync to server now');
        return;
      }
      setSyncing(true);
      // preparedBackup is the local backup (FormRenderer writes normalized payload to IndexedDB)
      const preparedBackup = localBackup;
      // normalize payload so backend receives expected shapes for images/files
      // call backend offline-save endpoint with normalized payload
      try {
        // Manual save only syncs data, do not submit for review
        await syncBackupToServer(false);
      } catch (e) {
        console.error('sync to server failed', e);
      }
    } finally {
      setSyncing(false);
    }
  }

  // Reusable normalization + sync logic so FormRenderer's Guardar can trigger it directly
  const syncBackupToServer = async (submitForReviewFlag: boolean = true) => {
    const backupKey = `wo-backup:${params.id}`;
    const localBackup = await idbGet(backupKey).catch(() => null);
    if (!localBackup) {
      console.warn('No local backup found for', backupKey);
      return false;
    }
    if (!navigator.onLine) {
      console.warn('Offline: will not sync to server now');
      return false;
    }

    // If there was a pending state change stored in the local backup, apply it first
    if (localBackup._pendingState) {
      try {
        await updateWorkOrder(params.id, localBackup._pendingState);
        // remove pending marker after successful update
        delete localBackup._pendingState;
        try { await idbPut(backupKey, localBackup); } catch (e) { /* ignore */ }
      } catch (e) {
        console.warn('Failed to apply pending state update before sync', e);
      }
    }

    const normalizeForBackend = (p: any) => {
      const copy = JSON.parse(JSON.stringify(p || {}));
      // photos: allow either string or { url: string } shapes
      if (copy.photos && typeof copy.photos === 'object') {
        for (const k of Object.keys(copy.photos)) {
          const v = copy.photos[k];
          if (v && typeof v === 'object') {
            if (typeof v.url === 'string') copy.photos[k] = v.url;
            else if (typeof v.data === 'string') copy.photos[k] = v.data;
          }
        }
      }
      // filesMap: ensure item.url is a string (data URL) when available
      if (copy.filesMap && typeof copy.filesMap === 'object') {
        for (const k of Object.keys(copy.filesMap)) {
          const item = copy.filesMap[k];
          if (item && typeof item === 'object') {
            if (item.url && typeof item.url === 'object' && typeof item.url.url === 'string') item.url = item.url.url;
            if (!item.url && typeof item.data === 'string') item.url = item.data;
          }
        }
      }
      // dynamicLists: image items may store value as object { url } or { data }
      if (copy.dynamicLists && typeof copy.dynamicLists === 'object') {
        for (const fieldId of Object.keys(copy.dynamicLists)) {
          const arr = copy.dynamicLists[fieldId] || [];
          for (let i = 0; i < arr.length; i++) {
            const it = arr[i];
            if (it && it.type === 'image') {
              if (it.value && typeof it.value === 'object') {
                if (typeof it.value.url === 'string') arr[i].value = it.value.url;
                else if (typeof it.value.data === 'string') arr[i].value = it.value.data;
              }
            }
          }
        }
      }
      return copy;
    };

    const normalized = normalizeForBackend(localBackup);
    await offlineSaveWorkOrder(params.id, { data: normalized });
    const nowIso = new Date().toISOString();
    setOrderData((prev: any) => ({ ...(prev || {}), data: normalized, dates: { ...(prev && prev.dates ? prev.dates : {}), end: nowIso } }));
    try {
      if (!submitForReviewFlag) {
        // do not submit for review; just sync the backup and return
        return true;
      }
      // fetch current server state; avoid duplicate transition to 'En revisión'
      let serverWo: any = null;
      try { serverWo = await getWorkOrder(params.id); } catch (gErr) { /* ignore */ }
      const serverState = serverWo ? (serverWo.status || serverWo.state) : null;
      const srv = String(serverState || '').toLowerCase();
      const underReviewKeys = [String(WORK_ORDER_STATES.UNDER_REVIEW).toLowerCase(), 'en revisión', 'en revision'];
      if (!underReviewKeys.includes(srv)) {
        const submitted = await submitForReview(params.id);
        if (submitted) {
          try {
            if (window.history.length > 1) {
              history.goBack();
            } else {
              history.replace(`/work-orders/${params.id}`);
            }
          } catch (navErr) {
            history.replace(`/work-orders/${params.id}`);
          }
          return true;
        }
      } else {
        // already en revisión on server, just navigate back
        try {
          if (window.history.length > 1) {
            history.goBack();
          } else {
            history.replace(`/work-orders/${params.id}`);
          }
        } catch (navErr) {
          history.replace(`/work-orders/${params.id}`);
        }
        return true;
      }
    } catch (e) {
      console.warn('submit for review failed', e);
    }
    return false;
  };

  // Called when FormRenderer's internal Guardar button is pressed (it already ran onSave)
  const handleSaveAndSyncFromForm = async () => {
    setSyncing(true);
    try {
      // Form's internal save should behave like manual save: sync only, do not submit
      await syncBackupToServer(false);
    } catch (e) {
      console.error('save-and-sync failed', e);
    } finally {
      setSyncing(false);
    }
  };

  // IndexedDB helpers for storing backups locally
  const idbPut = (key: string, value: any) => new Promise<void>((resolve, reject) => {
    try {
      const req = window.indexedDB.open('smg_backups', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('backups')) db.createObjectStore('backups');
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('backups', 'readwrite');
        const store = tx.objectStore('backups');
        store.put(value, key);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = (e) => { db.close(); reject(tx.error); };
      };
      req.onerror = () => reject(req.error);
    } catch (e) { reject(e); }
  });

  const idbGet = (key: string) => new Promise<any>((resolve, reject) => {
    try {
      const req = window.indexedDB.open('smg_backups', 1);
      req.onupgradeneeded = () => { req.result.createObjectStore('backups'); };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('backups', 'readonly');
        const store = tx.objectStore('backups');
        const g = store.get(key);
        g.onsuccess = () => { db.close(); resolve(g.result); };
        g.onerror = () => { db.close(); reject(g.error); };
      };
      req.onerror = () => reject(req.error);
    } catch (e) { reject(e); }
  });

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || '';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename || 'file', { type: mime });
  };


  const handleSaveAsync = async (payload: any, orderArg?: any) => {
    try {
      // store local backup (base64 included) - payload is already normalized by FormRenderer
      const backupKey = `wo-backup:${params.id}`;
      await idbPut(backupKey, payload);

      // determine files that need upload (data: URLs)
      const uploads: Array<{ uid: string; file: File; type?: string; source: 'photos'|'filesMap'|'dynamic' }> = [];

      const usedOrder = orderArg || orderData;
      // photos
      Object.keys(payload.photos || {}).forEach(uid => {
        const v = payload.photos[uid];
        if (typeof v === 'string' && v.startsWith('data:')) {
          uploads.push({ uid, file: dataURLtoFile(v, `${uid}.jpg`), type: `images/work-orders/${(usedOrder && (usedOrder.client && (usedOrder.client._id || usedOrder.client.id))) || 'unknown'}/${(usedOrder && usedOrder.orgSeq) || 'unknown'}`, source: 'photos' });
        }
      });

      // filesMap
      Object.keys(payload.filesMap || {}).forEach(uid => {
        const item = payload.filesMap[uid];
        const v = item && item.url;
        if (typeof v === 'string' && v.startsWith('data:')) {
          uploads.push({ uid, file: dataURLtoFile(v, item.name || `${uid}.bin`), type: `work-orders/${(usedOrder && (usedOrder.client && (usedOrder.client._id || usedOrder.client.id))) || 'unknown'}/${(usedOrder && usedOrder.orgSeq) || 'unknown'}`, source: 'filesMap' });
        }
      });

      // dynamic lists images
      Object.keys(payload.dynamicLists || {}).forEach(uid => {
        (payload.dynamicLists[uid] || []).forEach((it: any, idx: number) => {
          if (it.type === 'image' && typeof it.value === 'string' && it.value.startsWith('data:')) {
            uploads.push({ uid: `${uid}:${idx}`, file: dataURLtoFile(it.value, it.name || `${uid}_${idx}.jpg`), type: `images/work-orders/${(orderData && (orderData.client && (orderData.client._id || orderData.client.id))) || 'unknown'}/${(orderData && orderData.orgSeq) || 'unknown'}`, source: 'dynamic' });
          }
        });
      });

      // We will NOT upload files or send data to server. Keep data URLs as-is and save locally.
      const finalPayload = JSON.parse(JSON.stringify(payload));

      // check if there's actual changes compared to last saved local backup
      const lastSaved = await idbGet(backupKey).catch(() => null);
      const changed = JSON.stringify(lastSaved) !== JSON.stringify(finalPayload);
      if (!changed) {
        return;
      }

        // store local backup (single key)
        await idbPut(backupKey, finalPayload).catch(() => {});
        // update local orderData to reflect saved payload
        setOrderData((prev: any) => ({ ...(prev || {}), data: finalPayload }));
        try { emitWorkOrderUpdated({ id: params.id, workOrder: { data: finalPayload } }); } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('save err', err);
    }
  };

  return (
    <IonPage>
      <LoadingModal isOpen={loading} message={messageLoading} />
      <IonHeader className='ion-no-border'>
        <IonToolbar>
            <IonButtons slot='start'>
                <IonButton fill={'clear'} onClick={() => { history.goBack() }}>
                    <IonIcon slot="icon-only" icon={chevronBackOutline} />
                </IonButton>
            </IonButtons>
            <IonTitle>Orden</IonTitle>
            <IonButtons slot='end'>
              <IonButton fill={'clear'} disabled>
                {progress}%
              </IonButton>
              <IonButton title='Guardar' onClick={() => { try { handleManualSave(); } catch (e) { console.error(e); } }}>
                <IonIcon icon={saveOutline} />
              </IonButton>
            </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonModal isOpen={showStartModal} onDidDismiss={() => setShowStartModal(false)}>
        <IonContent className="ion-padding">
          <h2>Iniciar actividad</h2>
          <IonText>
            {`Iniciará la actividad de la Orden de trabajo ${orderData ? (orderData.orgSeq || orderData.orgSeq === 0 ? orderData.orgSeq : orderData._id) : ''}`}
          </IonText>
          <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <IonButton color="primary" onClick={async () => {
              const nowIso = new Date().toISOString();
              // optimistically update local state so UI reflects change immediately
              setOrderData((prev: any) => ({ ...(prev || {}), dates: { ...(prev && prev.dates ? prev.dates : {}), start: nowIso }, state: WORK_ORDER_STATES.STARTED }));
              try { emitWorkOrderUpdated({ id: params.id, workOrder: { dates: { start: nowIso }, state: WORK_ORDER_STATES.STARTED } }); } catch (e) { /* ignore */ }
              _startModalShown.current = true;

              const payload = { dates: { start: nowIso }, state: WORK_ORDER_STATES.STARTED };
              if (navigator.onLine) {
                try {
                  // try persist to server
                  const response = await updateWorkOrder(params.id, payload);
                  console.log('Start work order response', response);
                  // refresh order from server to ensure canonical state
                  try {
                    const refreshed = await getWorkOrder(params.id);
                    if (refreshed) setOrderData(refreshed);
                  } catch (rfErr) {
                    console.warn('Failed to refresh order after update', rfErr);
                  }
                } catch (e) {
                  console.warn('Failed to update start status online', e);
                  // store pending state so user can retry sync with Guardar
                  try {
                    const backupKey = `wo-backup:${params.id}`;
                    const localBackup = await idbGet(backupKey).catch(() => ({}));
                    localBackup._pendingState = { ...payload, _ts: new Date().toISOString() };
                    await idbPut(backupKey, localBackup);
                  } catch (putErr) {
                    console.warn('Failed to save pending state locally after update error', putErr);
                  }
                }
              } else {
                // offline: store pending state in local backup so sync will apply it later
                try {
                  const backupKey = `wo-backup:${params.id}`;
                  const localBackup = await idbGet(backupKey).catch(() => ({}));
                  localBackup._pendingState = { ...payload, _ts: new Date().toISOString() };
                  await idbPut(backupKey, localBackup);
                } catch (e) {
                  console.warn('Failed to save pending state locally', e);
                }
              }
              setShowStartModal(false);
            }}>Iniciar</IonButton>
            <IonButton color="medium" onClick={() => { setShowStartModal(false); try { history.goBack(); } catch (e) { /* ignore */ } }}>Cancelar</IonButton>
          </div>
        </IonContent>
      </IonModal>
      <IonContent>
          { (struct && Array.isArray(struct.components)) ? (
            <div>
              <FormRenderer 
                schema={struct.components} 
                showSaveButton={true} 
                onSave={handleSaveAsync} 
                onRegisterSave={(fn: () => void) => { saveTriggerRef.current = fn; }} 
                onProgress={(p: number) => setProgress(p)}
                onActivePageChange={(i: number, count: number) => { setFormActiveIndex(i); setFormPagesCount(count); }}
                initialData={(orderData && (orderData._initialDataFromSync || orderData.data)) || null}
                onFieldBlur={handleSaveAsync}
              />

              
            </div>
              
          ) : loading ? (
            <div style={{ padding: 16 }}><IonSpinner /></div>
          ) : (
            <div style={{ padding: 16 }}>No hay estructura disponible para esta orden</div>
          )
        }
      </IonContent>
      {/* Moved Guardar button here so sync logic stays in page scope; show only on last page */}
      { (formPagesCount > 0 && formActiveIndex === formPagesCount - 1) && (
        <IonFooter>
          <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
            <IonButton disabled={syncing} onClick={async () => {
              // prevent double submission: disable UI while syncing
              setSyncing(true);
              try {
                // trigger form save to ensure IndexedDB backup is up-to-date
                try { saveTriggerRef.current && saveTriggerRef.current(); } catch (e) { console.error('form save trigger err', e); }
                await new Promise(r => setTimeout(r, 250));

                // set end date and mark as 'under_review' locally
                const nowIso = new Date().toISOString();
                setOrderData((prev: any) => ({ ...(prev || {}), dates: { ...(prev && prev.dates ? prev.dates : {}), end: nowIso }, state: WORK_ORDER_STATES.UNDER_REVIEW }));
                try { emitWorkOrderUpdated({ id: params.id, workOrder: { dates: { end: nowIso }, state: WORK_ORDER_STATES.UNDER_REVIEW } }); } catch (e) { /* ignore */ }

                // only call update API if the order isn't already in that state
                const currentStatus = (orderData && (orderData.state || (orderData as any).status || (orderData as any).state)) || null;
                if (!currentStatus || String(currentStatus).toLowerCase() !== String(WORK_ORDER_STATES.UNDER_REVIEW).toLowerCase()) {
                  try {
                    await updateWorkOrder(params.id, { dates: { end: nowIso }, state: WORK_ORDER_STATES.UNDER_REVIEW });
                  } catch (uErr) {
                    console.warn('Failed to update work order dates/state', uErr);
                    // fallthrough to sync which may retry
                  }
                }

                // Footer action: this is the final submit flow — sync and submit for review
                await syncBackupToServer(true);
              } catch (e) {
                console.error('save+sync failed', e);
              } finally {
                setSyncing(false);
              }
            }}>
              Enviar a revisión
            </IonButton>
          </div>
        </IonFooter>
      )}
    </IonPage>
  );
};

export default WorkOrderEdit;

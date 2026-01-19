import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { getWorkOrder, updateWorkOrder, startWorkOrder } from '../api/workOrders';
import { getTemplate } from '../api/templates';
import FormRenderer from '../components/FormRenderer';
import { useWorkOrder } from '../context/WorkOrderContext';
import { useAuth } from '../context/AuthContext';
import { normalizeStructure } from '../utils/structure';
import { chevronBackOutline, cloudUploadOutline, saveOutline } from 'ionicons/icons';
import { LoadingModal } from '../components/modals/LoadingModal';

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
  const saveTriggerRef = React.useRef<() => void>(() => {});

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
          // nothing available
          setStruct({ components: [] });
        }
        // mark order as started when user (assignee) opens this edit page and let backend append history
        try {
          if (order && order.state !== 'Iniciado' && order.state !== 'En ejecución') {
            try {
              const updated = await startWorkOrder(params.id);
              // server performs transition and returns updated work order with history
              if (updated) setOrderData(updated);
            } catch (e) {
              // fallback: if start endpoint fails (permissions), still update local view to keep UX
              console.error('Error calling startWorkOrder', e);
              const nowIso = new Date().toISOString();
              const actorId = (user && ((user._id || user.id) as any)) || null;
              const historyEntry: any = {
                from: order.state || null,
                to: 'Iniciado',
                note: actorId ? `Iniciada por ${(user.firstName || user.name || 'usuario')}` : 'Iniciada',
                at: { $date: nowIso }
              };
              if (actorId) historyEntry.userId = { $oid: actorId };
              const newHistory = Array.isArray(order.history) ? [...order.history, historyEntry] : [historyEntry];
              setOrderData((prev: any) => ({ ...(prev || {}), state: 'Iniciado', history: newHistory }));
            }
          }
        } catch (e) {
          // ignore
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

  const handleSave = () => {
    // placeholder - replaced by async handler below when FormRenderer calls onSave
  }

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
      // store local backup (base64 included)
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
              <IonButton title='Guardar' onClick={() => { try { saveTriggerRef.current && saveTriggerRef.current(); } catch (e) { console.error(e); } }}>
                <IonIcon icon={saveOutline} />
              </IonButton>
            </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
          { (struct && Array.isArray(struct.components)) ? (
            <FormRenderer 
              schema={struct.components} 
              showSaveButton={true} 
              onSave={handleSaveAsync} 
              onRegisterSave={(fn: () => void) => { saveTriggerRef.current = fn; }} 
              onProgress={(p: number) => setProgress(p)} initialData={(orderData && (orderData._initialDataFromSync || orderData.data)) || null}
              onFieldBlur={handleSaveAsync}
              />
              
          ) : loading ? (
            <div style={{ padding: 16 }}><IonSpinner /></div>
          ) : (
            <div style={{ padding: 16 }}>No hay estructura disponible para esta orden</div>
          )
        }
      </IonContent>
    </IonPage>
  );
};

export default WorkOrderEdit;

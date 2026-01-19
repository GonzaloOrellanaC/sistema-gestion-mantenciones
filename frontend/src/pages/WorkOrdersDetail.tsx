import React, { useEffect, useState } from 'react';
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
  IonText,
  IonNote,
  IonAvatar,
  IonIcon
} from '@ionic/react';
import workOrdersApi from '../api/workOrders';
import usersApi from '../api/users';
import inventoryApi from '../api/inventory';
import assetsApi from '../api/assets';
import templatesApi from '../api/templates';
import WorkOrdersCosts from './WorkOrdersCosts';
import { chevronBackOutline } from 'ionicons/icons';

// Module-level caches to deduplicate work order fetches (prevents double requests in StrictMode)
const workOrderCache: Record<string, any> = {};
const workOrderPromises: Record<string, Promise<any>> = {};

function formatDate(d?: string | Date | null) {
  if (!d) return '-';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleString();
}

function formatDateOnly(d?: string | Date | null) {
  if (!d) return '-';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleDateString();
}

const WorkOrdersDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [wo, setWo] = useState<any>(null);
  const [assigneeName, setAssigneeName] = useState<string | null>(null);
  const [assigneeUser, setAssigneeUser] = useState<any>(null);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [templateObj, setTemplateObj] = useState<any | null>(null);
  const [historyResolved, setHistoryResolved] = useState<Array<any>>([]);
  const [partsAvailability, setPartsAvailability] = useState<Record<string, number>>({});
  const [partsLoading, setPartsLoading] = useState(false);
  const [assetInfo, setAssetInfo] = useState<any>(null);

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
          setWo(wo);
                  // template name (handle id or populated object)
        if (wo && wo.templateId) {
          try {
            const tid = typeof wo.templateId === 'object' ? (wo.templateId._id || wo.templateId.id) : wo.templateId;
            if (tid) {
              const t = await templatesApi.getTemplate(tid);
              if (mounted) setTemplateName(t?.name || null);
              if (mounted) setTemplateObj(t || null);
            } else if (typeof wo.templateId === 'object' && wo.templateId.name) {
              if (mounted) setTemplateName(wo.templateId.name);
              if (mounted) setTemplateObj(typeof wo.templateId === 'object' ? wo.templateId : null);
            }
          } catch (e) {
            console.warn('template fetch failed', e);
          }
        }

        // assignee (id or populated object)
        if (wo && wo.assigneeId) {
          try {
            const aid = typeof wo.assigneeId === 'object' ? (wo.assigneeId._id || wo.assigneeId.id) : wo.assigneeId;
            if (aid) {
              const u = await usersApi.getUser(aid);
              if (mounted) {
                setAssigneeName(u ? `${u.firstName} ${u.lastName}` : null);
                setAssigneeUser(u || null);
              }
            } else if (typeof wo.assigneeId === 'object') {
              if (mounted) {
                setAssigneeName(`${(wo.assigneeId.firstName || '')} ${(wo.assigneeId.lastName || '')}`.trim() || null);
                setAssigneeUser(wo.assigneeId || null);
              }
            }
          } catch (e) {
            console.warn('assignee fetch failed', e);
          }
        }

        // resolve history user names
        if (wo && Array.isArray(wo.history) && wo.history.length) {
          const userIds = Array.from(new Set(wo.history.map((h: any) => h.userId).filter(Boolean))) as string[];
          const idToName: Record<string, string> = {};
          await Promise.all(userIds.map(async (uid: string) => {
            try {
              const u = await usersApi.getUser(uid);
              if (u) idToName[uid] = `${u.firstName} ${u.lastName}`;
            } catch (e) {

          }
          }));
          const resolved = wo.history.map((h: any) => ({ ...h, userName: h.userId ? idToName[h.userId] || h.userId : null }));
          if (mounted) setHistoryResolved(resolved);
        }

        // asset info
        try {
          if (wo && wo.assetId) {
            const aid = typeof wo.assetId === 'object' ? (wo.assetId._id || wo.assetId.id) : wo.assetId;
            if (aid) {
              try {
                const a = await assetsApi.getAsset(aid);
                if (mounted) setAssetInfo(a || null);
              } catch (e) {
                // ignore
              }
            }
          }
        } catch (e) {
          // ignore
        }

        // debug
        // eslint-disable-next-line no-console
        console.log('WorkOrdersDetail loaded wo:', wo);

        // parts availability
        try {
          const partsFromWo = wo && ((wo.selectedParts) || (wo.parts) || (wo.data && (wo.data.selectedParts || wo.data.parts)) || []);
          const templateParts = (templateObj && templateObj.structure && Array.isArray(templateObj.structure.components))
            ? templateObj.structure.components.flatMap((c: any) => (c && c.type === 'parts' && Array.isArray(c.parts)) ? c.parts : [])
            : [];
          const partsToCheck = (Array.isArray(partsFromWo) && partsFromWo.length) ? partsFromWo : templateParts;
          if (Array.isArray(partsToCheck) && partsToCheck.length) {
            setPartsLoading(true);
            const map: Record<string, number> = {};
            await Promise.all(partsToCheck.map(async (p: any) => {
              const partId = p.partId || p.part || p._id || p.id;
              if (!partId) return;
              try {
                const stockLines = await inventoryApi.listStock({ orgId: wo.orgId, partId });
                const available = (stockLines || []).reduce((acc: number, s: any) => {
                  const q = Number(s.quantity || 0);
                  const r = Number(s.reserved || 0);
                  return acc + Math.max(0, q - r);
                }, 0);
                map[String(partId)] = available;
              } catch (e) {
                map[String(partId)] = 0;
              }
            }));
            if (mounted) setPartsAvailability(map);
          }
        } catch (e) {
          // ignore
        } finally {
          if (mounted) setPartsLoading(false);
        }
          setLoading(false);
        } catch (e) {
          console.warn('failed loading work order for edit', e);
          setLoading(false);
        }
      };
  
      load();
      return () => { mounted = false; };
    }, [id]);

  if (loading) return <IonPage><IonContent className="ion-padding"><IonSpinner /></IonContent></IonPage>;

  if (!wo) return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('workOrderDetail.notFoundTitle')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div>{t('workOrderDetail.notFoundBody')}</div>
      </IonContent>
    </IonPage>
  );

  const renderData = (d: any) => {
    if (!d || (typeof d === 'object' && Object.keys(d).length === 0)) return <IonNote>-</IonNote>;
    if (typeof d === 'string') return <pre style={{ whiteSpace: 'pre-wrap' }}>{d}</pre>;
    if (typeof d === 'object') {
      return (
        <div style={{ padding: 8 }}>
          {Object.keys(d).map((k) => (
            <div key={k} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>{k}</div>
              <div style={{ color: '#444', whiteSpace: 'pre-wrap' }}>{JSON.stringify(d[k], null, 2)}</div>
            </div>
          ))}
        </div>
      );
    }
    return <pre>{String(d)}</pre>;
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{padding: '0px 16px'}}>
          <IonButton color={'dark'} fill={'clear'} slot={'start'} onClick={() => {history.goBack()}}>
            <IonIcon icon={chevronBackOutline} slot='icon-only' />
          </IonButton>
          <IonTitle style={{marginLeft: 10}}>{t('workOrderDetail.labels.number')} {wo.orgSeq || ''}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid>
          <IonRow>
            <IonCol size="4">
              <div style={{ padding: '12px 0' }}><h3 style={{ margin: 0 }}>{t('workOrderDetail.columns.details')}</h3></div>
              <IonList>
                <IonItem>
                  <IonLabel><strong>{t('workOrderDetail.labels.state')}:</strong></IonLabel>
                  <IonText slot="end">{wo.state || wo.status || '-'}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel><strong>{t('workOrderDetail.labels.template')}:</strong></IonLabel>
                  <IonText slot="end">{templateName || (wo.templateId && (wo.templateId.name || wo.templateId)) || '-' }</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel><strong>{t('workOrderDetail.labels.assignedTo')}:</strong></IonLabel>
                  <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {assigneeUser ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <IonAvatar>
                          <img src={assigneeUser.photoUrl || '/assets/default-profile.svg'} alt="assignee" />
                        </IonAvatar>
                        <div>{assigneeName}</div>
                      </div>
                    ) : <IonText>{assigneeName || wo.assigneeId || '-'}</IonText>}
                  </div>
                </IonItem>
                <IonItem>
                  <IonLabel><strong>{t('workOrderDetail.labels.branch')}:</strong></IonLabel>
                  <IonText slot="end">{wo && wo.branchId ? (typeof wo.branchId === 'object' ? (wo.branchId.name || wo.branchId._id) : wo.branchId) : '-'}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel><strong>{t('workOrderDetail.labels.asset')}:</strong></IonLabel>
                  <IonText slot="end">{assetInfo ? (assetInfo.name || assetInfo._id) : (typeof wo.assetId === 'object' ? (wo.assetId.name || wo.assetId._id) : wo.assetId) || '-'}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel><strong>{t('workOrderDetail.labels.created')}:</strong></IonLabel>
                  <IonText slot="end">{formatDate((wo as any).dates?.created || wo.createdAt)}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel><strong>{t('workOrderDetail.labels.assigned')}:</strong></IonLabel>
                  <IonText slot="end">{formatDate((wo as any).dates?.assignedAt || (wo as any).assignedAt)}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel><strong>{t('workOrderDetail.labels.scheduledStart')}:</strong></IonLabel>
                  <IonText slot="end">{formatDateOnly((wo as any).dates?.scheduledStart || (wo as any).scheduledStart)}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel><strong>{t('workOrderDetail.labels.estimatedEnd')}:</strong></IonLabel>
                  <IonText slot="end">{formatDateOnly((wo as any).dates?.estimatedEnd || (wo as any).estimatedEnd)}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel style={{ width: '100%' }}><strong>{t('workOrderDetail.labels.data')}</strong></IonLabel>
                </IonItem>
                <IonItem>
                  <div style={{ width: '100%' }}>{renderData(wo.data)}</div>
                </IonItem>
              </IonList>
            </IonCol>
            <IonCol size="4">
              <div style={{ padding: '12px 0' }}><h3 style={{ margin: 0 }}>{t('workOrderDetail.columns.parts')}</h3></div>
              <IonList>
                <IonItem>
                  <IonLabel style={{ width: '100%' }}><strong>{t('workOrderDetail.sections.requiredParts')}</strong></IonLabel>
                </IonItem>
                {(() => {
                  const partsFromWo = ((wo.selectedParts) || (wo.parts) || (wo.data && (wo.data.selectedParts || wo.data.parts)) || []);
                  const templateParts = (templateObj && templateObj.structure && Array.isArray(templateObj.structure.components))
                    ? templateObj.structure.components.flatMap((c: any) => (c && c.type === 'parts' && Array.isArray(c.parts)) ? c.parts : [])
                    : [];
                  const partsToShow = (Array.isArray(partsFromWo) && partsFromWo.length) ? partsFromWo : templateParts;
                  if (!partsToShow || partsToShow.length === 0) {
                    return (
                      <IonItem>
                        <IonNote style={{ marginLeft: 10 }}>{t('workOrderDetail.noParts')}</IonNote>
                      </IonItem>
                    );
                  }
                  return partsToShow.map((p: any, idx: number) => {
                  const partId = p.partId || p.part || p._id || p.id;
                  const req = Number(p.qty || p.quantity || p.qtyRequested || 1) || 1;
                  const avail = partId ? (partsAvailability[String(partId)] ?? undefined) : undefined;
                  return (
                    <IonItem key={idx}>
                      <IonLabel style={{ marginLeft: 10 }}>
                        <div style={{ fontWeight: 600 }}>{p.name || p.label || partId}</div>
                        <div style={{ color: '#666' }}>{t('workOrderDetail.parts.quantity')}: {req} {avail !== undefined ? (<span style={{ marginLeft: 8, color: avail >= req ? '#2e7d32' : '#b71c1c' }}>{t('workOrderDetail.parts.available')}: {avail}</span>) : (partsLoading ? <em style={{ marginLeft: 8 }}>{t('workOrderDetail.parts.calculating')}</em> : null)}</div>
                      </IonLabel>
                    </IonItem>
                  );
                  });
                })()}

                <div style={{ padding: 16 }}>
                  <h3>{t('workOrderDetail.sections.costs')}</h3>
                  <WorkOrdersCosts workOrderId={id || ''} />
                </div>
                <div style={{ padding: 16 }}>
                  <IonButton onClick={() => history.push('/work-orders')} fill="clear">{t('workOrderDetail.buttons.backToList')}</IonButton>
                  <IonButton onClick={() => history.push(`/work-orders/${wo._id}/assign`)} style={{ marginLeft: 8 }}>{t('workOrderDetail.buttons.goToAssign')}</IonButton>
                </div>
                {import.meta.env.DEV && (
                  <div style={{ padding: 16, background: '#f7f7f7', margin: 12, borderRadius: 6 }}>
                    <strong>{t('workOrderDetail.debugRaw')}</strong>
                    <pre style={{ maxHeight: 300, overflow: 'auto' }}>{JSON.stringify(wo, null, 2)}</pre>
                  </div>
                )}
              </IonList>
            </IonCol>
            <IonCol size="4">
              <div style={{ padding: '12px 0' }}><h3 style={{ margin: 0 }}>{t('workOrderDetail.columns.history')}</h3></div>
              <IonList>
                <IonItem>
                  <IonLabel style={{ width: '100%' }}><strong>{t('workOrderDetail.sections.history')}</strong></IonLabel>
                </IonItem>
                {historyResolved.length === 0 && (!wo.history || wo.history.length === 0) && (
                  <IonItem>
                    <IonNote>{t('workOrderDetail.noHistory')}</IonNote>
                  </IonItem>
                )}
                {historyResolved.length > 0 && historyResolved.map((h, idx) => (
                  <IonItem key={idx}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div><strong>{h.to}</strong> &middot; <small>{formatDate(h.at)}</small></div>
                        <div style={{ color: '#666' }}>
                          {h.userId ? (
                            <a
                              onClick={() => history.push(`/users/edit/${h.userId}`)}
                              style={{ cursor: 'pointer', color: 'inherit', textDecoration: 'underline' }}
                            >
                              {h.userName || h.userId}
                            </a>
                          ) : (h.userName || '-')}
                        </div>
                      </div>
                      {h.note && <div style={{ marginTop: 6 }}>{h.note}</div>}
                    </div>
                  </IonItem>
                ))}
              </IonList>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default WorkOrdersDetail;

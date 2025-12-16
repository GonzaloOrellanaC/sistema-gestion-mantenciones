import React, { useEffect, useState } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonSpinner,
  IonText,
  IonNote,
  IonAvatar
} from '@ionic/react';
import workOrdersApi from '../api/workOrders';
import usersApi from '../api/users';
import templatesApi from '../api/templates';

function formatDate(d?: string | Date | null) {
  if (!d) return '-';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleString();
}

const WorkOrdersDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [wo, setWo] = useState<any>(null);
  const [assigneeName, setAssigneeName] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [historyResolved, setHistoryResolved] = useState<Array<any>>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (!id) return;
        const data = await workOrdersApi.getWorkOrder(id);
        if (!mounted) return;
        setWo(data);

        // fetch template name
        if (data && data.templateId) {
          try {
            const t = await templatesApi.getTemplate(data.templateId);
            if (mounted) setTemplateName(t?.name || null);
          } catch (e) {
            console.warn('template fetch failed', e);
          }
        }

        // resolve assignee name
        if (data && data.assigneeId) {
          try {
            const u = await usersApi.getUser(data.assigneeId);
            if (mounted) setAssigneeName(u ? `${u.firstName} ${u.lastName}` : null);
          } catch (e) {
            console.warn('assignee fetch failed', e);
          }
        }

        // resolve history user names (if any)
        if (data && Array.isArray(data.history) && data.history.length) {
          const userIds = Array.from(new Set(data.history.map((h: any) => h.userId).filter(Boolean)));
          const idToName: Record<string, string> = {};
          await Promise.all(userIds.map(async (uid: string) => {
            try {
              const u = await usersApi.getUser(uid);
              if (u) idToName[uid] = `${u.firstName} ${u.lastName}`;
            } catch (e) {
              /* ignore */
            }
          }));
          const resolved = data.history.map((h: any) => ({ ...h, userName: h.userId ? idToName[h.userId] || h.userId : null }));
          if (mounted) setHistoryResolved(resolved);
        }

      } catch (e) {
        console.error('load wo err', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <IonPage><IonContent className="ion-padding"><IonSpinner /></IonContent></IonPage>;

  if (!wo) return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Orden no encontrada</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div>La orden de trabajo no existe o no se pudo cargar.</div>
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
      <IonHeader>
        <IonToolbar>
          <IonTitle>OT #{wo.orgSeq || ''}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonItem>
            <IonLabel><strong>Estado:</strong></IonLabel>
            <IonText slot="end">{wo.state}</IonText>
          </IonItem>
          <IonItem>
            <IonLabel><strong>Plantilla:</strong></IonLabel>
            <IonText slot="end">{templateName || wo.templateId || '-' }</IonText>
          </IonItem>
          <IonItem>
            <IonLabel><strong>Asignado a:</strong></IonLabel>
            <IonText slot="end">{assigneeName || wo.assigneeId || '-'}</IonText>
          </IonItem>
          <IonItem>
            <IonLabel><strong>Cliente:</strong></IonLabel>
            <IonText slot="end">{wo.client ? JSON.stringify(wo.client) : '-'}</IonText>
          </IonItem>
          <IonItem>
            <IonLabel style={{ width: '100%' }}><strong>Datos</strong></IonLabel>
          </IonItem>
          <IonItem>
            <div style={{ width: '100%' }}>{renderData(wo.data)}</div>
          </IonItem>

          <IonItem>
            <IonLabel style={{ width: '100%' }}><strong>Historial</strong></IonLabel>
          </IonItem>
          {historyResolved.length === 0 && (!wo.history || wo.history.length === 0) && (
            <IonItem>
              <IonNote>Sin historial</IonNote>
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
        <div style={{ padding: 16 }}>
          <IonButton onClick={() => history.push('/work-orders')} fill="clear">Volver a lista</IonButton>
          <IonButton onClick={() => history.push(`/work-orders/${wo._id}/assign`)} style={{ marginLeft: 8 }}>Ir a asignar</IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default WorkOrdersDetail;

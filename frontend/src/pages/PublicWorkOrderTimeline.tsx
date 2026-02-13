import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSpinner, IonProgressBar, IonIcon } from '@ionic/react';
import { clipboardOutline, personOutline, constructOutline, searchOutline, checkmarkCircleOutline } from 'ionicons/icons';
import publicApi from '../api/public';

const PublicWorkOrderTimeline: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wo, setWo] = useState<any>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    publicApi.getWorkOrderByToken(token).then((res) => {
      setWo(res.workOrder);
      setLoading(false);
    }).catch((err) => {
      console.error('public wo err', err);
      setError(err?.response?.data?.message || 'No se pudo cargar');
      setLoading(false);
    });
  }, [token]);

  // Hide global sidebar/menu while this page is mounted by adding a body class
  useEffect(() => {
    const cls = 'public-workorder-no-menu';
    document.body.classList.add(cls);

    // inject a small style to hide common menu selectors when class is present
    const style = document.createElement('style');
    style.id = 'hide-menu-style';
    style.innerHTML = `body.${cls} ion-menu, body.${cls} .app-menu, body.${cls} .sidebar, body.${cls} .menu { display: none !important; } body.${cls} ion-split-pane { --ion-background-color: transparent; }`;
    document.head.appendChild(style);

    return () => {
      document.body.classList.remove(cls);
      const s = document.getElementById('hide-menu-style');
      if (s) s.remove();
    };
  }, []);

  const MILESTONES = [
    { key: 'created', label: 'Creación', icon: clipboardOutline },
    { key: 'assigned', label: 'Asignación', icon: personOutline },
    { key: 'started', label: 'Ejecución', icon: constructOutline },
    { key: 'under_review', label: 'Revisión', icon: searchOutline },
    { key: 'approved', label: 'Aprobación', icon: checkmarkCircleOutline }
  ];

  const completedAt = (msKey: string) => {
    if (!wo) return null;
    if (Array.isArray(wo.history)) {
      const h = wo.history.find((x: any) => String(x.to).toLowerCase() === String(msKey).toLowerCase() || String(x.to).toLowerCase().includes(msKey));
      if (h && h.at) return h.at;
    }
    if (msKey === 'created') return wo.createdAt || wo.dates?.created;
    if (msKey === 'assigned') return wo.dates?.assignedAt;
    if (msKey === 'started') return wo.history && wo.history.find((x: any) => String(x.to).toLowerCase() === 'started')?.at;
    if (msKey === 'under_review') return wo.history && (wo.history.find((x: any) => String(x.to).toLowerCase() === 'under_review')?.at || wo.history.find((x:any)=>String(x.to).toLowerCase()==='submitted')?.at);
    if (msKey === 'approved') return wo.dates?.approvedAt || (wo.history && wo.history.find((x: any) => String(x.to).toLowerCase() === 'approved')?.at);
    return null;
  };

  const buildItems = () => {
    return MILESTONES.map((m) => {
      const at = completedAt(m.key);
      const done = !!at || (String(wo?.state || '').toLowerCase() === m.key);
      const progress = (String(wo?.state || '').toLowerCase() === m.key && (wo?.progress != null)) ? Number(wo.progress) : (done ? 100 : 0);
      return { ...m, at, done, progress };
    });
  };

  const DetailCard: React.FC<{ step: any }> = ({ step }) => (
    <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 10px 30px rgba(2,6,23,0.08)', overflow: 'hidden' }}>
      <div style={{ display: 'flex' }}>
        <div style={{ width: 8, background: '#B3E5FC' }} />
        <div style={{ padding: 20, flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase' }}>Fase {activeStep + 1} de {MILESTONES.length}</div>
              <h2 style={{ margin: '6px 0', fontSize: 24 }}>{step.label}</h2>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ background: '#fff', padding: 8, borderRadius: 10, boxShadow: '0 2px 6px rgba(2,6,23,0.06)' }}>
                <IonIcon icon={step.icon} style={{ fontSize: 20, color: '#0369a1' }} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>Estado actual</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{step.done ? 'Completado' : (step.progress > 0 ? 'En Proceso' : 'Pendiente')}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Descripción general</h4>
              <p style={{ marginTop: 8, color: '#475569' }}>{wo?.templateId ? String(wo.templateId.name || wo.templateId) : 'Pauta asociada'}</p>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Responsable</h4>
              <p style={{ marginTop: 8, color: '#0f172a', fontWeight: 600 }}>{wo?.assigneeId ? (typeof wo.assigneeId === 'object' ? `${wo.assigneeId.firstName || ''} ${wo.assigneeId.lastName || ''}` : wo.assigneeId) : 'Sin asignar'}</p>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <h4 style={{ margin: 0, fontSize: 12, color: '#94a3b8', textTransform: 'uppercase' }}>Detalles / historial</h4>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 14, color: '#475569' }}>{step.at ? new Date(step.at).toLocaleString() : 'Sin registro'}</div>
              <div style={{ marginTop: 8 }}><IonProgressBar value={Math.max(0, Math.min(100, (step.progress || 0))) / 100} /></div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: 'flex', gap: 12 }}>
            <button
              onClick={() => {
                // go to previous enabled
                const prev = items.slice(0, activeStep).map((it, i) => ({ it, i })).reverse().find((x) => x.it.enabled);
                if (prev) setActiveStep(prev.i);
              }}
              style={{ flex: 1, padding: '12px 16px', borderRadius: 14, border: '1px solid #e6eefc', background: '#fff' }}
              disabled={!items.slice(0, activeStep).some((it) => it.enabled)}
            >Anterior</button>
            <button
              onClick={() => {
                const next = items.slice(activeStep + 1).map((it, i) => ({ it, i: i + activeStep + 1 })).find((x) => x.it.enabled);
                if (next) setActiveStep(next.i);
              }}
              style={{
                flex: 2,
                padding: '12px 16px',
                borderRadius: 14,
                border: 'none',
                background: '#B3E5FC',
                fontWeight: 800,
                opacity: items.slice(activeStep + 1).some((it) => it.enabled) ? 1 : 0.6,
                cursor: items.slice(activeStep + 1).some((it) => it.enabled) ? 'pointer' : 'not-allowed'
              }}
              disabled={!items.slice(activeStep + 1).some((it) => it.enabled)}
            >
              {isApproved ? 'Proceso Finalizado' : 'Siguiente Fase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const fullItems = buildItems();

  // determine current milestone key: prefer explicit `wo.state`, otherwise first non-done
  const currentKey = React.useMemo(() => {
    if (!wo) return fullItems[0]?.key;
    const stateKey = String(wo.state || '').toLowerCase();
    if (fullItems.find((f) => f.key === stateKey)) return stateKey;
    const firstNotDone = fullItems.find((f) => !f.done);
    return firstNotDone ? firstNotDone.key : fullItems[fullItems.length - 1]?.key;
  }, [wo, fullItems]);
  // keep all milestones visible but mark enabled only for completed + current
  const items = fullItems.map((f) => ({ ...f, enabled: f.done || f.key === currentKey }));

  // set activeStep to the index of the current milestone within fullItems
  useEffect(() => {
    if (!fullItems || fullItems.length === 0) return;
    const idx = fullItems.findIndex((it) => it.key === currentKey);
    setActiveStep(idx >= 0 ? idx : 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wo]);

  // consider WO approved only if state is 'approved' or approved milestone is done
  const isApproved = Boolean(wo && (String(wo.state || '').toLowerCase() === 'approved' || fullItems.find((f) => f.key === 'approved')?.done));

  // set document title to include OT number and executing company
  useEffect(() => {
    const prev = document.title;
    if (wo) {
      const company = (wo.org && (wo.org.name || wo.org.displayName)) || wo.orgName || wo.company || 'OM Ingeniería';
      document.title = `OT #${wo.orgSeq || ''} - ${company.replace('OM Ingeniería', 'omtecnologia')}`;
    }
    return () => { document.title = prev; };
  }, [wo]);

  return (
    <IonPage>
      <IonContent className="ion-padding">
        {loading && <div style={{ textAlign: 'center' }}><IonSpinner name="crescent" /></div>}
        {error && <div style={{ color: 'var(--ion-color-danger)' }}>{error}</div>}
        {!loading && !error && wo && (
          <div style={{ maxWidth: 980, margin: '0 auto' }}>
            <header style={{ textAlign: 'center', marginBottom: 20 }}>
              <h1 style={{ margin: 0 }}>{`OT #${wo.orgSeq || ''}`}</h1>
              <p style={{ color: '#64748b' }}>Visualización del ciclo de vida de la orden</p>
            </header>

            <div style={{ position: 'relative', marginBottom: 24 }}>
              <div style={{ position: 'absolute', top: '100%', left: 20, right: 20, height: 10, borderRadius: 8, background: '#e6eefc', transform: 'translateY(-50%)' }} />
              <div style={{ display: 'flex', gap: 24, padding: '12px 8px', overflowX: 'auto' }}>
                {items.map((it: any, idx: number) => (
                  <div
                    key={it.key}
                    style={{ minWidth: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: it.enabled ? 'pointer' : 'default', opacity: it.enabled ? 1 : 0.45 }}
                    onClick={() => it.enabled && setActiveStep(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: it.done ? '#0369a1' : '#fff', color: it.done ? '#fff' : '#94a3b8', border: `2px solid ${it.done ? '#0369a1' : '#e6eefc'}` }}>
                        {it.done ? <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: 22 }} /> : <IonIcon icon={it.icon} style={{ fontSize: 22 }} />}
                      </div>
                    </div>
                    <div style={{ marginTop: 8, fontWeight: 700, color: activeStep === idx ? '#0369a1' : '#0f172a' }}>{it.label}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: '#64748b' }}>{it.at ? new Date(it.at).toLocaleDateString() : 'Pendiente'}</div>
                  </div>
                ))}
              </div>
            </div>

            <DetailCard step={items[activeStep]} />
          </div>
        )}

        
      </IonContent>
        <footer style={{ margin: 28, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          <div>Desarrollado por <a href="https://omtecnologia.cl" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>OM Tecnología</a></div>
          <div>Contacto: <a href="mailto:contacto@omtecnologia.cl" style={{ color: '#2563eb' }}>contacto@omtecnologia.cl</a></div>
        </footer>
    </IonPage>
  );
};

export default PublicWorkOrderTimeline;

import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import dashboardApi from '../api/dashboard';
import type { WorkOrder } from '../api/types';

const Dashboard: React.FC = () => {
  const [createdCount, setCreatedCount] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [activeUsersCount, setActiveUsersCount] = useState<number | null>(null);
  const [weeklyCounts, setWeeklyCounts] = useState<number[]>([]);
  const [branchesData, setBranchesData] = useState<any[] | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const d: any = await dashboardApi.getCounts();
        if (!mounted) return;
        setCreatedCount(d.createdTotal ?? null);
        setPendingCount(d.pendingTotal ?? null);
        setActiveUsersCount(d.activeUsers ?? null);
        if (Array.isArray(d.branches) && d.branches.length > 0) {
          setBranchesData(d.branches || []);
        } else {
          setBranchesData(null);
          setWeeklyCounts(Array.isArray(d.weeklyCounts) ? d.weeklyCounts : []);
        }
      } catch (e) {
        console.error('dashboard load err', e);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <IonPage>
      <IonContent className="main-wrapper ion-padding">
        <div className="page-header">
          <div className="page-title">
            <h1>Dashboard</h1>
            <p>Resumen de actividad y KPIs clave</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 24 }}>
          <div className="table-container">
            <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>Ordenes de trabajo creadas</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{createdCount === null ? '—' : createdCount}</div>
            <div style={{ fontSize: 12, color: '#FB8C00' }} id="created-delta"><i className="fas fa-arrow-up"></i> +0% vs mes pasado</div>
          </div>
          <div className="table-container">
            <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>Órdenes pendientes</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{pendingCount === null ? '—' : pendingCount}</div>
            <div style={{ fontSize: 12, color: pendingCount && pendingCount > 0 ? '#D32F2F' : 'var(--text-secondary)' }}>{pendingCount && pendingCount > 0 ? 'Requieren atención' : 'Sin pendientes críticos'}</div>
          </div>
          <div className="table-container">
            <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>Usuarios Activos</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{activeUsersCount === null ? '—' : activeUsersCount}</div>
            <div style={{ fontSize: 12, color: 'var(--success-text)' }}>Enrolados en el sistema</div>
          </div>
        </div>

        <div className="table-container">
          <h3 style={{ marginBottom: 12 }}>Actividad Semanal</h3>
          {branchesData ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {branchesData.map((b: any) => (
                <div key={b._id} style={{ padding: 12, borderRadius: 6, border: '1px solid #eee' }}>
                  <div style={{ fontWeight: 700 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Creadas: {b.createdTotal} · Pendientes: {b.pendingTotal}</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: 120, gap: 6, marginTop: 8 }}>
                    {(b.weeklyCounts || [0,0,0,0,0,0,0]).map((v: number, idx: number) => {
                      const max = Math.max(1, ...(b.weeklyCounts || [0,0,0,0,0,0,0]));
                      const heightPct = Math.round((v / max) * 100);
                      const bg = v === Math.max(...(b.weeklyCounts || [0])) ? 'var(--primary-dark)' : 'var(--primary-accent)';
                      return <div key={idx} style={{ flex: 1, width: '100%', background: bg, height: `${Math.max(6, heightPct)}%`, borderRadius: 4 }} />;
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 12, paddingBottom: 10, borderBottom: '1px solid #eee' }}>
              {(weeklyCounts.length ? weeklyCounts : [0,0,0,0,0,0,0]).map((v, idx) => {
                const max = Math.max(1, ...(weeklyCounts.length ? weeklyCounts : [0,0,0,0,0,0,0]));
                const heightPct = Math.round((v / max) * 100);
                const bg = v === Math.max(...(weeklyCounts.length ? weeklyCounts : [0])) ? 'var(--primary-dark)' : 'var(--primary-accent)';
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', background: bg, height: `${Math.max(6, heightPct)}%`, borderRadius: 4, transition: 'height 200ms' }}></div>
                    <div style={{ fontSize: 12, marginTop: 8 }}>{v}</div>
                  </div>
                );
              })}
            </div>
          )}
          {!branchesData && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              {Array.from({ length: 7 }).map((_, i) => {
                const today = new Date();
                const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i));
                const label = d.toLocaleDateString(undefined, { weekday: 'short' });
                return <div key={i} style={{ flex: 1, textAlign: 'center' }}>{label}</div>;
              })}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;

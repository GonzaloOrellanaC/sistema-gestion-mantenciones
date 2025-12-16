import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';

const Dashboard: React.FC = () => {
  return (
    <IonPage>
      <IonContent className="main-wrapper">
        <div className="page-header">
          <div className="page-title">
            <h1>Dashboard</h1>
            <p>Resumen de actividad y KPIs clave</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 24 }}>
          <div className="table-container">
            <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>Formularios Enviados</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>1,240</div>
            <div style={{ fontSize: 12, color: 'var(--success-text)' }}><i className="fas fa-arrow-up"></i> +12% vs mes pasado</div>
          </div>
          <div className="table-container">
            <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>Órdenes Pendientes</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>45</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Requieren atención</div>
          </div>
          <div className="table-container">
            <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>Usuarios Activos</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>28</div>
            <div style={{ fontSize: 12, color: 'var(--success-text)' }}>Todos sincronizados</div>
          </div>
        </div>

        <div className="table-container">
          <h3 style={{ marginBottom: 12 }}>Actividad Semanal</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 20, paddingBottom: 10, borderBottom: '1px solid #eee' }}>
            <div style={{ flex: 1, background: 'var(--primary-light)', height: '40%', borderRadius: 4 }}></div>
            <div style={{ flex: 1, background: 'var(--primary-accent)', height: '65%', borderRadius: 4 }}></div>
            <div style={{ flex: 1, background: 'var(--primary-dark)', height: '80%', borderRadius: 4 }}></div>
            <div style={{ flex: 1, background: 'var(--primary-accent)', height: '50%', borderRadius: 4 }}></div>
            <div style={{ flex: 1, background: 'var(--primary-light)', height: '90%', borderRadius: 4 }}></div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;

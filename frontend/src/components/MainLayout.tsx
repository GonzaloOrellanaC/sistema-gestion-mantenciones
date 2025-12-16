import React from 'react';
import { IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, IonRouterOutlet, useIonRouter } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { people, fileTrayFull, calendar, logOut, documentLock, documentLockOutline, barChartOutline, peopleOutline, fileTrayFullOutline, calendarOutline } from 'ionicons/icons';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, token } = useAuth();
  const router = useIonRouter()

  // If not authenticated, render children directly (no menu)
  if (!token) return <>{children}</>;

  return (
    <IonSplitPane when="(min-width: 768px)" contentId="main">
      <IonMenu contentId="main" type="reveal" style={{ width: 260 }}>
        <IonContent>
          <div style={{ padding: 16 }}>
            <div className="logo-area" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/assets/sgm-logo.svg" alt="SGM" style={{ height: 36 }} />
            </div>

            <IonList>
              <IonItem button onClick={() => {router.push('/dashboard', 'root')}}>
                <IonIcon icon={barChartOutline} slot="start" />
                <IonLabel>Dashboard</IonLabel>
              </IonItem>
              <IonItem button onClick={() => {router.push('/users', 'root')}}>
                <IonIcon icon={peopleOutline} slot="start" />
                <IonLabel>Usuarios</IonLabel>
              </IonItem>
              <IonItem button onClick={() => {router.push('/roles', 'root')}}>
                <IonIcon icon={documentLockOutline} slot="start" />
                <IonLabel>Roles</IonLabel>
              </IonItem>
              <IonItem button onClick={() => {router.push('/work-orders', 'root')}}>
                <IonIcon icon={calendarOutline} slot="start" />
                <IonLabel>Órdenes</IonLabel>
              </IonItem>
              <IonItem button onClick={() => {router.push('/templates', 'root')}}>
                <IonIcon icon={fileTrayFullOutline} slot="start" />
                <IonLabel>Pautas</IonLabel>
              </IonItem>
            </IonList>

            <div style={{ borderTop: '1px solid #E1F5FE', paddingTop: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 20, background: 'var(--primary-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  {user?.firstName?.[0] ?? 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{user?.firstName} {user?.lastName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user ? 'Usuario' : ''}</div>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { logout(); router.push('/auth/login'); }}>
                <IonIcon icon={logOut} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </IonContent>
      </IonMenu>

      <IonRouterOutlet id="main" style={{ minHeight: '100vh' }}>
        {children}
      </IonRouterOutlet>
    </IonSplitPane>
  );
};

export default MainLayout;

import React, { useState, useEffect } from 'react';
import { IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, IonRouterOutlet, useIonRouter, IonModal, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { people, fileTrayFull, calendar, logOut, documentLock, documentLockOutline, barChartOutline, barChart, peopleOutline, fileTrayFullOutline, calendarOutline, desktopOutline, desktop, storefrontOutline, storefront, businessOutline, business, constructOutline, construct, beakerOutline, beaker } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, token } = useAuth();
  const history = useHistory();
  const location = useLocation();

  const menuInitial = [
    { label: 'Dashboard', path: '/dashboard', iconOutline: barChartOutline, iconFilled: barChart, active: false },
    { label: 'Usuarios', path: '/users', iconOutline: peopleOutline, iconFilled: people, active: false },
    { label: 'Roles', path: '/roles', iconOutline: documentLockOutline, iconFilled: documentLock, active: false },
    { label: 'Órdenes', path: '/work-orders', iconOutline: calendarOutline, iconFilled: calendar, active: false },
    { label: 'Pautas', path: '/templates', iconOutline: fileTrayFullOutline, iconFilled: fileTrayFull, active: false },
    { label: 'Insumos', path: '/supplies', iconOutline: beakerOutline, iconFilled: beaker, active: false },
    { label: 'Repuestos', path: '/parts', iconOutline: constructOutline, iconFilled: construct, active: false },
    { label: 'Activos', path: '/assets', iconOutline: desktopOutline, iconFilled: desktop, active: false },
    { label: 'Organización', path: '/organization', iconOutline: businessOutline, iconFilled: business, active: false },
    { label: 'Sucursales', path: '/branches', iconOutline: storefrontOutline, iconFilled: storefront, active: false },
  ] as Array<{ label: string; path: string; iconOutline: any; iconFilled: any; active: boolean }>;

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [showTrialModal, setShowTrialModal] = useState(false);

  useEffect(() => {
    if (location.pathname) {
      console.log('Location changed:', location.pathname);
      setMenuItems(menuInitial.map(item => {
        if (location.pathname === item.path || location.pathname.includes(item.path)) {
          return { ...item, active: true };
        }
        return { ...item, active: false };
      }));
      /* setMenuItems(prev => prev.map(it => ({ ...it, active: location.pathname.includes(it.path) }))); */
    }
  }, [location.pathname]);

  useEffect(() => {
    console.log({menuItems})
  }, [menuItems])

  // If not authenticated, render children directly (no menu)
  if (!token) return <>{children}</>;

  // compute trial info
  const org = (user as any)?.org;
  const trialEnds = org?.trialEndsAt ? new Date(org.trialEndsAt) : null;
  const isPaid = !!org?.isPaid;
  const now = new Date();
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <IonSplitPane when="(min-width: 768px)" contentId="main">
      <IonMenu contentId="main" type="reveal" style={{ width: 260 }}>
        <IonContent>
          <div style={{ padding: 16 }}>
            <div className="logo-area" style={{ gap: 10, textAlign: 'center', marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/assets/sgm-logo.svg" alt="SGM" style={{ height: 36 }} />
              <div>
                {/* <div style={{ fontWeight: 700, fontSize: 14 }}>SGM</div> */}
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {(user as any)?.org?.name ?? ''}
                </div>
              </div>
            </div>

            {/* Trial banner for org admins */}
            {user?.isAdmin && !isPaid && trialEnds && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ background: '#FFF8E1', border: '1px solid #FFECB3', padding: 10, borderRadius: 8, cursor: 'pointer' }} onClick={() => setShowTrialModal(true)}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Periodo de prueba activo</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{daysLeft} días restantes — Pulse para ver detalles</div>
                </div>
              </div>
            )}

            <div style={{ height: user?.isAdmin && !isPaid && trialEnds ? '60vh' : '100%', overflowY: 'auto', marginBottom: 12 }}>
              <IonList>
                {menuItems.map((it) => {
                  const iconToUse = it.active ? it.iconFilled : it.iconOutline;
                  const itemStyle = it.active ? { background: 'rgba(0,0,0,0.03)', borderRadius: 6 } : undefined;
                  return (
                    <IonItem style={{...itemStyle, '--background': it.active ? '#E3F2FD' : undefined}} key={it.path} button onClick={() => { history.push(it.path); setMenuItems(menuInitial.map(item => {
                      if (item.path === it.path) {
                        return { ...item, active: true };
                      } else {
                        return { ...item, active: false };
                      }
                    }))}}>
                      <IonIcon style={{ marginRight: 10 }} color={it.active ? 'primary' : undefined} icon={iconToUse} slot="start" />
                      <IonLabel color={it.active ? 'primary' : undefined}>{it.label}</IonLabel>
                    </IonItem>
                  );
                })}
              </IonList>
            </div>

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
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { logout(); history.push('/auth/login'); }}>
                <IonIcon style={{marginRight: 10}} icon={logOut} /> Cerrar Sesión
              </button>
            </div>
          </div>
        </IonContent>
      </IonMenu>

      <IonModal isOpen={showTrialModal} onDidDismiss={() => setShowTrialModal(false)}>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Periodo de prueba</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div style={{ marginBottom: 8 }}>
              Estado: <strong>{isPaid ? 'Pagado' : 'En prueba'}</strong>
            </div>
            {!isPaid && trialEnds && (
              <div style={{ marginBottom: 8 }}>
                Fecha de renovación: <strong>{trialEnds.toLocaleDateString()}</strong>
              </div>
            )}
            {!isPaid && daysLeft !== null && (
              <div style={{ marginBottom: 12 }}>
                Días restantes de prueba: <strong>{daysLeft}</strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <IonButton onClick={() => setShowTrialModal(false)}>Cerrar</IonButton>
            </div>
          </IonCardContent>
        </IonCard>
      </IonModal>

      <IonRouterOutlet id="main" style={{ minHeight: '100vh' }}>
        {children}
      </IonRouterOutlet>
    </IonSplitPane>
  );
};

export default MainLayout;

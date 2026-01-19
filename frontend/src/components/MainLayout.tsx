import React, { useState, useEffect, useMemo } from 'react';
import { IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, IonRouterOutlet, useIonRouter, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonPopover, IonButtons } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { people, fileTrayFull, calendar, logOut, documentLock, documentLockOutline, barChartOutline, barChart, peopleOutline, fileTrayFullOutline, calendarOutline, desktopOutline, desktop, storefrontOutline, storefront, businessOutline, business, constructOutline, construct, beakerOutline, beaker, documentsOutline, documents, ellipsisVerticalOutline, settingsOutline, cubeOutline, cube } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import TrialModal from './Modals/TrialModal';
import '../i18n';
import { useTranslation } from 'react-i18next';
import { checkmark } from 'ionicons/icons';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, token } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const menuInitial = useMemo(() => [
    { key: 'nav.dashboard', path: '/dashboard', iconOutline: barChartOutline, iconFilled: barChart, active: false, permissionKey: 'verTablero' },
    { key: 'nav.users', path: '/users', iconOutline: peopleOutline, iconFilled: people, active: false, permissionKey: 'verUsuarios' },
    { key: 'nav.roles', path: '/roles', iconOutline: documentLockOutline, iconFilled: documentLock, active: false, permissionKey: 'verRoles' },
    { key: 'nav.workOrders', path: '/work-orders', iconOutline: documentsOutline, iconFilled: documents, active: false, permissionKey: 'verOT' },
    { key: 'nav.calendar', path: '/calendar', iconOutline: calendarOutline, iconFilled: calendar, active: false },
    { key: 'nav.templates', path: '/templates', iconOutline: fileTrayFullOutline, iconFilled: fileTrayFull, active: false, permissionKey: 'verPautas' },
    { key: 'nav.logistics', path: '/logistics', iconOutline: cubeOutline, iconFilled: cube, active: false, permissionKey: '_logistics_any' },
    { key: 'nav.assets', path: '/assets', iconOutline: desktopOutline, iconFilled: desktop, active: false, permissionKey: 'verActivos' },
    { key: 'nav.organization', path: '/organization', iconOutline: businessOutline, iconFilled: business, active: false, permissionKey: 'verOrganization' },
    { key: 'nav.branches', path: '/branches', iconOutline: storefrontOutline, iconFilled: storefront, active: false, permissionKey: 'verSucursales' },
  ], [i18n.language, t]) as Array<{ key: string; path: string; iconOutline: any; iconFilled: any; active: boolean }>;

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showLangPopover, setShowLangPopover] = useState(false);
  const [langPopoverEvent, setLangPopoverEvent] = useState<any | undefined>(undefined);

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
  }, [location.pathname, i18n.language]);

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

  const perms = (user as any)?.role?.permissions || (user as any)?.roleId?.permissions || {};
  const hasPermission = (key?: string) => {
    if (!key) return true;
    if ((user as any)?.isSuperAdmin) return true;
    // special composite keys
    if (key === '_logistics_any') {
      const keys = ['verRepuestos', 'verLotes', 'verInsumos'];
      return keys.some(k => Object.prototype.hasOwnProperty.call(perms, k) && !!perms[k]);
    }
    if (Object.prototype.hasOwnProperty.call(perms, key)) return !!perms[key];
    // If permission key not present in the role, deny access by default
    return false;
  };

  return (
    <IonSplitPane when="(min-width: 768px)" contentId="main">
      <IonMenu contentId="main" type="reveal" style={{ width: 260 }}>
        <IonContent style={{position: 'relative'}}>
          <IonButtons style={{ position: 'absolute', top: 8, right: 8 }}>
            <IonButton fill={'clear'} onClick={(e) => { setLangPopoverEvent(e.nativeEvent); setShowLangPopover(true); }}>
              <IonIcon icon={ellipsisVerticalOutline} slot='icon-only' />
            </IonButton>
            <IonButton fill={'clear'} onClick={() => { history.push('/settings'); }}>
              <IonIcon icon={settingsOutline} slot='icon-only' />
            </IonButton>
          </IonButtons>
          <IonPopover isOpen={showLangPopover} event={langPopoverEvent} onDidDismiss={() => setShowLangPopover(false)}>
            <div style={{ padding: 12, minWidth: 200 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{t('common.languages.title')}</div>
              <IonList>
                <IonItem button onClick={() => { i18n.changeLanguage('es'); try { localStorage.setItem('appLanguage', 'es'); } catch{} setShowLangPopover(false); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span aria-hidden style={{ fontSize: 18 }}>🇪🇸</span>
                    <IonLabel>{t('common.languages.spanish')}</IonLabel>
                  </div>
                  {i18n.language && i18n.language.startsWith('es') && <IonIcon icon={checkmark} slot="end" />}
                </IonItem>
                <IonItem button onClick={() => { i18n.changeLanguage('en'); try { localStorage.setItem('appLanguage', 'en'); } catch{} setShowLangPopover(false); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span aria-hidden style={{ fontSize: 18 }}>🇺🇸</span>
                    <IonLabel>{t('common.languages.english')}</IonLabel>
                  </div>
                  {i18n.language && i18n.language.startsWith('en') && <IonIcon icon={checkmark} slot="end" />}
                </IonItem>
              </IonList>
            </div>
          </IonPopover>
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
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t('main.trialActive')}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('main.trialDaysRemaining', { days: daysLeft })}</div>
                </div>
              </div>
            )}

            <div style={{ height: user?.isAdmin && !isPaid && trialEnds ? '60vh' : '100%', overflowY: 'auto', marginBottom: 12 }}>
              <IonList>
                {menuItems.filter(it => hasPermission(it.permissionKey)).map((it) => {
                  const iconToUse = it.active ? it.iconFilled : it.iconOutline;
                  const isDisabled = !!it.disabled || !hasPermission(it.permissionKey);
                  const itemStyle = it.active ? { background: 'rgba(0,0,0,0.03)', borderRadius: 6 } : undefined;
                  return (
                    <IonItem
                      style={{...itemStyle, '--background': it.active ? '#E3F2FD' : undefined, opacity: isDisabled ? 0.5 : undefined}}
                      key={it.path}
                      button={!isDisabled}
                      aria-disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        history.push(it.path);
                        setMenuItems(menuInitial.map(item => {
                          if (item.path === it.path) {
                            return { ...item, active: true };
                          } else {
                            return { ...item, active: false };
                          }
                        }))
                      }}>
                      <IonIcon style={{ marginRight: 10 }} color={it.active ? 'primary' : undefined} icon={iconToUse} slot="start" />
                      <IonLabel color={it.active ? 'primary' : undefined}>{t(it.key)}</IonLabel>
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
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user ? t('common.userLabel') : ''}</div>
                </div>
              </div>
                <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                  <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => { history.push('/profile/edit'); }}>
                    <IonIcon style={{marginRight: 10}} icon={people} /> {t('main.editProfile')}
                  </button>
                  <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => { logout(); history.push('/auth/login'); }}>
                    <IonIcon style={{marginRight: 10}} icon={logOut} /> {t('main.logout')}
                  </button>
                </div>
            </div>
          </div>
        </IonContent>
      </IonMenu>

      <TrialModal isOpen={showTrialModal} onClose={() => setShowTrialModal(false)} isPaid={isPaid} trialEnds={trialEnds} daysLeft={daysLeft} />

      <IonRouterOutlet id="main" style={{ minHeight: '100vh' }}>
        {children}
      </IonRouterOutlet>
    </IonSplitPane>
  );
};

export default MainLayout;

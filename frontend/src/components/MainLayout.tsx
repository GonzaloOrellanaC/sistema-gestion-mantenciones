import React, { useState, useEffect, useMemo } from 'react';
import { IonSplitPane, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonIcon, IonLabel, IonRouterOutlet, useIonRouter, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonPopover, IonButtons, IonModal, IonFooter } from '@ionic/react';
import { useAuth } from '../context/AuthContext';
import { people, fileTrayFull, calendar, logOut, documentLock, documentLockOutline, barChartOutline, barChart, peopleOutline, fileTrayFullOutline, calendarOutline, desktopOutline, desktop, storefrontOutline, storefront, businessOutline, business, constructOutline, construct, beakerOutline, beaker, documentsOutline, documents, ellipsisVerticalOutline, settingsOutline, cubeOutline, cube } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import TrialModal from './Modals/TrialModal';
import { informationCircleOutline } from 'ionicons/icons';
import LanguageToggle from './Widgets/LanguageToggle.widget';
import '../i18n';
import { useTranslation } from 'react-i18next';
import { checkmark } from 'ionicons/icons';
import PlanLimitsModal from './PlanLimitsModal';
import planLimits from './planLimits.json';
import { hasPermission } from '../utils/permisions';
import AppButton from './Widgets/Button.widget';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, token, permissions } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const menuInitial = useMemo(() => [
    { key: 'main.dashboard', path: '/dashboard', iconOutline: barChartOutline, iconFilled: barChart, active: false, permissionKey: 'verTablero' },
    { key: 'main.users', path: '/users', iconOutline: peopleOutline, iconFilled: people, active: false, permissionKey: 'verUsuarios' },
    { key: 'main.roles', path: '/roles', iconOutline: documentLockOutline, iconFilled: documentLock, active: false, permissionKey: 'verRoles' },
    { key: 'main.workOrders', path: '/work-orders', iconOutline: documentsOutline, iconFilled: documents, active: false, permissionKey: 'verOT' },
    { key: 'main.calendar', path: '/calendar', iconOutline: calendarOutline, iconFilled: calendar, active: false },
    { key: 'main.templates', path: '/templates', iconOutline: fileTrayFullOutline, iconFilled: fileTrayFull, active: false, permissionKey: 'verPautas' },
    { key: 'main.logistics', path: '/logistics', iconOutline: cubeOutline, iconFilled: cube, active: false, permissionKey: 'verLogistica' },
    { key: 'main.assets', path: '/assets', iconOutline: desktopOutline, iconFilled: desktop, active: false, permissionKey: 'verActivos' },
    { key: 'main.organization', path: '/organization', iconOutline: businessOutline, iconFilled: business, active: false, permissionKey: 'verOrganization' },
    { key: 'main.branches', path: '/branches', iconOutline: storefrontOutline, iconFilled: storefront, active: false, permissionKey: 'verSucursales' },
  ], [i18n.language]) as Array<{ key: string; path: string; iconOutline: any; iconFilled: any; active: boolean }>;

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showLangPopover, setShowLangPopover] = useState(false);
  const [langPopoverEvent, setLangPopoverEvent] = useState<any | undefined>(undefined);

  const twemojiSrc = (emoji: string) => {
    const codePoints = Array.from(emoji).map(c => c.codePointAt(0)!.toString(16)).join('-');
    return `https://twemoji.maxcdn.com/v/latest/72x72/${codePoints}.png`;
  };

  useEffect(() => {
    if (location.pathname) {
      console.log('Location changed:', location.pathname);
      setMenuItems(menuInitial.map(item => ({ ...item, active: location.pathname === item.path || location.pathname.includes(item.path) })));
    }
  }, [location.pathname, menuInitial]);

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
        <IonContent style={{position: 'relative'}}>
          <IonButtons style={{ position: 'absolute', top: 8, right: 8 }}>
            <LanguageToggle />
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
                    <span aria-hidden style={{ fontSize: 18 }}>🇨🇱</span>
                    <IonLabel>{t('common.languages.spanish') || 'Español'}</IonLabel>
                  </div>
                  {i18n.language && i18n.language.startsWith('es') && <IonIcon icon={checkmark} slot="end" />}
                </IonItem>
                <IonItem button onClick={() => { i18n.changeLanguage('en'); try { localStorage.setItem('appLanguage', 'en'); } catch{} setShowLangPopover(false); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span aria-hidden style={{ fontSize: 18 }}>🇺🇸</span>
                    <IonLabel>{t('common.languages.english') || 'English'}</IonLabel>
                  </div>
                  {i18n.language && i18n.language.startsWith('en') && <IonIcon icon={checkmark} slot="end" />}
                </IonItem>
              </IonList>
            </div>
          </IonPopover>
          <div style={{ padding: 16 }}>
            <div className="logo-area" style={{ /* gap: 10, */ textAlign: 'left', marginBottom: 24, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
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
                {menuItems.filter(it => hasPermission(permissions, it.permissionKey)).map((it) => {
                  const iconToUse = it.active ? it.iconFilled : it.iconOutline;
                  const isDisabled = !!it.disabled || !hasPermission(permissions, it.permissionKey);
                  const itemStyle = it.active ? { background: 'rgba(0,0,0,0.03)', borderRadius: 6 } : undefined;
                  const label = t(it.key);
                  if (label === it.key) {
                    // log missing translations to help debugging (will appear in browser console)
                    // eslint-disable-next-line no-console
                    console.warn('Missing translation for', it.key);
                  }
                  const displayLabel = (label && label !== it.key) ? label : (it.key.split('.')?.pop() || it.key);
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
                      <IonLabel color={it.active ? 'primary' : undefined}>{displayLabel}</IonLabel>
                    </IonItem>
                  );
                })}
              </IonList>
            </div>

            <div style={{ borderTop: '1px solid #E1F5FE', paddingTop: 12, marginTop: 12 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 20, background: 'var(--primary-accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    {user?.firstName?.[0] ?? 'U'}
                  </div>
                  <div>
                      <div style={{ fontWeight: 600 }}>{user?.firstName} {user?.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user ? t('common.userLabel') : ''}</div>
                  </div>
                </div>
                <IonButton fill="clear" size="small" style={{ position: 'absolute', top: 0, right: 0, padding: 6 }} onClick={() => setShowPlanModal(true)}>
                  <IonIcon icon={informationCircleOutline} />
                </IonButton>
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

      <PlanLimitsModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        limits={(planLimits as any)[i18n.language] || planLimits['es']}
      />

      <IonRouterOutlet id="main" style={{ minHeight: '100vh' }}>
        {children}
      </IonRouterOutlet>
    </IonSplitPane>
  );
};

export default MainLayout;

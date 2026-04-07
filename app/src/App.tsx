import React, { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonIcon, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, IonBadge, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Login from './pages/Login';
import WorkOrdersList from './pages/WorkOrdersList';
import WorkOrderDetail from './pages/WorkOrderDetail';
import WorkOrderEdit from './pages/WorkOrderEdit';
import TemplatesList from './pages/TemplatesList';
import Profile from './pages/Profile';
import EditarPerfil from './pages/EditarPerfil';
import Settings from './pages/Settings';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import 'swiper/css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import { listOutline, personOutline, notificationsOutline, layersOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import NotificationToast from './components/NotificationToast';
import MyAssignations from './pages/MyAssignations';
import Notifications from './pages/Notifications';
import { WorkOrderProvider } from './context/WorkOrderContext';
import Assets from './pages/Assets';
import ActiveForm from './pages/AssetForm';

setupIonicReact();

function HomeRedirect() {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? <Redirect to="/my-assignations" /> : <Redirect to="/login" />;
}

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <AuthProvider>
        <WorkOrderProvider>
          <NotificationToast />
          <IonTabs>
            <IonRouterOutlet>
            <Route exact path="/" render={() => <HomeRedirect />} />
            <Route exact path="/login">
              <Login />
            </Route>
            <Route exact path="/my-assignations">
              <ProtectedRoute>
                <MyAssignations />
              </ProtectedRoute>
            </Route>
            <Route exact path="/work-orders">
              <ProtectedRoute>
                <WorkOrdersList />
              </ProtectedRoute>
            </Route>
            <Route exact path="/work-orders/:id" render={(props) => (
              <ProtectedRoute>
                <WorkOrderDetail {...props} />
              </ProtectedRoute>
            )} />
            <Route exact path="/work-orders/:id/edit" >
              <ProtectedRoute>
                <WorkOrderEdit />
              </ProtectedRoute>
            </Route>
            <Route exact path="/templates">
              <ProtectedRoute>
                <TemplatesList />
              </ProtectedRoute>
            </Route>
            <Route exact path="/profile">
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </Route>
            <Route exact path="/notifications">
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            </Route>
            <Route exact path="/settings">
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            </Route>
            <Route exact path="/assets">
              <ProtectedRoute>
                <Assets />
              </ProtectedRoute>
            </Route>
            <Route exact path="/assets/new">
              <ProtectedRoute>
                <ActiveForm />
              </ProtectedRoute>
            </Route>
            <Route exact path="/assets/:id/edit" >
              <ProtectedRoute>
                <ActiveForm />
              </ProtectedRoute>
            </Route>
            <Route exact path="/editar-perfil">
              <ProtectedRoute>
                <EditarPerfil />
              </ProtectedRoute>
            </Route>
            </IonRouterOutlet>
            <BottomTabs />
          </IonTabs>
        </WorkOrderProvider>
      </AuthProvider>
    </IonReactRouter>
  </IonApp>
);

export default App;

const BottomTabs = () => {
  const { token, unreadCount, user } = useAuth() as any;
  if (!token) return null;
  const { t } = useTranslation();
  const permissions = (user && user.role && user.role.permissions) || {};
  const canSeeAssets = !!(permissions.verActivos || permissions.crearActivos || permissions.editarActivos);
  return (
    <IonTabBar slot="bottom">
      <IonTabButton tab='my-assignations' href='/my-assignations'>
        <IonIcon icon={listOutline} />
        <span style={{ fontSize: 12 }}>{t('nav.orders')}</span>
      </IonTabButton>
      <IonTabButton tab='notifications' href='/notifications'>
        <IonIcon icon={notificationsOutline} />
        <span style={{ fontSize: 12 }}>{t('nav.notifications')}</span>
        {unreadCount > 0 && <div style={{ position: 'absolute', right: 8, top: 6 }}><IonBadge color='danger'>{unreadCount}</IonBadge></div>}
      </IonTabButton>
      {canSeeAssets && (
        <IonTabButton tab='assets' href='/assets'>
          <IonIcon icon={layersOutline} />
          <span style={{ fontSize: 12 }}>{t('nav.assets') || 'Assets'}</span>
        </IonTabButton>
      )}
      <IonTabButton tab='profile' href='/profile'>
        <IonIcon icon={personOutline} />
        <span style={{ fontSize: 12 }}>{t('nav.profile')}</span>
      </IonTabButton>
    </IonTabBar>
  )
}

const AppContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  return (
    <div className='safe-area'>
      {children}
    </div>
  );
};

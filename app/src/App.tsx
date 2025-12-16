import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonIcon, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Login from './pages/Login';
import WorkOrdersList from './pages/WorkOrdersList';
import WorkOrderDetail from './pages/WorkOrderDetail';
import WorkOrderEdit from './pages/WorkOrderEdit';
import TemplatesList from './pages/TemplatesList';
import Profile from './pages/Profile';
import EditarPerfil from './pages/EditarPerfil';
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
import { listOutline, personOutline } from 'ionicons/icons';
import MyAssignations from './pages/MyAssignations';
import { WorkOrderProvider } from './context/WorkOrderContext';

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
  const { token } = useAuth();
  if (!token) return null;
  return (
    <IonTabBar slot="bottom">
      <IonTabButton tab='my-assignations' href='/my-assignations'>
        <IonIcon icon={listOutline} />
        <span style={{ fontSize: 12 }}>Órdenes</span>
      </IonTabButton>
      <IonTabButton tab='profile' href='/profile'>
        <IonIcon icon={personOutline} />
        <span style={{ fontSize: 12 }}>Perfil</span>
      </IonTabButton>
    </IonTabBar>
  )
}

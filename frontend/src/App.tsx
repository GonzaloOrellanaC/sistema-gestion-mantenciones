import React from 'react';
import { Redirect, Route, useLocation } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayoutProvider } from './context/MainLayoutContext';
import { StylingProvider } from './context/StylingContext';
import WorkOrderAssign from './pages/WorkOrderAssign';
import ProtectedRoute from './components/ProtectedRoute';
import WorkOrdersDetail from './pages/WorkOrdersDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import FilesUpload from './pages/FilesUpload';
import RolesList from './pages/RolesList';
import TemplatesList from './pages/TemplatesList';
import TemplatesBuilder from './pages/TemplatesBuilder';
import TemplatePreview from './pages/TemplatePreview';
import UsersList from './pages/UsersList';
import UsersCreate from './pages/UsersCreate';
import BranchesList from './pages/BranchesList';
import BranchCreate from './pages/BranchCreate';
import Organization from './pages/Organization';
// Reporting page removed from routes for now.
import WorkOrdersList from './pages/WorkOrdersList';
import WorkOrdersCreate from './pages/WorkOrdersCreate';
import WorkOrdersReview from './pages/WorkOrdersReview';
import RoleCreate from './pages/RoleCreate';
import AssetsList from './pages/AssetsList';
import AssetsBulkUpload from './pages/AssetsBulkUpload';
import AssetCreate from './pages/AssetCreate';
import AssetDetail from './pages/AssetDetail';
import ProfileEdit from './pages/ProfileEdit';
import Supplies from './pages/Supplies';
import SupplyEdit from './pages/SupplyEdit';
import Parts from './pages/Parts';
import PartsEdit from './pages/PartsEdit';
import LotEdit from './pages/LotEdit';
import Logistics from './pages/Logistics';
import Lots from './pages/Lots';
import WarehouseAdmin from './pages/WarehouseAdmin';
import WorkOrdersCalendar from './pages/WorkOrdersCalendar';
import Settings from './pages/Settings';
import PublicWorkOrderTimeline from './pages/PublicWorkOrderTimeline';

import './theme/components.scss'

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

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
/* import '@ionic/react/css/palettes/dark.system.css'; */
import 'swiper/css';
import 'swiper/css/pagination';

/* Theme variables */
import './theme/variables.css';
import './styles/template.css';
import { ConfirmEmail } from './pages/ConfirmEmail';
import { hasPermission, Permission } from './utils/permisions';

setupIonicReact();

const Init = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <AuthProvider>
          <StylingProvider>
            <MainLayoutProvider>
              <App />
            </MainLayoutProvider>
          </StylingProvider>
        </AuthProvider>
      </IonReactRouter>
    </IonApp>
  )
}

const App: React.FC = () => {
  const location = useLocation()
  const { permissions, token, loading } = useAuth();

  const priorityRoutes: Array<{ path: string; key: Permission }> = [
    { path: '/dashboard', key: 'verTablero' },
    { path: '/work-orders', key: 'verOT' },
    { path: '/assets', key: 'verActivos' },
    { path: '/templates', key: 'verPautas' },
    { path: '/users', key: 'verUsuarios' },
    { path: '/roles', key: 'verRoles' },
    { path: '/organization', key: 'verOrganization' },
    { path: '/branches', key: 'verSucursales' },
  ];

  const firstAccessible = () => {
    for (const r of priorityRoutes) {
      if (hasPermission( permissions, r.key)) return r.path;
    }
    return '/auth/login';
  };

  return (
    <IonRouterOutlet>
      <Route exact path="/auth/login" component={Login}/>
      <Route exact path="/auth/register" component={Register}/>
      <Route exact path="/auth/forgot" component={ForgotPassword}/>
      <Route exact path="/auth/reset/:token" component={ChangePassword}/>
      <Route exact path="/auth/confirm-email/:token" component={ConfirmEmail}/>
      {/* <Route exact path="/dashboard" render={() => {
        if (loading) return null;
        if (!token) return <Redirect to="/auth/login" />;
        if (hasPermission( permissions, 'verTablero')) return <Dashboard />;
        return <Redirect to={firstAccessible()} />;
      }} /> */}
      <Route exact path="/dashboard" component={Dashboard}/>
      <Route exact path="/files/upload" component={FilesUpload}/>
      <ProtectedRoute exact path="/roles" component={RolesList} permissionKey="verRoles" />
      <ProtectedRoute exact path="/roles/new" component={RoleCreate} permissionKey="verRoles" />
      <ProtectedRoute exact path="/roles/edit/:id" component={RoleCreate} permissionKey="verRoles" />
      <ProtectedRoute exact path="/templates" component={TemplatesList} permissionKey="verPautas" />
      <ProtectedRoute exact path="/templates/create" component={TemplatesBuilder} permissionKey="verPautas" />
      <ProtectedRoute exact path="/templates/:id/edit" component={TemplatesBuilder} permissionKey="verPautas" />
      <ProtectedRoute exact path="/templates/:id/preview" component={TemplatePreview} permissionKey="verPautas" />
      <ProtectedRoute exact path="/users" component={UsersList} permissionKey="verUsuarios" />
      <ProtectedRoute exact path="/users/new" component={UsersCreate} permissionKey="verUsuarios" />
      <ProtectedRoute exact path="/users/:id/edit" component={UsersCreate} permissionKey="verUsuarios" />
      <ProtectedRoute exact path="/branches" component={BranchesList} permissionKey="verSucursales" />
      <ProtectedRoute exact path="/branches/new" component={BranchCreate} permissionKey="verSucursales" />
      <ProtectedRoute exact path="/branches/:id/edit" component={BranchCreate} permissionKey="verSucursales" />
      <ProtectedRoute exact path="/organization" component={Organization} permissionKey="verOrganization" />
      {/* /reporting route intentionally removed */}
      <ProtectedRoute exact path="/work-orders" component={WorkOrdersList} permissionKey="verOT" />
      <ProtectedRoute exact path="/work-orders/create" component={WorkOrdersCreate} permissionKey="verOT" />
      <ProtectedRoute exact path="/work-orders/edit/:id" component={WorkOrdersCreate} permissionKey="verOT" />
      <ProtectedRoute exact path="/work-orders/view/:id" component={WorkOrdersDetail} permissionKey="supervisar" />
      <ProtectedRoute exact path="/work-orders/review/:id" component={WorkOrdersReview} permissionKey="supervisar" />
      <ProtectedRoute exact path="/work-orders/assign/:id" component={WorkOrderAssign} permissionKey="verOT" />
      <Route exact path="/calendar" component={WorkOrdersCalendar} />
      <Route exact path="/public/work-order/:token" component={PublicWorkOrderTimeline} />
      <Route exact path="/public/work-orders/:token" component={PublicWorkOrderTimeline} />
      <ProtectedRoute exact path="/assets" component={AssetsList} permissionKey="verActivos" />
      <ProtectedRoute exact path="/assets/upload/bulk" component={AssetsBulkUpload} permissionKey="verActivos" />
      <ProtectedRoute exact path="/assets/:id" component={AssetDetail} permissionKey="verActivos" />
      <ProtectedRoute exact path="/assets/new" component={AssetCreate} permissionKey="verActivos" />
      <ProtectedRoute exact path="/assets/:id/edit" component={AssetCreate} permissionKey="verActivos" />
      <Route exact path="/profile/edit" component={ProfileEdit} />
      <Route exact path="/settings" component={Settings} />
      <Route exact path="/logistics/supplies" component={Supplies} />
      <Route exact path="/logistics/supplies/new" component={SupplyEdit} />
      <Route exact path="/logistics/supplies/:id/edit" component={SupplyEdit} />
      <Route exact path="/logistics/parts" component={Parts} />
      <Route exact path="/logistics/parts/new" component={PartsEdit} />
      <Route exact path="/logistics/parts/edit/:id" component={PartsEdit} />
      <Route exact path="/logistics/lots/edit/:id" component={LotEdit} />
      <Route exact path="/logistics/lots" component={Lots} />
      <Route exact path="/logistics" component={Logistics} />
      <ProtectedRoute exact path="/warehouses" component={WarehouseAdmin} permissionKey="verSucursales" />
      <Route exact path="/" render={() => {
        if (loading) return null;
        if (token) return <Redirect to={firstAccessible()} />;
        return <Redirect to="/auth/login" />;
      }} />
    </IonRouterOutlet>
  );
};

export default Init;

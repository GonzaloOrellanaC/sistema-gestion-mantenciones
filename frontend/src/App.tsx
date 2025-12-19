import { Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Landing from './pages/Landing';
import { AuthProvider } from './context/AuthContext';
import { MainLayoutProvider } from './context/MainLayoutContext';
import { StylingProvider } from './context/StylingContext';

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
import WorkOrderAssign from './pages/WorkOrderAssign';
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
import UsersDetail from './pages/UsersDetail';
import UsersCreate from './pages/UsersCreate';
import BranchesList from './pages/BranchesList';
import BranchCreate from './pages/BranchCreate';
import Organization from './pages/Organization';
import WorkOrdersList from './pages/WorkOrdersList';
import WorkOrdersCreate from './pages/WorkOrdersCreate';
import RoleCreate from './pages/RoleCreate';
import AssetsList from './pages/AssetsList';
import AssetCreate from './pages/AssetCreate';

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

const App: React.FC = () => (
  <IonRouterOutlet>
    <Route exact path="/auth/login" component={Login}/>
    <Route exact path="/auth/register" component={Register}/>
    <Route exact path="/auth/forgot" component={ForgotPassword}/>
    <Route exact path="/auth/reset/:token" component={ChangePassword}/>
    <Route exact path="/dashboard" component={Dashboard}/>
    <Route exact path="/files/upload" component={FilesUpload}/>
    <Route exact path="/roles" component={RolesList}/>
    <Route exact path="/roles/new" component={RoleCreate}/>
    <Route exact path="/roles/edit/:id" component={RoleCreate}/>
    <Route exact path="/templates" component={TemplatesList}/>
    <Route exact path="/templates/create" component={TemplatesBuilder}/>
    <Route exact path="/templates/:id/edit" component={TemplatesBuilder}/>
    <Route exact path="/templates/:id/preview" component={TemplatePreview}/>
    <Route exact path="/users" component={UsersList} />
    <Route exact path="/users/new" component={UsersCreate} />
    <Route exact path="/users/:id/edit" component={UsersCreate} />
    <Route exact path="/branches" component={BranchesList} />
    <Route exact path="/branches/new" component={BranchCreate} />
    <Route exact path="/branches/:id/edit" component={BranchCreate} />
    <Route exact path="/organization" component={Organization} />
    <Route exact path="/work-orders" component={WorkOrdersList}/>
    <Route exact path="/work-orders/create" component={WorkOrdersCreate}/>
    <Route exact path="/work-orders/edit/:id" component={WorkOrdersDetail}/>
    <Route exact path="/assets" component={AssetsList} />
    <Route exact path="/assets/new" component={AssetCreate} />
    <Route exact path="/assets/:id/edit" component={AssetCreate} />
    <Route exact path="/work-orders/assign/:id" component={WorkOrderAssign}/>
    <Route exact path="/" component={Landing}/>
  </IonRouterOutlet>
);

export default Init;

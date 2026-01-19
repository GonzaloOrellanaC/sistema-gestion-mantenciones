import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type ProtectedRouteProps = RouteProps & {
  permissionKey?: string;
  component: React.ComponentType<any>;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, permissionKey, ...rest }) => {
  const { user, token, loading } = useAuth();
  const perms = (user as any)?.role?.permissions || (user as any)?.roleId?.permissions || {};
  const hasPermission = (key?: string) => {
    if (!key) return true;
    if ((user as any)?.isSuperAdmin) return true;
    if (Object.prototype.hasOwnProperty.call(perms, key)) return !!perms[key];
    // If permission key not present in role, deny by default
    return false;
  };

  return (
    <Route
      {...rest}
      render={(props) => {
        // While auth is initializing, don't redirect (allow auth to resolve)
        if (loading) return null;
        if (!token) return <Redirect to="/auth/login" />;
        if (permissionKey && !hasPermission(permissionKey)) return <Redirect to="/dashboard" />;
        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute;

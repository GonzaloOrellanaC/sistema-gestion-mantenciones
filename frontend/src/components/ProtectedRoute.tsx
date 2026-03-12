import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission, Permission } from '../utils/permisions';

type ProtectedRouteProps = RouteProps & {
  permissionKey: Permission;
  component: React.ComponentType<any>;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, permissionKey, ...rest }) => {
  const { permissions, token, loading } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        // While auth is initializing, don't redirect (allow auth to resolve)
        if (loading) return null;
        if (!token) return <Redirect to="/auth/login" />;
        if (permissionKey && !hasPermission(permissions, permissionKey)) return <Redirect to="/dashboard" />;
        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute;

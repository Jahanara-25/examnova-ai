import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export function ProtectedRoute({ requiredRole, children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return React.createElement(Navigate, { to: '/auth/role-selection', state: { from: location }, replace: true });
  }

  if (user?.role !== requiredRole) {
    return React.createElement(Navigate, { to: `/${user?.role || 'auth'}/dashboard`, replace: true });
  }

  return children;
}

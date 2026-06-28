import { Navigate, useLocation } from 'react-router-dom';
import { ReactElement } from 'react';
import { useAuth } from '../context/AuthContext';
import { ModulePermission, Role } from '../types';
import { firstAccessiblePath, hasModulePermission } from '../utils/permissions';

export function ProtectedRoute({
  children,
  roles,
  permission
}: {
  children: ReactElement;
  roles?: Role[];
  permission?: ModulePermission;
}) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'superadmin' && user.isSubscribed === false && location.pathname !== '/subscription-expired') {
    return <Navigate to="/subscription-expired" replace />;
  }
  if (roles && !roles.includes(user.role)) return <Navigate to={firstAccessiblePath(user)} replace />;
  if (permission && !hasModulePermission(user, permission)) return <Navigate to={firstAccessiblePath(user)} replace />;
  return children;
}

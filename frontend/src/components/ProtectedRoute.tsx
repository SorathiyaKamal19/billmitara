import { Navigate, useLocation } from 'react-router-dom';
import { ReactElement } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export function ProtectedRoute({ children, roles }: { children: ReactElement; roles?: Role[] }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'superadmin' && user.isSubscribed === false && location.pathname !== '/subscription-expired') {
    return <Navigate to="/subscription-expired" replace />;
  }
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'chef' ? '/kitchen' : '/tables'} replace />;
  return children;
}

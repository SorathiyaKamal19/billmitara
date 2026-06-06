import { Navigate } from 'react-router-dom';
import { ReactElement } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

export function ProtectedRoute({ children, roles }: { children: ReactElement; roles?: Role[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'chef' ? '/kitchen' : '/tables'} replace />;
  return children;
}

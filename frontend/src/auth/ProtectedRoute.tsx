import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './authStore';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, checkExpiry } = useAuthStore();

  useEffect(() => {
    // Check token expiry on every route change
    checkExpiry();
  }, [location.pathname, checkExpiry]);

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

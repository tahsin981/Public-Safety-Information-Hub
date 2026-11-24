import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { Role } from '../lib/types';

// UI gate only. The backend remains the authority and re-checks every request.
export function RequireRole({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <p role="status" className="container">Checking your session…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (roles && !roles.includes(user.role))
    return (
      <div className="container" role="alert">
        <h1>Access denied</h1>
        <p>Your role ({user.role}) cannot open this page.</p>
      </div>
    );
  return <>{children}</>;
}

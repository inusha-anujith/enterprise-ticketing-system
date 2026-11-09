// components/ProtectedRoute.jsx
// Wraps pages that need a login. Optionally limits a page to certain roles.
// Note: this only hides pages in the browser. The real protection is on the API,
// which checks the token and role on every request.
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading…</div>;
  }

  if (!user) {
    // Remember where they were going, so login can send them back there
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

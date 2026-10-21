import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protects a page behind the login.
 *
 * <p>If the user is not logged in we redirect to /login and remember where they
 * wanted to go, so they can be sent back after a successful login.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  // While we are still checking the stored token we show a loader instead of
  // redirecting - otherwise every page reload would bounce to /login.
  if (initializing) {
    return (
      <div className="page-loader">
        <div className="spinner spinner--large" />
        <p>Checking your session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

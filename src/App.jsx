import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import { useAuth } from './context/AuthContext';

/**
 * The routes of the application.
 *
 * <ul>
 *   <li>{@code /register} - registration page (public)</li>
 *   <li>{@code /login} - login page (public)</li>
 *   <li>{@code /home} - protected welcome page (JWT required)</li>
 * </ul>
 */
export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app">
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/home' : '/login'} replace />}
        />

        <Route path="/register" element={<Register />} />

        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/home" replace /> : <Login />}
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Anything else -> back to the start page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

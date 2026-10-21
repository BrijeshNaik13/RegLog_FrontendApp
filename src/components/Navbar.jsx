import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Top navigation bar.
 *
 * <p>It shows the login / register links for guests and the user name plus a
 * logout button for logged-in users.
 */
export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear the token + auth state, then send the user back to the login page.
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to={isAuthenticated ? '/home' : '/'} className="navbar__brand">
          <span className="navbar__logo" aria-hidden="true">
            ◈
          </span>
          <span className="navbar__title">RegLog</span>
        </Link>

        <nav className="navbar__links">
          {isAuthenticated ? (
            <>
              <span className="navbar__greeting">
                Welcome, <strong>{user?.username || 'User'}</strong>
              </span>
              <button type="button" className="btn btn--ghost" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="navbar__link">
                Login
              </NavLink>
              <NavLink to="/register" className="navbar__link navbar__link--cta">
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

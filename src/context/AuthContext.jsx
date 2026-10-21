import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getHomeData, login as loginRequest, register as registerRequest } from '../services/authService';
import { tokenStorage } from '../services/api';

/**
 * Authentication context.
 *
 * <p>It keeps the "who is logged in?" state in one place so that every
 * component can read it with the {@code useAuth()} hook instead of every
 * component talking to localStorage on its own.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStorage.get());
  const [user, setUser] = useState(null);

  // "initializing" is true while we check whether a stored token is still valid.
  // Without it the ProtectedRoute would redirect to /login for a split second
  // on every page reload.
  const [initializing, setInitializing] = useState(() => Boolean(tokenStorage.get()));

  /**
   * On the very first render we may find a token in localStorage (the user hit
   * "refresh"). We call the protected /api/home endpoint to check whether that
   * token is still valid and to load the user details.
   */
  useEffect(() => {
    const storedToken = tokenStorage.get();

    if (!storedToken) {
      setInitializing(false);
      return undefined;
    }

    let cancelled = false;

    getHomeData()
      .then((data) => {
        if (cancelled) return;
        setToken(storedToken);
        setUser(data.user);
      })
      .catch(() => {
        // The token is expired or was signed with a different secret -> drop it.
        tokenStorage.clear();
        if (cancelled) return;
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * If the Axios interceptor sees a 401 it clears the token and fires this
   * event. We listen for it so the UI reacts immediately.
   */
  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('reglog:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('reglog:unauthorized', handleUnauthorized);
  }, []);

  /** Logs the user in and stores the returned JWT. */
  const login = useCallback(async (credentials) => {
    const data = await loginRequest(credentials);
    tokenStorage.set(data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  /** Registers a new account (no token is issued for a registration). */
  const register = useCallback(async (payload) => registerRequest(payload), []);

  /** Clears the authentication state and the stored token. */
  const logout = useCallback(() => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      initializing,
      login,
      register,
      logout,
    }),
    [token, user, initializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Hook that gives access to the authentication state. */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth() must be used inside an <AuthProvider>');
  }
  return context;
}

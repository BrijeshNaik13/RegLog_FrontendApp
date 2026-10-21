import axios from 'axios';

/**
 * Central Axios configuration.
 *
 * <p>Every request to the backend goes through this instance, so the JWT is
 * attached in exactly one place.
 *
 * <p>SECURITY NOTE (token storage strategy):
 * the JWT is kept in `localStorage`. That survives a page reload and is easy to
 * read from JavaScript, which also means a Cross-Site-Scripting (XSS) bug
 * anywhere in the app could steal the token. Because of that we never render
 * user supplied text as raw HTML (React escapes it by default) and we do not
 * use `dangerouslySetInnerHTML` anywhere.
 *
 * To harden the app later, move the token to an `HttpOnly; Secure; SameSite=Strict`
 * cookie - the backend only has to read the token from the cookie instead of the
 * `Authorization` header, everything else stays the same.
 */

// Where the backend lives. Configure it in the ".env" file (see .env.example).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Key used to store the JWT in localStorage.
const TOKEN_KEY = 'reglog_token';

/**
 * Small helper around localStorage so the rest of the app never touches it
 * directly - that makes it easy to switch to cookies later on.
 */
export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      // localStorage can be blocked (private mode, disabled cookies, ...).
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* ignore - the user simply will not stay logged in after a reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/**
 * Request interceptor: add the JWT to every outgoing request.
 * The backend expects the token in the "Authorization: Bearer <token>" header.
 */
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor: if the backend rejects the token (401) we log the user
 * out automatically, because the stored token is no longer usable.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && tokenStorage.get()) {
      tokenStorage.clear();
      window.dispatchEvent(new Event('reglog:unauthorized'));
    }
    return Promise.reject(error);
  }
);

/**
 * Turns any error coming from Axios into a short, user friendly message.
 *
 * The backend sends errors in a predictable shape:
 *   { "message": "...", "fieldErrors": { "email": "..." } }
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;

  if (data) {
    // A field error is more specific than the general message.
    if (data.fieldErrors && typeof data.fieldErrors === 'object') {
      const firstFieldError = Object.values(data.fieldErrors)[0];
      if (firstFieldError) return firstFieldError;
    }
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
  }

  if (error?.code === 'ECONNABORTED') {
    return 'The request timed out. Please check your connection and try again.';
  }

  if (error?.message === 'Network Error') {
    return 'Cannot reach the server. Make sure the backend is running on ' + API_BASE_URL + '.';
  }

  return fallback;
}

/** The API base URL, handy for debugging in the browser console. */
export { API_BASE_URL };

export default api;

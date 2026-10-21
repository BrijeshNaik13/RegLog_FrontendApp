import api from './api';

/**
 * All calls to the RegLog backend live here.
 *
 * Keeping them in one file means the pages only deal with data, never with URLs
 * or Axios details.
 */

/**
 * POST /api/register
 * @param {{username: string, email: string, password: string, confirmPassword: string, mobileNumber: string}} payload
 */
export async function register(payload) {
  const { data } = await api.post('/api/register', payload);
  return data;
}

/**
 * POST /api/login
 * @param {{email: string, password: string}} credentials
 * @returns {Promise<{message: string, token: string, user: object}>}
 */
export async function login(credentials) {
  const { data } = await api.post('/api/login', credentials);
  return data;
}

/**
 * GET /api/home - a protected endpoint, the JWT is added automatically.
 * @returns {Promise<{message: string, user: object}>}
 */
export async function getHomeData() {
  const { data } = await api.get('/api/home');
  return data;
}

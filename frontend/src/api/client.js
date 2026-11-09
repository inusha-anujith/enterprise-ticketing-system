// api/client.js
// One place for every call to the backend. It:
//   - adds the base URL (from .env, so production can point at the deployed API)
//   - attaches the login token
//   - turns error responses into normal JavaScript errors with the API's message
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'apexdesk_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Is the API running?');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // An expired or invalid token: tell the app to log the user out
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  return data;
}

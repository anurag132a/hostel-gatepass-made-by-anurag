const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export function getToken() { return localStorage.getItem('hh_token'); }
export function setSession(token, user) {
  localStorage.setItem('hh_token', token);
  localStorage.setItem('hh_user', JSON.stringify(user));
}
export function clearSession() { localStorage.removeItem('hh_token'); localStorage.removeItem('hh_user'); }
export function getSavedUser() { try { return JSON.parse(localStorage.getItem('hh_user') || 'null'); } catch { return null; } }
export async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) clearSession();
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

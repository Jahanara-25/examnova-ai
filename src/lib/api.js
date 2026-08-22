const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export async function api(path, options = {}) {
  const token = localStorage.getItem('examnova-token');
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...(!(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) { localStorage.removeItem('examnova-token'); localStorage.removeItem('examnova-user'); }
    const error = new Error(data.message || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return data;
}

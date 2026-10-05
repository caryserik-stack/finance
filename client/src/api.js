const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, { body, ...opts } = {}) {
  const res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body), ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  put: (p, body) => request(p, { method: 'PUT', body }),
  del: (p) => request(p, { method: 'DELETE' }),
};

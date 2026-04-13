import axios from 'axios';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL)
  || process.env.API_URL
  || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10_000,
});

// Attach session token to every request
// apiClient.interceptors.request.use((config) => {
//   const token = getSessionToken();
//   if (token) config.headers['X-Session-Token'] = token;
//   return config;
// });

apiClient.interceptors.request.use((config) => {
  const token = getSessionToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

function getSessionToken() {
  if (typeof localStorage !== 'undefined') return localStorage.getItem('lokaal_token');
  return null;
}

// ── Session ───────────────────────────────────────────────────────────────────
export const sessionApi = {
  create: () => apiClient.post('/session').then(r => r.data),
  me:     () => apiClient.get('/session/me').then(r => r.data),
};

// ── Groups ────────────────────────────────────────────────────────────────────
export const groupsApi = {
  list: (lat, lng, radiusKm = 3) =>
    apiClient.get('/groups', { params: { lat, lng, radiusKm } }).then(r => r.data),

  get: (id) => apiClient.get(`/groups/${id}`).then(r => r.data),

  create: (payload) => apiClient.post('/groups', payload).then(r => r.data),

  kickMember: (groupId, targetHash) =>
    apiClient.delete(`/groups/${groupId}/members/${targetHash}`).then(r => r.data),
};

// ── Join requests ─────────────────────────────────────────────────────────────
export const joinApi = {
  submit: (groupId, reason) =>
    apiClient.post(`/groups/${groupId}/join-requests`, { reason }).then(r => r.data),

  list: (groupId) =>
    apiClient.get(`/groups/${groupId}/join-requests`).then(r => r.data),

  decide: (groupId, requestId, action) =>
    apiClient.patch(`/groups/${groupId}/join-requests/${requestId}`, { action }).then(r => r.data),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const messagesApi = {
  list: (groupId, { before, limit } = {}) =>
    apiClient.get(`/groups/${groupId}/messages`, { params: { before, limit } }).then(r => r.data),

  send: (groupId, content) =>
    apiClient.post(`/groups/${groupId}/messages`, { content }).then(r => r.data),

  flag: (groupId, messageId) =>
    apiClient.post(`/groups/${groupId}/messages/${messageId}/flag`).then(r => r.data),
};

// ── Place tips ────────────────────────────────────────────────────────────────
export const placesApi = {
  listTips: (lat, lng, radiusKm = 2) =>
    apiClient.get('/places/tips', { params: { lat, lng, radiusKm } }).then(r => r.data),

  submitTip: (lat, lng, content) =>
    apiClient.post('/places/tips', { lat, lng, content }).then(r => r.data),

  upvoteTip: (id) =>
    apiClient.post(`/places/tips/${id}/upvote`).then(r => r.data),
};

// ── Ghost trail ───────────────────────────────────────────────────────────────
export const ghostApi = {
  score:   () => apiClient.get('/ghost/score').then(r => r.data),
  history: () => apiClient.get('/ghost/history').then(r => r.data),
  rotate:  () => apiClient.post('/ghost/rotate').then(r => r.data),
};

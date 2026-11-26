import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 10000, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bb_token');
      localStorage.removeItem('bb_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (d) => api.post('/auth/register', d),
  login: (d) => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
  updateProfile: (d) => api.put('/auth/profile', d),
  createFirstAdmin: (d) => api.post('/auth/create-first-admin', d),
};

export const usersAPI = {
  leaderboard: (p) => api.get('/users/leaderboard', { params: p }),
  getProfile: (id) => api.get(`/users/${id}`),
};

export const doubtsAPI = {
  getAll: (p) => api.get('/doubts', { params: p }),
  getById: (id) => api.get(`/doubts/${id}`),
  create: (d) => api.post('/doubts', d),
  apply: (id, d) => api.post(`/doubts/${id}/apply`, d),
  selectHelper: (dId, hId, d) => api.post(`/doubts/${dId}/select/${hId}`, d || {}),
  cancel: (id) => api.delete(`/doubts/${id}`),
  myDoubts: () => api.get('/doubts/my/posted'),
  report: (id, d) => api.post(`/doubts/${id}/report`, d),
};

export const sessionsAPI = {
  getAll: (p) => api.get('/sessions', { params: p }),
  getById: (id) => api.get(`/sessions/${id}`),
  complete: (id) => api.post(`/sessions/${id}/complete`),
  rate: (id, d) => api.post(`/sessions/${id}/rate`, d),
  ready: (id) => api.post(`/sessions/${id}/ready`),
  acceptSchedule: (id) => api.post(`/sessions/${id}/accept-schedule`),
  declineSchedule: (id) => api.post(`/sessions/${id}/decline-schedule`),
  upload: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/sessions/${id}/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

export const coinsAPI = {
  balance: () => api.get('/coins/balance'),
  transactions: (p) => api.get('/coins/transactions', { params: p }),
};

export default api;

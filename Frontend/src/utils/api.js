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

export default api;

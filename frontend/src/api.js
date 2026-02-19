import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.error || err.response?.data?.message || err.message;
    throw new Error(msg);
  }
);

export async function register(username, password, age, gender) {
  return api.post('/register', { username, password, age, gender });
}

export async function login(username, password) {
  return api.post('/login', { username, password });
}

export async function track(featureName) {
  return api.post('/track', { feature_name: featureName }).catch(() => {});
}

export async function getAnalytics(params) {
  return api.get('/analytics', { params });
}

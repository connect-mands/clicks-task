import { useState, useEffect } from 'react';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import Cookies from 'js-cookie';

const COOKIE_OPTIONS = { expires: 30, sameSite: 'lax' };
const COOKIE_KEYS = { dateRange: 'analytics_date_range', age: 'analytics_age', gender: 'analytics_gender' };

export function getStoredFilters() {
  const stored = Cookies.get(COOKIE_KEYS.dateRange);
  let startDate = null, endDate = null;
  if (stored) {
    try {
      const [s, e] = JSON.parse(stored);
      startDate = s || null;
      endDate = e || null;
    } catch (_) {}
  }
  return {
    startDate,
    endDate,
    age: Cookies.get(COOKIE_KEYS.age) || '',
    gender: Cookies.get(COOKIE_KEYS.gender) || '',
  };
}

export function setStoredFilters({ startDate, endDate, age, gender }) {
  if (startDate != null && endDate != null) {
    Cookies.set(COOKIE_KEYS.dateRange, JSON.stringify([startDate, endDate]), COOKIE_OPTIONS);
  }
  if (age != null) Cookies.set(COOKIE_KEYS.age, age, COOKIE_OPTIONS);
  if (gender != null) Cookies.set(COOKIE_KEYS.gender, gender, COOKIE_OPTIONS);
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) {
      localStorage.removeItem('token');
      setUser(null);
      return;
    }
    localStorage.setItem('token', token);
    // Decode basic user info from token payload (no need for extra API call)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ username: payload.username });
    } catch {
      setUser(null);
    }
  }, [token]);

  return token ? (
    <Dashboard user={user} onLogout={() => setToken(null)} />
  ) : (
    <Login
      onLogin={(t) => setToken(t)}
      onRegister={(t) => setToken(t)}
    />
  );
}

export default App;

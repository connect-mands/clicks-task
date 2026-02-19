import { useState } from 'react';
import { register, login } from './api';
import './Login.css';

export function Login({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { token } = await login(username, password);
        onLogin(token);
      } else {
        if (!age || !gender) {
          setError('Age and gender are required for registration');
          setLoading(false);
          return;
        }
        const { token } = await register(username, password, parseInt(age), gender);
        onRegister(token);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Product Analytics</h1>
        <p className="subtitle">Sign in to view your dashboard</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />

          {mode === 'register' && (
            <>
              <input
                type="number"
                placeholder="Age"
                min="1"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required={mode === 'register'}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </>
          )}

          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Log In' : 'Register'}
          </button>
        </form>

        <p className="toggle-mode">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Register' : 'Log In'}
          </button>
        </p>
      </div>
    </div>
  );
}

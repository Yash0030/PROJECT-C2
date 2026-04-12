import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@shared/api/auth.js';
import { useSessionStore } from '@shared/store/sessionStore.js';
import styles from './AuthPage.module.css';

export default function AuthPage() {
  const navigate   = useNavigate();
  const setSession = useSessionStore(s => s.setSession);

  const [mode, setMode]       = useState('login');   // 'login' | 'register'
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = mode === 'register'
        ? await authApi.register(name, email, password)
        : await authApi.login(email, password);

      setSession(data.token, data.user);
      navigate('/');
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.logo}>ChitChat 🌐</h1>
      <div className={styles.card}>
        <div className={styles.tabs}>
          <button
            className={mode === 'login' ? styles.activeTab : styles.tab}
            onClick={() => setMode('login')}
          >Login</button>
          <button
            className={mode === 'register' ? styles.activeTab : styles.tab}
            onClick={() => setMode('register')}
          >Register</button>
        </div>

        {mode === 'register' && (
          <input
            className={styles.input}
            placeholder="Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}
        <input
          className={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle()}
        />

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.btn} onClick={handle} disabled={loading}>
          {loading ? '…' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
      </div>
    </div>
  );
}
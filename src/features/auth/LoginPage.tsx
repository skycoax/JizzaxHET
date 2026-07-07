import { useState } from 'react';
import type { AuthUser } from '@/hooks/useAuth';

interface Props {
  defaultUrl: string;
  onLogin:    (token: string, user: AuthUser, url: string) => void;
  onDemo:     () => void;
}

export function LoginPage({ defaultUrl, onLogin, onDemo }: Props) {
  const [url,      setUrl     ] = useState(defaultUrl);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAdv,  setShowAdv ] = useState(false);
  const [loading,  setLoading ] = useState(false);
  const [error,    setError   ] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Login va parolni kiriting");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const form = new URLSearchParams();
      form.append('username', username.trim());
      form.append('password', password);
      const r = await fetch(`${url.replace(/\/$/, '')}/auth/login`, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(8000),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.detail || "Login yoki parol noto'g'ri");
        return;
      }
      onLogin(data.access_token, data.user, url.replace(/\/$/, ''));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        setError('Server javob bermadi (8s). URL ni tekshiring.');
      } else {
        setError("Serverga ulanib bo'lmadi. URL va tarmoqni tekshiring.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg" data-theme="dark">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <img src="/het-logo.png" alt="HET" draggable={false}/>
        </div>
        <h1 className="login-title">Jizzax HET</h1>
        <p className="login-sub">Vaziyat dispetcherlik markazi</p>

        <form className="login-form" onSubmit={submit}>
          <div className="lf-field">
            <label>Login</label>
            <input
              type="text"
              className="lf-inp"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="lf-field">
            <label>Parol</label>
            <input
              type="password"
              className="lf-inp"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {/* Advanced: server URL */}
          <button
            type="button"
            className="lf-adv-toggle"
            onClick={() => setShowAdv(v => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Server manzili {showAdv ? '▴' : '▾'}
          </button>

          {showAdv && (
            <div className="lf-field">
              <label>Backend URL</label>
              <input
                type="url"
                className="lf-inp lf-mono"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="http://localhost:8000"
              />
              <div className="lf-hint">
                LAN server manzili. Default: http://localhost:8000
              </div>
            </div>
          )}

          {error && (
            <div className="lf-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="lf-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="lf-spinner"/>
                Ulanilmoqda...
              </>
            ) : 'Kirish'}
          </button>
        </form>

        <button className="lf-demo" onClick={onDemo}>
          Demo rejimida ochish (backend kerak emas)
        </button>

        <div className="login-footer">
          Jizzax IIB · Kiberjinoyatlar bo'limi
        </div>
      </div>
    </div>
  );
}

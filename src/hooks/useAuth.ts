import { useState, useCallback } from 'react';

export interface AuthUser {
  id:        string;
  username:  string;
  full_name: string;
  role:      'admin' | 'dispatcher' | 'tetk_chief';
}

export interface AuthState {
  token:      string | null;
  user:       AuthUser | null;
  backendUrl: string;
  demoMode:   boolean;
}

const KEYS = {
  token:   'jhet_token',
  user:    'jhet_user',
  backend: 'jhet_backend_url',
  demo:    'jhet_demo_mode',
};

function read(): AuthState {
  return {
    token:      localStorage.getItem(KEYS.token),
    user:       JSON.parse(localStorage.getItem(KEYS.user) || 'null'),
    backendUrl: localStorage.getItem(KEYS.backend) || 'http://localhost:8000',
    demoMode:   localStorage.getItem(KEYS.demo) === 'true',
  };
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(read);

  const login = useCallback((token: string, user: AuthUser, url: string) => {
    localStorage.setItem(KEYS.token, token);
    localStorage.setItem(KEYS.user, JSON.stringify(user));
    localStorage.setItem(KEYS.backend, url);
    localStorage.removeItem(KEYS.demo);
    setState({ token, user, backendUrl: url, demoMode: false });
  }, []);

  const enterDemo = useCallback(() => {
    localStorage.removeItem(KEYS.token);
    localStorage.removeItem(KEYS.user);
    localStorage.setItem(KEYS.demo, 'true');
    setState(prev => ({ ...prev, token: null, user: null, demoMode: true }));
  }, []);

  const logout = useCallback(() => {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    setState({ token: null, user: null, backendUrl: 'http://localhost:8000', demoMode: false });
  }, []);

  return { ...state, login, enterDemo, logout };
}

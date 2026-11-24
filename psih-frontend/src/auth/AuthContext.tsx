import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, getToken, setToken, setUnauthorizedHandler } from '../api/client';
import type { User } from '../lib/types';

interface AuthState {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}
const Ctx = createContext<AuthState | null>(null);
export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside <AuthProvider>');
  return c;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => !!getToken());

  const clear = useCallback(() => { setToken(null); setUser(null); qc.clear(); }, [qc]);

  useEffect(() => {
    setUnauthorizedHandler(clear); // expired JWT -> back to signed-out state
    if (getToken()) {
      api<User>('/auth/me').then((r) => setUser(r.data)).catch(clear).finally(() => setLoading(false));
    }
    return () => setUnauthorizedHandler(null);
  }, [clear]);

  const value = useMemo<AuthState>(() => ({
    user, loading,
    async login(email, password) {
      const r = await api<{ user: User; token: string }>('/auth/login', { method: 'POST', body: { email, password } });
      setToken(r.data.token); setUser(r.data.user);
      return r.data.user;
    },
    async logout() { await api('/auth/logout', { method: 'POST' }).catch(() => undefined); clear(); },
  }), [user, loading, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

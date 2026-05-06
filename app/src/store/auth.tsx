import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthPerson } from '../api/types';
import { getToken, setToken } from '../api/client';

interface AuthState {
  person: AuthPerson | null;
  token: string | null;
  setSession: (person: AuthPerson, token: string) => void;
  clearSession: () => void;
}

const STORAGE_KEY = 'app-attendance.person';

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [person, setPerson] = useState<AuthPerson | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthPerson) : null;
  });
  const [token, setTokenState] = useState<string | null>(() => getToken());

  useEffect(() => {
    if (person) localStorage.setItem(STORAGE_KEY, JSON.stringify(person));
    else localStorage.removeItem(STORAGE_KEY);
  }, [person]);

  const value = useMemo<AuthState>(
    () => ({
      person,
      token,
      setSession: (p, t) => {
        setPerson(p);
        setToken(t);
        setTokenState(t);
      },
      clearSession: () => {
        setPerson(null);
        setToken(null);
        setTokenState(null);
      },
    }),
    [person, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

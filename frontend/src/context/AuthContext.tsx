import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { api } from '../api/client';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  registerOwner: (input: RegisterOwnerInput) => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => void;
}

interface RegisterOwnerInput {
  name: string;
  email: string;
  password: string;
  phone: string;
  restaurantName: string;
  restaurantPhone?: string;
  restaurantAddress?: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(localStorage.getItem('poss_token'));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('poss_user');
    return raw ? JSON.parse(raw) : null;
  });

  async function login(identifier: string, password: string) {
    const { data } = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('poss_token', data.token);
    localStorage.setItem('poss_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  async function registerOwner(input: RegisterOwnerInput) {
    const { data } = await api.post('/auth/register-owner', input);
    localStorage.setItem('poss_token', data.token);
    localStorage.setItem('poss_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  function updateUser(nextUser: User) {
    localStorage.setItem('poss_user', JSON.stringify(nextUser));
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem('poss_token');
    localStorage.removeItem('poss_user');
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ user, token, login, registerOwner, updateUser, logout }), [user, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

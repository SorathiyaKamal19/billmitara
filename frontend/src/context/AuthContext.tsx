import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { api } from '../api/client';
import { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<void>;
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
const TOKEN_KEY = 'poss_token';
const USER_KEY = 'poss_user';
const WELCOME_MODAL_KEY = 'poss_show_welcome_modal';

function getStoredValue(key: string) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function clearStoredAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

function saveAuth(token: string, user: User, rememberMe: boolean) {
  clearStoredAuth();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
}

function readStoredUser() {
  const raw = getStoredValue(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(getStoredValue(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(readStoredUser);

  async function login(identifier: string, password: string, rememberMe = true) {
    const { data } = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('poss_remember_me', rememberMe ? 'true' : 'false');
    saveAuth(data.token, data.user, rememberMe);
    setToken(data.token);
    setUser(data.user);
  }

  async function registerOwner(input: RegisterOwnerInput) {
    const { data } = await api.post('/auth/register-owner', input);
    saveAuth(data.token, data.user, true);
    localStorage.setItem(WELCOME_MODAL_KEY, 'true');
    setToken(data.token);
    setUser(data.user);
  }

  function updateUser(nextUser: User) {
    const storage = sessionStorage.getItem(TOKEN_KEY) ? sessionStorage : localStorage;
    storage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
  }

  function logout() {
    clearStoredAuth();
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

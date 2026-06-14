import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User, EmployerProfile, ProviderProfile, LoginResult } from '../types';

interface AuthContextType {
  user: User | null;
  provider: ProviderProfile | null;
  employer: EmployerProfile | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [employer, setEmployer] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<any, { data: LoginResult }>('/auth/me');
      setUser(res.data.user);
      setProvider(res.data.provider || null);
      setEmployer(res.data.employer || null);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      setProvider(null);
      setEmployer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (phone: string, password: string) => {
    const res = await api.post<any, { data: LoginResult }>('/auth/login', { phone, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    setProvider(res.data.provider || null);
    setEmployer(res.data.employer || null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setProvider(null);
    setEmployer(null);
  };

  return (
    <AuthContext.Provider value={{ user, provider, employer, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

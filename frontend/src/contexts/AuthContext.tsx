import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { post, get } from '../utils/request';

interface User {
  id: string;
  username: string;
  realName?: string;
  email?: string;
  phone?: string;
  status: string;
  role?: {
    id: string;
    name: string;
    code: string;
    type: string;
  } | null;
  permissions?: Array<{
    id: string;
    name: string;
    code: string;
    module: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('erp_token');
    const savedUser = localStorage.getItem('erp_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        fetchCurrentUser(savedToken);
      } catch {
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (currentToken: string) => {
    try {
      const userData = await get<User>('/auth/me', {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      setUser(userData);
      localStorage.setItem('erp_user', JSON.stringify(userData));
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const result = await post<{ token: string; user: User }>('/auth/login', {
        username,
        password,
      });
      setToken(result.token);
      setUser(result.user);
      localStorage.setItem('erp_token', result.token);
      localStorage.setItem('erp_user', JSON.stringify(result.user));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

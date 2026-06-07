import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../api/client';

interface User {
  id: number;
  phone: string;
  name: string;
  avatar?: string;
  role: 'customer' | 'provider' | 'admin';
  isVerified: boolean;
  rating: number;
  orderCount: number;
  faceVerified?: boolean;
  address?: string;
}

const demoAdmin: User = {
  id: 1,
  phone: '13800000000',
  name: '演示管理员',
  role: 'admin',
  isVerified: true,
  rating: 5,
  orderCount: 128,
  faceVerified: true,
  address: '本地复验账号',
};

const demoToken = 'local-demo-admin-token';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, name: string, role?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(demoToken);
    setUser(demoAdmin);
    localStorage.setItem('token', demoToken);
    localStorage.setItem('user', JSON.stringify(demoAdmin));
    setLoading(false);
  }, []);

  const login = async (phone: string, password: string) => {
    const response = await api.post('/auth/login', { phone, password });
    const { token: newToken, user: newUser } = response.data;
    
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const register = async (phone: string, password: string, name: string, role: string = 'customer') => {
    const response = await api.post('/auth/register', { phone, password, name, role });
    const { token: newToken, user: newUser } = response.data;
    
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

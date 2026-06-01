import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { authAPI } from '../utils/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('planet_token');
    const savedUser = localStorage.getItem('planet_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (phone: string, code: string) => {
    const response = await authAPI.login(phone, code);
    return response.data;
  };

  const register = async (data: any) => {
    const response = await authAPI.register(data);
    if (response.data.success) {
      const { token, user } = response.data;
      setToken(token);
      setUser(user);
      localStorage.setItem('planet_token', token);
      localStorage.setItem('planet_user', JSON.stringify(user));
    }
    return response.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('planet_token');
    localStorage.removeItem('planet_user');
  };

  const handleLoginSuccess = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('planet_token', token);
    localStorage.setItem('planet_user', JSON.stringify(user));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      logout,
      handleLoginSuccess,
      isAuthenticated: !!token 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

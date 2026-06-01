import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (loginType, credentials) => {
    let response;
    
    switch (loginType) {
      case 'sms':
        response = await authApi.smsLogin(credentials.phone, credentials.code);
        break;
      case 'password':
        response = await authApi.passwordLogin(credentials.account, credentials.password);
        break;
      case 'thirdParty':
        response = await authApi.thirdPartyLogin(credentials);
        break;
      default:
        throw new Error('不支持的登录方式');
    }

    const { token, user } = response.data;
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return response.data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const bindPhone = async (phone, code) => {
    const response = await authApi.bindPhone(phone, code);
    setUser(response.data.user);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      bindPhone,
      isAuthenticated,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

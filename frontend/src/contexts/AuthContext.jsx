import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      checkAuth();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkAuth = async () => {
    try {
      const result = await api.get('/auth/current');
      if (result.success) {
        setUser(result.data);
      } else {
        logout();
      }
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const result = await api.post('/auth/login', { username, password });
    if (result.success) {
      const { user: userData, token: tokenData } = result.data;
      setUser(userData);
      setToken(tokenData);
      localStorage.setItem('token', tokenData);
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenData}`;
    }
    return result;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    const rolePermissions = {
      approver: ['templates:view', 'approvals:view', 'approvals:approve', 'certificates:view', 'certificates:issue', 'certificates:revoke', 'verification:view', 'verification:verify', 'applicants:view'],
      applicant: ['approvals:view', 'approvals:create', 'certificates:viewOwn'],
      verifier: ['verification:verify', 'verification:view'],
    };

    const permissions = rolePermissions[user.role] || [];
    return permissions.includes(permission) || permissions.includes('*');
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

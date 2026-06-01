import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadCurrentUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setCurrentUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await authAPI.login(username, password);
    localStorage.setItem('token', response.data.access_token);
    await loadCurrentUser();
    return response.data;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const canComment = () => {
    return currentUser && currentUser.role !== 'guest';
  };

  const isEditorOrAdmin = () => {
    return currentUser && ['admin', 'editor'].includes(currentUser.role);
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
    canComment,
    isEditorOrAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

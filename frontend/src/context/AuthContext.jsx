import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pharmacy_token');
    const storedUser = localStorage.getItem('pharmacy_user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('pharmacy_token');
        localStorage.removeItem('pharmacy_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const response = await authAPI.login(username, password);
    
    if (response.data.success) {
      const { token, user } = response.data.data;
      localStorage.setItem('pharmacy_token', token);
      localStorage.setItem('pharmacy_user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    }
    
    return { success: false, message: response.data.message };
  };

  const logout = () => {
    localStorage.removeItem('pharmacy_token');
    localStorage.removeItem('pharmacy_user');
    setUser(null);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

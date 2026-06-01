import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, setToken } from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const data = await authApi.getMe();
      if (data.authenticated) {
        setUser(data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const register = async (data) => {
    const result = await authApi.register(data);
    setToken(result.token);
    setUser(result.user);
    setIsAuthenticated(true);
    return result;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      register,
      logout,
      updateUser,
      checkAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

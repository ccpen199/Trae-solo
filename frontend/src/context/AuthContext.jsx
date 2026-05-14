import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, [token]);

  const login = async (loginData) => {
    const res = await api.post('/auth/login', loginData);
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.setItem('hasLaunched', 'true');
    setIsFirstLaunch(false);
    setShowWelcome(false);
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    return res.data;
  };

  const register = async (registerData) => {
    const res = await api.post('/auth/register', registerData);
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    localStorage.setItem('hasLaunched', 'true');
    setIsFirstLaunch(false);
    setShowWelcome(false);
    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  };

  const completeFirstLaunch = () => {
    localStorage.setItem('hasLaunched', 'true');
    setIsFirstLaunch(false);
    setShowWelcome(false);
  };

  const startFirstLaunch = () => {
    setShowWelcome(true);
    setIsFirstLaunch(true);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      logout, 
      isFirstLaunch, 
      showWelcome,
      completeFirstLaunch,
      startFirstLaunch
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

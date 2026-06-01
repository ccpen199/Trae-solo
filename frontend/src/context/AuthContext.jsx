import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('quark_token');
    if (token) {
      checkAuth();
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/profile');
      if (response.data.isLoggedIn) {
        setUser(response.data.user);
        setIsLoggedIn(true);
      }
    } catch (error) {
      localStorage.removeItem('quark_token');
    }
  };

  const login = async (phone, password) => {
    try {
      const response = await axios.post('/api/auth/login', { phone, password });
      localStorage.setItem('quark_token', response.data.token);
      setUser(response.data.user);
      setIsLoggedIn(true);
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    await axios.post('/api/auth/logout');
    localStorage.removeItem('quark_token');
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn,
      login,
      logout,
      showLoginModal,
      setShowLoginModal
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

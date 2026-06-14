import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data.user);
    } catch (err) {
      console.error('加载用户信息失败', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, password) => {
    const res = await api.post('/auth/login', { phone, password });
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (phone, password, nickname, role = 'user', realName = '', idCard = '') => {
    const data = { phone, password, nickname, role };
    if (realName && idCard) {
      data.real_name = realName;
      data.id_card = idCard;
    }
    const res = await api.post('/auth/register', data);
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  };

  const verifyIdentity = async (realName, idCard) => {
    const res = await api.post('/auth/verify', { real_name: realName, id_card: idCard });
    setUser(res.data.user);
    return res.data;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      verifyIdentity,
      refreshUser: loadUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

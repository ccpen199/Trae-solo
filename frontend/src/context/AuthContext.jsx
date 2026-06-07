import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.auth.profile();
      setUser(data);
    } catch (e) {
      localStorage.removeItem('token');
    }
    setLoading(false);
  };

  const login = async (data) => {
    const result = await api.auth.login(data);
    localStorage.setItem('token', result.token);
    setUser(result.user);
    return result;
  };

  const register = async (data) => {
    const result = await api.auth.register(data);
    localStorage.setItem('token', result.token);
    setUser(result.user);
    return result;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshProfile = loadProfile;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

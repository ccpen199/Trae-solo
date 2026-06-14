import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getUser, clearAuth } from '../utils/auth';
import api from '../utils/api';
import { useTranslation } from '../i18n';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('cn');

  useEffect(() => {
    const initAuth = async () => {
      const savedUser = getUser();
      if (savedUser) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data.user);
        } catch (error) {
          clearAuth();
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const { t } = useTranslation(language);

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'cn' ? 'en' : 'cn');
  };

  const value = useMemo(() => ({
    user,
    setUser,
    loading,
    language,
    setLanguage,
    toggleLanguage,
    logout,
    t,
    isAuthenticated: !!user,
    isJobseeker: user?.role === 'jobseeker',
    isCompany: user?.role === 'company',
    isAdmin: user?.role === 'admin',
  }), [user, loading, language, t]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

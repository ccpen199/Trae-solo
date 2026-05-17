import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('yunote_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        loadUserProfile();
      } catch (e) {
        localStorage.removeItem('yunote_token');
        localStorage.removeItem('yunote_user');
      }
    }
    setLoading(false);
  }, []);

  const loadUserProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data.user);
      localStorage.setItem('yunote_user', JSON.stringify(res.data.user));
    } catch (err) {
      console.error('加载用户信息失败:', err);
    }
  };

  const login = async (phone, code) => {
    const res = await api.post('/auth/login/phone', { phone, code });
    localStorage.setItem('yunote_token', res.data.token);
    localStorage.setItem('yunote_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const loginWithPlatform = async (platform, platformId, nickname) => {
    const res = await api.post('/auth/login/platform', { platform, platformId, nickname });
    localStorage.setItem('yunote_token', res.data.token);
    localStorage.setItem('yunote_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('yunote_token');
    localStorage.removeItem('yunote_user');
    setUser(null);
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AppContext.Provider value={{
      user,
      setUser,
      loading,
      login,
      loginWithPlatform,
      logout,
      refreshUser: loadUserProfile,
      showToast
    }}>
      {children}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          borderRadius: '8px',
          background: toast.type === 'error' ? '#ff4d4f' : toast.type === 'success' ? '#52c41a' : '#1890ff',
          color: 'white',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {toast.message}
        </div>
      )}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

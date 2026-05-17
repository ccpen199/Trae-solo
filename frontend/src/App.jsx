import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Posts from './pages/Posts';
import LiveRoom from './pages/LiveRoom';
import Rank from './pages/Rank';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import Layout from './components/Layout';
import { useStore } from './store';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useStore();
  const [requireLogin, setRequireLogin] = useState(false);

  useEffect(() => {
    const protectedPaths = ['/profile'];
    const actionsNeedLogin = location.state?.needLogin;
    
    if (!token && (protectedPaths.includes(location.pathname) || actionsNeedLogin)) {
      setRequireLogin(true);
      setTimeout(() => {
        navigate('/login', { state: { from: location.pathname } });
      }, 0);
    } else {
      setRequireLogin(false);
    }
  }, [token, location.pathname, location.state?.needLogin, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="posts" element={<Posts />} />
        <Route path="live/:id" element={<LiveRoom />} />
        <Route path="rank" element={<Rank />} />
        <Route path="profile" element={<Profile />} />
        <Route path="user/:id" element={<UserProfile />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

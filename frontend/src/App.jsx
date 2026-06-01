import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import DailyPage from './pages/DailyPage';
import FocusPage from './pages/FocusPage';
import SleepPage from './pages/SleepPage';
import BreathPage from './pages/BreathPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FocusRunning from './pages/FocusRunning';
import SleepRunning from './pages/SleepRunning';
import BreathRunning from './pages/BreathRunning';
import FocusComplete from './pages/FocusComplete';
import SleepComplete from './pages/SleepComplete';
import BreathComplete from './pages/BreathComplete';
import { useAuthStore } from './store';
import { authAPI } from './services/api';

function App() {
  const location = useLocation();
  const { isLoggedIn, token, updateUser } = useAuthStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isLoggedIn && token) {
      authAPI.getMe().catch(() => {});
    }
  }, [isLoggedIn, token]);

  const hideNavPages = [
    '/focus/running', 
    '/focus/complete',
    '/sleep/running', 
    '/sleep/complete',
    '/breath/running',
    '/breath/complete',
    '/login', 
    '/register'
  ];
  const shouldShowNav = !hideNavPages.includes(location.pathname);

  return (
    <div className="app-container">
      {!isOnline && <div className="offline-indicator">当前网络不可用</div>}
      
      <div className="main-content">
        <Routes>
          <Route path="/" element={<DailyPage />} />
          <Route path="/focus" element={<FocusPage />} />
          <Route path="/focus/running" element={<FocusRunning />} />
          <Route path="/focus/complete" element={<FocusComplete />} />
          <Route path="/sleep" element={<SleepPage />} />
          <Route path="/sleep/running" element={<SleepRunning />} />
          <Route path="/sleep/complete" element={<SleepComplete />} />
          <Route path="/breath" element={<BreathPage />} />
          <Route path="/breath/running" element={<BreathRunning />} />
          <Route path="/breath/complete" element={<BreathComplete />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </div>

      {shouldShowNav && <BottomNav />}
    </div>
  );
}

export default App;

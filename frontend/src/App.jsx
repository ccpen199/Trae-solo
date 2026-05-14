import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';
import Login from './pages/Login';
import Home from './pages/Home';
import Chat from './pages/Chat';
import World from './pages/World';
import Profile from './pages/Profile';
import Capture from './pages/Capture';
import Contacts from './pages/Contacts';
import MomentPlayer from './pages/MomentPlayer';
import History from './pages/History';
import Favorites from './pages/Favorites';
import PrivacySettings from './pages/PrivacySettings';
import BottomNav from './components/BottomNav';

function AppContent() {
  const { token } = useAuthStore();
  const location = useLocation();
  
  const showNav = ['/', '/world', '/profile', '/contacts'].includes(location.pathname);

  if (!token) {
    return (
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat/:chatId" element={<Chat />} />
        <Route path="/world" element={<World />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/capture" element={<Capture />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/moment/:momentId" element={<MomentPlayer />} />
        <Route path="/history" element={<History />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/privacy" element={<PrivacySettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}

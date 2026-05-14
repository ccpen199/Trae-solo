import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useStore from './store/useStore';
import { ToastContainer } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import BottomNav from './components/BottomNav';

import Login from './pages/Login';
import Square from './pages/Square';
import Planet from './pages/Planet';
import CreatePost from './pages/CreatePost';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Profile from './pages/Profile';

const AppContent: React.FC = () => {
  const { isAuthenticated, initAuth } = useStore();
  const location = useLocation();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const showBottomNav = ['/', '/planet', '/messages', '/profile'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={isAuthenticated ? <Square /> : <Navigate to="/login" />} />
        <Route path="/planet" element={isAuthenticated ? <Planet /> : <Navigate to="/login" />} />
        <Route path="/post" element={isAuthenticated ? <CreatePost /> : <Navigate to="/login" />} />
        <Route path="/messages" element={isAuthenticated ? <Messages /> : <Navigate to="/login" />} />
        <Route path="/chat/:userId" element={isAuthenticated ? <Chat /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {showBottomNav && isAuthenticated && <BottomNav />}
      <ToastContainer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;

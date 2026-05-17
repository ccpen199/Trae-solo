import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/common/Toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import useAuthStore from './store/authStore';

import Bookshelf from './pages/Bookshelf';
import Explore from './pages/Explore';
import Vip from './pages/Vip';
import Profile from './pages/Profile';
import Login from './pages/Login';
import BookDetail from './pages/BookDetail';
import Reader from './pages/Reader';

const App = () => {
  const { init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Bookshelf />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/vip" element={<Vip />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/reader/:id" element={<Reader />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;

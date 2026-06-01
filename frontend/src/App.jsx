import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import NewsDetailPage from './pages/NewsDetailPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import Header from './components/Header';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/*" element={
          <>
            <Header />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/news/:id" element={<NewsDetailPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;

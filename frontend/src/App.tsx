import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useStore } from './store/useStore';
import { authApi } from './lib/api';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast } from './components/Toast';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AvatarSetup } from './pages/AvatarSetup';
import { ChatRoom } from './pages/ChatRoom';
import { Feed } from './pages/Feed';
import { Communities } from './pages/Communities';
import { Profile } from './pages/Profile';
import type { User as UserType } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useStore();
  
  if (token) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { token, setUser, setToken } = useStore();
  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState(false);
  
  const initializeApp = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(false);
    
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        const data = response.data as { user: UserType };
        setUser(data.user);
      } else {
        setToken(null);
      }
    } catch (err) {
      console.error('Initialize app error:', err);
      setToken(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [token, setUser, setToken]);
  
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
          <p className="text-white/70">加载中...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">加载失败</h2>
          <p className="text-white/70 mb-6">无法连接到服务器，请检查网络连接。</p>
          <button
            onClick={initializeApp}
            className="btn-primary"
          >
            重试
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <Router>
      <ErrorBoundary>
        <Toast />
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/avatar-setup"
            element={
              <ProtectedRoute>
                <Layout>
                  <AvatarSetup />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Home />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Layout>
                  <ChatRoom />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <Layout>
                  <Feed />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/communities"
            element={
              <ProtectedRoute>
                <Layout>
                  <Communities />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;

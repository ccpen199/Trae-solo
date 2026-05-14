import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser } from './api/auth';
import { useAuthStore } from './store/useAuthStore';
import Header from './components/Header';
import Toast from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Articles from './pages/Articles';
import Questions from './pages/Questions';
import ArticleDetail from './pages/ArticleDetail';
import QuestionDetail from './pages/QuestionDetail';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import CreateArticle from './pages/CreateArticle';
import CreateQuestion from './pages/CreateQuestion';
import Settings from './pages/Settings';
import Admin from './pages/Admin';

export default function App() {
  const { user, setUser, clearUser } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token && !user) {
        try {
          const res = await getCurrentUser();
          if (res?.success) {
            setUser(res.data);
          } else {
            localStorage.removeItem('token');
          }
        } catch (err) {
          localStorage.removeItem('token');
        }
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const noHeaderPaths = ['/login', '/register'];
  const showHeader = !noHeaderPaths.includes(location.pathname);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {showHeader && <Header />}
        <main className={showHeader ? 'pt-16' : ''}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/articles" element={<Articles />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/search" element={<Search />} />
              <Route path="/article/:id" element={<ArticleDetail />} />
              <Route path="/question/:id" element={<QuestionDetail />} />
              <Route path="/user/:id" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/create/article" element={<CreateArticle />} />
              <Route path="/create/question" element={<CreateQuestion />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                  <h1 className="text-6xl font-bold text-gray-200 mb-2">404</h1>
                  <p className="text-gray-500 mb-6">页面不存在或已被移除</p>
                  <button
                    onClick={() => navigate('/')}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    返回首页
                  </button>
                </div>
              } />
            </Routes>
          </ErrorBoundary>
        </main>
        <Toast />
      </div>
    </ErrorBoundary>
  );
}

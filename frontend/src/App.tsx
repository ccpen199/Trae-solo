import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DiariesPage from './pages/DiariesPage';
import DiaryDetailPage from './pages/DiaryDetailPage';
import CreateDiaryPage from './pages/CreateDiaryPage';
import DesignersPage from './pages/DesignersPage';
import DesignerDetailPage from './pages/DesignerDetailPage';
import DesignerApplyPage from './pages/DesignerApplyPage';
import InspirationPage from './pages/InspirationPage';
import TransactionsPage from './pages/TransactionsPage';
import TransactionDetailPage from './pages/TransactionDetailPage';
import ProfilePage from './pages/ProfilePage';
import ModerationPage from './pages/ModerationPage';
import { useAuthStore } from './store/authStore';

function App() {
  const { token, fetchCurrentUser } = useAuthStore();
  const [initDone, setInitDone] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (token) await fetchCurrentUser();
      setInitDone(true);
    };
    init();
  }, [token]);

  if (!initDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route index element={<Navigate to="/auth/login" replace />} />
      </Route>

      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="diaries" element={<DiariesPage />} />
        <Route path="diaries/create" element={<CreateDiaryPage />} />
        <Route path="diaries/:id" element={<DiaryDetailPage />} />
        <Route path="designers" element={<DesignersPage />} />
        <Route path="designers/apply" element={<DesignerApplyPage />} />
        <Route path="designers/:id" element={<DesignerDetailPage />} />
        <Route path="inspiration" element={<InspirationPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="transactions/:id" element={<TransactionDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="moderation" element={<ModerationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

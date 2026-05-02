import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, App as AntApp, Spin, Layout, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuthStore } from '@/store';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import QuestionListPage from '@/pages/questions/QuestionList';
import QuestionCreatePage from '@/pages/questions/QuestionCreate';
import ExamPaperListPage from '@/pages/exam-papers/ExamPaperList';
import ExamPaperCreatePage from '@/pages/exam-papers/ExamPaperCreate';
import ExamListPage from '@/pages/exams/ExamList';
import ExamCreatePage from '@/pages/exams/ExamCreate';
import ExamTakingPage from '@/pages/exams/ExamTaking';
import ExamResultPage from '@/pages/exams/ExamResult';
import GradingListPage from '@/pages/grading/GradingList';
import GradingDetailPage from '@/pages/grading/GradingDetail';
import StatisticsPage from '@/pages/statistics/Statistics';
import ExamStatisticsPage from '@/pages/statistics/ExamStatistics';
import KnowledgePointPage from '@/pages/knowledge-points/KnowledgePointList';
import ProfilePage from '@/pages/Profile';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();
  
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  if (isAuthenticated && location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  const { checkAuth, isLoading, setUser, isAuthenticated } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  const initialize = useCallback(async () => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        setUser(user);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    
    setInitialized(true);
    
    if (storedToken) {
      try {
        await checkAuth();
      } catch {
        message.info('登录已过期，请重新登录');
      }
    }
  }, [checkAuth, setUser]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16, color: '#666' }}>初始化中...</div>
      </div>
    );
  }

  return (
    <ConfigProvider locale={zhCN}>
      <AntApp>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Layout style={{ minHeight: '100vh' }}>
                    <LoginPage />
                  </Layout>
                </PublicRoute>
              }
            />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              
              <Route path="questions">
                <Route index element={<QuestionListPage />} />
                <Route path="create" element={<QuestionCreatePage />} />
                <Route path="edit/:id" element={<QuestionCreatePage />} />
              </Route>
              
              <Route path="exam-papers">
                <Route index element={<ExamPaperListPage />} />
                <Route path="create" element={<ExamPaperCreatePage />} />
              </Route>
              
              <Route path="exams">
                <Route index element={<ExamListPage />} />
                <Route path="create" element={<ExamCreatePage />} />
                <Route path="take/:examId" element={<ExamTakingPage />} />
                <Route path="result/:userExamId" element={<ExamResultPage />} />
              </Route>
              
              <Route path="grading">
                <Route index element={<GradingListPage />} />
                <Route path="detail/:userExamId" element={<GradingDetailPage />} />
              </Route>
              
              <Route path="statistics">
                <Route index element={<StatisticsPage />} />
                <Route path="exam/:examId" element={<ExamStatisticsPage />} />
              </Route>
              
              <Route path="knowledge-points" element={<KnowledgePointPage />} />
              
              <Route path="profile" element={<ProfilePage />} />
              
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
};

export default AppRouter;

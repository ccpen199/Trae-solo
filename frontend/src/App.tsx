import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks, { NewTask, TaskDetail } from './pages/Tasks';
import PhotoManagement from './pages/Photos';
import PhotoList from './pages/PhotoList';
import LossManagement from './pages/Loss';
import LossList from './pages/LossList';
import ReviewManagement from './pages/Review';
import ReviewList from './pages/ReviewList';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          isAuthenticated ? <AppLayout /> : <Navigate to="/login" />
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="tasks/new" element={<NewTask />} />
        <Route path="tasks/:id" element={<TaskDetail />} />
        <Route path="photos" element={<PhotoList />} />
        <Route path="photos/:taskId" element={<PhotoManagement />} />
        <Route path="loss" element={<LossList />} />
        <Route path="loss/:taskId" element={<LossManagement />} />
        <Route path="review" element={<ReviewList />} />
        <Route path="review/:taskId" element={<ReviewManagement />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;

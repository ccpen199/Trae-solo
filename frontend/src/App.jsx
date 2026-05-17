import React, { Component } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { useApp } from './store/appContext';
import WhitelistPage from './pages/WhitelistPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import CreditPage from './pages/CreditPage';
import BankCardPage from './pages/BankCardPage';
import AdvanceApplyPage from './pages/AdvanceApplyPage';
import './App.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('页面崩溃:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="加载失败"
          subTitle="页面发生错误，请点击重试"
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              点击重试
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useApp();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <Routes>
          <Route path="/" element={<WhitelistPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/credit" element={
            <ProtectedRoute>
              <CreditPage />
            </ProtectedRoute>
          } />
          <Route path="/bankcard" element={
            <ProtectedRoute>
              <BankCardPage />
            </ProtectedRoute>
          } />
          <Route path="/advance/apply/:commissionId" element={
            <ProtectedRoute>
              <AdvanceApplyPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;

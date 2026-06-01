import React, { Component, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd-mobile';
import zhCN from 'antd-mobile/es/locales/zh-CN';
import { useAuthStore } from './store/useAuthStore';
import LoginPage from './pages/Login';
import ChatPage from './pages/Chat';
import ContactsPage from './pages/Contacts';
import ProfilePage from './pages/Profile';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: 40, 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh'
        }}>
          <h2>😢 页面加载失败</h2>
          <p style={{ color: '#666', margin: '16px 0' }}>{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 24px',
              background: '#1677ff',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer'
            }}
          >
            点击重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent = () => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
      <Route path="/contacts" element={<ContactsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ConfigProvider locale={zhCN}>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
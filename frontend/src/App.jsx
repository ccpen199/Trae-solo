import React, { useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Home, Video, Users, User, MessageCircle } from 'lucide-react';
import useStore from './store';
import Login from './pages/Login';
import HomePage from './pages/Home';
import LiveRoom from './pages/LiveRoom';
import CreateLive from './pages/CreateLive';
import Moments from './pages/Moments';
import Profile from './pages/Profile';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('页面错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
          background: '#f5f5f5'
        }}>
          <h2 style={{ color: '#ff4757' }}>加载失败</h2>
          <p style={{ margin: '10px 0 20px', color: '#666' }}>
            {this.state.error?.message || '点击重试恢复正常使用'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #ff4757, #ff6b81)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children }) => {
  try {
    const isAuthenticated = useStore((state) => state.isAuthenticated);
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  } catch (e) {
    console.error('ProtectedRoute error:', e);
    return children;
  }
};

const BottomNav = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/moments', icon: Users, label: '动态' },
    { path: '/create-live', icon: Video, label: '开播', primary: true },
    { path: '/messages', icon: MessageCircle, label: '消息' },
    { path: '/profile', icon: User, label: '我的' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'white',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0',
      borderTop: '1px solid #eee',
      zIndex: 100
    }}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textDecoration: 'none',
            color: location.pathname === item.path ? '#ff4757' : '#999',
            padding: '4px 12px'
          }}
        >
          {item.primary ? (
            <div style={{
              background: 'linear-gradient(135deg, #ff4757, #ff6b81)',
              borderRadius: '50%',
              padding: '8px',
              marginTop: '-20px',
              boxShadow: '0 4px 12px rgba(255,71,87,0.4)'
            }}>
              <item.icon size={24} color="white" />
            </div>
          ) : (
            <item.icon size={22} />
          )}
          <span style={{ fontSize: '11px', marginTop: '4px' }}>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

const AppContent = () => {
  const location = useLocation();
  const hideNav = ['/login', '/live-room'].includes(location.pathname) || 
    location.pathname.startsWith('/live-room/');

  useEffect(() => {
    try {
      const initFromStorage = useStore.getState().initFromStorage;
      if (initFromStorage) {
        initFromStorage();
      }
    } catch (e) {
      console.error('初始化状态失败:', e);
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: hideNav ? 0 : 60 }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/live-room/:id" element={<LiveRoom />} />
        <Route path="/create-live" element={<ProtectedRoute><CreateLive /></ProtectedRoute>} />
        <Route path="/moments" element={<Moments />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/messages" element={
          <div style={{ padding: 20, textAlign: 'center', paddingTop: 100 }}>
            <h3>消息中心</h3>
            <p style={{ color: '#999', marginTop: 20 }}>暂无新消息</p>
          </div>
        } />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

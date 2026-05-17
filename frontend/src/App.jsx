import React, { Component } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import Record from './pages/Record';
import Login from './pages/Login';
import Toast from './components/Toast';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error" style={{ height: '100vh', background: '#000' }}>
          <span>加载失败</span>
          <button onClick={() => window.location.reload()}>点击重试</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentPath = location.pathname;
  const showNav = ['/', '/search', '/record'].includes(currentPath);

  if (!showNav) return null;

  return (
    <div className="bottom-nav">
      <div 
        className={`nav-item ${currentPath === '/' ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <span className="icon">🏠</span>
        <span>首页</span>
      </div>
      
      <div 
        className={`nav-item ${currentPath === '/search' ? 'active' : ''}`}
        onClick={() => navigate('/search')}
      >
        <span className="icon">🔍</span>
        <span>发现</span>
      </div>
      
      <div 
        className="nav-item record"
        onClick={() => navigate('/record')}
      >
        <span className="icon">+</span>
      </div>
      
      <div className="nav-item">
        <span className="icon">📩</span>
        <span>消息</span>
      </div>
      
      <div className="nav-item">
        <span className="icon">👤</span>
        <span>我</span>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/record" element={<Record />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        <BottomNav />
        <Toast />
      </div>
    </ErrorBoundary>
  );
};

export default App;

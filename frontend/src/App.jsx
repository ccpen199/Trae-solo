import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { userApi, healthApi } from './services/api';
import UserCenter from './pages/UserCenter';
import BusinessPurchase from './pages/BusinessPurchase';
import OrderHistory from './pages/OrderHistory';
import './App.css';

export const AppContext = createContext();

const DEMO_USER_ID = 1;

function Navigation() {
  const location = useLocation();
  const { userInfo } = useContext(AppContext);

  const navItems = [
    { path: '/', label: '用户中心', icon: '👤' },
    { path: '/purchase', label: '业务线消费', icon: '🛒' },
    { path: '/orders', label: '订单记录', icon: '📋' }
  ];

  return (
    <nav className="app-nav">
      <div className="nav-header">
        <div className="logo">
          <span className="logo-icon">🐪</span>
          <span className="logo-text">去哪儿用户中心</span>
        </div>
        {userInfo && (
          <div className="user-info-nav">
            <span className="level-badge" style={{ backgroundColor: userInfo.userInfo?.user?.level_color || '#95A5A6' }}>
              {userInfo.userInfo?.user?.level_icon} {userInfo.userInfo?.user?.level_name}
            </span>
            <span className="user-name">{userInfo.userInfo?.user?.nickname}</span>
          </div>
        )}
      </div>
      <div className="nav-links">
        {navItems.map(item => (
          <Link 
            key={item.path} 
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function App() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState(null);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshUserInfo = async () => {
    try {
      const response = await userApi.getInfo(DEMO_USER_ID);
      if (response.data.success) {
        setUserInfo(response.data.data);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      try {
        const healthResponse = await healthApi.check();
        setHealthStatus(healthResponse.data);
        
        await refreshUserInfo();
      } catch (error) {
        console.error('应用初始化失败:', error);
        setHealthStatus({ 
          success: false, 
          message: '后端服务未启动或连接失败',
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>正在加载去哪儿用户积分成长体系...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ 
      userInfo, 
      refreshUserInfo, 
      DEMO_USER_ID,
      showNotification,
      healthStatus
    }}>
      <div className="app">
        <Navigation />
        <main className="main-content">
          {notification && (
            <div className={`notification ${notification.type}`}>
              {notification.message}
            </div>
          )}
          
          {!healthStatus?.success && (
            <div className="error-banner">
              <p>⚠️ 后端服务连接异常，请确保后端服务已启动</p>
              <p className="hint">后端地址: http://localhost:20776</p>
            </div>
          )}
          
          <Routes>
            <Route path="/" element={<UserCenter />} />
            <Route path="/purchase" element={<BusinessPurchase />} />
            <Route path="/orders" element={<OrderHistory />} />
          </Routes>
        </main>
      </div>
    </AppContext.Provider>
  );
}

export default App;

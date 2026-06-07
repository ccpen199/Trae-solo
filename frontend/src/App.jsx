
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useStore from './store.js';
import { authAPI, messageAPI } from './api.js';

import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Jobs from './pages/Jobs.jsx';
import JobDetail from './pages/JobDetail.jsx';
import Referrals from './pages/Referrals.jsx';
import ReferralDetail from './pages/ReferralDetail.jsx';
import Companies from './pages/Companies.jsx';
import CompanyDetail from './pages/CompanyDetail.jsx';
import Messages from './pages/Messages.jsx';
import Onboarding from './pages/Onboarding.jsx';
import OnboardingDetail from './pages/OnboardingDetail.jsx';
import Admin from './pages/Admin.jsx';
import Friends from './pages/Friends.jsx';
import PostJob from './pages/PostJob.jsx';

function PrivateRoute({ children, roles }) {
  const { user, token } = useStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function Header() {
  const { user, unreadCount, logout } = useStore();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const navItems = [
    { path: '/', label: '首页' },
    { path: '/jobs', label: '职位' },
    { path: '/referrals', label: '内推' },
    { path: '/companies', label: '企业' },
    { path: '/friends', label: '好友' },
    { path: '/messages', label: '消息' },
  ];

  if (user?.role === 'employer' || user?.role === 'admin') {
    navItems.push({ path: '/onboarding', label: '入职' });
  }
  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: '管理' });
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (e) {}
    logout();
    setShowMenu(false);
  };

  if (!user) return null;

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">
          <span>🤝</span> 熟人推荐
        </Link>
        <nav className="nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
              {item.path === '/messages' && unreadCount > 0 && (
                <span className="badge">{unreadCount}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="header-right">
          <div className="user-info" onClick={() => setShowMenu(!showMenu)}>
            <div className="avatar">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <span>{user.username}</span>
            {showMenu && (
              <div style={{ position: 'absolute', right: 0, top: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: 8, minWidth: 150, zIndex: 1000 }}>
                <div style={{ padding: '8px 12px', color: '#666', fontSize: 13, borderBottom: '1px solid #f0f0f0' }}>
                  {user.role === 'jobseeker' ? '求职者' : user.role === 'employer' ? '企业用户' : '管理员'}
                </div>
                {(user.role === 'employer' || user.role === 'admin') && (
                  <Link to="/post-job" style={{ display: 'block', padding: '8px 12px', cursor: 'pointer', color: '#333', fontSize: 13 }} onClick={() => setShowMenu(false)}>
                    发布职位
                  </Link>
                )}
                <div style={{ padding: '8px 12px', cursor: 'pointer', color: '#ff4d4f', fontSize: 13 }} onClick={handleLogout}>
                  退出登录
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const { token, user, setUser, setUnreadCount, init } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const initUser = async () => {
      if (token && !user) {
        try {
          const res = await authAPI.me();
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (e) {
          console.error('获取用户信息失败:', e);
        }
      }
      setLoading(false);
    };
    initUser();
  }, [token, user, setUser]);

  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        try {
          const res = await messageAPI.unreadCount();
          setUnreadCount(res.data.count || 0);
        } catch (e) {}
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [user, setUnreadCount]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {token && <Header />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } />
        <Route path="/jobs" element={
          <PrivateRoute>
            <Jobs />
          </PrivateRoute>
        } />
        <Route path="/jobs/:id" element={
          <PrivateRoute>
            <JobDetail />
          </PrivateRoute>
        } />
        <Route path="/post-job" element={
          <PrivateRoute roles={['employer', 'admin']}>
            <PostJob />
          </PrivateRoute>
        } />
        <Route path="/referrals" element={
          <PrivateRoute>
            <Referrals />
          </PrivateRoute>
        } />
        <Route path="/referrals/:id" element={
          <PrivateRoute>
            <ReferralDetail />
          </PrivateRoute>
        } />
        <Route path="/companies" element={
          <PrivateRoute>
            <Companies />
          </PrivateRoute>
        } />
        <Route path="/companies/:id" element={
          <PrivateRoute>
            <CompanyDetail />
          </PrivateRoute>
        } />
        <Route path="/friends" element={
          <PrivateRoute>
            <Friends />
          </PrivateRoute>
        } />
        <Route path="/messages" element={
          <PrivateRoute>
            <Messages />
          </PrivateRoute>
        } />
        <Route path="/onboarding" element={
          <PrivateRoute roles={['jobseeker', 'employer', 'admin']}>
            <Onboarding />
          </PrivateRoute>
        } />
        <Route path="/onboarding/:id" element={
          <PrivateRoute>
            <OnboardingDetail />
          </PrivateRoute>
        } />
        <Route path="/admin" element={
          <PrivateRoute roles={['admin']}>
            <Admin />
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

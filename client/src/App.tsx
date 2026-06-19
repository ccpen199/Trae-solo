import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import { ToastProvider } from './components/ToastProvider';
import Login from './pages/Login';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import Withdrawal from './pages/Withdrawal';
import Invite from './pages/Invite';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useUserStore((s) => s.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const TabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tabs = [
    { key: '/', icon: '🏠', label: '首页' },
    { key: '/tasks', icon: '🎯', label: '任务' },
    { key: '/wallet', icon: '💰', label: '金币' },
    { key: '/profile', icon: '👤', label: '我的' },
  ];

  const hideOn = ['/login', '/withdrawal', '/invite'];
  if (hideOn.some((p) => location.pathname.startsWith(p))) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-50 max-w-md mx-auto"
      style={{ boxShadow: '0 -2px 20px rgba(0,0,0,0.05)' }}
    >
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const active = location.pathname === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.key)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                active ? 'text-primary' : 'text-gray-400'
              }`}
            >
              <div className={`text-2xl ${active ? 'scale-110' : ''} transition-transform`}>
                {tab.icon}
              </div>
              <div className="text-xs mt-0.5 font-medium">{tab.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative pb-20">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/tasks"
            element={
              <RequireAuth>
                <Tasks />
              </RequireAuth>
            }
          />
          <Route
            path="/wallet"
            element={
              <RequireAuth>
                <Wallet />
              </RequireAuth>
            }
          />
          <Route
            path="/withdrawal"
            element={
              <RequireAuth>
                <Withdrawal />
              </RequireAuth>
            }
          />
          <Route
            path="/invite"
            element={
              <RequireAuth>
                <Invite />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <TabBar />
      </div>
    </ToastProvider>
  );
};

export default App;

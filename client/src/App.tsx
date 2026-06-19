import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import Login from './pages/Login';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import Withdrawal from './pages/Withdrawal';
import Invite from './pages/Invite';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useUserStore((s) => s.token);
  const navigate = useNavigate();
  const login = useUserStore((s) => s.login);

  useEffect(() => {
    if (!token) {
      login().catch(() => navigate('/login'));
    }
  }, []);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-primary text-4xl animate-bounce">🪙</div>
      </div>
    );
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

  if (location.pathname.startsWith('/login') || location.pathname.startsWith('/withdrawal') || location.pathname.startsWith('/invite')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-50 max-w-md mx-auto" style={{ boxShadow: '0 -2px 20px rgba(0,0,0,0.05)' }}>
      <div className="flex justify-around py-2">
        {tabs.map((tab) => {
          const active = location.pathname === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.key)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${active ? 'text-primary' : 'text-gray-400'}`}
            >
              <div className={`text-2xl ${active ? 'scale-110' : ''} transition-transform`}>{tab.icon}</div>
              <div className={`text-xs mt-0.5 font-medium ${active ? '' : ''}`}>{tab.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Toast: React.FC<{ message: string | null }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-xl text-sm z-[999] bounce-in">
      {message}
    </div>
  );
};

export const useToast = () => {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string, d = 1500) => {
    setMsg(m);
    setTimeout(() => setMsg(null), d);
  };
  return { Toast, show };
};

const App: React.FC = () => {
  const { Toast, show } = useToast();
  (window as any).toast = show;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 relative pb-20">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/withdrawal" element={<Withdrawal />} />
                <Route path="/invite" element={<Invite />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <TabBar />
            </>
          </ProtectedRoute>
        } />
      </Routes>
      <Toast />
    </div>
  );
};

export default App;

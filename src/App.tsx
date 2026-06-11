import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import {
  Home as HomeIcon,
  ClipboardList,
  Users,
  Wallet,
  BarChart3,
  Bell,
  User,
} from 'lucide-react';
import ProtectedRoute from './components/ProtectedRoute';
import Loading from './components/Loading';
import Login from './pages/Login';
import Home from './pages/Home';
import Attendance from './pages/Attendance';
import CheckIn from './pages/CheckIn';
import Students from './pages/Students';
import Funding from './pages/Funding';
import Statistics from './pages/Statistics';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [initializing, setInitializing] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const hideTabBarRoutes = ['/login'];
  const showTabBar = !hideTabBarRoutes.includes(location.pathname);

  const tabs = [
    { key: '/', title: '首页', icon: <HomeIcon size={20} /> },
    { key: '/attendance', title: '考勤', icon: <ClipboardList size={20} /> },
    { key: '/students', title: '学生', icon: <Users size={20} /> },
    { key: '/funding', title: '资助', icon: <Wallet size={20} /> },
    { key: '/statistics', title: '统计', icon: <BarChart3 size={20} /> },
    { key: '/alerts', title: '预警', icon: <Bell size={20} /> },
    { key: '/profile', title: '我的', icon: <User size={20} /> },
  ];

  const handleTabChange = (key: string) => {
    navigate(key);
  };

  if (initializing) {
    return <Loading fullScreen text="系统启动中..." />;
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-page)]">
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/checkin"
            element={
              <ProtectedRoute>
                <CheckIn />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/funding"
            element={
              <ProtectedRoute>
                <Funding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <ProtectedRoute>
                <Statistics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>

      {showTabBar && (
        <div className="flex-shrink-0 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
          <TabBar
            activeKey={location.pathname}
            onChange={handleTabChange}
            safeArea={false}
            style={{
              '--active-color': '#1E40AF',
              '--text-color': '#9CA3AF',
            } as React.CSSProperties}
          >
            {tabs.map((item) => (
              <TabBar.Item key={item.key} title={item.title} icon={item.icon} />
            ))}
          </TabBar>
        </div>
      )}
    </div>
  );
};

export default App;

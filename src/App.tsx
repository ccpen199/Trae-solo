import { useState, useEffect } from 'react';
import { Home, List, User, Shield, LogOut } from 'lucide-react';
import Login from './pages/Login';
import HomePage from './pages/Home';
import StationDetail from './pages/StationDetail';
import Charging from './pages/Charging';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import AdminDevices from './pages/AdminDevices';
import AdminWorkOrders from './pages/AdminWorkOrders';
import AdminAlarms from './pages/AdminAlarms';
import AdminAnalytics from './pages/AdminAnalytics';
import { getToken, getUser, getCurrentPage, setCurrentPage, logout, getRoleHome } from './lib/appState';

interface UserType {
  id: number;
  phone: string;
  nickname: string;
  role: string;
  balance: number;
  vehicle_info?: string;
}

function initState() {
  const token = getToken();
  const user = getUser();
  let page = getCurrentPage();

  console.log('[App] 初始化状态:');
  console.log('  token:', token ? `存在 (${token.length} chars)` : '不存在');
  console.log('  user:', user ? `${user.nickname} (${user.role})` : '不存在');
  console.log('  currentPage:', page);

  if (token && user) {
    if (page === 'login' || !page) {
      page = getRoleHome(user.role);
      console.log('  修正目标页面:', page);
      localStorage.setItem('currentPage', page);
    }
    return { token, user, currentPage: page };
  }

  console.log('  未登录，跳转登录页');
  localStorage.setItem('currentPage', 'login');
  return { token: null, user: null, currentPage: 'login' };
}

export default function App() {
  const initialState = initState();
  const [token, setTokenState] = useState<string | null>(initialState.token);
  const [user, setUserState] = useState<UserType | null>(initialState.user);
  const [currentPage, setCurrentPageState] = useState<string>(initialState.currentPage);

  console.log('[App] 渲染: token=' + (token ? '有' : '无') + ', page=' + currentPage + ', user=' + (user?.nickname || '无'));

  const setPage = (page: string) => {
    console.log('[App] 设置页面:', page);
    setCurrentPage(page);
    setCurrentPageState(page);
  };

  const handleLogout = () => {
    console.log('[App] 退出登录');
    logout();
    setTokenState(null);
    setUserState(null);
    setCurrentPageState('login');
  };

  useEffect(() => {
    const handlePageChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('[App] 收到 pagechange 事件:', customEvent.detail);
      setCurrentPageState(customEvent.detail);
    };

    const handleUserChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('[App] 收到 userchange 事件:', customEvent.detail?.nickname);
      setUserState(customEvent.detail);
    };

    const handleLogoutEvent = () => {
      console.log('[App] 收到 logout 事件');
      setTokenState(null);
      setUserState(null);
      setCurrentPageState('login');
    };

    window.addEventListener('pagechange', handlePageChange);
    window.addEventListener('userchange', handleUserChange);
    window.addEventListener('logout', handleLogoutEvent);

    return () => {
      window.removeEventListener('pagechange', handlePageChange);
      window.removeEventListener('userchange', handleUserChange);
      window.removeEventListener('logout', handleLogoutEvent);
    };
  }, []);

  const renderPage = () => {
    if (!token) {
      console.log('[App] 渲染登录页');
      return <Login />;
    }

    console.log('[App] 渲染页面:', currentPage);
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'station-detail':
        return <StationDetail />;
      case 'charging':
        return <Charging />;
      case 'orders':
        return <Orders />;
      case 'order-detail':
        return <OrderDetail />;
      case 'profile':
        return <Profile />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'admin-devices':
        return <AdminDevices />;
      case 'admin-workorders':
        return <AdminWorkOrders />;
      case 'admin-alarms':
        return <AdminAlarms />;
      case 'admin-analytics':
        return <AdminAnalytics />;
      default:
        console.log('[App] 未知页面，跳转首页:', currentPage);
        const target = getRoleHome(user?.role || 'owner');
        setPage(target);
        return null;
    }
  };

  const isAdminPage = ['admin-dashboard', 'admin-devices', 'admin-workorders', 'admin-alarms', 'admin-analytics'].includes(currentPage);
  const showBottomNav = !!token && ['home', 'orders', 'profile'].includes(currentPage);
  const showAdminNav = !!token && isAdminPage && (user?.role === 'admin' || user?.role === 'operator');

  const adminNavItems = [
    { id: 'admin-dashboard', label: '概览' },
    { id: 'admin-devices', label: '设备' },
    { id: 'admin-alarms', label: '告警' },
    { id: 'admin-workorders', label: '工单' },
    { id: 'admin-analytics', label: '分析' },
  ];

  const ownerNavItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'orders', label: '订单', icon: List },
    { id: 'profile', label: '我的', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {showAdminNav && (
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-600" />
              <span className="font-bold text-gray-800">运营管理后台</span>
              <span className="text-xs text-gray-400">· {user?.nickname}</span>
            </div>
            <div className="flex gap-1 items-center">
              {adminNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    currentPage === item.id
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => setPage('home')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-blue-500 hover:bg-blue-50 ml-2"
              >
                车主端
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 flex items-center gap-1"
              >
                <LogOut className="w-4 h-4" />
                退出
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={showAdminNav ? '' : showBottomNav ? 'pb-20' : ''}>
        {renderPage()}
      </div>

      {showBottomNav && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-20">
          <div className="max-w-4xl mx-auto flex">
            {ownerNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${currentPage === item.id ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <item.icon className={`w-6 h-6 ${currentPage === item.id ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
            {(user?.role === 'admin' || user?.role === 'operator') && (
              <button
                onClick={() => setPage('admin-dashboard')}
                className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500 transition-colors"
              >
                <Shield className="w-6 h-6" />
                <span className="text-xs font-medium">管理</span>
              </button>
            )}
            {token && (
              <button
                onClick={handleLogout}
                className="flex-1 py-3 flex flex-col items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-6 h-4" />
                <span className="text-xs font-medium">退出</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

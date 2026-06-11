import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Users, MessageSquare, Clock,
  DollarSign, Cat, Star, ShieldAlert, Settings, ChevronLeft,
  ChevronRight, Bell, Search, Menu, UserCircle
} from 'lucide-react';
import { useAppStore } from '@/store';

const navItems = [
  { key: 'dashboard', label: '工作台', icon: LayoutDashboard, path: '/' },
  { key: 'jobs', label: '岗位管理', icon: Briefcase, path: '/jobs' },
  { key: 'talents', label: '人才库', icon: Users, path: '/talents' },
  { key: 'interviews', label: '面试中心', icon: MessageSquare, path: '/interviews' },
  { key: 'attendance', label: '考勤管理', icon: Clock, path: '/attendance' },
  { key: 'settlement', label: '结算中心', icon: DollarSign, path: '/settlement' },
  { key: 'micro-tasks', label: '喵任务', icon: Cat, path: '/micro-tasks' },
  { key: 'credit', label: '信用体系', icon: Star, path: '/credit' },
  { key: 'risk', label: '风控预警', icon: ShieldAlert, path: '/risk' },
  { key: 'admin', label: '系统管理', icon: Settings, path: '/admin' },
  { key: 'profile', label: '个人中心', icon: UserCircle, path: '/profile' },
];

function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, activeMenu, setActiveMenu } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (item: typeof navItems[0]) => {
    setActiveMenu(item.key);
    navigate(item.path);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-primary-dark text-white z-30 transition-all duration-300 flex flex-col ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        {!sidebarCollapsed && (
          <h1 className="font-heading font-bold text-lg tracking-wide truncate">
            校园兼职平台
          </h1>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="ml-auto p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path)) ||
            (item.key === 'dashboard' && location.pathname === '/');
          return (
            <button
              key={item.key}
              onClick={() => handleNav(item)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-accent text-white shadow-lg shadow-accent/25'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <Icon size={20} />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function TopBar() {
  const { currentUser, notifications, markNotificationRead } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const searchResults = searchTerm.trim()
    ? navItems.filter((item) => item.label.includes(searchTerm.trim()) || item.path.includes(searchTerm.trim()))
    : [];

  const submitSearch = () => {
    const keyword = searchTerm.trim();
    if (!keyword) return;
    navigate(`/jobs?search=${encodeURIComponent(keyword)}`);
    setSearchTerm('');
  };

  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .map((seg, i, arr) => ({
      label: seg,
      isLast: i === arr.length - 1,
    }));

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-0 z-20">
      <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
        <Menu size={20} />
      </button>
      <nav className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">首页</span>
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-gray-300">/</span>
            <span className={crumb.isLast ? 'text-primary font-medium' : 'text-gray-500'}>
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitSearch();
            }}
            placeholder="搜索岗位、学生或功能..."
            className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary-light/50"
          />
          {searchTerm.trim() && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-40">
              {searchResults.length > 0 ? searchResults.slice(0, 5).map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    navigate(item.path);
                    setSearchTerm('');
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                >
                  {item.label}
                  <span className="block text-xs text-gray-400 mt-0.5">{item.path}</span>
                </button>
              )) : (
                <button onClick={submitSearch} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50">
                  在岗位管理中搜索“{searchTerm.trim()}”
                </button>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-xs rounded-full w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold animate-pulse-glow">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 max-h-96 overflow-y-auto">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markNotificationRead(n.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    !n.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <p className="text-sm font-medium text-gray-800">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{n.createdAt}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="个人中心"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
              {currentUser.name[0]}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden md:block">
              {currentUser.name}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default function Layout() {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-bg-warm">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <TopBar />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

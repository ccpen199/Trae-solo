import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home,
  Shield,
  Briefcase,
  GraduationCap,
  FileText,
  MessageCircle,
  BarChart3,
  User,
  ChevronLeft,
  LogOut,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { useEffect } from 'react';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/social-security', label: '社保服务', icon: Shield },
  { path: '/employment', label: '就业服务', icon: Briefcase },
  { path: '/talent', label: '人才服务', icon: GraduationCap },
  { path: '/labor', label: '劳动关系', icon: FileText },
  { path: '/policy', label: '政策问答', icon: MessageCircle },
  { path: '/monitor', label: '效能监测', icon: BarChart3, adminOnly: true },
  { path: '/profile', label: '个人中心', icon: User },
];

export default function Layout() {
  const { user, token, sidebarCollapsed, toggleSidebar, logout, mode } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  if (!token) return null;

  const filteredNav = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'admin',
  );

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-56'
        } bg-primary-700 text-white flex flex-col transition-all duration-300 shrink-0`}
      >
        <div className="h-14 flex items-center justify-center border-b border-primary-600">
          {sidebarCollapsed ? (
            <Shield className="w-7 h-7" />
          ) : (
            <span className="text-lg font-semibold tracking-wide">人社中台</span>
          )}
        </div>
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-800 text-white'
                    : 'text-primary-200 hover:bg-primary-600 hover:text-white'
                } ${sidebarCollapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center h-10 border-t border-primary-600 text-primary-200 hover:text-white transition-colors"
        >
          <ChevronLeft
            className={`w-5 h-5 transition-transform ${
              sidebarCollapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                mode === 'personal'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-accent-100 text-accent-700'
              }`}
            >
              {mode === 'personal' ? '个人模式' : '企业模式'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-600">{user?.name || '未登录'}</span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-danger-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

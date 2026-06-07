import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Receipt,
  CalendarDays,
  Bell,
  Settings,
  Globe,
  Clock,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useI18nStore } from '@/store/i18n';
import { formatDateTime } from '@/lib/api';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { language, setLanguage, t } = useI18nStore();
  const navigate = useNavigate();

  useEffect(() => {
    useI18nStore.getState().loadTranslations(language);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: LayoutDashboard, labelKey: 'dashboard', namespace: 'dashboard' },
    { path: '/properties', icon: Building2, labelKey: 'properties', namespace: 'property' },
    { path: '/owners', icon: Users, labelKey: 'owners', namespace: 'property' },
    { path: '/tenants', icon: Users, labelKey: 'tenants', namespace: 'property' },
    { path: '/leases', icon: FileText, labelKey: 'leases', namespace: 'property' },
    { path: '/loans', icon: Receipt, labelKey: 'loans', namespace: 'property' },
    { path: '/tax', icon: FileText, labelKey: 'tax_returns', namespace: 'property' },
    { path: '/reports', icon: FileText, labelKey: 'reports', namespace: 'common' },
    { path: '/appointments', icon: CalendarDays, labelKey: 'appointments', namespace: 'common' },
    { path: '/reminders', icon: Bell, labelKey: 'reminders', namespace: 'common' },
    { path: '/compliance', icon: Settings, labelKey: 'compliance', namespace: 'compliance' },
    { path: '/mall', icon: ShoppingBag, labelKey: 'mall', namespace: 'common' },
    { path: '/sync', icon: Settings, labelKey: 'sync', namespace: 'common' },
  ];

  function ShoppingBag(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-800 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-bold">AusAsset Pro</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-700 rounded-lg"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 mx-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              {sidebarOpen && (
                <span className="ml-3">
                  {t(item.labelKey, item.namespace as any)}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {t('welcome', 'auth')}, {user?.full_name}
              </h2>
              {user?.timezone && (
                <span className="text-sm text-gray-500 flex items-center">
                  <Clock size={14} className="mr-1" />
                  {formatDateTime(new Date(), user.timezone)}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Globe size={16} className="mr-2" />
                {language === 'zh' ? '中文' : 'English'}
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded-lg"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {user?.full_name?.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user?.full_name}
                  </span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut size={16} className="mr-2" />
                      {t('logout', 'auth')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

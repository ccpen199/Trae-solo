import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  PawPrint,
  Calendar,
  FileText,
  ShoppingBag,
  MessageCircle,
  HeartPulse,
  User,
  Menu,
  X,
  Bell,
  Settings,
  LogOut,
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  Store,
} from 'lucide-react';
import { Avatar, Badge } from '@/components/common/BadgeTagAvatar';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/utils/common';

interface OwnerLayoutProps {
  children: React.ReactNode;
}

const ownerNavItems = [
  { path: '/owner', label: '首页', icon: Home },
  { path: '/owner/pets', label: '宠物档案', icon: PawPrint },
  { path: '/owner/booking', label: '服务预约', icon: Calendar },
  { path: '/owner/health-records', label: '健康档案', icon: FileText },
  { path: '/owner/shop', label: '购买/提交订单', icon: ShoppingBag },
  { path: '/owner/consult', label: '在线问诊', icon: MessageCircle },
  { path: '/owner/symptom-check', label: '症状自查', icon: HeartPulse },
  { path: '/owner/member', label: '会员中心', icon: User },
  { path: '/store', label: '管理后台', icon: LayoutDashboard },
];

export function OwnerLayout({ children }: OwnerLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-white border-r border-neutral-200 flex-shrink-0 overflow-hidden"
          >
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-neutral-100">
                <Link to="/owner" className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
                    <PawPrint className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="font-display text-lg font-bold text-neutral-900">宠护康</h1>
                    <p className="text-xs text-neutral-500">宠物健康管理平台</p>
                  </div>
                </Link>
              </div>

              <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1">
                {ownerNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  const handleOwnerNavClick = () => {
                    if (item.path === '/store') {
                      navigate('/store');
                    }
                  };

                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={handleOwnerNavClick}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                          isActive
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                          )}
                        >
                          <Icon
                            className={cn(
                              'w-5 h-5 transition-colors',
                              isActive ? 'text-primary-600' : 'text-neutral-400 group-hover:text-neutral-600'
                            )}
                          />
                          <span>{item.label}</span>
                          {item.path === '/consult' && (
                            <Badge variant="accent" size="sm" className="ml-auto">
                              2
                            </Badge>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="p-4 border-t border-neutral-100">
                <div className="bg-gradient-to-br from-primary-50 to-mint-50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={user?.avatar} name={user?.nickname || '用户'} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">
                        {user?.nickname || '用户'}
                      </p>
                      <p className="text-xs text-neutral-500">黄金会员 · Lv.3</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div>
              <h2 className="font-display text-lg font-semibold text-neutral-900">
                {ownerNavItems.find((i) => i.path === location.pathname)?.label || '首页'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full" />
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2"
              >
                <Avatar src={user?.avatar} name={user?.nickname || ''} size="sm" />
                <span className="hidden md:inline text-sm font-medium">
                  {user?.nickname || '用户'}
                </span>
              </Button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-float border border-neutral-100 py-2 z-50"
                  >
                    <button className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      账户设置
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

interface StoreLayoutProps {
  children: React.ReactNode;
}

const storeNavItems = [
  { path: '/store', label: '管理后台', icon: LayoutDashboard },
  { path: '/store', label: '工作台', icon: LayoutDashboard },
  { path: '/store/schedule', label: '排班调度', icon: Calendar },
  { path: '/store/services', label: '服务管理', icon: ClipboardList },
  { path: '/store/records', label: '病历管理', icon: FileText },
  { path: '/store/inventory', label: '库存管理', icon: Package },
  { path: '/store/members', label: '会员管理', icon: Users },
];

export function StoreLayout({ children }: StoreLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, switchRole } = useAuthStore();
  const [showRoleSwitch, setShowRoleSwitch] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <aside className="w-64 bg-white border-r border-neutral-200 flex-shrink-0">
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-neutral-100 bg-gradient-to-br from-primary-500 to-primary-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-white">爱宠屋</h1>
                <p className="text-xs text-white/70">管理后台 · 直营中心店</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {storeNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <li key={`${item.path}-${item.label}`}>
                    <Link
                      to={item.path}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                      {item.path === '/store/inventory' && (
                        <Badge variant="danger" size="sm" className="ml-auto">
                          4
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t border-neutral-100 space-y-2">
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
              <Avatar src={user?.avatar} name={user?.nickname || ''} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 text-sm truncate">
                  {user?.nickname || '管理员'}
                </p>
                <p className="text-xs text-neutral-500">店长</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => setShowRoleSwitch(true)}
              >
                切换角色
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-neutral-900">
              {storeNavItems.find((i) => i.path === location.pathname)?.label || '工作台'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="accent" size="sm">
              + 新增预约
            </Button>
            <Badge variant="success">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 inline-block animate-pulse" />
              营业中
            </Badge>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {showRoleSwitch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRoleSwitch(false)}>
          <div className="bg-white rounded-2xl p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold mb-4">切换角色</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  switchRole('owner');
                  navigate('/owner');
                  setShowRoleSwitch(false);
                }}
              >
                <User className="w-5 h-5 mr-3" />
                宠主端
              </Button>
              <Button
                variant="primary"
                className="w-full justify-start"
                onClick={() => {
                  switchRole('store_admin');
                  navigate('/store');
                  setShowRoleSwitch(false);
                }}
              >
                <Store className="w-5 h-5 mr-3" />
                门店端
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  switchRole('veterinarian');
                  navigate('/store/records');
                  setShowRoleSwitch(false);
                }}
              >
                <FileText className="w-5 h-5 mr-3" />
                兽医端
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

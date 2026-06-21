import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
  Settings,
  ShoppingBag,
  Gem,
  Gauge,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';

const navItems = [
  { label: '首页', path: '/' },
  { label: '在线鉴定', path: '/appraise' },
  { label: '鉴定证书', path: '/certificate' },
  { label: '行家知识库', path: '/knowledge' },
  { label: '价值评估', path: '/valuation' },
  { label: '社区问答', path: '/community' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const userMenuItems = [
    { label: '个人中心', icon: User, path: '/user/profile' },
    { label: '我的订单', icon: ShoppingBag, path: '/user/orders' },
    { label: '我的藏品', icon: Gem, path: '/user/collections' },
    ...(user?.role === 'expert' ? [
      { label: '专家工作台', icon: Gauge, path: '/expert/dashboard' },
    ] : []),
    ...(user?.role === 'admin' ? [
      { label: '管理后台', icon: Award, path: '/admin/dashboard' },
    ] : []),
    { label: '账号设置', icon: Settings, path: '/user/profile' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="sticky top-0 z-40 bg-rice-50/95 backdrop-blur-md border-b border-gold-200 shadow-scroll"
      >
        <div className="container">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="flex items-center gap-3 group">
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
                className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-md bg-ink-gradient flex items-center justify-center border border-gold-400 shadow-gold-glow"
              >
                <span className="font-serif text-xl lg:text-2xl font-bold text-gold-300 text-shadow-gold">
                  鉴
                </span>
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h1 className="font-serif text-xl lg:text-2xl font-bold text-jade-700 group-hover:text-gold-500 transition-colors">
                  鉴真阁
                </h1>
                <p className="text-[10px] lg:text-xs text-gold-500 tracking-widest hidden sm:block">
                  权威鉴定 · 传承有序
                </p>
              </motion.div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 * index }}
                >
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      cn(
                        'relative px-4 py-2 font-medium text-jade-600 hover:text-gold-500 transition-colors',
                        isActive && 'text-gold-500',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span>{item.label}</span>
                        {isActive && (
                          <motion.span
                            layoutId="nav-indicator"
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gold-gradient rounded-full"
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-jade-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-ink-gradient flex items-center justify-center border-2 border-gold-400">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-gold-300" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-jade-700">
                        {user.nickname || '用户'}
                      </p>
                      <p className="text-xs text-gold-500">
                        {user.role === 'admin' ? '管理员' : user.role === 'expert' ? '认证专家' : '普通用户'}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-jade-500 transition-transform',
                        userMenuOpen && 'rotate-180',
                      )}
                    />
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 card py-2"
                      >
                        {userMenuItems.map((menuItem) => {
                          const Icon = menuItem.icon;
                          return (
                            <Link
                              key={menuItem.path}
                              to={menuItem.path}
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-jade-600 hover:bg-gold-50 hover:text-jade-700 transition-colors"
                            >
                              <Icon className="w-4 h-4" />
                              {menuItem.label}
                            </Link>
                          );
                        })}
                        <div className="my-1 border-t border-gold-200" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-cinnabar-500 hover:bg-cinnabar-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          退出登录
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                    登录
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                    注册
                  </Button>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-jade-600 hover:bg-jade-50 rounded-md transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden overflow-hidden bg-rice-50 border-b border-gold-200"
          >
            <div className="container py-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block px-4 py-3 rounded-md font-medium text-jade-600 hover:bg-gold-50 transition-colors',
                      isActive && 'bg-gold-50 text-gold-600',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="pt-4 mt-2 border-t border-gold-200">
                {isAuthenticated && user ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-10 h-10 rounded-full bg-ink-gradient flex items-center justify-center border-2 border-gold-400">
                        {user.avatar ? (
                          <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-gold-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-jade-700">{user.nickname || '用户'}</p>
                        <p className="text-xs text-gold-500">
                          {user.role === 'admin' ? '管理员' : user.role === 'expert' ? '认证专家' : '普通用户'}
                        </p>
                      </div>
                    </div>
                    {userMenuItems.map((menuItem) => {
                      const Icon = menuItem.icon;
                      return (
                        <Link
                          key={menuItem.path}
                          to={menuItem.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-md text-jade-600 hover:bg-gold-50 transition-colors"
                        >
                          <Icon className="w-4 h-4" />
                          {menuItem.label}
                        </Link>
                      );
                    })}
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 rounded-md w-full text-cinnabar-500 hover:bg-cinnabar-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button variant="ghost" size="sm" fullWidth onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
                      登录
                    </Button>
                    <Button variant="primary" size="sm" fullWidth onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}>
                      注册
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

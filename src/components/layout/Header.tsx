import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Menu, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import Avatar from '@/components/common/Avatar';
import Badge from '@/components/common/Badge';
import { useUserStore } from '@/stores/useUserStore';

interface HeaderProps {
  className?: string;
}

const navItems = [
  { label: '首页', path: '/' },
  { label: '爆料', path: '/baoliao' },
  { label: '圈子', path: '/circles' },
  { label: '服务', path: '/services' },
  { label: '积分', path: '/points' },
  { label: '管理后台', path: '/admin' },
];

export default function Header({ className }: HeaderProps) {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useUserStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const hasNotification = true;

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchValue)}`);
      setSearchValue('');
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200',
        className
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            onClick={handleLogoClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-westlake-500 to-westlake-600 flex items-center justify-center text-white font-bold text-lg">
          惠
        </div>
        <span className="text-xl font-bold text-gradient-westlake hidden sm:block">
          惠州生活圈
        </span>
      </motion.div>

      <nav className="hidden md:flex items-center gap-1">
        {navItems.map((item) => (
          <motion.div
            key={item.path}
            whileHover={{ y: -1 }}
            whileTap={{ y: 0 }}
          >
            <Link
              to={item.path}
              className="px-4 py-2 text-neutral-600 hover:text-westlake-600 rounded-lg hover:bg-westlake-50 transition-colors font-medium relative group"
            >
              {item.label}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-westlake-500 group-hover:w-1/2 transition-all duration-300" />
            </Link>
          </motion.div>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <form
          onSubmit={handleSearch}
          className="hidden sm:flex items-center bg-neutral-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-westlake-500 transition-all"
        >
          <Search className="w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="搜索..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-transparent border-none outline-none ml-2 w-32 lg:w-48 text-sm placeholder:text-neutral-400"
          />
        </form>

        <motion.button
          className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/notifications')}
        >
          <Bell className="w-5 h-5 text-neutral-600" />
          <AnimatePresence>
            {hasNotification && (
              <Badge
              variant="red"
              dot
              className="absolute top-1 right-1"
            />
          )}
        </AnimatePresence>
      </motion.button>

        {isLoggedIn && user ? (
          <div className="hidden sm:flex relative">
            <Avatar
              size="sm"
              name={user.nickname}
              src={user.avatar}
              online
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="cursor-pointer"
            />
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-card shadow-card border border-neutral-100 overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-neutral-100">
                    <p className="font-medium text-neutral-800">{user.nickname}</p>
                    <p className="text-xs text-neutral-500">{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</p>
                  </div>
                  <button
                    onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" /> 个人中心
                  </button>
                  <button
                    onClick={() => { navigate('/points'); setShowUserMenu(false); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                  >
                    <span className="text-chaojing-500">🌸</span> 我的红花
                  </button>
                  {user.role === 'editor' || user.role === 'government' ? (
                    <button
                      onClick={() => { navigate('/admin'); setShowUserMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                    >
                      <Bell className="w-4 h-4" /> 管理后台
                    </button>
                  ) : null}
                  <div className="border-t border-neutral-100">
                    <button
                      onClick={() => { logout(); setShowUserMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      退出登录
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/login')}
            className="hidden sm:flex"
          >
            <User className="w-4 h-4 mr-1" />
            登录
          </Button>
        )}

        <motion.button
          className="md:hidden p-2 rounded-lg hover:bg-neutral-100"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          whileTap={{ scale: 0.9 }}
        >
          {isMenuOpen ? (
            <X className="w-6 h-6 text-neutral-600" />
          ) : (
            <Menu className="w-6 h-6 text-neutral-600" />
          )}
        </motion.button>
      </div>
    </div>

    <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden border-t border-neutral-200"
        >
          <div className="py-4 space-y-2">
            <form
              onSubmit={handleSearch}
              className="flex items-center bg-neutral-100 rounded-full px-4 py-2 mb-4"
            >
              <Search className="w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="bg-transparent border-none outline-none ml-2 flex-1 text-sm"
              />
            </form>

            {navItems.map((item, index) => (
              <motion.div
                key={item.path}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={item.path}
                  className="block px-4 py-3 text-neutral-700 hover:bg-westlake-50 hover:text-westlake-600 rounded-lg transition-colors font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}

            {!isLoggedIn ? (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="px-4 pt-2"
              >
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    navigate('/login');
                    setIsMenuOpen(false);
                  }}
                >
                  登录 / 注册
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="px-4 pt-2 space-y-2"
              >
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-card">
                  <Avatar size="md" src={user?.avatar} name={user?.nickname} />
                  <div>
                    <p className="font-medium text-neutral-800">{user?.nickname}</p>
                    <p className="text-xs text-chaojing-600">🌸 {user?.points} 小红花</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                >
                  退出登录
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
      </div>
    </header>
  );
}

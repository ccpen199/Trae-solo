import { useState } from 'react';
import { 
  Film, 
  Home, 
  Ticket, 
  Crown, 
  PlayCircle, 
  Palette, 
  Users, 
  Settings, 
  User, 
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import type { PageType } from '../types';

interface NavItem {
  id: PageType;
  label: string;
  icon: typeof Home;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'videos', label: '快看视频', icon: PlayCircle },
  { id: 'art-film', label: '艺术电影', icon: Palette },
  { id: 'community', label: '社区广场', icon: Users },
];

const userNavItems: NavItem[] = [
  { id: 'tickets', label: '我的电影票', icon: Ticket, requiresAuth: true },
  { id: 'vip', label: '会员中心', icon: Crown, requiresAuth: true },
];

export default function Navbar() {
  const { 
    currentPage, 
    setCurrentPage, 
    isLoggedIn, 
    user, 
    logout 
  } = useAppStore();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleNavClick = (page: PageType, requiresAuth?: boolean) => {
    if (requiresAuth && !isLoggedIn) {
      setCurrentPage('login');
    } else {
      setCurrentPage(page);
    }
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cinema-bg/95 backdrop-blur-lg border-b border-cinema-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cinema-red to-cinema-red-dark flex items-center justify-center transition-transform group-hover:scale-110">
                <Film className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gradient hidden sm:block">
                光影票务
              </span>
            </button>

            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-cinema-red/20 text-cinema-red' 
                        : 'text-cinema-text-secondary hover:text-cinema-text hover:bg-cinema-bg-light'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-cinema-text-secondary hover:text-cinema-text hover:bg-cinema-bg-light transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            <button className="p-2 rounded-lg text-cinema-text-secondary hover:text-cinema-text hover:bg-cinema-bg-light transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-cinema-red rounded-full animate-pulse" />
            </button>

            {isLoggedIn && user ? (
              <div className="hidden sm:flex items-center gap-3">
                {userNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id, item.requiresAuth)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-cinema-red/20 text-cinema-red' 
                          : 'text-cinema-text-secondary hover:text-cinema-text hover:bg-cinema-bg-light'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-cinema-bg-light transition-colors"
                  >
                    <div className="relative">
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-9 h-9 rounded-full object-cover border-2 border-cinema-gold"
                      />
                      {user.vipLevel > 0 && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-cinema-gold to-cinema-gold-light rounded-full flex items-center justify-center">
                          <Crown className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-cinema-text-secondary transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-cinema-bg-light rounded-xl border border-cinema-border shadow-xl animate-slide-down overflow-hidden">
                      <div className="p-4 border-b border-cinema-border">
                        <p className="font-medium text-cinema-text">{user.username}</p>
                        <p className="text-sm text-cinema-text-secondary">{user.email}</p>
                        {user.vipLevel > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gradient-to-r from-cinema-gold to-cinema-gold-light rounded text-xs font-medium text-white">
                              VIP {user.vipLevel}
                            </span>
                            <span className="text-xs text-cinema-gold">{user.vipPoints} 积分</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => handleNavClick('vip')}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-cinema-text-secondary hover:text-cinema-text hover:bg-cinema-bg transition-colors"
                        >
                          <Crown className="w-4 h-4" />
                          <span className="text-sm">会员中心</span>
                        </button>
                        <button
                          onClick={() => handleNavClick('admin')}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-cinema-text-secondary hover:text-cinema-text hover:bg-cinema-bg transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span className="text-sm">管理后台</span>
                        </button>
                        <div className="my-2 border-t border-cinema-border" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-cinema-red hover:bg-cinema-red/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">退出登录</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('login')}
                className="btn-primary flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">登录</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-cinema-text-secondary hover:text-cinema-text hover:bg-cinema-bg-light transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="py-4 border-t border-cinema-border animate-slide-down">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cinema-text-muted" />
              <input
                type="text"
                placeholder="搜索电影、演员、导演..."
                className="w-full pl-12 pr-4 py-3 bg-cinema-bg-light border border-cinema-border rounded-xl text-cinema-text placeholder-cinema-text-muted focus:outline-none focus:border-cinema-red transition-colors"
              />
            </div>
          </div>
        )}

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-cinema-border animate-slide-down">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-cinema-red/20 text-cinema-red' 
                        : 'text-cinema-text-secondary hover:text-cinema-text hover:bg-cinema-bg-light'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
              
              {isLoggedIn ? (
                <>
                  <div className="my-3 border-t border-cinema-border" />
                  {userNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id, item.requiresAuth)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive 
                            ? 'bg-cinema-red/20 text-cinema-red' 
                            : 'text-cinema-text-secondary hover:text-cinema-text hover:bg-cinema-bg-light'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                  <div className="my-3 border-t border-cinema-border" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-cinema-red hover:bg-cinema-red/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">退出登录</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="my-3 border-t border-cinema-border" />
                  <button
                    onClick={() => handleNavClick('login')}
                    className="w-full btn-primary py-3"
                  >
                    立即登录
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

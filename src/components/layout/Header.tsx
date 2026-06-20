import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, Search, Globe, CreditCard, MapPin, Calendar, LogOut, Settings, Crown } from 'lucide-react';
import { useAuthStore, selectIsAuthenticated, selectUser, selectMember } from '../../store/authStore';
import Button from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../lib/utils';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);
  const member = useAuthStore(selectMember);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const navLinks = [
    { label: '搜索酒店', href: '/search', icon: Search },
    { label: '我的行程', href: '/itineraries', icon: MapPin },
    { label: '我的订单', href: '/bookings', icon: Calendar },
    { label: '会员中心', href: '/member', icon: Crown },
  ];

  const languages = [
    { code: 'zh-CN', label: '简体中文' },
    { code: 'en-US', label: 'English' },
    { code: 'ja-JP', label: '日本語' },
    { code: 'fr-FR', label: 'Français' },
    { code: 'de-DE', label: 'Deutsch' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-cloud-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-deep-blue to-deep-blue-light rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-deep-blue">
                StayGlobal
              </span>
            </Link>

            <nav className="hidden md:flex items-center ml-8 space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center space-x-1 text-graphite-600 hover:text-deep-blue transition-colors text-sm font-medium"
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                  className="flex items-center space-x-1 px-3 py-1.5 text-sm text-graphite-600 hover:text-deep-blue transition-colors rounded-lg hover:bg-cloud-100"
                >
                  <Globe className="w-4 h-4" />
                  <span>中文</span>
                </button>
                {isLangMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-elevated border border-cloud-200 py-2 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        className="w-full px-4 py-2 text-left text-sm text-graphite-700 hover:bg-cloud-50"
                        onClick={() => setIsLangMenuOpen(false)}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-cloud-200" />

              <div className="flex items-center space-x-1 px-3 py-1.5 text-sm text-graphite-600 hover:text-deep-blue transition-colors rounded-lg hover:bg-cloud-100 cursor-pointer">
                <CreditCard className="w-4 h-4" />
                <span>CNY ¥</span>
              </div>
            </div>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-full border-2 border-cloud-200 hover:border-deep-blue transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-deep-blue to-deep-blue-light rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  {member && (
                    <Badge variant="gold" size="sm" className="hidden sm:flex">
                      {member.tier}
                    </Badge>
                  )}
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-elevated border border-cloud-200 py-3 z-50">
                    <div className="px-4 py-3 border-b border-cloud-200">
                      <p className="font-medium text-graphite-900">{user?.name}</p>
                      <p className="text-sm text-graphite-500">{user?.email}</p>
                      {member && (
                        <div className="flex items-center mt-2">
                          <Badge variant="gold" size="sm">
                            {member.tier} 会员
                          </Badge>
                          <span className="ml-2 text-sm text-graphite-500">
                            {member.points} 积分
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => { navigate('/bookings'); setIsUserMenuOpen(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-graphite-700 hover:bg-cloud-50 flex items-center space-x-2"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>我的订单</span>
                      </button>
                      <button
                        onClick={() => { navigate('/itineraries'); setIsUserMenuOpen(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-graphite-700 hover:bg-cloud-50 flex items-center space-x-2"
                      >
                        <MapPin className="w-4 h-4" />
                        <span>我的行程</span>
                      </button>
                      <button
                        onClick={() => { navigate('/member'); setIsUserMenuOpen(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-graphite-700 hover:bg-cloud-50 flex items-center space-x-2"
                      >
                        <Crown className="w-4 h-4" />
                        <span>会员中心</span>
                      </button>
                      <button
                        onClick={() => { navigate('/gdpr'); setIsUserMenuOpen(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-graphite-700 hover:bg-cloud-50 flex items-center space-x-2"
                      >
                        <Settings className="w-4 h-4" />
                        <span>隐私设置</span>
                      </button>
                    </div>
                    <div className="border-t border-cloud-200 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>退出登录</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  登录
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  注册
                </Button>
              </div>
            )}

            <button
              className="md:hidden p-2 rounded-lg hover:bg-cloud-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-graphite-700" />
              ) : (
                <Menu className="w-6 h-6 text-graphite-700" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-cloud-200">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center space-x-3 px-4 py-3 text-graphite-700 hover:bg-cloud-50 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <link.icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
            <div className="pt-4 border-t border-cloud-200">
              <div className="flex items-center space-x-3 px-4 py-3">
                <Globe className="w-5 h-5 text-graphite-500" />
                <select className="flex-1 bg-transparent text-graphite-700 focus:outline-none">
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                  <option value="ja-JP">日本語</option>
                </select>
              </div>
              <div className="flex items-center space-x-3 px-4 py-3">
                <CreditCard className="w-5 h-5 text-graphite-500" />
                <select className="flex-1 bg-transparent text-graphite-700 focus:outline-none">
                  <option value="CNY">人民币 (¥)</option>
                  <option value="USD">美元 ($)</option>
                  <option value="EUR">欧元 (€)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

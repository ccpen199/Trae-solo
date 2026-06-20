import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Scale,
  Search,
  Menu,
  X,
  User,
  Gavel,
  FileText,
  BarChart3,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useCompareStore } from '@/store';
import { cn } from '@/utils';

const navItems = [
  { path: '/', label: '首页大厅', icon: HomeIcon },
  { path: '/list', label: '标的列表', icon: Gavel },
  { path: '/compare', label: '智能对比', icon: BarChart3 },
  { path: '/auction', label: '竞买中心', icon: Gavel },
  { path: '/due-diligence', label: '尽调服务', icon: FileText },
];

function HomeIcon({ className }: { className?: string }) {
  return <Shield className={className} />;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const { compareList } = useCompareStore();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-ink-200">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center transition-transform group-hover:scale-105">
              <Scale className="w-6 h-6 text-gold-400" />
            </div>
            <div className="hidden sm:block">
              <span className="font-serif font-bold text-lg text-ink-900">法拍通</span>
              <span className="block text-xs text-ink-500 -mt-0.5">司法拍卖服务平台</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-ink-600 hover:text-primary-600 hover:bg-ink-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.path === '/compare' && compareList.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-gold-500 text-white rounded-full">
                      {compareList.length}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <button className="p-2 text-ink-600 hover:text-primary-600 hover:bg-ink-50 rounded-md transition-colors">
              <Search className="w-5 h-5" />
            </button>

            <div className="hidden sm:block relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50 rounded-md transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">张明</span>
                <ChevronDown className={cn('w-4 h-4 transition-transform', isUserMenuOpen && 'rotate-180')} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg border border-ink-200 shadow-lg py-1 animate-fade-in">
                  <Link
                    to="/auction"
                    className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    我的竞拍
                  </Link>
                  <Link
                    to="/auction/deposit"
                    className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    保证金管理
                  </Link>
                  <Link
                    to="/auction/qualification"
                    className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    资质审核
                  </Link>
                  <div className="border-t border-ink-100 my-1"></div>
                  <button className="w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-danger-50">
                    退出登录
                  </button>
                </div>
              )}
            </div>

            <button
              className="md:hidden p-2 text-ink-600 hover:bg-ink-50 rounded-md"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-ink-100 animate-slide-down">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-ink-600 hover:bg-ink-50'
                    )}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

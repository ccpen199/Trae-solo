import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Building2,
  TrendingUp,
  Clock,
  AlertTriangle,
  User,
  Search,
  ChevronDown,
  LogOut,
  Settings,
  Heart,
  Bell,
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { useAppStore } from '../store/useAppStore';
import type { PropertyType } from '@shared/types';
import { cn } from '../lib/utils';

const mainNavItems = [
  { label: '首页', href: '/', icon: Home },
  { label: '房源', href: '/properties', icon: Building2 },
  { label: '价格分析', href: '/price-analysis', icon: TrendingUp },
  { label: '房价时光机', href: '/time-machine', icon: Clock },
  { label: '举报中心', href: '/report', icon: AlertTriangle },
  { label: '用户中心', href: '/user-center', icon: User },
];

const categories: { key: PropertyType; label: string }[] = [
  { key: 'secondhand', label: '二手房' },
  { key: 'new', label: '新房' },
  { key: 'rental', label: '租赁' },
  { key: 'overseas', label: '海外' },
  { key: 'vacation', label: '旅居' },
];

export function Navbar() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const { currentCategory, setCurrentCategory, user, isAuthenticated, logout, setSearchQuery } = useAppStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    navigate('/properties');
  };

  const handleCategoryChange = (category: PropertyType) => {
    setCurrentCategory(category);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary-800" />
            <span className="text-xl font-bold text-primary-800 font-serif">安居智联</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  'text-gray-700 hover:text-primary-800 hover:bg-primary-50'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <button className="relative p-2 text-gray-600 hover:text-primary-800 hover:bg-gray-100 rounded-full">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="p-2 text-gray-600 hover:text-primary-800 hover:bg-gray-100 rounded-full">
                  <Heart className="w-5 h-5" />
                </button>
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-md">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <User className="w-5 h-5 text-primary-800" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                      {user?.nickname || user?.phone}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </Menu.Button>
                  <Transition
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="py-1">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/user-center"
                              className={cn(
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                'flex items-center gap-2 px-4 py-2 text-sm'
                              )}
                            >
                              <User className="w-4 h-4" />
                              个人中心
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/settings"
                              className={cn(
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                'flex items-center gap-2 px-4 py-2 text-sm'
                              )}
                            >
                              <Settings className="w-4 h-4" />
                              账号设置
                            </Link>
                          )}
                        </Menu.Item>
                        <div className="border-t border-gray-100 my-1"></div>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={cn(
                                active ? 'bg-gray-100 text-red-600' : 'text-red-600',
                                'flex items-center gap-2 px-4 py-2 text-sm w-full text-left'
                              )}
                            >
                              <LogOut className="w-4 h-4" />
                              退出登录
                            </button>
                          )}
                        </Menu.Item>
                      </div>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-primary-800 hover:bg-primary-50 rounded-md"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-800 hover:bg-primary-700 rounded-md"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div className="flex items-center gap-1">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={cn(
                  'px-4 py-1.5 text-sm font-medium rounded-full transition-colors',
                  currentCategory === cat.key
                    ? 'bg-primary-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜索小区、地址、房源..."
                className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-800 hover:bg-primary-700 rounded-full transition-colors"
            >
              搜索
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

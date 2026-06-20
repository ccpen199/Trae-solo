import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Sparkles,
  User,
  Users,
  Settings,
  Fish,
  BarChart3,
  Database,
  Cpu,
  Menu,
  X,
  Moon,
  Sun,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  section: 'main' | 'admin';
}

const navItems: NavItem[] = [
  { label: '首页仪表板', icon: <LayoutDashboard size={20} />, path: '/', section: 'main' },
  { label: '钓点探索', icon: <MapPin size={20} />, path: '/spots', section: 'main' },
  { label: 'AI渔获分析', icon: <Sparkles size={20} />, path: '/ai-analysis', section: 'main' },
  { label: '个人档案', icon: <User size={20} />, path: '/profile', section: 'main' },
  { label: '钓友圈', icon: <Users size={20} />, path: '/social', section: 'main' },
];

const adminNavItems: NavItem[] = [
  { label: '数据概览', icon: <BarChart3 size={20} />, path: '/admin', section: 'admin' },
  { label: '数据源管理', icon: <Database size={20} />, path: '/admin/data-sources', section: 'admin' },
  { label: '模型管理', icon: <Cpu size={20} />, path: '/admin/models', section: 'admin' },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, user } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const isAdminPage = location.pathname.startsWith('/admin');
  const currentNavItems = isAdminPage ? adminNavItems : navItems;
  
  const activePath = currentNavItems.find(item => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  })?.path || '';
  
  const handleNavClick = (path: string) => {
    navigate(path);
  };
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-deep-sea-950 text-moonlight-100' : 'bg-moonlight-50 text-deep-sea-900'} transition-colors duration-300`}>
      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full z-30 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-20',
          theme === 'dark' ? 'bg-deep-sea-900 border-r border-deep-sea-700' : 'bg-white border-r border-moonlight-200'
        )}
      >
        {/* Logo 区域 */}
        <div className="h-16 flex items-center px-4 border-b border-deep-sea-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lake-green-400 to-deep-sea-500 flex items-center justify-center flex-shrink-0">
              <Fish size={22} className="text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-lg gradient-text">渔智</h1>
                <p className="text-xs text-moonlight-400">垂钓气象决策平台</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 导航菜单 */}
        <nav className="p-3 space-y-1">
          {!isAdminPage && (
            <p className={`text-xs font-medium text-moonlight-500 px-3 py-2 ${sidebarOpen ? '' : 'text-center'}`}>
              {sidebarOpen ? '功能导航' : '···'}
            </p>
          )}
          {currentNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                activePath === item.path
                  ? 'bg-lake-green-500/15 text-lake-green-400 font-medium'
                  : theme === 'dark'
                    ? 'text-moonlight-300 hover:bg-deep-sea-800 hover:text-white'
                    : 'text-moonlight-600 hover:bg-moonlight-100 hover:text-deep-sea-900',
                !sidebarOpen && 'justify-center'
              )}
            >
              {item.icon}
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
          
          {!isAdminPage && (
            <>
              <div className="my-3 border-t border-deep-sea-700/50"></div>
              <p className={`text-xs font-medium text-moonlight-500 px-3 py-2 ${sidebarOpen ? '' : 'text-center'}`}>
                {sidebarOpen ? '管理后台' : '⚙'}
              </p>
              <button
                onClick={() => handleNavClick('/admin')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  theme === 'dark'
                    ? 'text-moonlight-400 hover:bg-deep-sea-800 hover:text-white'
                    : 'text-moonlight-500 hover:bg-moonlight-100 hover:text-deep-sea-900',
                  !sidebarOpen && 'justify-center'
                )}
              >
                <Settings size={20} />
                {sidebarOpen && <span className="text-sm">管理后台</span>}
              </button>
            </>
          )}
          
          {isAdminPage && (
            <>
              <div className="my-3 border-t border-deep-sea-700/50"></div>
              <button
                onClick={() => handleNavClick('/')}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                  theme === 'dark'
                    ? 'text-moonlight-400 hover:bg-deep-sea-800 hover:text-white'
                    : 'text-moonlight-500 hover:bg-moonlight-100 hover:text-deep-sea-900',
                  !sidebarOpen && 'justify-center'
                )}
              >
                <LayoutDashboard size={20} />
                {sidebarOpen && <span className="text-sm">返回前台</span>}
              </button>
            </>
          )}
        </nav>
        
        {/* 底部用户信息 */}
        <div className={`absolute bottom-0 left-0 right-0 p-3 border-t ${theme === 'dark' ? 'border-deep-sea-700/50' : 'border-moonlight-200'}`}>
          <div className="flex items-center gap-3">
            <img
              src={user.avatar}
              alt={user.nickname}
              className="w-10 h-10 rounded-full border-2 border-lake-green-500/50"
            />
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.nickname}</p>
                <p className="text-xs text-moonlight-400">Lv.{user.level} {user.levelName}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      {/* 主内容区 */}
      <div className={cn('transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-20')}>
        {/* 顶部栏 */}
        <header className={cn(
          'h-16 sticky top-0 z-20 flex items-center justify-between px-6',
          theme === 'dark' 
            ? 'bg-deep-sea-950/80 backdrop-blur-lg border-b border-deep-sea-800/50' 
            : 'bg-white/80 backdrop-blur-lg border-b border-moonlight-200'
        )}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                theme === 'dark' ? 'hover:bg-deep-sea-800' : 'hover:bg-moonlight-100'
              )}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-lg font-semibold">
              {currentNavItems.find(item => item.path === activePath)?.label || '首页'}
            </h2>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className={cn(
                'p-2 rounded-lg transition-colors',
                theme === 'dark' ? 'hover:bg-deep-sea-800' : 'hover:bg-moonlight-100'
              )}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="h-6 w-px bg-moonlight-700/30"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-moonlight-400">
                {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
              </span>
            </div>
          </div>
        </header>
        
        {/* 页面内容 */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

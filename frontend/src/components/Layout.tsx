import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, Newspaper, Users, Settings, LogOut, User, Wifi, WifiOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Avatar } from './Avatar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, isOnline, logout } = useStore();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/chat', icon: MessageCircle, label: '聊天室' },
    { path: '/feed', icon: Newspaper, label: '动态' },
    { path: '/communities', icon: Users, label: '社团' },
  ];
  
  return (
    <div className="min-h-screen flex">
      <aside className="w-20 md:w-64 bg-white/5 backdrop-blur-lg border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="hidden md:block text-white font-bold text-xl">LinkWorld</span>
          </div>
        </div>
        
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-primary-500/30 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden md:block font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="p-2 border-t border-white/10">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-primary-500/30 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="hidden md:block font-medium">设置</span>
          </NavLink>
        </div>
        
        {user && (
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
              <Avatar config={user.avatarConfig} size={40} />
              <div className="hidden md:block flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user.nickname}</p>
                <p className="text-white/50 text-sm truncate">@{user.username}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 py-1">
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="hidden md:block text-green-400 text-sm">在线</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="hidden md:block text-red-400 text-sm">离线</span>
              </>
            )}
          </div>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
};

export default Layout;

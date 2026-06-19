import { Bell, Search, User, ChevronDown, Settings } from 'lucide-react';
import { currentUser } from '../data/mockData';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索内容..."
            className="pl-10 pr-4 py-2 w-64 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-slate-700">{currentUser.name}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="font-medium text-sm">{currentUser.name}</div>
                <div className="text-xs text-slate-500">{currentUser.department}</div>
              </div>
              <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <User className="w-4 h-4" />
                个人中心
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                设置
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

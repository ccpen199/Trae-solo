import {
  Search,
  Bell,
  MessageSquare,
  Moon,
  Sun,
  User,
  Settings,
  ChevronDown,
  BadgePercent,
  HelpCircle,
  Maximize2,
  Plus,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifications] = useState(12);
  const [messages] = useState(5);
  const [globalSearch, setGlobalSearch] = useState('');
  const [lastSearch, setLastSearch] = useState('');

  const submitGlobalSearch = () => {
    const keyword = globalSearch.trim();
    setLastSearch(keyword || '全部');
  };
  
  return (
    <header className="relative h-[72px] flex items-center justify-between px-6 border-b border-gold-500/10 backdrop-blur-xl z-30"
      style={{ background: 'linear-gradient(180deg, rgba(15,30,49,0.95) 0%, rgba(22,44,72,0.85) 100%)' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-40 left-1/4 w-96 h-96 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.15) 0%, transparent 60%)' }}
        />
      </div>
      
      <div className="relative flex items-center gap-5 flex-1">
        <div className="relative max-w-[560px] w-full">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            <Search className="w-4.5 h-4.5" />
          </div>
          <input
            type="text"
            placeholder="搜索房源、工单、供应商、合同..."
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submitGlobalSearch();
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-primary-800/40 border border-gold-500/10 text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/40 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md bg-primary-800/70 text-[10px] text-neutral-500 border border-neutral-600/30 font-mono">
            ⌘K
          </kbd>
          {lastSearch && (
            <div className="absolute left-0 top-[calc(100%+6px)] rounded-lg border border-gold-500/20 bg-primary-900/95 px-3 py-2 text-xs text-neutral-300 shadow-lg">
              查询结果：已匹配“{lastSearch}”相关房源、工单和供应商
            </div>
          )}
        </div>
        
        <button
          onClick={() => navigate('/orders/create')}
          className="px-4 py-2.5 rounded-xl btn-gold flex items-center gap-2 text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          新建工单
        </button>
      </div>
      
      <div className="relative flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-all"
          title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
        >
          {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
        </button>
        
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-all">
          <Maximize2 className="w-4.5 h-4.5" />
        </button>
        
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-all">
          <HelpCircle className="w-4.5 h-4.5" />
        </button>
        
        <div className="w-px h-8 bg-gold-500/10 mx-1" />
        
        <button className="relative w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-all">
          <Bell className="w-4.5 h-4.5" />
          {notifications > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-primary-900">
              {notifications > 99 ? '99+' : notifications}
            </span>
          )}
        </button>
        
        <button className="relative w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-all">
          <MessageSquare className="w-4.5 h-4.5" />
          {messages > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gold-500 text-primary-900 text-[10px] font-bold flex items-center justify-center border-2 border-primary-900">
              {messages}
            </span>
          )}
        </button>
        
        <div className="w-px h-8 bg-gold-500/10 mx-1" />
        
        <div className="flex items-center gap-3 pl-2 pr-1 py-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #D4A853 0%, #B88F3E 100%)',
                boxShadow: '0 0 0 2px rgba(212,168,83,0.3), 0 4px 12px rgba(212,168,83,0.25)'
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                alt="用户头像"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-primary-900" />
          </div>
          
          <div className="hidden xl:block min-w-0">
            <p className="text-sm font-semibold text-white truncate">张宏伟</p>
            <p className="text-[11px] text-gold-400 flex items-center gap-1">
              <BadgePercent className="w-3 h-3" />
              VIP · 恒信资本
            </p>
          </div>
          
          <ChevronDown className="w-4 h-4 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
        </div>
        
        <button className="w-10 h-10 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-all">
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
}

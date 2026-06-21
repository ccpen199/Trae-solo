import { Bell, Search, Settings, RefreshCw, User, Shield, TrendingUp, Clock } from 'lucide-react';
import { useAppStore } from '@/stores/app';
import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

export default function Header() {
  const { user, lastUpdate, refreshAll, boxOffice } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setTimeout(() => setRefreshing(false), 600);
  };

  const todayDate = currentTime.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
  const timeStr = currentTime.toLocaleTimeString('zh-CN', { hour12: false });

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-space-700/40 bg-space-900/60 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" strokeWidth={1.8} />
          <input
            type="text"
            placeholder="搜索影片 / 影院 / 剧组人员..."
            className="w-80 h-10 pl-10 pr-4 rounded-xl bg-space-800/50 border border-space-700/50 text-sm text-slate-200
                       placeholder:text-slate-500 focus:outline-none focus:border-gold-500/40 focus:ring-2 focus:ring-gold-500/10
                       transition-all"
          />
        </div>

        <div className="hidden xl:flex items-center gap-4 h-10 px-4 rounded-xl bg-gradient-to-r from-chart-green/10 to-transparent border border-chart-green/20">
          <div className="flex items-center gap-1.5 text-chart-green">
            <TrendingUp className="w-4 h-4" strokeWidth={2} />
            <span className="text-xs font-medium">大盘走势</span>
          </div>
          <div className="w-px h-5 bg-space-700" />
          <div>
            <span className="kpi-value text-lg">
              {boxOffice ? (boxOffice.boxOfficeChange >= 0 ? '+' : '') + boxOffice.boxOfficeChange + '%' : '--'}
            </span>
            <span className="ml-2 text-[11px] text-slate-400">环比昨日</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex flex-col items-end mr-3 py-0.5">
          <div className="text-sm font-mono text-gold-400/90 leading-tight">{timeStr}</div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 leading-tight">
            <Clock className="w-3 h-3" strokeWidth={1.8} />
            <span>{todayDate}</span>
            <span className="mx-1 text-space-600">·</span>
            <span>更新于 {lastUpdate}</span>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="p-2.5 rounded-xl bg-space-800/50 border border-space-700/50 text-slate-400
                     hover:text-gold-400 hover:border-gold-500/30 transition-all group"
          title="刷新数据"
        >
          <RefreshCw className={clsx('w-4.5 h-4.5', refreshing && 'animate-spin')} strokeWidth={1.8} />
        </button>

        <button className="relative p-2.5 rounded-xl bg-space-800/50 border border-space-700/50 text-slate-400
                           hover:text-gold-400 hover:border-gold-500/30 transition-all">
          <Bell className="w-4.5 h-4.5" strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cine-400 animate-pulse" />
        </button>

        <button className="p-2.5 rounded-xl bg-space-800/50 border border-space-700/50 text-slate-400
                           hover:text-gold-400 hover:border-gold-500/30 transition-all">
          <Settings className="w-4.5 h-4.5" strokeWidth={1.8} />
        </button>

        <div className="ml-2 flex items-center gap-3 h-10 pl-3 pr-4 rounded-xl bg-space-800/50 border border-space-700/50 hover:border-gold-500/30 transition-all cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
            <User className="w-4 h-4 text-space-950" strokeWidth={2.2} />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-slate-200 leading-tight">{user.userName}</div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 leading-tight">
              <Shield className="w-3 h-3 text-gold-500" strokeWidth={2} />
              <span className="text-gold-500/90">{user.userRole}</span>
              <span className="text-space-600">·</span>
              <span>{user.orgName}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

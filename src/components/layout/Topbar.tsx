import { Bell, Wifi, Battery, HardDrive, Search } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useEffect, useState } from 'react';

export default function Topbar() {
  const currentDevice = useAppStore((s) => s.currentDevice);
  const unreadCount = useAppStore((s) => s.unreadCount);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  };

  return (
    <header className="h-16 bg-deep-900/80 backdrop-blur-md border-b border-deep-700 flex items-center px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索设备、事件..."
            className="w-64 h-9 pl-9 pr-4 bg-deep-800 border border-deep-700 rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-glow/50 focus:ring-1 focus:ring-cyan-glow/30 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden md:block">
          <p className="text-sm font-mono text-cyan-400 font-medium">{formatTime(currentTime)}</p>
          <p className="text-[10px] text-slate-500 font-mono">{formatDate(currentTime)}</p>
        </div>

        {currentDevice && (
          <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-deep-800/50 border border-deep-700">
            <div className="flex items-center gap-2">
              <Wifi className={`w-4 h-4 ${currentDevice.signalStrength > -60 ? 'text-accent-success' : currentDevice.signalStrength > -75 ? 'text-accent-warning' : 'text-accent-danger'}`} />
              <span className="text-xs font-mono text-slate-400">{currentDevice.signalStrength} dBm</span>
            </div>
            <div className="w-px h-4 bg-deep-700" />
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-accent-success" />
              <span className="text-xs font-mono text-slate-400">{currentDevice.batteryLevel}%</span>
            </div>
            <div className="w-px h-4 bg-deep-700" />
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-accent-info" />
              <span className="text-xs font-mono text-slate-400">
                {currentDevice.storageUsed}/{currentDevice.storageTotal}G
              </span>
            </div>
          </div>
        )}

        <button className="relative p-2 rounded-lg hover:bg-deep-800 transition-colors group">
          <Bell className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-accent-danger text-white text-xs rounded-full flex items-center justify-center font-mono">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

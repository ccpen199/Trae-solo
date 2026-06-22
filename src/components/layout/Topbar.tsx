import { Bell, Search, ShieldCheck, RotateCcw, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store';
import dayjs from 'dayjs';

export default function Topbar() {
  const [showSearch, setShowSearch] = useState(false);
  const bills = useAppStore((s) => s.bills);
  const resetAll = useAppStore((s) => s.resetAll);
  const today = dayjs().format('YYYY年MM月DD日');

  const approaching = bills.filter((b) => {
    if (b.status === 'paid' || b.status === 'cancelled') return false;
    const diff = dayjs(b.dueDate).diff(dayjs(), 'day');
    return diff >= 0 && diff <= 3;
  }).length;
  const overdue = bills.filter((b) => b.status === 'overdue').length;
  const alerts = approaching + overdue;

  return (
    <header className="h-16 shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-6 gap-4 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <button className="md:hidden btn-ghost -ml-2 p-2 rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            {today} · 合规模式已开启
          </div>
          <h1 className="font-serif text-lg font-semibold text-slate-900 leading-tight">
            您好，房东先生 👋
          </h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索房源、租客、账单编号…"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
            onFocus={() => setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 150)}
          />
          {showSearch && (
            <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-xl border border-slate-200 shadow-xl z-50">
              <div className="text-[11px] text-slate-400 mb-2">快捷搜索建议</div>
              <div className="space-y-1">
                {['国贸CBD · 两居室', '租客：李明华', '账单：逾期未缴'].map((t) => (
                  <div
                    key={t}
                    className="px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    🔍 {t}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (confirm('确定要重置所有数据为初始演示状态吗？此操作不可撤销。')) {
              resetAll();
              location.reload();
            }
          }}
          className="btn-ghost btn-sm text-slate-500"
          title="重置演示数据"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">重置演示</span>
        </button>

        <button className="relative btn-ghost p-2 rounded-xl">
          <Bell className="w-5 h-5 text-slate-600" />
          {alerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
              {alerts}
            </span>
          )}
        </button>

        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-brand-700/30 ring-2 ring-white">
          房
        </div>
      </div>
    </header>
  );
}

export { X };

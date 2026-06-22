import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import type { OrderStatus } from '@/types';
import {
  FileText, ClipboardList, Clock, CheckCircle2, AlertTriangle,
  RotateCcw, Filter, Search, MoreHorizontal
} from 'lucide-react';
import OrderCard from '@/components/OrderCard';
import { getStatusClass, getStatusLabel } from '@/utils';

const tabs: { key: 'all' | OrderStatus; label: string; icon: any; }[] = [
  { key: 'all', label: '全部', icon: FileText },
  { key: 'InProgress', label: '履约中', icon: Clock },
  { key: 'Pending', label: '待匹配', icon: ClipboardList },
  { key: 'Checking', label: '验收中', icon: CheckCircle2 },
  { key: 'Completed', label: '已完成', icon: CheckCircle2 },
  { key: 'Disputed', label: '争议中', icon: AlertTriangle },
  { key: 'Refunded', label: '已退款', icon: RotateCcw },
];

export default function OrdersPage() {
  const currentUser = useAppStore(s => s.getCurrentUser());
  const allOrders = useAppStore(s => s.getOrdersByUser(currentUser?.id || ''));
  const [tab, setTab] = useState<typeof tabs[number]['key']>('all');
  const [role, setRole] = useState<'all' | 'player' | 'provider'>('all');
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(() => {
    return allOrders.filter(o => {
      if (tab !== 'all' && o.status !== tab) return false;
      if (role === 'player' && o.playerId !== currentUser?.id) return false;
      if (role === 'provider' && o.providerId !== currentUser?.id) return false;
      if (keyword && !o.id.toLowerCase().includes(keyword.toLowerCase())) return false;
      return true;
    });
  }, [allOrders, tab, role, keyword, currentUser]);

  const countBy = (s: OrderStatus) => allOrders.filter(o => o.status === s).length;

  return (
    <div className="pt-28 pb-24">
      <div className="container">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <h1 className="section-title text-3xl md:text-4xl mb-2">
              <FileText className="w-8 h-8 inline-block mr-3 text-esports-400" />
              <span className="text-night-100">订单</span>
              <span className="text-gradient-esports"> 合约中心</span>
            </h1>
            <p className="text-night-400">管理您的所有订单合约，追踪履约进度与证据链</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-night-500" />
              <input
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="搜索订单号..."
                className="input-base pl-11 w-60 py-2.5"
              />
            </div>
            <Link to="/publish" className="btn-primary py-2.5 px-5 text-sm">
              <Plus className="w-4 h-4" /> 发布新需求
            </Link>
          </div>
        </div>

        <div className="glass-card p-1.5 mb-6 inline-flex overflow-x-auto max-w-full">
          {tabs.map(t => {
            const Icon = t.icon;
            const count = t.key === 'all' ? allOrders.length : countBy(t.key as OrderStatus);
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  active ? 'text-white' : 'text-night-400 hover:text-night-100'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="order-tab"
                    className="absolute inset-0 rounded-xl bg-gradient-esports shadow-esports-glow"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{t.label}</span>
                <span className={`relative z-10 text-xs px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20' : 'bg-night-700 text-night-400'
                }`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-night-800/50 border border-white/5">
            {[
              { k: 'all', l: '全部角色' },
              { k: 'player', l: '我是需求方' },
              { k: 'provider', l: '我是供给方' },
            ].map(r => (
              <button
                key={r.k}
                onClick={() => setRole(r.k as typeof role)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  role === r.k ? 'bg-esports-400/20 text-esports-300 border border-esports-400/30' : 'text-night-400 hover:text-night-200'
                }`}
              >
                {r.l}
              </button>
            ))}
          </div>
          <div className="text-xs text-night-500 ml-auto">
            <Filter className="w-3.5 h-3.5 inline mr-1.5" />
            共 <span className="data-number font-bold text-esports-300 text-sm">{filtered.length}</span> 条订单
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-20 text-center"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-night-800/80 flex items-center justify-center mb-5">
                <FileText className="w-12 h-12 text-night-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">暂无订单</h3>
              <p className="text-night-400 mb-6">当前筛选条件下还没有订单记录</p>
              <Link to="/publish" className="btn-primary inline-flex">
                立即发布需求
                <MoreHorizontal className="w-4 h-4" />
              </Link>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {filtered.map((o, i) => (
                <motion.div
                  layout
                  key={o.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ delay: Math.min(i * 40, 300) }}
                >
                  <OrderCard orderId={o.id} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

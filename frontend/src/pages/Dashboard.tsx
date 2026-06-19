import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { CATEGORY_OPTIONS, ORDER_STATUS, CONTRACT_STATUS, formatCurrency, formatWeight, formatDate } from '../lib/constants';

interface Stats {
  opportunities: any;
  orders: any;
  users: any;
  enterprises: any;
  category_breakdown: any[];
  recent_orders: any[];
  trace_codes: any;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats').then(d => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading || !stats) return <div className="flex items-center justify-center py-32 text-slate-400">数据加载中...</div>;

  const cards = [
    { label: '商机总量', value: stats.opportunities.total, sub: `供应${stats.opportunities.supply_count} · 需求${stats.opportunities.demand_count}`, icon: '🎯', color: 'from-blue-500 to-blue-600', route: '/opportunities' },
    { label: '交易总额', value: formatCurrency(stats.orders.total_amount), sub: `订单${stats.orders.total}笔 · 完成${stats.orders.completed}笔`, icon: '💰', color: 'from-emerald-500 to-green-600', route: '/orders' },
    { label: '入驻企业', value: stats.enterprises.approved, sub: `待审核${stats.enterprises.pending} · 驳回${stats.enterprises.rejected}`, icon: '🏢', color: 'from-purple-500 to-violet-600', route: '/admin/enterprises' },
    { label: '溯源备案', value: stats.trace_codes.total, sub: `固废系统已同步${stats.trace_codes.env_synced}条`, icon: '🏷️', color: 'from-amber-500 to-orange-600', route: '/trace-codes' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c, i) => (
          <Link key={i} to={c.route} className="card card-hover p-5 block">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-2xl shadow-lg shadow-black/5`}>
                {c.icon}
              </div>
              <span className="text-xs text-slate-400">→</span>
            </div>
            <div className="text-3xl font-bold text-slate-900">{c.value}</div>
            <div className="text-sm text-slate-500 mt-1">{c.sub}</div>
            <div className="mt-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800 text-lg">📈 品类供需分析</h3>
            <Link to="/heatmap" className="text-sm text-primary-600 hover:underline">查看热力图 →</Link>
          </div>
          <div className="space-y-4">
            {stats.category_breakdown.map((cb: any) => {
              const max = Math.max(...stats.category_breakdown.map(x => x.supply_volume + x.demand_volume)) || 1;
              const cat = CATEGORY_OPTIONS.find(o => o.value === cb.category);
              return (
                <div key={cb.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat?.color}`}>{cb.category}</span>
                      <span className="text-sm text-slate-600">{cb.count}条商机</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-800">均价 {formatCurrency(cb.avg_price)}/吨</div>
                  </div>
                  <div className="flex gap-1 h-8 rounded-lg overflow-hidden bg-slate-50">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-end pr-2 text-white text-xs font-medium" 
                      style={{ width: `${(cb.supply_volume / max) * 50}%`, minWidth: cb.supply_volume > 0 ? '8%' : 0 }}
                    >
                      {cb.supply_volume > 0 && <span className="truncate max-w-full">供{Math.round(cb.supply_volume)}</span>}
                    </div>
                    <div 
                      className="bg-gradient-to-r from-emerald-400 to-green-500 flex items-center pl-2 text-white text-xs font-medium" 
                      style={{ width: `${(cb.demand_volume / max) * 50}%`, minWidth: cb.demand_volume > 0 ? '8%' : 0 }}
                    >
                      {cb.demand_volume > 0 && <span className="truncate max-w-full">需{Math.round(cb.demand_volume)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-800 text-lg">👥 企业分布</h3>
          </div>
          <div className="space-y-3">
            {[
              { k: '回收商', v: stats.users.recycler_count, c: 'bg-green-500', r: 'recycler' },
              { k: '产废单位', v: stats.users.producer_count, c: 'bg-blue-500', r: 'producer' },
              { k: '质检机构', v: stats.users.inspector_count, c: 'bg-purple-500', r: 'inspector' },
              { k: '物流承运商', v: stats.users.carrier_count, c: 'bg-amber-500', r: 'carrier' },
            ].map(r => {
              const total = Object.values({ a: stats.users.recycler_count, b: stats.users.producer_count, c: stats.users.inspector_count, d: stats.users.carrier_count })
                .reduce((s: number, n: any) => s + Number(n || 0), 0) || 1;
              return (
                <div key={r.r}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600">{r.k}</span>
                    <span className="font-semibold text-slate-800">{r.v} 家</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${r.c} transition-all`} style={{ width: `${(r.v / total) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700">快捷入口</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { t: '发布商机', i: '➕', r: '/opportunities/publish' },
                { t: '议价中心', i: '💬', r: '/negotiations' },
                { t: '电子合同', i: '📄', r: '/contracts' },
                { t: '信用评级', i: '⭐', r: '/credit-ratings' },
                { t: '溯源查询', i: '🔍', r: '/trace-verify' },
                { t: '价格预测', i: '📈', r: '/price-forecast' },
              ].map(q => (
                <Link key={q.r} to={q.r} className="p-3 rounded-lg bg-slate-50 hover:bg-primary-50 text-center transition group">
                  <div className="text-2xl group-hover:scale-110 transition">{q.i}</div>
                  <div className="text-xs text-slate-600 mt-1">{q.t}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-800 text-lg">📦 最近交易订单</h3>
          <Link to="/orders" className="text-sm text-primary-600 hover:underline">全部订单 →</Link>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-header">订单编号</th>
                <th className="table-header">品类</th>
                <th className="table-header">规格</th>
                <th className="table-header">数量</th>
                <th className="table-header">买方</th>
                <th className="table-header">卖方</th>
                <th className="table-header">金额</th>
                <th className="table-header">状态</th>
                <th className="table-header">创建时间</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_orders.length === 0 && (
                <tr><td colSpan={10} className="text-center py-10 text-slate-400">暂无订单数据</td></tr>
              )}
              {stats.recent_orders.map((o: any) => {
                const st = ORDER_STATUS[o.status];
                return (
                  <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="table-cell font-mono text-xs text-slate-700">{o.id.substring(0, 8).toUpperCase()}...</td>
                    <td className="table-cell">{o.category}</td>
                    <td className="table-cell text-slate-500">{o.sub_category}</td>
                    <td className="table-cell">{formatWeight(o.quantity)}</td>
                    <td className="table-cell text-xs max-w-[120px] truncate" title={o.buyer_name}>{o.buyer_name}</td>
                    <td className="table-cell text-xs max-w-[120px] truncate" title={o.seller_name}>{o.seller_name}</td>
                    <td className="table-cell font-semibold text-slate-900">{formatCurrency(o.total_amount)}</td>
                    <td className="table-cell"><span className={`status-badge ${st?.color}`}>{st?.label}</span></td>
                    <td className="table-cell text-xs">{formatDate(o.created_at)}</td>
                    <td className="table-cell">
                      <Link to={`/orders/${o.id}`} className="text-primary-600 hover:underline text-xs">详情</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

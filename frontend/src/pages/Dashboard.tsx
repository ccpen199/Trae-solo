import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { CATEGORY_OPTIONS, ORDER_STATUS, CONTRACT_STATUS, formatCurrency, formatWeight, formatDate, ROLE_LABELS } from '../lib/constants';
import { useAuthStore } from '../store/auth';

interface Stats {
  opportunities: any;
  orders: any;
  users?: any;
  enterprises?: any;
  category_breakdown: any[];
  recent_orders: any[];
  trace_codes: any;
  is_personal?: boolean;
  _role: string;
  negotiations?: any;
  contracts?: any;
  payments?: any;
  logistics?: any;
  inspections?: any;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats').then(d => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading || !stats) return <div className="flex items-center justify-center py-32 text-slate-400">数据加载中...</div>;

  const isPersonal = !!stats.is_personal;
  const role = stats._role;

  let cards: any[] = [];

  if (!isPersonal) {
    cards = [
      { label: '商机总量', value: stats.opportunities.total, sub: `供应${stats.opportunities.supply_count} · 需求${stats.opportunities.demand_count}`, icon: '🎯', color: 'from-blue-500 to-blue-600', route: '/opportunities' },
      { label: '交易总额', value: formatCurrency(stats.orders.total_amount), sub: `订单${stats.orders.total}笔 · 完成${stats.orders.completed}笔`, icon: '💰', color: 'from-emerald-500 to-green-600', route: '/orders' },
      { label: '入驻企业', value: stats.enterprises?.approved || 0, sub: `待审核${stats.enterprises?.pending || 0} · 驳回${stats.enterprises?.rejected || 0}`, icon: '🏢', color: 'from-purple-500 to-violet-600', route: '/admin/enterprises' },
      { label: '溯源备案', value: stats.trace_codes.total || 0, sub: `固废系统已同步${stats.trace_codes.env_synced || 0}条`, icon: '🏷️', color: 'from-amber-500 to-orange-600', route: '/trace-codes' },
    ];
  } else {
    const baseCards = [
      { label: '我的商机', value: stats.opportunities.total || 0, sub: `供应${stats.opportunities.supply_count || 0} · 需求${stats.opportunities.demand_count || 0}`, icon: '🎯', color: 'from-blue-500 to-blue-600', route: '/opportunities' },
      { label: '交易总额', value: formatCurrency(stats.orders.total_amount || 0), sub: `订单${stats.orders.total || 0}笔 · 完成${stats.orders.completed || 0}笔`, icon: '💰', color: 'from-emerald-500 to-green-600', route: '/orders' },
    ];

    if (role === 'recycler' || role === 'producer') {
      cards = [
        ...baseCards,
        { label: '待处理议价', value: stats.negotiations?.pending || 0, sub: `已接受${stats.negotiations?.accepted || 0} · 总计${stats.negotiations?.total || 0}`, icon: '💬', color: 'from-violet-500 to-purple-600', route: '/negotiations' },
        { label: '资金监管', value: formatCurrency(stats.payments?.frozen_amount || 0), sub: `已释放${formatCurrency(stats.payments?.released_amount || 0)}`, icon: '🔒', color: 'from-amber-500 to-orange-600', route: '/orders' },
        { label: '溯源备案', value: stats.trace_codes?.total || 0, sub: `固废同步${stats.trace_codes?.env_synced || 0}条`, icon: '🏷️', color: 'from-teal-500 to-cyan-600', route: '/trace-codes' },
        { label: '物流配送', value: stats.logistics?.total || 0, sub: `已送达${stats.logistics?.delivered || 0}单`, icon: '🚚', color: 'from-sky-500 to-blue-600', route: '/logistics/quotations' },
      ];
    } else if (role === 'inspector') {
      cards = [
        { label: '质检任务', value: stats.inspections?.total || 0, sub: `已出具${stats.inspections?.issued || 0}份`, icon: '🔬', color: 'from-violet-500 to-purple-600', route: '/orders' },
        { label: '已完成订单', value: stats.orders.completed || 0, sub: `总订单${stats.orders.total || 0}笔`, icon: '✅', color: 'from-emerald-500 to-green-600', route: '/orders' },
        { label: '交易总额', value: formatCurrency(stats.orders.total_amount || 0), sub: `质检收入统计`, icon: '💰', color: 'from-amber-500 to-orange-600', route: '/orders' },
        { label: '溯源备案', value: stats.trace_codes?.total || 0, sub: `参与质检溯源`, icon: '🏷️', color: 'from-teal-500 to-cyan-600', route: '/trace-codes' },
      ];
    } else if (role === 'carrier') {
      cards = [
        { label: '运输订单', value: stats.logistics?.total || 0, sub: `运输中${stats.logistics?.in_transit || 0} · 已送达${stats.logistics?.delivered || 0}`, icon: '🚚', color: 'from-blue-500 to-blue-600', route: '/logistics/carrier-orders' },
        { label: '运输收入', value: formatCurrency(stats.logistics?.total_income || 0), sub: `累计结算金额`, icon: '💰', color: 'from-emerald-500 to-green-600', route: '/logistics/carrier-orders' },
        { label: '待报价需求', value: stats.orders.total || 0, sub: `新待报价订单`, icon: '📋', color: 'from-amber-500 to-orange-600', route: '/logistics/quotations' },
        { label: '已完成订单', value: stats.orders.completed || 0, sub: `历史完成订单`, icon: '✅', color: 'from-teal-500 to-cyan-600', route: '/logistics/carrier-orders' },
      ];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">工作台</h2>
          <p className="text-slate-500 text-sm mt-1">欢迎回来，{ROLE_LABELS[role as keyof typeof ROLE_LABELS] || ''} · {user?.username}</p>
        </div>
      </div>

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
            <h3 className="font-bold text-slate-800 text-lg">{isPersonal ? '� 我的经营概览' : '�👥 企业分布'}</h3>
          </div>

          {!isPersonal && stats.users ? (
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
          ) : (
            <div className="space-y-3">
              {role === 'recycler' || role === 'producer' ? (
                <>
                  {[
                    { k: '议价中', v: stats.negotiations?.pending || 0, c: 'bg-violet-500' },
                    { k: '已签合同', v: stats.contracts?.signed || 0, c: 'bg-blue-500' },
                    { k: '待付定金', v: stats.orders?.total ? stats.orders.total - (stats.orders.completed + stats.orders.disputed) : 0, c: 'bg-amber-500' },
                    { k: '已完成', v: stats.orders?.completed || 0, c: 'bg-green-500' },
                  ].map(r => {
                    const total = (stats.negotiations?.total || 0) + (stats.contracts?.total || 0) + (stats.orders?.total || 0) || 1;
                    return (
                      <div key={r.k}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-slate-600">{r.k}</span>
                          <span className="font-semibold text-slate-800">{r.v} 项</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${r.c} transition-all`} style={{ width: `${(r.v / total) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-500">
                    <div className="text-2xl mb-2">{role === 'inspector' ? '🔬' : '🚚'}</div>
                    <div>当前无待处理任务</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700">快捷入口</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { t: '发布商机', i: '➕', r: '/opportunities/publish', show: role === 'producer' || role === 'recycler' || isPersonal === false },
                { t: '议价中心', i: '💬', r: '/negotiations', show: role === 'producer' || role === 'recycler' || isPersonal === false },
                { t: '电子合同', i: '📄', r: '/contracts', show: role === 'producer' || role === 'recycler' || isPersonal === false },
                { t: '信用评级', i: '⭐', r: '/credit-ratings', show: role === 'recycler' || isPersonal === false },
                { t: '溯源查询', i: '🔍', r: '/trace-verify', show: true },
                { t: '价格预测', i: '📈', r: '/price-forecast', show: true },
              ].filter(q => q.show).map(q => (
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
                <th className="table-header">订单状态</th>
                <th className="table-header">议价</th>
                <th className="table-header">合同</th>
                <th className="table-header">资金</th>
                <th className="table-header">创建时间</th>
                <th className="table-header">操作</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_orders.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-12">
                    <div className="text-5xl mb-4">📋</div>
                    <div className="text-slate-500 mb-2">暂无交易订单记录</div>
                    <div className="text-sm text-slate-400 mb-4">
                      {isPersonal ? '前往商机市场选择合适的商机发起议价，开启第一笔交易' : '平台暂无交易数据'}
                    </div>
                    {isPersonal && (role === 'recycler' || role === 'producer') && (
                      <div className="flex gap-3 justify-center">
                        <Link to="/opportunities" className="btn-primary">
                          前往商机市场
                        </Link>
                        <Link to="/opportunities/publish" className="btn-secondary">
                          发布商机
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                stats.recent_orders.map((o: any) => {
                  const st = ORDER_STATUS[o.status];
                  const negStatus = o.negotiation_status ? ORDER_STATUS[o.negotiation_status] : { label: '-', color: 'bg-slate-100 text-slate-500' };
                  const contractStatus = o.contract_status ? CONTRACT_STATUS[o.contract_status] : { label: '-', color: 'bg-slate-100 text-slate-500' };
                  const paymentStatus = o.payment_status ? { 
                    label: o.payment_status === 'frozen' ? '已冻结' : o.payment_status === 'released' ? '已释放' : '-',
                    color: o.payment_status === 'frozen' ? 'bg-amber-100 text-amber-700' : o.payment_status === 'released' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  } : { label: '-', color: 'bg-slate-100 text-slate-500' };
                  return (
                    <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="table-cell font-mono text-xs text-slate-700">{o.order_no || o.id.substring(0, 8).toUpperCase()}...</td>
                      <td className="table-cell">{o.category}</td>
                      <td className="table-cell text-slate-500">{o.sub_category}</td>
                      <td className="table-cell">{formatWeight(o.quantity)}</td>
                      <td className="table-cell text-xs max-w-[120px] truncate" title={o.buyer_name}>{o.buyer_name}</td>
                      <td className="table-cell text-xs max-w-[120px] truncate" title={o.seller_name}>{o.seller_name}</td>
                      <td className="table-cell font-semibold text-slate-900">{formatCurrency(o.total_amount)}</td>
                      <td className="table-cell"><span className={`status-badge ${st?.color}`}>{st?.label}</span></td>
                      <td className="table-cell"><span className={`status-badge text-xs ${negStatus?.color}`}>{negStatus?.label}</span></td>
                      <td className="table-cell"><span className={`status-badge text-xs ${contractStatus?.color}`}>{contractStatus?.label}</span></td>
                      <td className="table-cell"><span className={`status-badge text-xs ${paymentStatus?.color}`}>{paymentStatus?.label}</span></td>
                      <td className="table-cell text-xs">{formatDate(o.created_at)}</td>
                      <td className="table-cell">
                        <Link to={`/orders/${o.id}`} className="text-primary-600 hover:underline text-xs">查看</Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

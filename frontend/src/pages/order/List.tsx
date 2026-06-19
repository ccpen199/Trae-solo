import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { ORDER_STATUS, formatCurrency, formatWeight, formatDate } from '../../lib/constants';

export default function OrderList() {
  const [data, setData] = useState<any[]>([]);
  const [f, setF] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my').then(d => { setData(d as any); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = data.filter(o => f === 'all' ? true : o.status === f);

  const filterTabs = [
    { v: 'all', l: '全部' },
    { v: 'contracted', l: '待付定金' },
    { v: 'deposit_paid', l: '待发货' },
    { v: 'shipping', l: '运输中' },
    { v: 'inspecting', l: '质检中' },
    { v: 'completed', l: '已完成' },
    { v: 'disputed', l: '争议中' },
  ];

  return (
    <div className="space-y-5">
      <div className="card p-4 flex flex-wrap gap-2">
        {filterTabs.map(t => (
          <button key={t.v} onClick={() => setF(t.v)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition ${
              f === t.v ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>{t.l}</button>
        ))}
      </div>

      {loading ? (
        <div className="card p-16 text-center text-slate-400">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-3">📦</div>
          <div className="text-slate-600">暂无订单</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3 text-left">订单编号</th>
                <th className="px-5 py-3 text-left">商品</th>
                <th className="px-5 py-3 text-left">数量</th>
                <th className="px-5 py-3 text-left">买方</th>
                <th className="px-5 py-3 text-left">卖方</th>
                <th className="px-5 py-3 text-left">金额</th>
                <th className="px-5 py-3 text-left">状态</th>
                <th className="px-5 py-3 text-left">时间</th>
                <th className="px-5 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const st = ORDER_STATUS[o.status];
                return (
                  <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs font-semibold text-slate-700">DD-{o.id.substring(0, 8).toUpperCase()}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800 max-w-[180px] truncate" title={o.opp_title}>{o.category} · {o.sub_category}</div>
                      <div className="text-xs text-slate-500 mt-0.5 max-w-[180px] truncate">{o.opp_title}</div>
                    </td>
                    <td className="px-5 py-4"><div className="font-semibold">{formatWeight(o.quantity, o.unit)}</div></td>
                    <td className="px-5 py-4 text-xs max-w-[140px] truncate" title={o.buyer_name}>{o.buyer_name}</td>
                    <td className="px-5 py-4 text-xs max-w-[140px] truncate" title={o.seller_name}>{o.seller_name}</td>
                    <td className="px-5 py-4"><div className="font-bold text-slate-900">{formatCurrency(o.total_amount)}</div></td>
                    <td className="px-5 py-4"><span className={`status-badge ${st?.color}`}>{st?.label}</span></td>
                    <td className="px-5 py-4 text-xs text-slate-500">{formatDate(o.created_at)}</td>
                    <td className="px-5 py-4">
                      <Link to={`/orders/${o.id}`} className="text-primary-600 hover:underline text-xs font-medium">查看详情</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

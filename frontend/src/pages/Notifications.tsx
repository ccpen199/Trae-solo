import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { formatDateTime } from '../lib/constants';

const typeMap: Record<string, { label: string; icon: string; color: string; route: string }> = {
  opportunity: { label: '商机通知', icon: '🎯', color: 'bg-blue-50 text-blue-700', route: '/opportunities/' },
  negotiation: { label: '议价消息', icon: '💬', color: 'bg-purple-50 text-purple-700', route: '/negotiations/' },
  contract: { label: '合同消息', icon: '📄', color: 'bg-indigo-50 text-indigo-700', route: '/contracts/' },
  order: { label: '订单消息', icon: '📦', color: 'bg-emerald-50 text-emerald-700', route: '/orders/' },
  payment: { label: '资金消息', icon: '💰', color: 'bg-amber-50 text-amber-700', route: '/orders/' },
  logistics: { label: '物流消息', icon: '🚚', color: 'bg-cyan-50 text-cyan-700', route: '/tracking/' },
  system: { label: '系统通知', icon: '🔔', color: 'bg-slate-100 text-slate-700', route: '' }
};

export default function Notifications() {
  const [data, setData] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [typeCount, setTypeCount] = useState<Record<string, number>>({});
  const [f, setF] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f !== 'all' && f !== 'unread') params.set('type', f);
    if (f === 'unread') params.set('is_read', 'false');
    const d: any = await api.get(`/notifications?${params}`);
    setData(d.notifications || []);
    setUnread(d.unread_count || 0);
    setTypeCount(d.type_count || {});
    setLoading(false);
  };

  useEffect(() => { void fetchData(); }, [f]);

  const markRead = async (id: string) => { await api.put(`/notifications/${id}/read`); fetchData(); };
  const markAll = async () => {
    if (!confirm('全部标记为已读？')) return;
    await api.put('/notifications/read-all'); fetchData();
  };

  const tabs = [
    { v: 'all', l: '全部', n: data.length },
    { v: 'unread', l: '未读', n: unread },
    ...Object.keys(typeMap).map(k => ({ v: k, l: typeMap[k].label, n: typeCount[k] || 0 }))
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <span>🔔</span>消息中心
              {unread > 0 && <span className="text-sm font-normal bg-red-500 text-white px-2 py-0.5 rounded-full">{unread} 条未读</span>}
            </h2>
            <p className="text-sm text-slate-500">商机 · 议价 · 合同 · 订单 · 资金 · 物流实时通知</p>
          </div>
          <button onClick={markAll} disabled={unread === 0} className="btn-outline disabled:opacity-50">✓ 全部标记已读</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button key={t.v} onClick={() => setF(t.v)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                f === t.v ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {typeMap[t.v]?.icon || '📋'} {t.l} {t.n > 0 && <span className={f === t.v ? 'ml-1 opacity-70' : 'ml-1 text-slate-400'}>({t.n})</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="card p-16 text-center text-slate-400">加载中...</div> : data.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-4">🔕</div>
          <div className="text-slate-600">暂无消息</div>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map(n => {
            const t = typeMap[n.type] || typeMap.system;
            const route = t.route + (n.related_id || '');
            return (
              <div key={n.id} className={`card p-4 card-hover cursor-pointer relative overflow-hidden ${!n.is_read ? 'bg-primary-50/40 border-primary-200' : ''}`}
                onClick={() => { markRead(n.id); if (t.route) window.location.href = route; }}>
                {!n.is_read && <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-primary-600"></span>}
                <div className="flex items-start gap-3 ml-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${t.color}`}>{t.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800">{n.title}</span>
                      {!n.is_read && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>}
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed">{n.content}</div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${t.color}`}>{t.label}</span>
                      <span className="text-xs text-slate-400">{formatDateTime(n.created_at)}</span>
                    </div>
                  </div>
                  <span className="text-slate-300">→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

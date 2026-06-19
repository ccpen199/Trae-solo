import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { TRACE_STATUS, formatWeight, formatDateTime } from '../../lib/constants';

export default function TraceList() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/trace/trace-codes/my').then((d: any) => { setData(d.codes || []); setTotal(d.total || 0); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="card p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">🏷️ 废料溯源码管理</h2>
          <p className="text-sm text-slate-500">对接生态环境部固废系统 · 全生命周期可追溯，共 {total} 条记录</p>
        </div>
        <Link to="/trace-verify" className="btn-outline">🔍 公开溯源查询</Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { t: '总溯源码', v: total, i: '🏷️', c: 'from-slate-500 to-slate-600' },
          { t: '固废系统已同步', v: data.filter(t => t.min_env_sync_status === 'synced').length, i: '✅', c: 'from-emerald-500 to-green-600' },
          { t: '运输中', v: data.filter(t => t.status === 'in_transit').length, i: '🚚', c: 'from-cyan-500 to-blue-600' },
          { t: '已完成归档', v: data.filter(t => t.status === 'archived').length, i: '📦', c: 'from-primary-500 to-primary-600' }
        ].map((s, i) => (
          <div key={i} className="card p-5">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.c} flex items-center justify-center text-2xl mb-3 shadow-md shadow-black/5`}>{s.i}</div>
            <div className="text-3xl font-bold text-slate-900">{s.v}</div>
            <div className="text-sm text-slate-500 mt-1">{s.t}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="card p-16 text-center text-slate-400">加载中...</div> : data.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-3">🏷️</div>
          <div className="text-slate-600 mb-2">暂无溯源码记录</div>
          <div className="text-sm text-slate-400">支付定金后系统自动生成溯源码并同步生态环境部固废系统</div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map(t => {
            const ts = TRACE_STATUS[t.status];
            return (
              <div key={t.id} className="card p-5 card-hover">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-emerald-100 border-2 border-primary-200 rounded-2xl flex flex-col items-center justify-center">
                      <span className="text-lg">🏷️</span>
                      <span className="text-[9px] text-primary-700 font-bold tracking-tighter">{t.code?.slice(-6)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono font-bold text-lg text-slate-800 tracking-wide">{t.code}</span>
                        <span className={`status-badge ${ts?.color}`}>{ts?.label}</span>
                        {t.min_env_sync_status === 'synced'
                          ? <span className="status-badge bg-green-100 text-green-700 text-[10px]">✓ 生态环境部固废系统已同步</span>
                          : <span className="status-badge bg-amber-100 text-amber-700 text-[10px]">⏳ 待同步固废系统</span>
                        }
                      </div>
                      <div className="text-sm text-slate-600">{t.category} · {t.sub_category} · {formatWeight(t.quantity)}</div>
                      <div className="text-xs text-slate-400 mt-0.5">关联订单 <Link to={`/orders/${t.order_id}`} className="text-primary-600 hover:underline">DD-{t.order_id?.substring(0, 8).toUpperCase()}</Link> · 固废备案号: {t.min_env_tracking_no || '-'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400 mb-1">产废方 → 回收方</div>
                    <div className="text-xs text-slate-600 max-w-[240px] truncate">{t.producer_name} → {t.recycler_name}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm pt-3 border-t border-slate-100">
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-xs text-slate-400 mb-0.5">起始地</div><div>{t.origin_address}</div></div>
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-xs text-slate-400 mb-0.5">当前所在地</div><div>{t.current_address || t.origin_address}</div></div>
                  <div className="p-3 rounded-lg bg-slate-50"><div className="text-xs text-slate-400 mb-0.5">目的地</div><div>{t.destination_address}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

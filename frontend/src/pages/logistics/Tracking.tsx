import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { LOGISTICS_STATUS, formatDateTime, formatCurrency } from '../../lib/constants';

export default function Tracking() {
  const { no } = useParams();
  const [trackingInput, setTrackingInput] = useState(no || '');
  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const doSearch = async () => {
    if (!trackingInput.trim()) { alert('请输入运单号'); return; }
    setLoading(true); setErr(''); setSearched(true);
    try {
      const r: any = await api.get(`/logistics/tracking/${trackingInput.trim()}`);
      setData(r.logistics); setEvents(r.events);
    } catch (e: any) {
      setErr(e.error || '未查询到该运单，请检查运单号');
      setData(null); setEvents([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (no && no !== 'null') doSearch(); }, [no]);

  const st = data ? LOGISTICS_STATUS[data.status] : null;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="card p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-1">📍 物流轨迹查询</h2>
        <p className="text-sm text-slate-500 mb-5">输入运单号实时追踪货物位置（对接中储运/德邦API）</p>
        <div className="flex gap-2">
          <input value={trackingInput} onChange={e => setTrackingInput(e.target.value)} placeholder="请输入运单号，如 ZGY1718789..." className="input-field flex-1" onKeyDown={e => e.key === 'Enter' && doSearch()} />
          <button onClick={doSearch} disabled={loading} className="btn-primary px-8">{loading ? '查询中' : '🔍 查询'}</button>
        </div>
      </div>

      {err && <div className="card p-5 border-red-200 bg-red-50 text-red-700 text-sm">⚠️ {err}</div>}

      {data && (
        <>
          <div className="card overflow-hidden">
            <div className={`p-6 ${data.status === 'delivered' ? 'bg-gradient-to-r from-emerald-100 to-green-100' : data.status === 'exception' ? 'bg-gradient-to-r from-red-100 to-rose-100' : 'bg-gradient-to-r from-cyan-100 to-blue-100'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`status-badge bg-white/95 shadow-sm ${st?.color?.replace('bg-', 'text-').split(' ')[0]}`}>{st?.label}</span>
                    <span className="font-mono text-sm font-semibold">{data.tracking_no}</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">{data.category} · {data.sub_category} · {data.weight_ton}吨</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 mb-1">承运商</div>
                  <div className="font-semibold text-slate-800">{data.carrier_name}</div>
                  <div className="text-xs text-slate-500 mt-1">费用 {formatCurrency(data.quoted_price + (data.insurance_fee || 0))}</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-px bg-slate-200">
              {[
                { k: '车辆牌照', v: data.vehicle_no || '---' },
                { k: '司机', v: data.driver_name ? `${data.driver_name} · ${data.driver_phone}` : '待分配' },
                { k: '总里程', v: `${data.distance_km} km / 预计 ${data.estimated_days} 天` },
                { k: '预计到达', v: data.estimated_arrival?.split('T')[0] || '---' }
              ].map((s, i) => (
                <div key={i} className="bg-white p-4 text-sm">
                  <div className="text-xs text-slate-400 mb-0.5">{s.k}</div>
                  <div className="text-slate-800">{s.v}</div>
                </div>
              ))}
            </div>
            <div className="p-5 text-sm bg-slate-50/50 grid grid-cols-2 gap-5">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <div className="text-xs text-slate-400 mb-1">📦 提货地址</div>
                <div className="font-medium">{data.pickup_address}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <div className="text-xs text-slate-400 mb-1">🏁 送达地址</div>
                <div className="font-medium">{data.delivery_address}</div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-5">🔄 物流轨迹节点</h3>
            {events.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">暂无轨迹信息</div>
            ) : (
              <div className="relative pl-1">
                <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary-300 via-slate-200 to-slate-100"></div>
                <div className="space-y-5">
                  {events.slice().reverse().map((e, i) => {
                    const first = i === 0;
                    return (
                      <div key={e.id} className="relative flex gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white shadow-sm ${
                          first ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white ring-4 ring-primary-100' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {first ? '📍' : '✓'}
                        </div>
                        <div className="flex-1 pt-0.5 pb-1">
                          <div className={`font-semibold ${first ? 'text-slate-900' : 'text-slate-700'}`}>
                            {e.status}
                            {first && <span className="ml-2 text-xs text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">最新</span>}
                          </div>
                          <div className="text-sm text-slate-600 mt-1">{e.description}</div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                            <span>📍 {e.location}</span>
                            <span>·</span>
                            <span>{formatDateTime(e.event_time)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {!data && !loading && !searched && (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-3">🔍</div>
          <div className="text-slate-600">输入运单号即可查询货物实时位置</div>
        </div>
      )}
    </div>
  );
}

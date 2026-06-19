import { useState } from 'react';
import api from '../../lib/api';
import { TRACE_STATUS, formatWeight, formatDateTime } from '../../lib/constants';

export default function TraceVerify() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [err, setErr] = useState('');

  const samples = ['TRC17187894', 'TRC17187895', 'TRC17187896'];

  const verify = async () => {
    if (!code.trim()) { alert('请输入溯源码'); return; }
    setLoading(true); setErr(''); setData(null); setEvents([]);
    try {
      const r: any = await api.post('/trace/trace-codes/verify', { code: code.trim() });
      setData(r.trace); setEvents(r.events);
    } catch (e: any) { setErr(e.error || '溯源码不存在'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="card p-8 text-center border-2 border-primary-100 bg-gradient-to-br from-primary-50/50 via-white to-emerald-50/30">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary-500 to-emerald-600 flex items-center justify-center text-4xl shadow-xl shadow-primary-200/50 mb-4">🏷️</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">废料溯源码查询（公开）</h2>
        <p className="text-sm text-slate-500 mb-6">对接生态环境部固体废物管理系统 · 全链路合规溯源</p>
        <div className="max-w-xl mx-auto flex gap-2">
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="请输入16位溯源码，如 TRC1718789471..." className="input-field flex-1 text-lg px-4 py-3" onKeyDown={e => e.key === 'Enter' && verify()} />
          <button onClick={verify} disabled={loading} className="btn-primary px-8">{loading ? '查询中...' : '🔍 验证溯源'}</button>
        </div>
        <div className="mt-4 text-xs text-slate-500">
          示例溯源码:
          {samples.map(s => (
            <button key={s} onClick={() => { setCode(s); setTimeout(verify, 50); }} className="ml-2 font-mono text-primary-600 hover:underline bg-primary-50 px-2 py-0.5 rounded">{s}</button>
          ))}
        </div>
      </div>

      {err && <div className="card p-5 border-red-200 bg-red-50 text-red-700 flex items-center gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <div className="font-semibold">{err}</div>
          <div className="text-xs text-red-600/80 mt-1">溯源码由平台系统自动生成，请向交易对方索取</div>
        </div>
      </div>}

      {data && (
        <>
          <div className={`card overflow-hidden ${data.min_env_verified ? 'border-2 border-emerald-300' : ''}`}>
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono font-bold text-2xl tracking-widest bg-white/20 px-4 py-1.5 rounded-lg backdrop-blur">{data.code}</span>
                    {data.min_env_verified
                      ? <span className="bg-white/95 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">✓ 生态环境部固废系统认证</span>
                      : <span className="bg-amber-400/90 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">⚠️ 待完成固废系统备案</span>
                    }
                  </div>
                  <div className="text-white/90 text-sm mt-3">{data.category} · {data.sub_category} · {formatWeight(data.quantity, data.unit)}</div>
                  {data.min_env_tracking_no && (
                    <div className="text-white/70 text-xs mt-1 font-mono">固废系统跟踪编号: {data.min_env_tracking_no}</div>
                  )}
                </div>
                <div className={`status-badge bg-white/95 text-slate-700 text-sm ${TRACE_STATUS[data.status]?.color}`}>{TRACE_STATUS[data.status]?.label}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-slate-200">
              {[
                { k: '产废单位', v: <div><div className="font-medium">{data.producer_name}</div><div className="text-xs text-slate-400 mt-0.5">{data.producer_region}</div></div> },
                { k: '回收利用单位', v: <div><div className="font-medium">{data.recycler_name}</div><div className="text-xs text-slate-400 mt-0.5">{data.recycler_region}</div></div> },
                { k: '关联订单', v: <span className="font-mono">DD-{data.order_id?.substring(0, 12).toUpperCase()}...</span> },
                { k: '订单状态', v: <span className={`status-badge ${data.order_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{data.order_status}</span> },
              ].map((s, i) => (
                <div key={i} className="bg-white p-4">
                  <div className="text-xs text-slate-400 mb-1">{s.k}</div>
                  <div className="text-slate-800">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {data.report_no && (
            <div className="card p-5 bg-purple-50/40 border-purple-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500 text-white flex items-center justify-center flex-shrink-0">🔬</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-slate-800">CMA质检报告</h3>
                    {data.is_passed ? <span className="status-badge bg-green-100 text-green-700">✓ 合格</span> : <span className="status-badge bg-red-100 text-red-700">✗ 不合格</span>}
                  </div>
                  <div className="text-sm text-slate-600 grid grid-cols-3 gap-4 mt-2">
                    <div>报告编号: <span className="font-mono text-slate-800">{data.report_no}</span></div>
                    <div>等级: <span className="font-bold text-purple-700">{data.quality_grade}</span></div>
                    <div>出具机构: <span className="text-slate-800">{data.inspector_name || '-'}</span></div>
                    <div>杂质率: <span className="font-semibold">{data.impurity_rate}%</span></div>
                    <div>含水率: <span className="font-semibold">{data.moisture_rate}%</span></div>
                    <div>检测日期: {data.inspection_date}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="font-bold text-slate-800 mb-5">🔗 溯源链路全生命周期</h3>
            <div className="relative pl-2">
              <div className="absolute left-7 top-3 bottom-3 w-0.5 bg-gradient-to-b from-emerald-400 via-primary-300 to-slate-200"></div>
              <div className="space-y-6">
                {events.slice().reverse().map((e, i) => {
                  const first = i === 0;
                  return (
                    <div key={e.id} className="relative flex gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-4 border-white shadow-md ${
                        first ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white ring-4 ring-emerald-100'
                          : i === events.length - 1 ? 'bg-gradient-to-br from-slate-500 to-slate-600 text-white'
                          : 'bg-white border-2 border-primary-300 text-primary-600'
                      }`}>
                        {first ? '📍' : e.event_type.includes('质检') ? '🔬' : e.event_type.includes('同步') ? '📡' : e.event_type.includes('揽收') || e.event_type.includes('运输') || e.event_type.includes('生成') ? '🚚' : '✓'}
                      </div>
                      <div className="flex-1 pt-0.5 pb-2">
                        <div className={`font-semibold ${first ? 'text-slate-900 text-base' : 'text-slate-700'}`}>
                          {e.event_type}
                          {first && <span className="ml-2 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">当前节点</span>}
                        </div>
                        <div className="text-sm text-slate-600 mt-1 leading-relaxed">{e.description}</div>
                        <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                          <span>👤 {e.operator}</span>
                          <span>·</span>
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
          </div>
        </>
      )}
    </div>
  );
}

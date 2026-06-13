import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Package, Clock, MapPin, Bell, ListTodo, UserCheck, ChevronRight, X } from 'lucide-react';
import { api } from '../lib/api';
import type { Waybill, TrackingEvent } from '../../shared/types';

export default function TrackPage() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(sp.get('q') || '');
  const [batch, setBatch] = useState<string[]>([]);
  const [batchInput, setBatchInput] = useState('');
  const [result, setResult] = useState<{ waybill: Waybill; events: TrackingEvent[] } | null>(null);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [tab, setTab] = useState<'single' | 'batch' | 'history'>('single');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [bound, setBound] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (query) doSearch();
    api.track.history().then((d) => setHistory(d as any[]));
  }, []);

  const doSearch = async () => {
    setError('');
    if (!query) return;
    try {
      const r = await api.track.get(query.trim());
      setResult(r as any);
    } catch {
      setError('未找到该运单，请检查运单号是否正确');
      setResult(null);
    }
  };

  const doBatch = async () => {
    if (!batchInput) return;
    const nos = batchInput.split(/[\n,，\s]+/).filter(Boolean);
    try {
      const r = await api.track.batch(nos);
      setBatchResults(r as any[]);
      setBatch(nos);
    } catch {}
  };

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: '待取件', color: 'tag-gray', icon: Clock },
    picked: { label: '已取件', color: 'tag-blue', icon: Package },
    inTransit: { label: '运输中', color: 'tag-blue', icon: Package },
    delivering: { label: '派送中', color: 'tag-orange', icon: MapPin },
    signed: { label: '已签收', color: 'tag-green', icon: UserCheck },
    exception: { label: '异常', color: 'tag-red', icon: X },
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-neutral-700 mb-6">物流查询</h1>

      <div className="card mb-6">
        <div className="flex border-b border-neutral-200 mb-5 -mx-6 -mt-6 px-6">
          {[
            { k: 'single', label: '单号查询', icon: Search },
            { k: 'batch', label: '批量查询', icon: ListTodo },
            { k: 'history', label: '历史记录', icon: Clock },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as any)}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 -mb-px transition-all ${
                tab === t.k ? 'border-brand-500 text-brand-500' : 'border-transparent text-neutral-500 hover:text-brand-500'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'single' && (
          <div>
            <div className="flex gap-3 mb-4">
              <input
                className="input-field text-base"
                placeholder="请输入运单号，例如：ZT7890123456789"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              />
              <button onClick={doSearch} className="btn-primary !px-8">
                <Search className="w-4 h-4" /> 查询
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              试试：
              {['ZT7890123456789', 'ZT7890123456790', 'ZT7890123456791'].map((n) => (
                <button key={n} onClick={() => { setQuery(n); setTimeout(doSearch, 0); }} className="px-2 py-0.5 bg-neutral-100 rounded hover:bg-brand-50 hover:text-brand-500">
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'batch' && (
          <div>
            <textarea
              className="input-field h-32 resize-none font-mono text-sm"
              placeholder="请输入多个运单号，支持换行、逗号、空格分隔&#10;例如：&#10;ZT7890123456789&#10;ZT7890123456790&#10;ZT7890123456791"
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-neutral-400">最多支持 20 个运单同时查询</span>
              <button onClick={doBatch} className="btn-primary">
                <ListTodo className="w-4 h-4" /> 批量查询
              </button>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div>
            {bound ? (
              <div className="flex items-center justify-between mb-4 p-3 bg-success-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-success-500" />
                  <span className="text-sm text-success-600">已绑定手机号 138****8000，可查看最近半年历史记录</span>
                </div>
                <button onClick={() => setBound(false)} className="text-xs text-neutral-500 hover:text-brand-500">解绑</button>
              </div>
            ) : (
              <div className="mb-4 p-4 bg-neutral-50 rounded-lg text-center">
                <div className="text-sm text-neutral-600 mb-3">绑定手机号后可查看近半年内所有物流记录</div>
                <button onClick={() => setBound(true)} className="btn-secondary">
                  <UserCheck className="w-4 h-4" /> 绑定手机号
                </button>
              </div>
            )}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-500" />
                <span className="text-sm text-neutral-600">物流节点推送通知</span>
              </div>
              <button
                onClick={() => setPushEnabled(!pushEnabled)}
                className={`relative w-12 h-6 rounded-full transition-all ${pushEnabled ? 'bg-brand-500' : 'bg-neutral-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${pushEnabled ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        )}
      </div>

      {tab === 'single' && error && (
        <div className="card border border-red-200 bg-red-50 text-center py-8 mb-6">
          <X className="w-10 h-10 text-danger-500 mx-auto mb-2" />
          <div className="text-neutral-600">{error}</div>
        </div>
      )}

      {tab === 'single' && result && (
        <div className="card">
          <div className="flex items-start justify-between mb-5 pb-5 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-neutral-700">运单号 {result.waybill.trackingNo}</h3>
                {(() => {
                  const s = statusMap[result.waybill.status];
                  return <span className={s.color}>{s.label}</span>;
                })()}
              </div>
              <div className="text-sm text-neutral-500">
                {result.waybill.senderName} → {result.waybill.receiverName} · {result.waybill.receiverAddress.slice(0, 15)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-neutral-400">运费</div>
              <div className="text-xl font-bold text-accent-500">¥{result.waybill.freight}</div>
            </div>
          </div>

          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-neutral-200" />
            {result.events.map((e, i) => {
              const Icon = i === 0 ? Package : MapPin;
              return (
                <div key={e.id} className="relative pb-6 last:pb-0 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div
                    className={`absolute -left-[18px] w-5 h-5 rounded-full flex items-center justify-center ${
                      i === 0 ? 'bg-brand-500 text-white animate-pulse-slow' : 'bg-white border-2 border-neutral-300 text-neutral-400'
                    }`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                  </div>
                  <div className="ml-2">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-sm font-medium ${i === 0 ? 'text-brand-500' : 'text-neutral-700'}`}>{e.status}</span>
                      <span className="text-xs text-neutral-400">{e.timestamp}</span>
                    </div>
                    <div className="text-sm text-neutral-600 mt-0.5">{e.description}</div>
                    <div className="text-xs text-neutral-400">{e.location}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {result.waybill.status !== 'signed' && (
            <div className="mt-6 pt-5 border-t border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Bell className="w-4 h-4 text-brand-500" />
                开启节点推送，实时获取物流状态更新
              </div>
              <button
                onClick={() => setPushEnabled(!pushEnabled)}
                className={`relative w-12 h-6 rounded-full transition-all ${pushEnabled ? 'bg-brand-500' : 'bg-neutral-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${pushEnabled ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'batch' && batchResults.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-neutral-700 mb-4">批量查询结果（{batchResults.length}）</h3>
          <div className="space-y-3">
            {batchResults.map((r, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-all ${
                  r.found ? 'border-neutral-200 hover:border-brand-300 hover:shadow-sm' : 'border-red-200 bg-red-50'
                }`}
              >
                {r.found ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-semibold">{r.trackingNo}</span>
                        {statusMap[r.status] && <span className={statusMap[r.status].color}>{statusMap[r.status].label}</span>}
                      </div>
                      <div className="text-sm text-neutral-600">{r.latestEvent?.description}</div>
                      <div className="text-xs text-neutral-400">{r.latestEvent?.location} · {r.latestEvent?.timestamp}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-300" />
                  </div>
                ) : (
                  <div className="text-neutral-500">
                    <span className="font-mono">{r.trackingNo}</span> - 未找到该运单
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'history' && history.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-neutral-700 mb-4">近半年物流记录（{history.length}）</h3>
          <div className="space-y-3">
            {history.map((h) => (
              <div
                key={h.id}
                onClick={() => { setQuery(h.trackingNo); setTab('single'); setTimeout(() => api.track.get(h.trackingNo).then((r) => setResult(r as any)), 0); }}
                className="p-4 rounded-xl border border-neutral-200 hover:border-brand-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-semibold text-neutral-700">{h.trackingNo}</span>
                  {statusMap[h.status] && <span className={statusMap[h.status].color}>{statusMap[h.status].label}</span>}
                </div>
                <div className="text-sm text-neutral-600 mb-1">寄往 → {h.receiverName} {h.receiverAddress.slice(0, 20)}</div>
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>{h.latestDesc || '暂无物流信息'}</span>
                  <span>¥{h.freight} · {h.createdAt.slice(0, 10)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

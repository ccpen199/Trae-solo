import { useEffect, useState, useCallback, useMemo } from 'react';
import { Wallet, CreditCard, AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react';
import { useSettlementStore } from '@/stores/useSettlementStore';
import StatusBadge from '@/components/StatusBadge';

const STATUS_FILTERS = ['全部', '待处理', '处理中', '已完成', '失败'];
const STATUS_KEY_MAP: Record<string, string> = { '待处理': 'pending', '处理中': 'processing', '已完成': 'completed', '失败': 'failed' };
const METHOD_FILTERS = ['全部', '微信', '银行卡'];

function formatTime(t: string) {
  if (!t) return '-';
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function maskAccount(acc: string) {
  if (!acc) return '-';
  if (acc.length <= 4) return acc;
  return acc.slice(0, 2) + '****' + acc.slice(-4);
}

function MethodIcon({ method }: { method: string }) {
  if (method === 'wechat') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-green-500 text-white text-xs font-bold">微</span>
        <span className="text-sm text-neutral-text">微信</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white text-xs font-bold">卡</span>
      <span className="text-sm text-neutral-text">银行卡</span>
    </span>
  );
}

export default function Settlement() {
  const { settlements, loading, fetchSettlements, executeSettlement, batchSettlement } = useSettlementStore();
  const [statusFilter, setStatusFilter] = useState('全部');
  const [methodFilter, setMethodFilter] = useState('全部');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmBatch, setConfirmBatch] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const params: Record<string, string | number> = {};
    if (statusFilter !== '全部') params.status = STATUS_KEY_MAP[statusFilter] || statusFilter;
    if (methodFilter !== '全部') params.method = methodFilter === '微信' ? 'wechat' : 'bank';
    fetchSettlements(params);
  }, [statusFilter, methodFilter, fetchSettlements]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const list = useMemo(() => (settlements as Record<string, unknown>[]) || [], [settlements]);

  const stats = useMemo(() => {
    let pending = 0, completed = 0, processing = 0, failed = 0;
    list.forEach((s) => {
      const st = s.status as string;
      const amt = (s.amount as number) || 0;
      if (st === 'pending') { pending += amt; }
      else if (st === 'completed') { completed += amt; }
      else if (st === 'processing') { processing += amt; }
      else if (st === 'failed') { failed++; }
    });
    return { pending, completed, processing, failedCount: failed };
  }, [list]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleExecute = async (id: string) => {
    try {
      await executeSettlement(id);
      showToast('打款已执行');
      setConfirmId(null);
      fetchSettlements();
    } catch { showToast('打款失败'); setConfirmId(null); }
  };

  const handleBatch = async () => {
    try {
      await batchSettlement(Array.from(selected));
      showToast('批量打款已执行');
      setConfirmBatch(false);
      setSelected(new Set());
      fetchSettlements();
    } catch { showToast('批量打款失败'); setConfirmBatch(false); }
  };

  const pendingSelected = list.filter(
    (s) => selected.has((s.id as string)) && (s.status as string) === 'pending'
  );

  const summaryCards = [
    { label: '待处理金额', value: `¥${stats.pending.toFixed(2)}`, icon: Wallet, color: 'text-yellow-600 bg-yellow-50' },
    { label: '已结算金额', value: `¥${stats.completed.toFixed(2)}`, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: '处理中金额', value: `¥${stats.processing.toFixed(2)}`, icon: Clock, color: 'text-blue-600 bg-blue-50' },
    { label: '失败笔数', value: stats.failedCount, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-forest-700 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-card">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-neutral-text">{s.value}</p>
              <p className="text-xs text-neutral-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <div className="flex gap-2">
            {STATUS_FILTERS.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${statusFilter === s ? 'bg-forest-700 text-white' : 'bg-white text-neutral-text hover:bg-forest-50'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {METHOD_FILTERS.map((m) => (
              <button key={m} onClick={() => setMethodFilter(m)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${methodFilter === m ? 'bg-forest-700 text-white' : 'bg-white text-neutral-text hover:bg-forest-50'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        {selected.size > 0 && (
          <button onClick={() => setConfirmBatch(true)}
            className="flex items-center gap-2 rounded-lg bg-forest-700 px-4 py-2 text-sm text-white hover:bg-forest-800">
            批量打款 ({pendingSelected.length})
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-border bg-neutral-bg">
              <th className="px-4 py-3 text-left"><input type="checkbox" checked={selected.size > 0 && list.every((s) => selected.has((s.id as string)))}
                onChange={() => {
                  if (selected.size > 0) setSelected(new Set());
                  else setSelected(new Set(list.filter((s) => (s.status as string) === 'pending').map((s) => (s.id as string))));
                }} className="rounded" /></th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">订单号</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">金额</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">方式</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">状态</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">账户</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">创建时间</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">完成时间</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-border animate-pulse">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-16 rounded bg-gray-200" /></td>
                  ))}
                </tr>
              ))
            ) : list.map((s) => {
              const id = (s.id as string) || '';
              const isPending = (s.status as string) === 'pending';
              const isFailed = (s.status as string) === 'failed';
              return (
                <tr key={id} className="border-b border-neutral-border hover:bg-neutral-bg/50">
                  <td className="px-4 py-3">
                    {(isPending) && <input type="checkbox" checked={selected.has(id)} onChange={() => toggleSelect(id)} className="rounded" />}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-muted">{id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3 font-medium text-neutral-text">¥{((s.amount as number) || 0).toFixed(2)}</td>
                  <td className="px-4 py-3"><MethodIcon method={(s.method as string) || ''} /></td>
                  <td className="px-4 py-3"><StatusBadge status={(s.status as string) || ''} category="settlement" /></td>
                  <td className="px-4 py-3 text-neutral-muted">{maskAccount((s.account as string) || '')}</td>
                  <td className="px-4 py-3 text-neutral-muted">{formatTime((s.created_at as string) || '')}</td>
                  <td className="px-4 py-3 text-neutral-muted">{formatTime((s.completed_at as string) || '')}</td>
                  <td className="px-4 py-3">
                    {(isPending || isFailed) && (
                      <button onClick={() => setConfirmId(id)}
                        className="rounded-lg bg-forest-700 px-3 py-1 text-xs text-white hover:bg-forest-800">
                        执行打款
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(confirmId || confirmBatch) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setConfirmId(null); setConfirmBatch(false); }}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-text">确认打款</h3>
              <button onClick={() => { setConfirmId(null); setConfirmBatch(false); }}><X className="h-5 w-5 text-neutral-muted" /></button>
            </div>
            <p className="mb-6 text-sm text-neutral-muted">
              {confirmBatch
                ? `确认对 ${pendingSelected.length} 笔待处理订单执行批量打款？`
                : '确认执行此笔打款操作？'}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setConfirmId(null); setConfirmBatch(false); }}
                className="rounded-lg border border-neutral-border px-4 py-2 text-sm text-neutral-text hover:bg-neutral-bg">取消</button>
              <button onClick={() => confirmBatch ? handleBatch() : confirmId && handleExecute(confirmId)}
                className="rounded-lg bg-forest-700 px-4 py-2 text-sm text-white hover:bg-forest-800">确认打款</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

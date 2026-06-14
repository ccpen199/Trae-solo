import { useEffect, useState, useCallback, useMemo } from 'react';
import { ShieldCheck, Clock, CheckCircle2, XCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useProcessorStore } from '@/stores/useProcessorStore';
import StatusBadge from '@/components/StatusBadge';

const STATUS_FILTERS = ['全部', '待审核', '初审中', '复审中', '已通过', '已驳回'];
const STATUS_KEY_MAP: Record<string, string> = {
  '待审核': 'pending', '初审中': 'initial_review', '复审中': 'final_review', '已通过': 'approved', '已驳回': 'rejected',
};

const AUDIT_STATUS_MAP: Record<string, string> = {
  pending: '待审核',
  initial_review: '初审中',
  final_review: '复审中',
  approved: '已通过',
  rejected: '已驳回',
};

const PROCESSOR_STATUS_CATEGORY = 'order';

const DOT_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500',
  initial_review: 'bg-blue-500',
  final_review: 'bg-purple-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
};

function ProcessorStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    initial_review: 'bg-blue-100 text-blue-700',
    final_review: 'bg-purple-100 text-purple-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };
  const label = AUDIT_STATUS_MAP[status] || status;
  const color = colors[status] || 'bg-gray-100 text-gray-700';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
}

function formatTime(t: string) {
  if (!t) return '-';
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

interface AuditModalData {
  id: string;
  newStatus: string;
  actionLabel: string;
}

export default function Audit() {
  const { processors, loading, fetchProcessors, auditProcessor } = useProcessorStore();
  const [statusFilter, setStatusFilter] = useState('全部');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [auditModal, setAuditModal] = useState<AuditModalData | null>(null);
  const [auditNotes, setAuditNotes] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const params: Record<string, string | number> = {};
    if (statusFilter !== '全部') params.status = STATUS_KEY_MAP[statusFilter] || statusFilter;
    fetchProcessors(params);
  }, [statusFilter, fetchProcessors]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const list = useMemo(() => (processors as Record<string, unknown>[]) || [], [processors]);

  const stats = useMemo(() => {
    let total = list.length, approved = 0, pending = 0, rejected = 0;
    list.forEach((p) => {
      const s = p.status as string;
      if (s === 'approved') approved++;
      if (s === 'pending' || s === 'initial_review' || s === 'final_review') pending++;
      if (s === 'rejected') rejected++;
    });
    return { total, approved, pending, rejected };
  }, [list]);

  const statCards = [
    { label: '处理方总数', value: stats.total, icon: ShieldCheck, color: 'text-forest-600 bg-forest-50' },
    { label: '已通过', value: stats.approved, icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    { label: '待审核', value: stats.pending, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
    { label: '已驳回', value: stats.rejected, icon: XCircle, color: 'text-red-600 bg-red-50' },
  ];

  const handleAudit = async () => {
    if (!auditModal) return;
    try {
      await auditProcessor(auditModal.id, { status: auditModal.newStatus, notes: auditNotes });
      showToast(`${auditModal.actionLabel}成功`);
      setAuditModal(null);
      setAuditNotes('');
      fetchProcessors();
    } catch { showToast('操作失败'); }
  };

  const getActions = (status: string, id: string) => {
    switch (status) {
      case 'pending':
        return [{ label: '开始初审', newStatus: 'initial_review' }];
      case 'initial_review':
        return [{ label: '通过初审', newStatus: 'final_review' }, { label: '驳回', newStatus: 'rejected' }];
      case 'final_review':
        return [{ label: '通过终审', newStatus: 'approved' }, { label: '驳回', newStatus: 'rejected' }];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-forest-700 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-card">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-text">{s.value}</p>
              <p className="text-xs text-neutral-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${statusFilter === s ? 'bg-forest-700 text-white' : 'bg-white text-neutral-text hover:bg-forest-50'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-border bg-neutral-bg">
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">企业名称</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">许可证</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">状态</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">联系人</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">申请时间</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-muted">操作</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-border animate-pulse">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 w-16 rounded bg-gray-200" /></td>
                  ))}
                </tr>
              ))
            ) : list.map((p) => {
              const id = (p.id as string) || '';
              const status = (p.status as string) || 'pending';
              const isExpanded = expandedId === id;
              const actions = getActions(status, id);
              const history = (p.audit_history as Record<string, unknown>[]) || [];

              return (
                <>
                  <tr key={id} className="border-b border-neutral-border hover:bg-neutral-bg/50">
                    <td className="px-4 py-3 font-medium text-neutral-text">{p.name as string}</td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-muted">{(p.license as string) || '-'}</td>
                    <td className="px-4 py-3"><ProcessorStatusBadge status={status} /></td>
                    <td className="px-4 py-3 text-neutral-text">{(p.contact as string) || '-'}</td>
                    <td className="px-4 py-3 text-neutral-muted">{formatTime((p.created_at as string) || '')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {actions.map((a) => (
                          <button key={a.label} onClick={() => setAuditModal({ id, newStatus: a.newStatus, actionLabel: a.label })}
                            className={`rounded-lg px-3 py-1 text-xs font-medium ${
                              a.newStatus === 'rejected' ? 'border border-red-300 text-red-600 hover:bg-red-50' : 'bg-forest-700 text-white hover:bg-forest-800'
                            }`}>
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setExpandedId(isExpanded ? null : id)} className="text-neutral-muted hover:text-forest-700">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${id}-detail`}>
                      <td colSpan={7} className="bg-neutral-bg/50 px-8 py-4">
                        <h4 className="mb-3 text-xs font-semibold text-neutral-muted">审核历史</h4>
                        {history.length === 0 ? (
                          <p className="text-xs text-neutral-muted">暂无审核记录</p>
                        ) : (
                          <div className="relative">
                            {history.map((entry, i) => {
                              const entryStatus = (entry.status as string) || '';
                              const dotColor = DOT_COLORS[entryStatus] || 'bg-gray-400';
                              return (
                                <div key={i} className="relative flex gap-4 pb-4">
                                  <div className="flex flex-col items-center">
                                    <div className={`h-3 w-3 rounded-full ${dotColor}`} />
                                    {i < history.length - 1 && <div className="h-full w-0.5 bg-neutral-border" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <ProcessorStatusBadge status={entryStatus} />
                                      <span className="text-xs text-neutral-muted">{(entry.reviewer as string) || ''}</span>
                                    </div>
                                    {(entry.notes as string) && <p className="mt-1 text-xs text-neutral-muted">{entry.notes as string}</p>}
                                    {(entry.created_at as string) && <p className="mt-0.5 text-xs text-neutral-muted">{formatTime(entry.created_at as string)}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {auditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => { setAuditModal(null); setAuditNotes(''); }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-text">{auditModal.actionLabel}</h3>
              <button onClick={() => { setAuditModal(null); setAuditNotes(''); }}><X className="h-5 w-5 text-neutral-muted" /></button>
            </div>
            <div className="mb-4">
              <label className="mb-1 block text-xs text-neutral-muted">审核备注</label>
              <textarea value={auditNotes} onChange={(e) => setAuditNotes(e.target.value)}
                placeholder="请输入审核备注..."
                className="w-full rounded-lg border border-neutral-border p-2 text-sm focus:border-forest-700 focus:outline-none"
                rows={3} />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setAuditModal(null); setAuditNotes(''); }}
                className="rounded-lg border border-neutral-border px-4 py-2 text-sm text-neutral-text hover:bg-neutral-bg">取消</button>
              <button onClick={handleAudit}
                className={`rounded-lg px-4 py-2 text-sm text-white ${
                  auditModal.newStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-forest-700 hover:bg-forest-800'
                }`}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from 'react';
import {
  ScrollText,
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  Clock,
  FileText,
  User,
  Filter,
  Search,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { ReviewStatus, SummaryReview } from '@/../shared/types';

const statusConfig: Record<ReviewStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: '待审核', color: 'text-amber-300', bg: 'bg-amber-500/15 ring-amber-500/30', icon: Clock },
  approved: { label: '已通过', color: 'text-emerald-300', bg: 'bg-emerald-500/15 ring-emerald-500/30', icon: CheckCircle2 },
  revised: { label: '需修正', color: 'text-rose-300', bg: 'bg-rose-500/15 ring-rose-500/30', icon: Edit3 },
};

export default function SummaryReviewPage() {
  const { summaryReviews, updateSummaryReview } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(summaryReviews.find((r) => r.status === 'pending')?.id ?? null);
  const [reviewComment, setReviewComment] = useState('');
  const [editingSummary, setEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState('');

  const filtered = useMemo(() => {
    return summaryReviews.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (search && !r.reportTitle.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [summaryReviews, statusFilter, search]);

  const selected = useMemo(
    () => summaryReviews.find((r) => r.id === selectedId) ?? null,
    [summaryReviews, selectedId]
  );

  const stats = useMemo(() => ({
    total: summaryReviews.length,
    pending: summaryReviews.filter((r) => r.status === 'pending').length,
    approved: summaryReviews.filter((r) => r.status === 'approved').length,
    revised: summaryReviews.filter((r) => r.status === 'revised').length,
  }), [summaryReviews]);

  const handleApprove = () => {
    if (!selected) return;
    updateSummaryReview(selected.id, 'approved', reviewComment || undefined);
    setReviewComment('');
    setEditingSummary(false);
  };

  const handleRevise = () => {
    if (!selected) return;
    updateSummaryReview(selected.id, 'revised', reviewComment || undefined);
    setReviewComment('');
    setEditingSummary(false);
  };

  const startEdit = () => {
    if (!selected) return;
    setEditedSummary(selected.generatedSummary);
    setEditingSummary(true);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-6">
      <div className="mb-6 animate-fade-in-up">
        <h1 className="font-serif text-2xl font-semibold text-gold-200">摘要审核队列</h1>
        <p className="mt-1 text-sm text-slate-500">
          LLM 生成的研报结构化摘要需经人工校验双通道审核，确保信息准确无遗漏
        </p>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '40ms' }}>
        {[
          { label: '全部摘要', value: stats.total, icon: ScrollText, color: 'text-gold-300' },
          { label: '待审核', value: stats.pending, icon: Clock, color: 'text-amber-300' },
          { label: '已通过', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-300' },
          { label: '需修正', value: stats.revised, icon: Edit3, color: 'text-rose-300' },
        ].map((s, i) => (
          <div key={i} className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-500">{s.label}</p>
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
            </div>
            <p className="mt-2 text-2xl font-semibold text-gold-200">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-5 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="glass-panel flex h-full flex-col rounded-xl">
            <div className="border-b border-gold-500/10 p-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索研报标题..."
                    className="w-full rounded-md border border-gold-500/10 bg-finance-900/60 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-gold-500/30 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 rounded-md border border-gold-500/10 bg-finance-800/60 p-0.5 text-[11px]">
                  {(['all', 'pending', 'approved', 'revised'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`rounded px-2.5 py-1 transition ${
                        statusFilter === s
                          ? 'bg-gold-500/15 text-gold-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s === 'all' ? '全部' : statusConfig[s].label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1 max-h-[620px] space-y-2 overflow-y-auto p-3">
              {filtered.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-20 text-center">
                  <Filter className="h-10 w-10 text-slate-700" />
                  <p className="mt-3 text-xs text-slate-500">无匹配的审核记录</p>
                </div>
              ) : (
                filtered.map((r, i) => {
                  const cfg = statusConfig[r.status];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedId(r.id);
                        setEditingSummary(false);
                        setReviewComment('');
                      }}
                      className={`animate-fade-in-up w-full rounded-lg border p-3.5 text-left transition ${
                        selectedId === r.id
                          ? 'border-gold-500/30 bg-gold-500/5'
                          : 'border-gold-500/10 bg-finance-900/30 hover:border-gold-500/20'
                      }`}
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-gold-500/20 to-gold-700/20 text-gold-300 ring-1 ring-gold-500/20">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm font-medium text-slate-200">
                              {r.reportTitle}
                            </p>
                            <span className={`shrink-0 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] ring-1 ${cfg.bg} ${cfg.color}`}>
                              <Icon className="h-2.5 w-2.5" />
                              {cfg.label}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {r.createdAt.slice(0, 10)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Sparkles className="h-2.5 w-2.5" />
                              LLM v3.5
                            </span>
                          </div>
                          {r.reviewerComment && (
                            <div className="mt-2 flex items-start gap-1.5 rounded bg-finance-800/50 px-2 py-1.5">
                              <MessageSquare className="mt-0.5 h-2.5 w-2.5 shrink-0 text-slate-500" />
                              <p className="line-clamp-2 text-[11px] text-slate-400">{r.reviewerComment}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="col-span-7 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          {selected ? (
            <div className="glass-panel flex h-full flex-col rounded-xl">
              <div className="flex items-center justify-between border-b border-gold-500/10 px-5 py-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-slate-200">{selected.reportTitle}</h3>
                    {(() => {
                      const cfg = statusConfig[selected.status];
                      const Icon = cfg.icon;
                      return (
                        <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-[10px] ring-1 ${cfg.bg} ${cfg.color}`}>
                          <Icon className="h-2.5 w-2.5" />
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    提交时间 {selected.createdAt.replace('T', ' ').slice(0, 16)} · LLM v3.5 生成
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 rounded-md border border-gold-500/10 bg-finance-800/60 px-3 py-1.5 text-[11px] text-slate-300 hover:border-gold-500/30 hover:text-gold-300">
                    <Eye className="h-3 w-3" />
                    查看原文
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs text-slate-400">原文片段</span>
                  </div>
                  <div className="rounded-lg border border-gold-500/10 bg-finance-900/40 p-4">
                    <p className="text-xs leading-relaxed text-slate-300">
                      {selected.originalText || '（完整原文请点击"查看原文"按钮）'}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-gold-400" />
                      <span className="text-xs text-slate-400">LLM 生成摘要</span>
                    </div>
                    {!editingSummary && selected.status !== 'approved' && (
                      <button
                        onClick={startEdit}
                        className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-slate-400 hover:bg-finance-700/50 hover:text-gold-300"
                      >
                        <Edit3 className="h-2.5 w-2.5" />
                        编辑修正
                      </button>
                    )}
                  </div>
                  <div className={`rounded-lg border p-4 gold-border-gradient ${editingSummary ? 'bg-finance-900/60' : 'bg-finance-900/40'}`}>
                    {editingSummary ? (
                      <textarea
                        value={editedSummary}
                        onChange={(e) => setEditedSummary(e.target.value)}
                        rows={6}
                        className="w-full resize-none bg-transparent text-sm leading-relaxed text-slate-200 outline-none"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed text-slate-200">{selected.generatedSummary}</p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                    <span className="text-xs text-slate-400">审核要点清单</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '核心数据准确无误', ok: true },
                      { label: '关键观点无遗漏', ok: true },
                      { label: '无幻觉或杜撰内容', ok: true },
                      { label: '逻辑连贯符合原文', ok: selected.status !== 'revised' },
                    ].map((c, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                          c.ok
                            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
                            : 'border-rose-500/20 bg-rose-500/5 text-rose-300'
                        }`}
                      >
                        {c.ok ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {c.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs text-slate-400">审核意见（可选）</span>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={selected.reviewerComment || '如需退回修改，请在此说明修正要求；如通过可填写审核备注...'}
                    rows={3}
                    disabled={selected.status === 'approved'}
                    className="w-full resize-none rounded-md border border-gold-500/10 bg-finance-900/60 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-gold-500/30 focus:outline-none disabled:opacity-60"
                  />
                </div>

                {selected.status !== 'pending' && (
                  <div className="rounded-lg border border-gold-500/10 bg-finance-900/30 p-3">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <User className="h-3 w-3" />
                      <span>上次审核：李明远 · 高级分析师</span>
                    </div>
                    {selected.reviewerComment && (
                      <p className="mt-1.5 text-xs text-slate-400">意见：{selected.reviewerComment}</p>
                    )}
                  </div>
                )}
              </div>

              {selected.status !== 'approved' && (
                <div className="flex items-center justify-end gap-2 border-t border-gold-500/10 px-5 py-3">
                  <button
                    onClick={() => {
                      setEditingSummary(false);
                      setReviewComment('');
                    }}
                    className="flex items-center gap-1.5 rounded-md border border-gold-500/10 px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                  >
                    <RefreshCw className="h-3 w-3" />
                    重置
                  </button>
                  <button
                    onClick={handleRevise}
                    className="flex items-center gap-1.5 rounded-md border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-300 transition hover:bg-rose-500/20"
                  >
                    <ThumbsDown className="h-3 w-3" />
                    退回修正
                  </button>
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2 text-xs font-medium text-finance-900 shadow-gold transition hover:from-gold-400 hover:to-gold-500"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    通过发布
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel flex h-full items-center justify-center rounded-xl">
              <div className="text-center">
                <ScrollText className="mx-auto h-12 w-12 text-slate-700" />
                <p className="mt-4 text-sm text-slate-400">请从左侧选择一份待审核摘要</p>
                <p className="mt-1 text-xs text-slate-600">LLM + 人工校验双通道确保信息准确</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

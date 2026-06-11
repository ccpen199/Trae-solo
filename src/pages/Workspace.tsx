import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Users,
  Calendar,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Sparkles,
  User,
  Highlighter,
  MessageSquare,
  Underline,
  ArrowLeft,
  Send,
  PenLine,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  MapPin,
  AlertTriangle,
  History,
  GitCompare,
  ThumbsUp,
  Edit3,
  Save,
  XCircle,
  ChevronDown,
  ChevronUp,
  BookOpenCheck,
  Target,
  Shield,
  CornerDownRight,
  FileCheck2,
  Hash,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { Report, SummaryStatus } from '@/../shared/types';

const statusColor: Record<SummaryStatus, string> = {
  pending: 'bg-slate-500/15 text-slate-400 ring-slate-500/30',
  generating: 'bg-blue-500/15 text-blue-300 ring-blue-500/30',
  reviewing: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  finalized: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
};

const statusLabel: Record<SummaryStatus, string> = {
  pending: '待生成',
  generating: '生成中',
  reviewing: '审核中',
  finalized: '已定稿',
};

function ReportList() {
  const navigate = useNavigate();
  const { reports } = useAppStore();
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');

  const industries = useMemo(
    () => Array.from(new Set(reports.map((r) => r.industry).filter(Boolean) as string[])),
    [reports]
  );

  const filtered = reports.filter(
    (r) =>
      (!search || r.title.toLowerCase().includes(search.toLowerCase())) &&
      (industryFilter === 'all' || r.industry === industryFilter)
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-6">
      <div className="mb-6 flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gold-200">分析师协作空间</h1>
          <p className="mt-1 text-sm text-slate-500">
            研报库管理、多人在线标注、结构化摘要生成
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2 text-sm font-medium text-finance-900 shadow-gold transition hover:from-gold-400 hover:to-gold-500">
          <Plus className="h-4 w-4" />
          上传研报
        </button>
      </div>

      <div className="mb-5 flex items-center justify-between animate-fade-in-up" style={{ animationDelay: '40ms' }}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索研报标题、作者..."
              className="w-72 rounded-md border border-gold-500/10 bg-finance-800/60 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-gold-500/30 focus:outline-none"
            />
          </div>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="rounded-md border border-gold-500/10 bg-finance-800/60 px-3 py-2 text-sm text-slate-300 focus:border-gold-500/30 focus:outline-none"
          >
            <option value="all">全部行业</option>
            {industries.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <button className="flex items-center gap-1.5 rounded-md border border-gold-500/10 bg-finance-800/60 px-3 py-2 text-sm text-slate-300 hover:border-gold-500/30 hover:text-gold-300">
            <Filter className="h-4 w-4" />
            更多筛选
          </button>
        </div>
        <p className="text-xs text-slate-500">共 {filtered.length} 份研报</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((r, i) => (
          <button
            key={r.id}
            onClick={() => navigate(`/workspace/${r.id}`)}
            className="group glass-panel rounded-xl p-5 text-left transition hover:border-gold-500/30 hover:shadow-gold animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500/20 to-gold-700/20 text-gold-300 ring-1 ring-gold-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-sm font-medium leading-snug text-slate-200 group-hover:text-gold-200">
                    {r.title}
                  </h3>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 group-hover:text-gold-400" />
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">{r.author}</span>
                  {r.industry && (
                    <span className="rounded bg-finance-700/50 px-1.5 py-0.5 text-[10px] text-slate-400">
                      {r.industry}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-finance-900/40 py-2">
                <p className="text-sm font-semibold text-gold-300">{r.pageCount}</p>
                <p className="text-[10px] text-slate-500">页数</p>
              </div>
              <div className="rounded-md bg-finance-900/40 py-2">
                <p className="text-sm font-semibold text-gold-300">{r.collaborators.length}</p>
                <p className="text-[10px] text-slate-500">协作者</p>
              </div>
              <div className="rounded-md bg-finance-900/40 py-2">
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] ring-1 ${statusColor[r.summaryStatus]}`}
                >
                  {statusLabel[r.summaryStatus]}
                </span>
                <p className="mt-0.5 text-[10px] text-slate-500">摘要状态</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gold-500/5 pt-3">
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Calendar className="h-3 w-3" />
                {r.publishDate}
              </div>
              <div className="flex -space-x-1.5">
                {r.collaborators.slice(0, 3).map((c, idx) => (
                  <div
                    key={idx}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-finance-500 to-finance-700 text-[10px] text-gold-300 ring-2 ring-finance-800"
                  >
                    {c[0]}
                  </div>
                ))}
                {r.collaborators.length > 3 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-finance-700 text-[10px] text-slate-400 ring-2 ring-finance-800">
                    +{r.collaborators.length - 3}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReportDetail() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { reports, getReportAnnotations, summaryReviews } = useAppStore();
  const report = reports.find((r) => r.id === reportId);
  const [activeTool, setActiveTool] = useState<'highlight' | 'underline' | 'comment' | null>(null);
  const urlPage = parseInt(searchParams.get('page') || '0', 10);
  const [currentPage, setCurrentPage] = useState(urlPage > 0 ? urlPage : 12);
  const [commentText, setCommentText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeAnnoId, setActiveAnnoId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<'comments' | 'anchors' | 'conflicts' | 'summary'>('comments');
  const [showSummaryCompare, setShowSummaryCompare] = useState(false);
  const [summaryOpinion, setSummaryOpinion] = useState('');
  const [savedSummary, setSavedSummary] = useState(false);

  if (!report) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-slate-400">研报不存在</p>
      </div>
    );
  }

  const annotations = getReportAnnotations(report.id);
  const reportSummaryReviews = summaryReviews.filter((sr) => sr.reportId === report.id);

  const conflictingAnnotationPairs = useMemo(() => {
    const pairs: Array<{ ann1: any; ann2: any; overlap: number }> = [];
    const sorted = [...annotations].sort((a, b) => a.pageNumber - b.pageNumber || a.position.x - b.position.x);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i], b = sorted[j];
        if (a.pageNumber !== b.pageNumber) continue;
        if (a.annotatorId === b.annotatorId) continue;
        const xOverlap = Math.max(0, Math.min(a.position.x + a.position.width, b.position.x + b.position.width) - Math.max(a.position.x, b.position.x));
        const yOverlap = Math.max(0, Math.min(a.position.y + a.position.height, b.position.y + b.position.height) - Math.max(a.position.y, b.position.y));
        const overlapPct = (xOverlap * yOverlap) / (a.position.width * a.position.height + 0.001);
        if (overlapPct > 0.3) {
          pairs.push({ ann1: a, ann2: b, overlap: Math.round(overlapPct * 100) });
        }
      }
    }
    return pairs.slice(0, 3);
  }, [annotations]);

  const simulateSummary = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2500);
  };

  const jumpToAnnotation = (a: any) => {
    setCurrentPage(a.pageNumber);
    setActiveAnnoId(a.id);
  };

  const handleSaveSummaryOpinion = () => {
    setSavedSummary(true);
    setTimeout(() => setSavedSummary(false), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b border-gold-500/10 px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workspace')}
            className="flex items-center gap-1 rounded p-1.5 text-slate-400 hover:bg-finance-700/50 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="font-serif text-base font-semibold text-gold-200">{report.title}</h2>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
              <span>{report.author}</span>
              <span>·</span>
              <span>{report.publishDate}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {report.collaborators.join('、')}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-[11px] ring-1 ${statusColor[report.summaryStatus]}`}
          >
            {statusLabel[report.summaryStatus]}
          </span>
          {conflictingAnnotationPairs.length > 0 && (
            <span className="flex items-center gap-1 rounded bg-rose-500/15 px-2 py-0.5 text-[11px] text-rose-300 ring-1 ring-rose-500/30">
              <AlertTriangle className="h-3 w-3" />
              {conflictingAnnotationPairs.length} 处批注冲突
            </span>
          )}
          <button
            onClick={simulateSummary}
            disabled={generating}
            className="flex items-center gap-1.5 rounded-md bg-gold-500/15 px-3 py-1.5 text-xs font-medium text-gold-300 ring-1 ring-gold-500/30 transition hover:bg-gold-500/25 disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {generating ? '生成中...' : '生成结构化摘要'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-52 shrink-0 border-r border-gold-500/10 bg-finance-800/30 p-3 overflow-y-auto">
          <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">标注工具</p>
          <div className="space-y-1">
            {([
              { key: 'highlight', icon: Highlighter, label: '高亮' },
              { key: 'underline', icon: Underline, label: '下划线' },
              { key: 'comment', icon: MessageSquare, label: '批注' },
            ] as const).map((tool) => (
              <button
                key={tool.key}
                onClick={() => setActiveTool(activeTool === tool.key ? null : tool.key)}
                className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs transition ${
                  activeTool === tool.key
                    ? 'bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/25'
                    : 'text-slate-400 hover:bg-finance-700/40 hover:text-slate-200'
                }`}
              >
                <tool.icon className="h-3.5 w-3.5" />
                {tool.label}
              </button>
            ))}
          </div>

          <p className="mt-5 mb-2 text-[11px] uppercase tracking-wider text-slate-500">
            协作者
          </p>
          <div className="space-y-1.5">
            {report.collaborators.map((c, i) => (
              <div key={i} className="flex items-center gap-2 px-1 py-1">
                <div className="relative">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-finance-500 to-finance-700 text-[10px] text-gold-300">
                    {c[0]}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-finance-800 bg-signal-positive" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-300">{c}</p>
                  <p className="text-[10px] text-emerald-400">在线</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 mb-2 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-slate-500">
              PDF锚点索引
            </p>
            <span className="text-[10px] text-slate-600">{annotations.length}个</span>
          </div>
          <div className="space-y-1">
            {annotations.slice(0, 12).map((a) => {
              const excerpt = (a.text || a.comment || '批注').slice(0, 14);
              const isCurrent = a.pageNumber === currentPage && activeAnnoId === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => jumpToAnnotation(a)}
                  className={`flex w-full items-start gap-1.5 rounded-md px-2 py-1.5 text-left transition ${
                    isCurrent
                      ? 'bg-gold-500/10 text-gold-300 ring-1 ring-gold-500/25'
                      : a.pageNumber === currentPage
                        ? 'bg-finance-700/40 text-slate-300'
                        : 'text-slate-400 hover:bg-finance-700/30'
                  }`}
                >
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-finance-700 text-[9px] font-bold text-slate-500">
                    {a.pageNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5 shrink-0 text-slate-600" />
                      <span className="truncate text-[10px]">{excerpt}...</span>
                    </div>
                    <p className="text-[9px] text-slate-600">
                      ({a.position.x},{a.position.y}) · {a.annotatorName.slice(0, 2)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center overflow-y-auto bg-finance-900/50 p-8">
          <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className="rounded border border-gold-500/10 px-2 py-0.5 hover:border-gold-500/30 hover:text-slate-300"
            >
              上一页
            </button>
            <span>
              第 <span className="text-gold-300">{currentPage}</span> / {report.pageCount} 页
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(report.pageCount, currentPage + 1))}
              className="rounded border border-gold-500/10 px-2 py-0.5 hover:border-gold-500/30 hover:text-slate-300"
            >
              下一页
            </button>
            <div className="mx-3 h-3 w-px bg-slate-700" />
            <Hash className="h-3 w-3 text-slate-600" />
            <input
              type="number"
              min={1}
              max={report.pageCount}
              value={currentPage}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1 && v <= report.pageCount) setCurrentPage(v);
              }}
              className="w-14 rounded border border-gold-500/10 bg-finance-800/50 px-2 py-0.5 text-xs text-gold-300 focus:border-gold-500/30 focus:outline-none"
            />
            {activeAnnoId && (
              <>
                <div className="mx-3 h-3 w-px bg-slate-700" />
                <Target className="h-3 w-3 text-gold-400" />
                <span className="text-[11px] text-gold-300">已定位锚点</span>
                <button
                  onClick={() => setActiveAnnoId(null)}
                  className="text-[10px] text-slate-500 hover:text-slate-300"
                >
                  取消定位
                </button>
              </>
            )}
          </div>
          <div className="relative w-full max-w-3xl rounded-md bg-white p-16 shadow-2xl">
            <div className="absolute left-0 top-0 h-full w-full select-none text-slate-800">
              <h3 className="mb-4 font-serif text-xl font-bold text-slate-900">
                3.2 行业供需格局分析
              </h3>
              <p className="mb-3 text-sm leading-7 text-slate-700">
                从供给端来看，经过 2024
                年的深度行业洗牌，落后产能已基本出清。主要厂商的资本开支显著收缩，行业新增产能同比下降约 40%。
                <span className="highlight-yellow px-0.5">
                  预计 2025 年全球光伏新增装机量将达 630-680GW，同比增长 28%-38%。
                </span>
                需求端的复苏将快于供给端的恢复，行业有望在二季度迎来实质性的供需反转。
              </p>
              <p className="mb-3 text-sm leading-7 text-slate-700">
                技术路线方面，
                <span className="highlight-green px-0.5">
                  TOPCon 电池效率已突破 27%，经济性显著优于 PERC，成为当前扩产主流技术路线。
                </span>
                HJT 电池在降本方面也取得积极进展，预计 2025 年下半年将逐步具备大规模量产条件。BC 技术路线则受到头部厂商的重点关注。
              </p>
              <p className="mb-3 text-sm leading-7 text-slate-700">
                分区域来看，国内市场受益于大基地建设和分布式光伏的持续推进，全年装机有望达到 250GW。海外市场方面，美国 IRA
                政策的拉动效应持续显现，欧洲能源转型需求稳健，新兴市场如中东、拉美、东南亚的需求增速显著高于全球平均水平。
              </p>
              <p className="text-sm leading-7 text-slate-700">
                <span className="highlight-red px-0.5">
                  注意：产业链价格博弈仍存不确定性，需警惕二季度末价格再次下行风险。
                </span>
                此外，海外贸易壁垒的变化、关键原辅材料的供应波动等因素也可能对行业盈利水平产生影响。
              </p>
            </div>

            {annotations
              .filter((a) => a.pageNumber === currentPage)
              .map((a) => (
                <div
                  key={a.id}
                  className={`absolute cursor-pointer transition ${
                    a.type === 'comment'
                      ? 'rounded bg-amber-400/20 ring-1 ring-amber-400/50'
                      : ''
                  } ${activeAnnoId === a.id ? 'ring-2 ring-gold-400 shadow-lg shadow-gold-500/20 z-10' : 'hover:ring-2 hover:ring-gold-400'}`}
                  style={{
                    left: `${(a.position.x / 800) * 100}%`,
                    top: `${(a.position.y / 1000) * 100}%`,
                    width: `${(a.position.width / 800) * 100}%`,
                    height: `${(a.position.height / 1000) * 100}%`,
                    animation: activeAnnoId === a.id ? 'pulse-gold 2s infinite' : undefined,
                  }}
                  onClick={() => setActiveAnnoId(a.id)}
                >
                  {a.type === 'comment' && (
                    <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white shadow">
                      <MessageSquare className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div className="flex w-96 shrink-0 flex-col border-l border-gold-500/10 bg-finance-800/40">
          <div className="border-b border-gold-500/10 px-4 py-2">
            <div className="flex items-center gap-0.5 rounded-md bg-finance-900/50 p-0.5">
              {([
                { key: 'comments', icon: MessageSquare, label: '批注', badge: annotations.filter(a => a.pageNumber === currentPage).length },
                { key: 'anchors', icon: MapPin, label: '锚点', badge: annotations.length },
                { key: 'conflicts', icon: AlertTriangle, label: '冲突', badge: conflictingAnnotationPairs.length },
                { key: 'summary', icon: BookOpenCheck, label: '摘要', badge: reportSummaryReviews.length },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setRightTab(t.key)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-[11px] transition ${
                    rightTab === t.key
                      ? 'bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/25'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <t.icon className="h-3 w-3" />
                  {t.label}
                  {t.badge > 0 && (
                    <span className={`rounded-full px-1 text-[9px] ${
                      rightTab === t.key ? 'bg-gold-500/30' : t.key === 'conflicts' && t.badge > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-finance-700/50 text-slate-500'
                    }`}>
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {rightTab === 'comments' && (
              <div className="space-y-4">
                {annotations
                  .filter((a) => a.pageNumber === currentPage)
                  .map((a, i) => (
                    <div
                      key={a.id}
                      className={`animate-fade-in-up rounded-lg p-2 transition ${activeAnnoId === a.id ? 'bg-gold-500/5 ring-1 ring-gold-500/25' : ''}`}
                      style={{ animationDelay: `${i * 50}ms` }}
                      onClick={() => setActiveAnnoId(a.id)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-finance-500 to-finance-700 text-xs text-gold-300">
                          {a.annotatorName[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-slate-200">
                              {a.annotatorName}
                            </span>
                            <span
                              className={`rounded px-1 py-px text-[9px] ${
                                a.type === 'highlight'
                                  ? 'bg-amber-500/15 text-amber-300'
                                  : a.type === 'underline'
                                    ? 'bg-emerald-500/15 text-emerald-300'
                                    : 'bg-blue-500/15 text-blue-300'
                              }`}
                            >
                              {a.type === 'highlight'
                                ? '高亮'
                                : a.type === 'underline'
                                  ? '下划线'
                                  : '批注'}
                            </span>
                          </div>
                          {a.text && (
                            <p className="mt-1 rounded bg-finance-900/60 px-2 py-1.5 text-[11px] leading-relaxed text-slate-400">
                              {a.text}
                            </p>
                          )}
                          {a.comment && (
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                              {a.comment}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-600">
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              P{a.pageNumber} · ({a.position.x},{a.position.y})
                            </span>
                            <span>·</span>
                            <Clock className="h-2.5 w-2.5" />
                            {a.createdAt.slice(11, 16)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                {annotations.filter(a => a.pageNumber === currentPage).length === 0 && (
                  <div className="py-10 text-center text-xs text-slate-500">
                    当前页暂无批注
                  </div>
                )}
              </div>
            )}

            {rightTab === 'anchors' && (
              <div className="space-y-2">
                <p className="mb-1 text-[10px] text-slate-500">共 {annotations.length} 个锚点，点击快速定位</p>
                {annotations.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => jumpToAnnotation(a)}
                    className={`flex w-full items-start gap-2 rounded-md border p-2.5 text-left transition ${
                      activeAnnoId === a.id
                        ? 'border-gold-500/30 bg-gold-500/5'
                        : a.pageNumber === currentPage
                          ? 'border-slate-600/50 bg-finance-900/30'
                          : 'border-transparent bg-finance-900/20 hover:border-gold-500/20'
                    }`}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-gradient-to-br from-gold-500/20 to-gold-700/20 text-[10px] font-bold text-gold-300 ring-1 ring-gold-500/30">
                      {a.pageNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-slate-200">
                        {a.text || a.comment || '无文字内容'}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{a.annotatorName}</span>
                        <span>·</span>
                        <span>位置 ({a.position.x}, {a.position.y})</span>
                      </div>
                      <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-finance-700">
                        <div
                          className="h-full rounded bg-gradient-to-r from-gold-600/60 to-gold-400/60"
                          style={{ width: `${Math.min(100, (a.position.y / 1000) * 100 + (a.position.height / 1000) * 50)}%` }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {rightTab === 'conflicts' && (
              <div className="space-y-3">
                {conflictingAnnotationPairs.length > 0 ? (
                  <>
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5">
                      <p className="flex items-center gap-1.5 text-[11px] font-medium text-rose-300">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        检测到 {conflictingAnnotationPairs.length} 处重叠批注冲突
                      </p>
                      <p className="mt-1 text-[10px] leading-relaxed text-rose-400/80">
                        多位分析师对同一文本位置标注了不同批注/高亮，建议人工确认统一意见。
                      </p>
                    </div>
                    {conflictingAnnotationPairs.map((pair, idx) => (
                      <div
                        key={idx}
                        className="animate-fade-in-up rounded-lg border border-gold-500/10 bg-finance-900/30 p-3"
                        style={{ animationDelay: `${idx * 80}ms` }}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <GitCompare className="h-3 w-3 text-rose-400" />
                            <span className="text-[11px] font-medium text-slate-200">冲突 #{idx + 1}</span>
                            <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] text-rose-300 ring-1 ring-rose-500/25">
                              重叠 {pair.overlap}%
                            </span>
                          </div>
                          <button
                            onClick={() => setCurrentPage(pair.ann1.pageNumber)}
                            className="flex items-center gap-0.5 rounded bg-finance-700/50 px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-gold-300"
                          >
                            <MapPin className="h-2.5 w-2.5" />
                            定位P{pair.ann1.pageNumber}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[pair.ann1, pair.ann2].map((a, aidx) => (
                            <div
                              key={a.id}
                              className={`rounded-md p-2 ${aidx === 0 ? 'bg-blue-500/5 ring-1 ring-blue-500/20' : 'bg-amber-500/5 ring-1 ring-amber-500/20'}`}
                            >
                              <div className="mb-1.5 flex items-center gap-1.5">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-finance-500 to-finance-700 text-[10px] text-gold-300">
                                  {a.annotatorName[0]}
                                </div>
                                <span className="text-[10px] font-medium text-slate-200">{a.annotatorName}</span>
                              </div>
                              <p className="line-clamp-2 text-[10px] leading-relaxed text-slate-400">
                                {a.comment || a.text || '无文字批注'}
                              </p>
                              <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-600">
                                <span>
                                  {a.type === 'highlight' ? '高亮' : a.type === 'underline' ? '下划线' : '批注'}
                                </span>
                                <History className="h-2 w-2" />
                                <span>{a.createdAt.slice(5, 16)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 flex gap-1">
                          <button className="flex-1 flex items-center justify-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-[10px] text-blue-300 ring-1 ring-blue-500/25 hover:bg-blue-500/20">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            采用A方案
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300 ring-1 ring-amber-500/25 hover:bg-amber-500/20">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            采用B方案
                          </button>
                          <button className="flex items-center justify-center gap-1 rounded-md bg-finance-700/50 px-2 py-1 text-[10px] text-slate-400 hover:text-slate-200">
                            <Users className="h-2.5 w-2.5" />
                            协审
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="py-10 text-center">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400/40" />
                    <p className="mt-3 text-xs font-medium text-slate-300">暂无批注冲突</p>
                    <p className="mt-1 text-[10px] text-slate-500">当前研报所有批注位置独立，无重叠争议</p>
                  </div>
                )}
              </div>
            )}

            {rightTab === 'summary' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-slate-300">结构化摘要人工校验</p>
                  <button
                    onClick={() => setShowSummaryCompare(!showSummaryCompare)}
                    className="flex items-center gap-0.5 rounded bg-finance-700/50 px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-gold-300"
                  >
                    <GitCompare className="h-2.5 w-2.5" />
                    {showSummaryCompare ? '关闭对比' : '版本对比'}
                  </button>
                </div>

                {reportSummaryReviews.length > 0 ? (
                  reportSummaryReviews.map((sr, idx) => (
                    <div
                      key={sr.id}
                      className="animate-fade-in-up rounded-lg border border-gold-500/10 bg-finance-900/30 p-3"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] ring-1 ${
                            sr.status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30'
                              : sr.status === 'revised'
                                ? 'bg-blue-500/15 text-blue-300 ring-blue-500/30'
                                : 'bg-amber-500/15 text-amber-300 ring-amber-500/30'
                          }`}
                        >
                          {sr.status === 'approved'
                            ? '审核通过'
                            : sr.status === 'revised'
                              ? '待修改'
                              : '待审核'}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <FileCheck2 className="h-2.5 w-2.5" />
                          v{sr.version}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-300 line-clamp-4">
                        {sr.generatedSummary}
                      </p>
                      {sr.reviewerComment && (
                        <div className="mt-2.5 rounded-md border border-gold-500/5 bg-finance-800/50 p-2">
                          <p className="flex items-center gap-1 text-[10px] text-slate-500">
                            <CornerDownRight className="h-2.5 w-2.5 text-gold-400" />
                            <span className="font-medium text-gold-300">{sr.reviewerId.slice(0, 2)}</span>
                            审核意见：
                          </p>
                          <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
                            {sr.reviewerComment}
                          </p>
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <Shield className="h-2.5 w-2.5" />
                          审核人：{sr.reviewerId.slice(0, 2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {sr.createdAt.slice(0, 16).replace('T', ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-purple-500/15 bg-purple-500/5 p-3">
                    <p className="flex items-center gap-1.5 text-[11px] text-purple-300">
                      <Sparkles className="h-3 w-3" />
                      暂无校验记录
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      点击右上角"生成结构化摘要"启动流程，生成后可在此进行人工校验
                    </p>
                  </div>
                )}

                <div className="mt-4 rounded-lg border border-gold-500/10 bg-finance-900/40 p-3">
                  <p className="mb-2 text-[11px] font-medium text-slate-300">人工校验输入框</p>
                  <textarea
                    value={summaryOpinion}
                    onChange={(e) => setSummaryOpinion(e.target.value)}
                    placeholder="请输入审核意见：数据准确性、结论合理性、遗漏风险点..."
                    rows={3}
                    className="w-full resize-none rounded-md border border-gold-500/10 bg-finance-800/50 px-2.5 py-2 text-[11px] text-slate-200 placeholder:text-slate-600 focus:border-gold-500/30 focus:outline-none"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex gap-1">
                      <button className="flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-300 ring-1 ring-emerald-500/25 hover:bg-emerald-500/20">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        通过
                      </button>
                      <button className="flex items-center gap-0.5 rounded-md bg-blue-500/10 px-2 py-1 text-[10px] text-blue-300 ring-1 ring-blue-500/25 hover:bg-blue-500/20">
                        <Edit3 className="h-2.5 w-2.5" />
                        退回修改
                      </button>
                    </div>
                    <button
                      onClick={handleSaveSummaryOpinion}
                      disabled={!summaryOpinion.trim()}
                      className="flex items-center gap-0.5 rounded-md bg-gold-500/15 px-2.5 py-1 text-[10px] text-gold-300 ring-1 ring-gold-500/30 hover:bg-gold-500/25 disabled:opacity-40"
                    >
                      {savedSummary ? (
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-300" />
                      ) : (
                        <Save className="h-2.5 w-2.5" />
                      )}
                      {savedSummary ? '已保存' : '保存意见'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-gold-500/10 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="添加批注、回复讨论、校验意见..."
                rows={2}
                className="flex-1 resize-none rounded-md border border-gold-500/10 bg-finance-900/60 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:border-gold-500/30 focus:outline-none"
              />
              <button
                disabled={!commentText.trim()}
                className="flex h-[58px] w-10 items-center justify-center rounded-md bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30 transition hover:bg-gold-500/25 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {report.summary && (
        <div className="border-t border-gold-500/10 bg-finance-800/70 p-5">
          <div className="mx-auto max-w-5xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <Sparkles className="h-4 w-4 text-gold-400" />
                结构化摘要（LLM 生成 + 人工校验）
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">双通道审核机制</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-[11px] text-emerald-300">已人工校验</span>
                {reportSummaryReviews.length > 0 && (
                  <>
                    <span className="mx-2 h-3 w-px bg-slate-600" />
                    <span className="text-[11px] text-slate-500">
                      {reportSummaryReviews.length} 条校验记录 · 最新 v{reportSummaryReviews[0].version}
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{report.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Workspace() {
  const { reportId } = useParams();
  return reportId ? <ReportDetail /> : <ReportList />;
}

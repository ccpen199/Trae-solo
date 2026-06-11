import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Zap,
  Filter,
  Layers,
  ArrowUpRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Database,
  User,
  Building2,
  Landmark,
  Lightbulb,
  Factory,
  AlertTriangle,
  Calendar,
  Newspaper,
  X,
  RefreshCw,
  CheckCircle2,
  Shield,
  FileText,
  MessageSquare,
  BarChart3,
  Clock,
  ExternalLink,
  Eye,
  GitBranch,
  BookmarkCheck,
  ClipboardCheck,
  PenLine,
  TrendingUp,
} from 'lucide-react';
import KnowledgeGraph from '@/components/graph/KnowledgeGraph';
import { useAppStore } from '@/store/appStore';
import type { Entity, EntityType, RiskLevel, Triple } from '@/../shared/types';

const predicateList = [
  '担任董事长',
  '担任总裁',
  '持股',
  '控股',
  '参股',
  '上游供应商',
  '下游客户',
  '战略合作',
  '同业竞争',
  '签订供货协议',
  '主营相关',
  '所属行业',
  '涉及概念',
  '布局',
  '参与定增',
];

const sourceList = [
  { id: 'src-001', name: '巨潮资讯网（官方公告）' },
  { id: 'src-002', name: '上交所/深交所' },
  { id: 'src-003', name: '财新网' },
  { id: 'src-004', name: '财联社' },
  { id: 'src-005', name: '路透社' },
  { id: 'src-006', name: '券商研报' },
  { id: 'src-007', name: '自媒体/财经博客' },
];

const userRole = {
  name: '高级分析师',
  avatar: '陈',
  permissions: [
    { label: '三元组审核', key: 'review', desc: '可审批/驳回待审核三元组' },
    { label: '摘要校验', key: 'summary', desc: '可审核LLM生成的结构化摘要' },
    { label: '研报标注', key: 'annotate', desc: '可对协作研报添加批注锚点' },
    { label: '订阅管理', key: 'subscribe', desc: '可创建/管理实体与概念订阅' },
    { label: '血缘追溯', key: 'lineage', desc: '可查看数据血缘与信源评分' },
  ],
};

const riskColor: Record<RiskLevel, string> = {
  low: 'bg-signal-positive/15 text-signal-positive ring-signal-positive/30',
  medium: 'bg-signal-warning/15 text-signal-warning ring-signal-warning/30',
  high: 'bg-signal-danger/15 text-signal-danger ring-signal-danger/30',
};

const riskLabel: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中等风险',
  high: '高风险',
};

const reviewStatusColor: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  rejected: 'bg-red-500/15 text-red-300 ring-red-500/30',
};

const reviewStatusLabel: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

export default function GraphHome() {
  const navigate = useNavigate();
  const {
    entities,
    relations,
    concepts,
    triples,
    annotations,
    reports,
    sourceScores,
    summaryReviews,
    pushes,
    setSelectedEntity,
    getEntityTriples,
  } = useAppStore();
  const [typeFilter, setTypeFilter] = useState<EntityType | 'all'>('all');
  const [selectedForDetail, setSelectedForDetail] = useState<Entity | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showRolePanel, setShowRolePanel] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    entityDetail: true,
    businessStatus: true,
    riskDynamics: true,
  });
  const [advancedFilters, setAdvancedFilters] = useState({
    predicate: [] as string[],
    subjectTypes: [] as EntityType[],
    riskLevel: 'all' as RiskLevel | 'all',
    dateRange: { start: '', end: '' },
    sources: [] as string[],
  });

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePredicate = (p: string) => {
    setAdvancedFilters((f) => ({
      ...f,
      predicate: f.predicate.includes(p) ? f.predicate.filter((x) => x !== p) : [...f.predicate, p],
    }));
  };

  const toggleSubjectType = (t: EntityType) => {
    setAdvancedFilters((f) => ({
      ...f,
      subjectTypes: f.subjectTypes.includes(t) ? f.subjectTypes.filter((x) => x !== t) : [...f.subjectTypes, t],
    }));
  };

  const toggleSource = (s: string) => {
    setAdvancedFilters((f) => ({
      ...f,
      sources: f.sources.includes(s) ? f.sources.filter((x) => x !== s) : [...f.sources, s],
    }));
  };

  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      predicate: [],
      subjectTypes: [],
      riskLevel: 'all',
      dateRange: { start: '', end: '' },
      sources: [],
    });
  };

  const hasActiveAdvancedFilters =
    advancedFilters.predicate.length > 0 ||
    advancedFilters.subjectTypes.length > 0 ||
    advancedFilters.riskLevel !== 'all' ||
    advancedFilters.dateRange.start ||
    advancedFilters.dateRange.end ||
    advancedFilters.sources.length > 0;

  const filteredNodes = useMemo(() => {
    let result = typeFilter === 'all' ? entities : entities.filter((e) => e.type === typeFilter);

    if (advancedFilters.subjectTypes.length > 0) {
      result = result.filter((e) => advancedFilters.subjectTypes.includes(e.type));
    }

    if (advancedFilters.riskLevel !== 'all') {
      if (advancedFilters.riskLevel === 'high') {
        result = result.filter((e) => e.riskTags && e.riskTags.length > 0);
      }
    }

    if (advancedFilters.sources.length > 0) {
      const ids = new Set(
        entities
          .filter((e) => e.description?.includes('公告') || e.description?.includes('研报'))
          .map((e) => e.id)
      );
      result = result.filter((e) => ids.has(e.id));
    }

    return result;
  }, [entities, typeFilter, advancedFilters]);

  const filteredLinks = useMemo(() => {
    const ids = new Set(filteredNodes.map((n) => n.id));
    let result = relations.filter((r) => ids.has(r.sourceId) && ids.has(r.targetId));

    if (advancedFilters.predicate.length > 0) {
      result = result.filter((r) => advancedFilters.predicate.includes(r.predicate));
    }

    if (advancedFilters.dateRange.start) {
      result = result.filter((r) => r.createdAt >= advancedFilters.dateRange.start);
    }
    if (advancedFilters.dateRange.end) {
      result = result.filter((r) => r.createdAt <= advancedFilters.dateRange.end);
    }

    return result;
  }, [filteredNodes, relations, advancedFilters]);

  const hotCompanies = useMemo(
    () =>
      entities
        .filter((e) => e.type === 'company')
        .sort((a, b) => (b.hotScore ?? 0) - (a.hotScore ?? 0))
        .slice(0, 5),
    [entities]
  );

  const hotConcepts = useMemo(
    () => [...concepts].sort((a, b) => b.hotScore - a.hotScore).slice(0, 6),
    [concepts]
  );

  const entityTriples = useMemo(() => {
    if (!selectedForDetail) return [];
    return getEntityTriples(selectedForDetail.id);
  }, [selectedForDetail, getEntityTriples, triples]);

  const pendingTriples = useMemo(() => triples.filter((t) => t.reviewStatus === 'pending'), [triples]);
  const pendingSummaries = useMemo(() => summaryReviews.filter((s) => s.status === 'pending'), [summaryReviews]);
  const recentAnnotations = useMemo(
    () => [...annotations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4),
    [annotations]
  );
  const avgSourceScore = useMemo(() => {
    if (sourceScores.length === 0) return 0;
    return Math.round(sourceScores.reduce((sum, s) => sum + s.overall, 0) / sourceScores.length);
  }, [sourceScores]);

  const enrichedRiskDynamics = useMemo(() => {
    const highRiskPushes = pushes
      .filter((p) => p.riskLevel === 'high' || p.riskLevel === 'medium')
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 3);

    return [
      ...highRiskPushes.map((p) => ({
        time: formatTime(p.publishedAt),
        text: p.title,
        tag: p.riskLevel === 'high' ? '高风险' : '中风险',
        riskLevel: p.riskLevel,
        sourceUrl: p.sourceUrl,
        sourceName: p.sourceName,
        relatedEntities: p.relatedEntities,
        read: p.read,
      })),
      {
        time: '15 分钟前',
        text: '隆基绿能热度上升 8 位，当前排名第 1',
        tag: '热度',
        riskLevel: 'low' as RiskLevel,
        sourceUrl: '',
        sourceName: '',
        relatedEntities: ['c-001'],
        read: true,
      },
      {
        time: '3 小时前',
        text: '新增实体「通威股份」关联关系 5 条',
        tag: '新增',
        riskLevel: 'low' as RiskLevel,
        sourceUrl: '',
        sourceName: '',
        relatedEntities: ['c-002'],
        read: true,
      },
    ];
  }, [pushes]);

  const handleNodeClick = (entity: Entity) => {
    setSelectedEntity(entity);
    setSelectedForDetail(entity);
    setExpandedSections((prev) => ({ ...prev, entityDetail: true }));
  };

  const typeIcon: Record<EntityType, any> = {
    company: Building2,
    person: User,
    institution: Landmark,
    concept: Lightbulb,
    industry: Factory,
  };

  const typeLabel: Record<EntityType, string> = {
    company: '公司',
    person: '人物',
    institution: '机构',
    concept: '概念',
    industry: '行业',
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="flex flex-1 flex-col">
        <div className="border-b border-gold-500/10 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-xl font-semibold text-gold-200">
                资本市场关联知识图谱
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                {filteredNodes.length} 个实体 · {filteredLinks.length} 条关联关系 · 实时动态更新
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowRolePanel(!showRolePanel)}
                  className="flex items-center gap-2 rounded-md border border-gold-500/10 bg-finance-800/60 px-3 py-1.5 text-xs text-slate-300 transition hover:border-gold-500/30 hover:text-gold-300"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-[10px] font-bold text-finance-900">
                    {userRole.avatar}
                  </div>
                  <Shield className="h-3.5 w-3.5 text-gold-400" />
                  {userRole.name}
                  <ChevronDown className={`h-3 w-3 transition ${showRolePanel ? 'rotate-180' : ''}`} />
                </button>
                {showRolePanel && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-72 animate-fade-in-up rounded-xl border border-gold-500/20 bg-finance-900/95 p-4 shadow-xl backdrop-blur-sm">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-sm font-bold text-finance-900">
                        {userRole.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gold-200">{userRole.name}</p>
                        <p className="text-[10px] text-slate-500">用户ID: u-001 · 当前在线</p>
                      </div>
                    </div>
                    <div className="mb-2 text-[11px] font-medium text-slate-400">权限范围</div>
                    <div className="space-y-1.5">
                      {userRole.permissions.map((perm) => (
                        <div
                          key={perm.key}
                          className="flex items-start gap-2 rounded-md bg-finance-800/60 px-2.5 py-1.5"
                        >
                          <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-gold-400" />
                          <div>
                            <p className="text-[11px] font-medium text-slate-200">{perm.label}</p>
                            <p className="text-[10px] text-slate-500">{perm.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 border-t border-gold-500/10 pt-2">
                      <p className="text-[10px] text-slate-600">
                        当前角色可审核 {pendingTriples.length} 条待审核三元组 · {pendingSummaries.length} 条待审核摘要
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 rounded-md border border-gold-500/10 bg-finance-800/60 p-0.5">
                {(['all', 'company', 'person', 'institution', 'concept', 'industry'] as const).map(
                  (t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs transition ${
                        typeFilter === t
                          ? 'bg-gold-500/20 text-gold-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t !== 'all' && (() => {
                        const Icon = typeIcon[t];
                        return <Icon className="h-3 w-3" />;
                      })()}
                      {t === 'all'
                        ? '全部'
                        : t === 'company'
                          ? '公司'
                          : t === 'person'
                            ? '人物'
                            : t === 'institution'
                              ? '机构'
                              : t === 'concept'
                                ? '概念'
                                : '行业'}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                className={`relative flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition ${
                  hasActiveAdvancedFilters || showAdvancedFilter
                    ? 'border-gold-500/30 bg-gold-500/15 text-gold-300'
                    : 'border-gold-500/10 bg-finance-800/60 text-slate-300 hover:border-gold-500/30 hover:text-gold-300'
                }`}
              >
                <Filter className="h-3.5 w-3.5" />
                高级筛选
                {hasActiveAdvancedFilters && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-signal-danger text-[9px] font-bold text-white">
                    {advancedFilters.predicate.length +
                      advancedFilters.subjectTypes.length +
                      advancedFilters.sources.length +
                      (advancedFilters.riskLevel !== 'all' ? 1 : 0) +
                      (advancedFilters.dateRange.start || advancedFilters.dateRange.end ? 1 : 0)}
                  </span>
                )}
                {showAdvancedFilter ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        {showAdvancedFilter && (
          <div className="animate-fade-in-up border-b border-gold-500/10 bg-gradient-to-b from-finance-800/40 to-transparent px-6 py-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-gold-400" />
                    关系类型
                  </p>
                  {advancedFilters.predicate.length > 0 && (
                    <button
                      onClick={() => setAdvancedFilters((f) => ({ ...f, predicate: [] }))}
                      className="text-[10px] text-slate-500 hover:text-gold-400"
                    >
                      清空
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {predicateList.map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePredicate(p)}
                      className={`rounded-full px-2 py-0.5 text-[10px] transition ${
                        advancedFilters.predicate.includes(p)
                          ? 'bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30'
                          : 'bg-finance-700/50 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                    <Database className="h-3 w-3 text-blue-400" />
                    主体类别
                  </p>
                </div>
                <div className="space-y-1">
                  {(['company', 'person', 'institution', 'concept', 'industry'] as const).map((t) => {
                    const Icon = typeIcon[t];
                    return (
                      <button
                        key={t}
                        onClick={() => toggleSubjectType(t)}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] transition ${
                          advancedFilters.subjectTypes.includes(t)
                            ? 'bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/25'
                            : 'text-slate-400 hover:bg-finance-700/30'
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        {typeLabel[t]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3 text-rose-400" />
                    风险等级
                  </p>
                </div>
                <div className="space-y-1">
                  {(['all', 'high', 'medium', 'low'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setAdvancedFilters((f) => ({ ...f, riskLevel: r }))}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] transition ${
                        advancedFilters.riskLevel === r
                          ? r === 'all'
                            ? 'bg-gold-500/10 text-gold-300 ring-1 ring-gold-500/25'
                            : r === 'high'
                              ? 'bg-red-500/10 text-red-300 ring-1 ring-red-500/25'
                              : r === 'medium'
                                ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/25'
                                : 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/25'
                          : 'text-slate-400 hover:bg-finance-700/30'
                      }`}
                    >
                      {r === 'all'
                        ? '全部等级'
                        : r === 'high'
                          ? '高风险'
                          : r === 'medium'
                            ? '中风险'
                            : '低风险'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-purple-400" />
                    时间范围
                  </p>
                </div>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={advancedFilters.dateRange.start}
                    onChange={(e) =>
                      setAdvancedFilters((f) => ({
                        ...f,
                        dateRange: { ...f.dateRange, start: e.target.value },
                      }))
                    }
                    placeholder="起始日期"
                    className="w-full rounded-md border border-gold-500/10 bg-finance-800/60 px-2 py-1.5 text-[11px] text-slate-200 focus:border-gold-500/30 focus:outline-none"
                  />
                  <input
                    type="date"
                    value={advancedFilters.dateRange.end}
                    onChange={(e) =>
                      setAdvancedFilters((f) => ({
                        ...f,
                        dateRange: { ...f.dateRange, end: e.target.value },
                      }))
                    }
                    placeholder="结束日期"
                    className="w-full rounded-md border border-gold-500/10 bg-finance-800/60 px-2 py-1.5 text-[11px] text-slate-200 focus:border-gold-500/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                    <Newspaper className="h-3 w-3 text-emerald-400" />
                    信源筛选
                  </p>
                </div>
                <div className="max-h-28 space-y-0.5 overflow-y-auto">
                  {sourceList.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => toggleSource(s.id)}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1 text-[10px] transition ${
                        advancedFilters.sources.includes(s.id)
                          ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/25'
                          : 'text-slate-400 hover:bg-finance-700/30'
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {hasActiveAdvancedFilters && (
              <div className="mt-4 flex items-center justify-between border-t border-gold-500/5 pt-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">当前筛选：</span>
                  {advancedFilters.predicate.map((p) => (
                    <span
                      key={p}
                      className="flex items-center gap-1 rounded-full bg-gold-500/10 px-2 py-0.5 text-[10px] text-gold-300"
                    >
                      {p}
                      <button
                        onClick={() => togglePredicate(p)}
                        className="hover:text-gold-100"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  {advancedFilters.subjectTypes.map((t) => (
                    <span
                      key={t}
                      className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300"
                    >
                      {typeLabel[t]}
                      <button
                        onClick={() => toggleSubjectType(t)}
                        className="hover:text-blue-100"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                  {advancedFilters.sources.map((s) => {
                    const src = sourceList.find((x) => x.id === s);
                    return (
                      <span
                        key={s}
                        className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300"
                      >
                        {src?.name}
                        <button
                          onClick={() => toggleSource(s)}
                          className="hover:text-emerald-100"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetAdvancedFilters}
                    className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    <RefreshCw className="h-3 w-3" />
                    重置
                  </button>
                  <button
                    onClick={() => setShowAdvancedFilter(false)}
                    className="flex items-center gap-1 rounded-md bg-gold-500/15 px-3 py-1 text-[11px] text-gold-300 ring-1 ring-gold-500/25 hover:bg-gold-500/25"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    应用筛选
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="relative flex-1">
          <KnowledgeGraph
            nodes={filteredNodes}
            links={filteredLinks}
            onNodeClick={handleNodeClick}
            highlightNodeId={selectedForDetail?.id}
          />
        </div>
      </div>

      <aside className="flex w-96 shrink-0 flex-col border-l border-gold-500/10 bg-finance-800/40">
        <div className="flex-1 overflow-y-auto">
          {selectedForDetail && (
            <div className="border-b border-gold-500/10">
              <button
                onClick={() => toggleSection('entityDetail')}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-finance-700/30"
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = typeIcon[selectedForDetail.type] || Building2;
                    return <Icon className="h-4 w-4 text-gold-400" />;
                  })()}
                  <span className="text-sm font-medium text-gold-200">{selectedForDetail.name}</span>
                  <span className="rounded bg-finance-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                    {typeLabel[selectedForDetail.type]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/entity/${selectedForDetail.id}`);
                    }}
                    className="rounded p-1 text-slate-500 transition hover:text-gold-300"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedForDetail(null);
                    }}
                    className="rounded p-1 text-slate-500 transition hover:text-slate-300"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {expandedSections.entityDetail ? (
                    <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                  )}
                </div>
              </button>

              {expandedSections.entityDetail && (
                <div className="animate-fade-in-up px-4 pb-4">
                  {selectedForDetail.riskTags && selectedForDetail.riskTags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {selectedForDetail.riskTags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-300 ring-1 ring-red-500/20"
                        >
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {selectedForDetail.metadata?.stockCode && (
                    <p className="mb-3 text-[11px] text-slate-500">
                      证券代码：{selectedForDetail.metadata.stockCode}
                      {selectedForDetail.metadata.marketCap && ` · 市值 ${selectedForDetail.metadata.marketCap}`}
                    </p>
                  )}

                  <div className="space-y-2.5">
                    {entityTriples.length > 0 ? (
                      entityTriples.map((triple) => (
                        <div
                          key={triple.id}
                          className="rounded-lg border border-gold-500/10 bg-finance-900/40 p-3"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-xs leading-relaxed text-slate-200">
                                <span className="font-medium text-gold-300">{triple.subject.name}</span>
                                <span className="mx-1.5 text-slate-500">→</span>
                                <span className="text-blue-300">{triple.predicate}</span>
                                <span className="mx-1.5 text-slate-500">→</span>
                                <span className="font-medium text-gold-300">{triple.object.name}</span>
                              </p>
                            </div>
                            {triple.reviewStatus && (
                              <span
                                className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] ring-1 ${reviewStatusColor[triple.reviewStatus]}`}
                              >
                                {reviewStatusLabel[triple.reviewStatus]}
                              </span>
                            )}
                          </div>

                          <div className="mb-2 flex items-center gap-3 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-2.5 w-2.5" />
                              置信度 {(triple.confidence * 100).toFixed(0)}%
                            </span>
                            {triple.sourceName && (
                              <span className="flex items-center gap-1">
                                <Newspaper className="h-2.5 w-2.5" />
                                {triple.sourceName}
                              </span>
                            )}
                            {triple.extractedAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {formatTime(triple.extractedAt)}
                              </span>
                            )}
                          </div>

                          {triple.sourceText && (
                            <div className="mb-2 rounded-md border border-gold-500/5 bg-finance-800/50 px-2.5 py-1.5">
                              <p className="text-[11px] leading-relaxed text-slate-400">
                                ...<span className="bg-yellow-500/20 px-0.5 text-yellow-200">{triple.sourceText}</span>...
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            {triple.sourceUrl && (
                              <a
                                href={triple.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 rounded-md bg-finance-700/50 px-2 py-0.5 text-[10px] text-slate-400 transition hover:text-gold-300"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                原始信源
                              </a>
                            )}
                            <button
                              onClick={() => navigate('/admin/lineage')}
                              className="flex items-center gap-1 rounded-md bg-finance-700/50 px-2 py-0.5 text-[10px] text-slate-400 transition hover:text-gold-300"
                            >
                              <GitBranch className="h-2.5 w-2.5" />
                              血缘追溯
                            </button>
                            <button
                              onClick={() => navigate('/extraction')}
                              className="flex items-center gap-1 rounded-md bg-finance-700/50 px-2 py-0.5 text-[10px] text-slate-400 transition hover:text-gold-300"
                            >
                              <Eye className="h-2.5 w-2.5" />
                              可信度复查
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="py-3 text-center text-xs text-slate-500">暂无关联三元组</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border-b border-gold-500/10">
            <button
              onClick={() => toggleSection('businessStatus')}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-finance-700/30"
            >
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-slate-200">业务状态总览</span>
                {(pendingTriples.length > 0 || pendingSummaries.length > 0) && (
                  <span className="rounded-full bg-signal-danger px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {pendingTriples.length + pendingSummaries.length}
                  </span>
                )}
              </div>
              {expandedSections.businessStatus ? (
                <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              )}
            </button>

            {expandedSections.businessStatus && (
              <div className="animate-fade-in-up px-4 pb-4">
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate('/extraction')}
                    className="group rounded-lg border border-amber-500/15 bg-amber-500/5 p-3 text-left transition hover:border-amber-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <FileText className="h-4 w-4 text-amber-400" />
                      <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                        {pendingTriples.length}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-200 group-hover:text-amber-300">待审核三元组</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">需人工校验确认</p>
                  </button>

                  <button
                    onClick={() => navigate('/admin/summary-review')}
                    className="group rounded-lg border border-purple-500/15 bg-purple-500/5 p-3 text-left transition hover:border-purple-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <span className="rounded-full bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold text-purple-300">
                        {pendingSummaries.length}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-200 group-hover:text-purple-300">待审核摘要</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">LLM生成摘要待校验</p>
                  </button>

                  <button
                    onClick={() => navigate('/workspace')}
                    className="group rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-3 text-left transition hover:border-emerald-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <PenLine className="h-4 w-4 text-emerald-400" />
                      <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                        {annotations.length}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-200 group-hover:text-emerald-300">PDF批注锚点</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">协作研报标注记录</p>
                  </button>

                  <button
                    onClick={() => navigate('/admin/source-scores')}
                    className="group rounded-lg border border-cyan-500/15 bg-cyan-500/5 p-3 text-left transition hover:border-cyan-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <BarChart3 className="h-4 w-4 text-cyan-400" />
                      <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                        {avgSourceScore}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-200 group-hover:text-cyan-300">信源可信度</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">综合评分均值</p>
                  </button>
                </div>

                {recentAnnotations.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-2 text-[11px] font-medium text-slate-400">最近批注</p>
                    <div className="space-y-1.5">
                      {recentAnnotations.map((ann) => {
                        const report = reports.find((r) => r.id === ann.reportId);
                        return (
                          <button
                            key={ann.id}
                            onClick={() => navigate('/workspace')}
                            className="flex w-full items-start gap-2 rounded-md border border-gold-500/5 bg-finance-900/30 p-2 text-left transition hover:border-gold-500/20"
                          >
                            <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-[11px] text-slate-300">
                                {ann.text || ann.comment || '批注锚点'}
                              </p>
                              <p className="mt-0.5 text-[10px] text-slate-500">
                                {ann.annotatorName} · P{ann.pageNumber}
                                {report ? ` · ${report.title.slice(0, 15)}...` : ''}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {pendingSummaries.length > 0 && (
                  <div>
                    <p className="mb-2 text-[11px] font-medium text-slate-400">待校验摘要</p>
                    <div className="space-y-1.5">
                      {pendingSummaries.slice(0, 2).map((sr) => (
                        <button
                          key={sr.id}
                          onClick={() => navigate('/admin/summary-review')}
                          className="flex w-full items-start gap-2 rounded-md border border-purple-500/10 bg-purple-500/5 p-2 text-left transition hover:border-purple-500/25"
                        >
                          <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-purple-400" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-[11px] font-medium text-slate-200">{sr.reportTitle}</p>
                            <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-slate-400">
                              {sr.generatedSummary}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-600">{formatTime(sr.createdAt)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 border-t border-gold-500/5 pt-2">
                  <p className="mb-1.5 text-[11px] font-medium text-slate-400">人工校验记录</p>
                  <div className="space-y-1">
                    {triples
                      .filter((t) => t.reviewHistory && t.reviewHistory.length > 0)
                      .slice(0, 3)
                      .flatMap((t) =>
                        (t.reviewHistory ?? []).map((rh) => (
                          <div
                            key={rh.id}
                            className="flex items-center gap-2 rounded px-2 py-1.5 text-[10px]"
                          >
                            {rh.action === 'approve' ? (
                              <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                            ) : (
                              <X className="h-3 w-3 shrink-0 text-red-400" />
                            )}
                            <span className="flex-1 truncate text-slate-400">
                              {rh.reviewerName} {rh.action === 'approve' ? '通过' : '驳回'}：{t.subject.name} → {t.predicate} → {t.object.name}
                            </span>
                            <span className="shrink-0 text-slate-600">{formatTime(rh.timestamp)}</span>
                          </div>
                        ))
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-b border-gold-500/10 px-4 py-3">
            <div className="mb-3 flex items-center gap-2">
              <Flame className="h-4 w-4 text-gold-400" />
              <h3 className="text-sm font-medium text-slate-200">热点实体排行</h3>
            </div>
            <div className="space-y-2">
              {hotCompanies.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => {
                    setSelectedEntity(e);
                    navigate(`/entity/${e.id}`);
                  }}
                  className="group flex w-full items-center justify-between rounded-md border border-transparent px-2.5 py-2 text-left transition hover:border-gold-500/20 hover:bg-gold-500/5"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                        i === 0
                          ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-finance-900'
                          : i < 3
                            ? 'bg-slate-700 text-slate-200'
                            : 'bg-finance-700 text-slate-500'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm text-slate-200 group-hover:text-gold-300">{e.name}</p>
                      {e.metadata?.stockCode && (
                        <p className="text-[10px] text-slate-500">{e.metadata.stockCode}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-finance-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-400"
                        style={{ width: `${e.hotScore ?? 0}%` }}
                      />
                    </div>
                    <ArrowUpRight className="h-3 w-3 text-slate-600 group-hover:text-gold-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-gold-500/10 px-4 py-3">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-medium text-slate-200">概念板块</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hotConcepts.map((c) => (
                <button
                  key={c.id}
                  className="group flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-xs text-emerald-300 transition hover:border-emerald-500/40 hover:bg-emerald-500/10"
                >
                  <Layers className="h-3 w-3" />
                  <span>{c.name}</span>
                  <span className="rounded-full bg-emerald-500/20 px-1.5 text-[10px]">
                    {c.hotScore}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-3">
            <button
              onClick={() => toggleSection('riskDynamics')}
              className="mb-3 flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-medium text-slate-200">风险与动态</h3>
              </div>
              {expandedSections.riskDynamics ? (
                <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              )}
            </button>

            {expandedSections.riskDynamics && (
              <div className="space-y-2.5">
                {enrichedRiskDynamics.map((item, i) => (
                  <div
                    key={i}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="rounded-md border border-gold-500/5 bg-finance-900/30 p-2.5">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            item.tag === '高风险'
                              ? 'bg-red-500/15 text-red-300'
                              : item.tag === '中风险'
                                ? 'bg-amber-500/15 text-amber-300'
                                : item.tag === '热度'
                                  ? 'bg-orange-500/15 text-orange-300'
                                  : 'bg-blue-500/15 text-blue-300'
                          }`}
                        >
                          {item.tag}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-relaxed text-slate-300">{item.text}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                            <span>{item.time}</span>
                            {item.sourceName && (
                              <span className="flex items-center gap-0.5">
                                <Newspaper className="h-2.5 w-2.5" />
                                {item.sourceName}
                              </span>
                            )}
                            {item.sourceUrl && (
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-0.5 text-gold-400 transition hover:text-gold-300"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                原始信源
                              </a>
                            )}
                          </div>
                          {item.relatedEntities.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              {item.relatedEntities.map((eid) => {
                                const e = entities.find((x) => x.id === eid);
                                if (!e) return null;
                                return (
                                  <button
                                    key={eid}
                                    onClick={() => {
                                      setSelectedEntity(e);
                                      navigate(`/entity/${eid}`);
                                    }}
                                    className="flex items-center gap-0.5 rounded bg-finance-700/50 px-1.5 py-0.5 text-[10px] text-slate-400 transition hover:text-gold-300"
                                  >
                                    {(() => {
                                      const Icon = typeIcon[e.type] || Building2;
                                      return <Icon className="h-2.5 w-2.5" />;
                                    })()}
                                    {e.name}
                                  </button>
                                );
                              })}
                              {(item.riskLevel === 'high' || item.riskLevel === 'medium') && (
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[9px] ring-1 ${riskColor[item.riskLevel]}`}
                                >
                                  {riskLabel[item.riskLevel]}
                                </span>
                              )}
                              {!item.read && (
                                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] text-amber-300">
                                  未读
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

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
} from 'lucide-react';
import KnowledgeGraph from '@/components/graph/KnowledgeGraph';
import { useAppStore } from '@/store/appStore';
import type { Entity, EntityType, RiskLevel } from '@/../shared/types';

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

export default function GraphHome() {
  const navigate = useNavigate();
  const { entities, relations, concepts, setSelectedEntity } = useAppStore();
  const [typeFilter, setTypeFilter] = useState<EntityType | 'all'>('all');
  const [selectedForDetail, setSelectedForDetail] = useState<Entity | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    predicate: [] as string[],
    subjectTypes: [] as EntityType[],
    riskLevel: 'all' as RiskLevel | 'all',
    dateRange: { start: '', end: '' },
    sources: [] as string[],
  });

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

  const handleNodeClick = (entity: Entity) => {
    setSelectedEntity(entity);
    setSelectedForDetail(entity);
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

      <aside className="flex w-80 shrink-0 flex-col border-l border-gold-500/10 bg-finance-800/40">
        <div className="border-b border-gold-500/10 px-5 py-4">
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

        <div className="border-b border-gold-500/10 px-5 py-4">
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

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-medium text-slate-200">实时动态</h3>
          </div>
          <div className="space-y-3">
            {[
              { time: '2 分钟前', text: '新增关联：腾讯控股 → 战略合作 → 海康威视', tag: '新增' },
              { time: '15 分钟前', text: '隆基绿能热度上升 8 位，当前排名第 1', tag: '热度' },
              { time: '1 小时前', text: '检测到风险信号：腾讯控股遭 SEC 调查', tag: '风险' },
              { time: '3 小时前', text: '新增实体「通威股份」关联关系 5 条', tag: '新增' },
              { time: '今天 09:30', text: '光伏胶膜概念板块整体热度 +12%', tag: '热度' },
            ].map((item, i) => (
              <div
                key={i}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start gap-2.5 rounded-md border border-gold-500/5 bg-finance-900/30 p-2.5">
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      item.tag === '风险'
                        ? 'bg-red-500/15 text-red-300'
                        : item.tag === '热度'
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-blue-500/15 text-blue-300'
                    }`}
                  >
                    {item.tag}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs leading-relaxed text-slate-300">{item.text}</p>
                    <p className="mt-1 text-[10px] text-slate-600">{item.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

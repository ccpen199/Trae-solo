import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  User,
  Landmark,
  Lightbulb,
  Factory,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Newspaper,
  FileText,
  Radio,
  Bell,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import KnowledgeGraph from '@/components/graph/KnowledgeGraph';
import { useAppStore } from '@/store/appStore';
import type { EntityType, RiskLevel } from '@/../shared/types';

const typeIcon: Record<EntityType, any> = {
  company: Building2,
  person: User,
  institution: Landmark,
  concept: Lightbulb,
  industry: Factory,
};

const riskColor: Record<RiskLevel, string> = {
  low: 'bg-signal-positive/15 text-signal-positive border-signal-positive/30',
  medium: 'bg-signal-warning/15 text-signal-warning border-signal-warning/30',
  high: 'bg-signal-danger/15 text-signal-danger border-signal-danger/30',
};

const riskLabel: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中等风险',
  high: '高风险',
};

export default function EntityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { entities, getEntityRelations, getEntityTimeline, addSubscription, subscriptions } =
    useAppStore();

  const entity = entities.find((e) => e.id === id);
  const graphData = useMemo(() => (id ? getEntityRelations(id, 2) : { nodes: [], links: [] }), [
    id,
    getEntityRelations,
  ]);
  const timeline = useMemo(() => (id ? getEntityTimeline(id) : []), [id, getEntityTimeline]);

  const isSubscribed = subscriptions.some((s) => s.targetId === id);
  const Icon = entity ? typeIcon[entity.type] : Building2;

  if (!entity) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">实体不存在</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-sm text-gold-400 hover:text-gold-300"
          >
            返回图谱
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="border-b border-gold-500/10 px-6 py-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-gold-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回知识图谱
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 p-6">
        <div className="col-span-5 space-y-5">
          <div className="gold-border-gradient rounded-xl p-5 animate-fade-in-up">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-gold-400/20 to-gold-700/20 text-gold-300 ring-1 ring-gold-500/30">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-semibold text-gold-200">
                    {entity.name}
                  </h1>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded bg-slate-700/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">
                      {entity.type === 'company'
                        ? '上市公司'
                        : entity.type === 'person'
                          ? '人物'
                          : entity.type === 'institution'
                            ? '机构'
                            : entity.type === 'concept'
                              ? '概念'
                              : '行业'}
                    </span>
                    {entity.metadata?.stockCode && (
                      <span className="text-xs text-gold-400">{entity.metadata.stockCode}</span>
                    )}
                    {entity.hotScore && (
                      <span className="flex items-center gap-1 text-xs text-amber-300">
                        <TrendingUp className="h-3 w-3" />
                        热度 {entity.hotScore}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isSubscribed) {
                    addSubscription({
                      type: entity.type === 'concept' ? 'concept' : 'entity',
                      targetId: entity.id,
                      targetName: entity.name,
                      notifyLevel: 'all',
                    });
                  }
                }}
                disabled={isSubscribed}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition ${
                  isSubscribed
                    ? 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30'
                    : 'bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/30 hover:bg-gold-500/25'
                }`}
              >
                {isSubscribed ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    已订阅
                  </>
                ) : (
                  <>
                    <Bell className="h-3.5 w-3.5" />
                    订阅动态
                  </>
                )}
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">{entity.description}</p>

            {entity.metadata && Object.keys(entity.metadata).length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {Object.entries(entity.metadata).map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-md border border-gold-500/10 bg-finance-900/40 p-2.5"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      {k === 'industry'
                        ? '所属行业'
                        : k === 'stockCode'
                          ? '股票代码'
                          : k === 'marketCap'
                            ? '市值'
                            : k === 'position'
                              ? '职位'
                              : k === 'age'
                                ? '年龄'
                                : k === 'type'
                                  ? '类型'
                                  : k === 'AUM'
                                    ? '管理规模'
                                    : k}
                    </p>
                    <p className="mt-0.5 font-serif text-sm text-gold-200">{v as string}</p>
                  </div>
                ))}
              </div>
            )}

            {entity.riskTags && entity.riskTags.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">
                  风险标签
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {entity.riskTags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[11px] text-red-300 ring-1 ring-red-500/20"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-xl p-5 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
              <Calendar className="h-4 w-4 text-gold-400" />
              时间线动态
            </h3>
            <div className="relative space-y-4 pl-1">
              <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-gold-500/50 via-finance-600 to-transparent" />
              {timeline.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-500">暂无动态</p>
              ) : (
                timeline.map((event, i) => (
                  <div
                    key={event.id}
                    className="relative animate-fade-in-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div
                      className={`absolute -left-0.5 top-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-finance-800 ${
                        event.riskLevel === 'high'
                          ? 'bg-signal-danger'
                          : event.riskLevel === 'medium'
                            ? 'bg-signal-warning'
                            : 'bg-signal-positive'
                      }`}
                    />
                    <div className="ml-6 rounded-md border border-gold-500/10 bg-finance-900/30 p-3 transition hover:border-gold-500/20">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-200">{event.title}</p>
                        {event.riskLevel && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] border ${
                              riskColor[event.riskLevel]
                            }`}
                          >
                            {riskLabel[event.riskLevel]}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {event.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-600">
                        <span className="flex items-center gap-1">
                          {event.type === 'announcement' ? (
                            <Newspaper className="h-3 w-3" />
                          ) : event.type === 'research' ? (
                            <FileText className="h-3 w-3" />
                          ) : event.type === 'news' ? (
                            <Radio className="h-3 w-3" />
                          ) : (
                            <Calendar className="h-3 w-3" />
                          )}
                          {event.type === 'announcement'
                            ? '公告'
                            : event.type === 'research'
                              ? '研报'
                              : event.type === 'news'
                                ? '新闻'
                                : '事件'}
                        </span>
                        <span>{event.date}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-span-7 space-y-5">
          <div className="glass-panel flex h-[460px] flex-col rounded-xl animate-fade-in-up" style={{ animationDelay: '40ms' }}>
            <div className="flex items-center justify-between border-b border-gold-500/10 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <TrendingUp className="h-4 w-4 text-gold-400" />
                关联关系网络（2 度）
              </h3>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <span className="rounded bg-finance-700/50 px-2 py-0.5">
                  {graphData.nodes.length} 节点
                </span>
                <span className="rounded bg-finance-700/50 px-2 py-0.5">
                  {graphData.links.length} 关系
                </span>
              </div>
            </div>
            <div className="flex-1">
              <KnowledgeGraph
                nodes={graphData.nodes}
                links={graphData.links}
                highlightNodeId={entity.id}
                onNodeClick={(e) => navigate(`/entity/${e.id}`)}
              />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-200">
              <FileText className="h-4 w-4 text-gold-400" />
              关联关系明细
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {graphData.links.slice(0, 8).map((rel) => {
                const src = entities.find((e) => e.id === rel.sourceId);
                const tgt = entities.find((e) => e.id === rel.targetId);
                if (!src || !tgt) return null;
                const isCenter = src.id === entity.id;
                return (
                  <button
                    key={rel.id}
                    className="flex items-center gap-2 rounded-md border border-gold-500/10 bg-finance-900/30 p-3 text-left transition hover:border-gold-500/25 hover:bg-gold-500/5"
                  >
                    <div
                      className={`flex min-w-0 flex-1 items-center gap-2 ${
                        isCenter ? '' : 'text-right flex-row-reverse'
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-medium ${
                          src.type === 'company'
                            ? 'bg-blue-500/15 text-blue-300'
                            : src.type === 'person'
                              ? 'bg-purple-500/15 text-purple-300'
                              : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {src.type === 'company'
                          ? '公'
                          : src.type === 'person'
                            ? '人'
                            : '机'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-slate-200">{src.name}</p>
                      </div>
                    </div>
                    <div className="shrink-0 rounded-full bg-gold-500/10 px-2 py-0.5 text-[10px] text-gold-300 ring-1 ring-gold-500/20">
                      {rel.predicate}
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-slate-200">{tgt.name}</p>
                      </div>
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded text-[10px] font-medium ${
                          tgt.type === 'company'
                            ? 'bg-blue-500/15 text-blue-300'
                            : tgt.type === 'person'
                              ? 'bg-purple-500/15 text-purple-300'
                              : 'bg-amber-500/15 text-amber-300'
                        }`}
                      >
                        {tgt.type === 'company'
                          ? '公'
                          : tgt.type === 'person'
                            ? '人'
                            : '机'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span
                        className={`text-[9px] ${
                          rel.confidence >= 0.9
                            ? 'text-emerald-400'
                            : rel.confidence >= 0.8
                              ? 'text-amber-400'
                              : 'text-slate-500'
                        }`}
                      >
                        {(rel.confidence * 100).toFixed(0)}%
                      </span>
                      {rel.verified ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <XCircle className="h-3 w-3 text-slate-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

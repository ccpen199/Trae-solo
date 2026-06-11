import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Zap, Filter, Layers, ArrowUpRight, Sparkles } from 'lucide-react';
import KnowledgeGraph from '@/components/graph/KnowledgeGraph';
import { useAppStore } from '@/store/appStore';
import type { Entity, EntityType } from '@/../shared/types';

export default function GraphHome() {
  const navigate = useNavigate();
  const { entities, relations, concepts, setSelectedEntity } = useAppStore();
  const [typeFilter, setTypeFilter] = useState<EntityType | 'all'>('all');
  const [selectedForDetail, setSelectedForDetail] = useState<Entity | null>(null);

  const filteredNodes = useMemo(
    () => (typeFilter === 'all' ? entities : entities.filter((e) => e.type === typeFilter)),
    [entities, typeFilter]
  );

  const filteredLinks = useMemo(() => {
    const ids = new Set(filteredNodes.map((n) => n.id));
    return relations.filter((r) => ids.has(r.sourceId) && ids.has(r.targetId));
  }, [filteredNodes, relations]);

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

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-gold-500/10 px-6 py-3">
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
                    className={`rounded px-2.5 py-1 text-xs transition ${
                      typeFilter === t
                        ? 'bg-gold-500/20 text-gold-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
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
            <button className="flex items-center gap-1.5 rounded-md border border-gold-500/10 bg-finance-800/60 px-3 py-1.5 text-xs text-slate-300 hover:border-gold-500/30 hover:text-gold-300">
              <Filter className="h-3.5 w-3.5" />
              高级筛选
            </button>
          </div>
        </div>

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

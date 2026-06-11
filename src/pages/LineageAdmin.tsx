import { useMemo, useState } from 'react';
import {
  GitBranch,
  Database,
  FileText,
  Cpu,
  Network,
  Search,
  Filter,
  Clock,
  ExternalLink,
  Layers,
  Info,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { LineageNode } from '@/../shared/types';

const nodeTypeConfig: Record<LineageNode['type'], { icon: any; color: string; bg: string; label: string }> = {
  source: { icon: Database, color: 'text-blue-300', bg: 'bg-blue-500/15 border-blue-500/30', label: '信源' },
  document: { icon: FileText, color: 'text-purple-300', bg: 'bg-purple-500/15 border-purple-500/30', label: '文档' },
  extraction_task: { icon: Cpu, color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30', label: '抽取任务' },
  triple: { icon: Network, color: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30', label: '三元组' },
};

export default function LineageAdmin() {
  const { lineageData } = useAppStore();
  const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null);
  const [typeFilter, setTypeFilter] = useState<LineageNode['type'] | 'all'>('all');
  const [search, setSearch] = useState('');

  const filteredNodes = useMemo(() => {
    if (!lineageData) return [];
    return lineageData.nodes.filter((n) => {
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      if (search && !n.label.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [lineageData, typeFilter, search]);

  const layout = useMemo(() => {
    if (!lineageData) return { positions: {} as Record<string, { x: number; y: number }>, width: 900, height: 500 };
    const layers: Record<string, number> = {};
    const visited = new Set<string>();
    const queue: { id: string; depth: number }[] = [];

    lineageData.nodes
      .filter((n) => n.type === 'source')
      .forEach((n) => {
        queue.push({ id: n.id, depth: 0 });
      });

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      layers[id] = depth;
      lineageData.edges
        .filter((e) => e.sourceId === id)
        .forEach((e) => queue.push({ id: e.targetId, depth: depth + 1 }));
    }

    const byLayer: Record<number, string[]> = {};
    Object.entries(layers).forEach(([id, d]) => {
      if (!byLayer[d]) byLayer[d] = [];
      byLayer[d].push(id);
    });

    const positions: Record<string, { x: number; y: number }> = {};
    const layerGap = 200;
    const nodeGap = 90;
    Object.entries(byLayer).forEach(([depthStr, ids]) => {
      const depth = parseInt(depthStr);
      const totalH = ids.length * nodeGap;
      const startY = 250 - totalH / 2 + nodeGap / 2;
      ids.forEach((id, i) => {
        positions[id] = { x: 80 + depth * layerGap, y: startY + i * nodeGap };
      });
    });

    const maxDepth = Math.max(...Object.values(layers), 0);
    return { positions, width: 120 + maxDepth * layerGap, height: 520 };
  }, [lineageData]);

  if (!lineageData) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-slate-400">暂无血缘数据</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-6">
      <div className="mb-6 animate-fade-in-up">
        <h1 className="font-serif text-2xl font-semibold text-gold-200">数据血缘追溯</h1>
        <p className="mt-1 text-sm text-slate-500">
          追踪每一条三元组的来源链路：信源 → 文档 → 抽取任务 → 知识三元组，实现全链路可追溯
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 space-y-4 animate-fade-in-up">
          <div className="glass-panel rounded-xl p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索节点..."
                className="w-full rounded-md border border-gold-500/10 bg-finance-900/60 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-gold-500/30 focus:outline-none"
              />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
              <Filter className="h-4 w-4 text-gold-400" />
              节点类型筛选
            </h3>
            <div className="space-y-1.5">
              {(['all', 'source', 'document', 'extraction_task', 'triple'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs transition ${
                    typeFilter === t
                      ? 'bg-gold-500/15 text-gold-300 ring-1 ring-gold-500/25'
                      : 'text-slate-400 hover:bg-finance-700/40 hover:text-slate-200'
                  }`}
                >
                  {t === 'all' ? (
                    <Layers className="h-3.5 w-3.5" />
                  ) : (
                    (() => {
                      const Cfg = nodeTypeConfig[t as LineageNode['type']];
                      const Icon = Cfg.icon;
                      return <Icon className={`h-3.5 w-3.5 ${Cfg.color}`} />;
                    })()
                  )}
                  <span>{t === 'all' ? '全部节点' : nodeTypeConfig[t as LineageNode['type']].label}</span>
                  <span className="ml-auto text-[10px] text-slate-500">
                    {t === 'all'
                      ? lineageData.nodes.length
                      : lineageData.nodes.filter((n) => n.type === t).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
              <Layers className="h-4 w-4 text-gold-400" />
              节点列表
            </h3>
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {filteredNodes.map((n) => {
                const cfg = nodeTypeConfig[n.type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNode(n)}
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition ${
                      selectedNode?.id === n.id
                        ? 'bg-gold-500/10 ring-1 ring-gold-500/20'
                        : 'hover:bg-finance-700/40'
                    }`}
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border ${cfg.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-slate-200">{n.label}</p>
                      <p className="text-[10px] text-slate-500">{cfg.label}</p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-6 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <div className="glass-panel flex h-full flex-col rounded-xl">
            <div className="flex items-center justify-between border-b border-gold-500/10 px-5 py-3">
              <h3 className="flex items-center gap-2 text-sm font-medium text-slate-200">
                <GitBranch className="h-4 w-4 text-gold-400" />
                血缘有向无环图
              </h3>
              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                {(Object.keys(nodeTypeConfig) as LineageNode['type'][]).map((t) => {
                  const cfg = nodeTypeConfig[t];
                  const Icon = cfg.icon;
                  return (
                    <span key={t} className="flex items-center gap-1">
                      <Icon className={`h-3 w-3 ${cfg.color}`} />
                      {cfg.label}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <svg
                width={layout.width}
                height={layout.height}
                className="mx-auto"
                viewBox={`0 0 ${layout.width} ${layout.height}`}
              >
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(201,169,98,0.4)" />
                  </marker>
                </defs>

                {lineageData.edges.map((e, i) => {
                  const s = layout.positions[e.sourceId];
                  const t = layout.positions[e.targetId];
                  if (!s || !t) return null;
                  const midX = (s.x + 60 + t.x) / 2;
                  return (
                    <path
                      key={i}
                      d={`M ${s.x + 60} ${s.y} C ${midX} ${s.y}, ${midX} ${t.y}, ${t.x} ${t.y}`}
                      fill="none"
                      stroke="rgba(201,169,98,0.25)"
                      strokeWidth="1.5"
                      markerEnd="url(#arrow)"
                    />
                  );
                })}

                {lineageData.nodes.map((n) => {
                  const pos = layout.positions[n.id];
                  if (!pos) return null;
                  const cfg = nodeTypeConfig[n.type];
                  const Icon = cfg.icon;
                  const isFiltered = !filteredNodes.find((fn) => fn.id === n.id);
                  const isSelected = selectedNode?.id === n.id;
                  return (
                    <g
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className="cursor-pointer"
                      style={{ opacity: isFiltered ? 0.2 : 1 }}
                    >
                      {isSelected && (
                        <rect
                          x={pos.x - 4}
                          y={pos.y - 22}
                          width="128"
                          height="44"
                          rx="8"
                          fill="none"
                          stroke="rgba(201,169,98,0.6)"
                          strokeWidth="1.5"
                          strokeDasharray="4 3"
                        />
                      )}
                      <rect
                        x={pos.x}
                        y={pos.y - 18}
                        width="120"
                        height="36"
                        rx="6"
                        className={n.type === 'source' ? 'fill-[rgba(59,130,246,0.1)]' : n.type === 'document' ? 'fill-[rgba(168,85,247,0.1)]' : n.type === 'extraction_task' ? 'fill-[rgba(245,158,11,0.1)]' : 'fill-[rgba(16,185,129,0.1)]'}
                        stroke={n.type === 'source' ? 'rgba(59,130,246,0.3)' : n.type === 'document' ? 'rgba(168,85,247,0.3)' : n.type === 'extraction_task' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}
                        strokeWidth="1"
                      />
                      <foreignObject x={pos.x + 4} y={pos.y - 14} width="112" height="28">
                        <div className="flex h-full items-center gap-1.5 overflow-hidden">
                          <Icon
                            className={`h-3.5 w-3.5 shrink-0 ${
                              n.type === 'source'
                                ? 'text-blue-300'
                                : n.type === 'document'
                                  ? 'text-purple-300'
                                  : n.type === 'extraction_task'
                                    ? 'text-amber-300'
                                    : 'text-emerald-300'
                            }`}
                          />
                          <span className="truncate text-[10px] text-slate-200">{n.label}</span>
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        <div className="col-span-3 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <div className="glass-panel rounded-xl p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
              <Info className="h-4 w-4 text-gold-400" />
              节点详情
            </h3>
            {selectedNode ? (
              <div className="space-y-4">
                {(() => {
                  const cfg = nodeTypeConfig[selectedNode.type];
                  const Icon = cfg.icon;
                  return (
                    <div className={`rounded-lg border p-3 ${cfg.bg}`}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${cfg.color}`} />
                        <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-200">{selectedNode.label}</p>
                    </div>
                  );
                })()}

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">节点ID</span>
                    <span className="font-mono text-slate-300">{selectedNode.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      时间戳
                    </span>
                    <span className="text-slate-300">{selectedNode.timestamp.replace('T', ' ').slice(0, 16)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">入度</span>
                    <span className="text-slate-300">
                      {lineageData.edges.filter((e) => e.targetId === selectedNode.id).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">出度</span>
                    <span className="text-slate-300">
                      {lineageData.edges.filter((e) => e.sourceId === selectedNode.id).length}
                    </span>
                  </div>
                </div>

                {lineageData.edges.filter((e) => e.sourceId === selectedNode.id).length > 0 && (
                  <div>
                    <p className="mb-2 text-xs text-slate-500">下游节点</p>
                    <div className="space-y-1.5">
                      {lineageData.edges
                        .filter((e) => e.sourceId === selectedNode.id)
                        .map((e) => {
                          const target = lineageData.nodes.find((n) => n.id === e.targetId);
                          if (!target) return null;
                          const cfg = nodeTypeConfig[target.type];
                          const TIcon = cfg.icon;
                          return (
                            <button
                              key={e.targetId}
                              onClick={() => setSelectedNode(target)}
                              className="flex w-full items-center gap-2 rounded-md border border-gold-500/10 bg-finance-900/40 px-2.5 py-2 text-left text-xs hover:border-gold-500/25"
                            >
                              <TIcon className={`h-3 w-3 ${cfg.color}`} />
                              <span className="truncate flex-1 text-slate-300">{target.label}</span>
                              <span className="text-[10px] text-gold-400">{e.relation}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {lineageData.edges.filter((e) => e.targetId === selectedNode.id).length > 0 && (
                  <div>
                    <p className="mb-2 text-xs text-slate-500">上游节点</p>
                    <div className="space-y-1.5">
                      {lineageData.edges
                        .filter((e) => e.targetId === selectedNode.id)
                        .map((e) => {
                          const source = lineageData.nodes.find((n) => n.id === e.sourceId);
                          if (!source) return null;
                          const cfg = nodeTypeConfig[source.type];
                          const SIcon = cfg.icon;
                          return (
                            <button
                              key={e.sourceId}
                              onClick={() => setSelectedNode(source)}
                              className="flex w-full items-center gap-2 rounded-md border border-gold-500/10 bg-finance-900/40 px-2.5 py-2 text-left text-xs hover:border-gold-500/25"
                            >
                              <SIcon className={`h-3 w-3 ${cfg.color}`} />
                              <span className="truncate flex-1 text-slate-300">{source.label}</span>
                              <span className="text-[10px] text-slate-500">{e.relation}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                <button className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gold-500/20 bg-gold-500/10 py-2 text-xs text-gold-300 transition hover:bg-gold-500/20">
                  <ExternalLink className="h-3.5 w-3.5" />
                  查看完整链路报告
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GitBranch className="h-10 w-10 text-slate-700" />
                <p className="mt-3 text-xs text-slate-500">点击图谱中的节点</p>
                <p className="text-xs text-slate-600">查看详细血缘信息</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

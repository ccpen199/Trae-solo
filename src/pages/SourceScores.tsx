import { useMemo, useState } from 'react';
import {
  ShieldCheck,
  Award,
  TrendingUp,
  Clock,
  Target,
  CheckSquare,
  Info,
  Search,
  ChevronRight,
  Star,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { SourceScore } from '@/../shared/types';

const dimensionConfig: Record<keyof SourceScore['dimensions'], { label: string; icon: any; color: string }> = {
  authority: { label: '权威性', icon: Award, color: '#60A5FA' },
  timeliness: { label: '时效性', icon: Clock, color: '#F472B6' },
  accuracy: { label: '准确性', icon: Target, color: '#34D399' },
  completeness: { label: '完整性', icon: CheckSquare, color: '#FBBF24' },
};

const scoreTier = (score: number) => {
  if (score >= 90) return { label: 'S', text: 'text-emerald-300', bg: 'bg-emerald-500/15 ring-emerald-500/30' };
  if (score >= 80) return { label: 'A', text: 'text-blue-300', bg: 'bg-blue-500/15 ring-blue-500/30' };
  if (score >= 70) return { label: 'B', text: 'text-amber-300', bg: 'bg-amber-500/15 ring-amber-500/30' };
  if (score >= 60) return { label: 'C', text: 'text-orange-300', bg: 'bg-orange-500/15 ring-orange-500/30' };
  return { label: 'D', text: 'text-red-300', bg: 'bg-red-500/15 ring-red-500/30' };
};

function RadarChart({ dimensions }: { dimensions: SourceScore['dimensions'] }) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 100;
  const dims = Object.entries(dimensions) as [keyof SourceScore['dimensions'], number][];
  const angleStep = (Math.PI * 2) / dims.length;

  const points = dims.map(([, val], i) => {
    const angle = (i * angleStep) - Math.PI / 2;
    const r = (val / 100) * radius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), angle };
  });

  const rings = [0.25, 0.5, 0.75, 1].map((scale) =>
    dims.map((_, i) => {
      const angle = (i * angleStep) - Math.PI / 2;
      const r = scale * radius;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ')
  );

  const dataPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {rings.map((ring, i) => (
        <polygon key={i} points={ring} fill="none" stroke="rgba(201,169,98,0.08)" strokeWidth="1" />
      ))}

      {dims.map((_, i) => {
        const angle = (i * angleStep) - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + radius * Math.cos(angle)}
            y2={cy + radius * Math.sin(angle)}
            stroke="rgba(201,169,98,0.1)"
            strokeWidth="1"
          />
        );
      })}

      <defs>
        <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(201,169,98,0.4)" />
          <stop offset="100%" stopColor="rgba(201,169,98,0.05)" />
        </radialGradient>
      </defs>

      <path d={dataPath} fill="url(#radarGrad)" stroke="rgba(201,169,98,0.7)" strokeWidth="2" />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#C9A962" stroke="#0B1E3F" strokeWidth="2" />
      ))}

      {dims.map(([key], i) => {
        const angle = (i * angleStep) - Math.PI / 2;
        const lr = radius + 22;
        const lx = cx + lr * Math.cos(angle);
        const ly = cy + lr * Math.sin(angle);
        const cfg = dimensionConfig[key];
        return (
          <g key={key}>
            <foreignObject x={lx - 22} y={ly - 10} width="44" height="20">
              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400">
                <cfg.icon className="h-2.5 w-2.5" style={{ color: cfg.color }} />
                {cfg.label}
              </div>
            </foreignObject>
          </g>
        );
      })}

      {points.map((p, i) => {
        const [, val] = dims[i];
        return (
          <text
            key={`v${i}`}
            x={p.x}
            y={p.y - 10}
            textAnchor="middle"
            fontSize="10"
            fill="#C9A962"
            fontWeight="600"
          >
            {val}
          </text>
        );
      })}
    </svg>
  );
}

function TrendLineChart({ history }: { history: SourceScore['history'] }) {
  const width = 480;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const min = Math.min(...history.map((h) => h.score)) - 5;
  const max = Math.max(...history.map((h) => h.score)) + 5;

  const points = history.map((h, i) => {
    const x = padding.left + (i / (history.length - 1)) * chartW;
    const y = padding.top + chartH - ((h.score - min) / (max - min)) * chartH;
    return { x, y, ...h };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = linePath + ` L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(min + t * (max - min)));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(201,169,98,0.3)" />
          <stop offset="100%" stopColor="rgba(201,169,98,0)" />
        </linearGradient>
      </defs>

      {yTicks.map((t, i) => {
        const y = padding.top + chartH - (i / (yTicks.length - 1)) * chartH;
        return (
          <g key={t}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(201,169,98,0.06)" strokeWidth="1" />
            <text x={padding.left - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#64748B">
              {t}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={linePath} fill="none" stroke="#C9A962" strokeWidth="2" />

      {points.map((p) => (
        <g key={p.date}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#0B1E3F" stroke="#C9A962" strokeWidth="2" />
          <text x={p.x} y={height - 10} textAnchor="middle" fontSize="9" fill="#64748B">
            {p.date.slice(2)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function SourceScores() {
  const { sourceScores } = useAppStore();
  const [selectedId, setSelectedId] = useState<string>(sourceScores[0]?.sourceId ?? '');
  const [search, setSearch] = useState('');

  const selected = useMemo(
    () => sourceScores.find((s) => s.sourceId === selectedId) ?? sourceScores[0],
    [sourceScores, selectedId]
  );

  const filtered = sourceScores.filter((s) =>
    s.sourceName.toLowerCase().includes(search.toLowerCase())
  );

  const avgOverall = (sourceScores.reduce((acc, s) => acc + s.overall, 0) / sourceScores.length).toFixed(1);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-6">
      <div className="mb-6 animate-fade-in-up">
        <h1 className="font-serif text-2xl font-semibold text-gold-200">信源可信度评分</h1>
        <p className="mt-1 text-sm text-slate-500">
          基于权威性、时效性、准确性、完整性四个维度的多维度评分模型，动态追踪信源质量变化趋势
        </p>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '40ms' }}>
        {[
          { label: '接入信源总数', value: sourceScores.length, icon: ShieldCheck, sub: '个信源' },
          { label: '平均综合评分', value: avgOverall, icon: Star, sub: '/ 100' },
          { label: 'S/A级信源占比', value: `${sourceScores.filter((s) => s.overall >= 80).length}/${sourceScores.length}`, icon: Award, sub: '高可信' },
          { label: '本月评分波动', value: '±2.3', icon: TrendingUp, sub: '较上月' },
        ].map((s, i) => (
          <div key={i} className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-500">{s.label}</p>
              <s.icon className="h-3.5 w-3.5 text-gold-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-semibold text-gold-200">{s.value}</span>
              <span className="text-[11px] text-slate-500">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="glass-panel rounded-xl">
            <div className="border-b border-gold-500/10 px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索信源..."
                  className="w-full rounded-md border border-gold-500/10 bg-finance-900/60 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-gold-500/30 focus:outline-none"
                />
              </div>
            </div>
            <div className="max-h-[540px] space-y-1 overflow-y-auto p-2">
              {filtered.map((s) => {
                const tier = scoreTier(s.overall);
                return (
                  <button
                    key={s.sourceId}
                    onClick={() => setSelectedId(s.sourceId)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition ${
                      selected?.sourceId === s.sourceId
                        ? 'bg-gold-500/10 ring-1 ring-gold-500/20'
                        : 'hover:bg-finance-700/40'
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ring-1 ${tier.bg} ${tier.text}`}>
                      {tier.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-slate-200">{s.sourceName}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-finance-700">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400"
                            style={{ width: `${s.overall}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gold-300">{s.overall}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {selected && (
          <>
            <div className="col-span-4 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
              <div className="glass-panel h-full rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-slate-200">{selected.sourceName}</h3>
                      {(() => {
                        const t = scoreTier(selected.overall);
                        return (
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ring-1 ${t.bg} ${t.text}`}>
                            {t.label}级
                          </span>
                        );
                      })()}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">多维度能力雷达图</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gold-200">{selected.overall}</p>
                    <p className="text-[10px] text-slate-500">综合评分</p>
                  </div>
                </div>

                <div className="mt-2">
                  <RadarChart dimensions={selected.dimensions} />
                </div>

                <div className="mt-2 space-y-2">
                  {(Object.entries(selected.dimensions) as [keyof SourceScore['dimensions'], number][]).map(([key, val]) => {
                    const cfg = dimensionConfig[key];
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className="flex w-20 items-center gap-1.5 text-[11px] text-slate-400">
                          <cfg.icon className="h-3 w-3" style={{ color: cfg.color }} />
                          {cfg.label}
                        </div>
                        <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-finance-700">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${val}%`, backgroundColor: cfg.color }}
                          />
                        </div>
                        <span className="w-8 text-right text-[11px] font-medium text-slate-300">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="col-span-4 space-y-4 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
              <div className="glass-panel rounded-xl p-5">
                <h3 className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <TrendingUp className="h-4 w-4 text-gold-400" />
                  评分历史趋势
                </h3>
                <p className="mt-1 text-[11px] text-slate-500">近6个月综合评分变化</p>
                <div className="mt-3">
                  <TrendLineChart history={selected.history} />
                </div>
              </div>

              <div className="glass-panel rounded-xl p-5">
                <h3 className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Info className="h-4 w-4 text-gold-400" />
                  评分模型说明
                </h3>
                <div className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-400">
                  <div className="flex gap-2">
                    <Award className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-300" />
                    <p><span className="text-slate-300">权威性</span>：信源官方背景、行业影响力、是否为监管指定披露渠道</p>
                  </div>
                  <div className="flex gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-pink-300" />
                    <p><span className="text-slate-300">时效性</span>：信息发布延迟、更新频率、突发事件响应速度</p>
                  </div>
                  <div className="flex gap-2">
                    <Target className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-300" />
                    <p><span className="text-slate-300">准确性</span>：历史信息正确率、纠错率、与交叉验证信源一致率</p>
                  </div>
                  <div className="flex gap-2">
                    <CheckSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-300" />
                    <p><span className="text-slate-300">完整性</span>：信息覆盖维度、数据字段齐全度、上下文保留度</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

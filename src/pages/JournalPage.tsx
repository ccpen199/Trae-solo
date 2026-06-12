import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { useJournalStore } from '@/store/journalStore';
import { emotions } from '@/data/emotions';
import { scenes } from '@/data/scenes';
import {
  FileText, Trash2, Calendar, Filter, AlertTriangle,
  BarChart3, PieChart, TrendingUp, Award, Search,
  ChevronLeft, ChevronRight, X, Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JournalEntry } from '@/types';

const PAGE_SIZE = 10;

const colorToBadge: Record<string, 'mint' | 'coral' | 'purple' | 'sky' | 'amber'> = {
  '#34D399': 'mint', '#F59E0B': 'amber', '#F87171': 'coral', '#A78BFA': 'purple', '#60A5FA': 'sky', '#EF4444': 'coral',
};

function AnimatedNumber({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>();
  const prevRef = useRef(0);

  useEffect(() => {
    startRef.current = null;
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min((ts - startRef.current) / 1200, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <span className="font-mono tabular-nums">{display.toFixed(decimals)}{suffix}</span>;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getWeekRange() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start: start.getTime(), end: end.getTime() };
}

const PIE_COLORS = ['#34D399', '#F59E0B', '#F87171', '#A78BFA', '#60A5FA', '#EF4444', '#FCD34D', '#FB923C'];

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="flex items-center justify-center h-48 text-slate-500 text-sm">暂无数据</div>;

  let cumulative = 0;
  const segments = data.map((d) => {
    const start = cumulative;
    const pct = (d.value / total) * 100;
    cumulative += pct;
    return { ...d, startAngle: (start / 100) * 360, sweep: (pct / 100) * 360 };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="50" cy="50" r="35"
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={`${(seg.sweep / 360) * (2 * Math.PI * 35)} ${2 * Math.PI * 35}`}
              strokeDashoffset={`${-(seg.startAngle / 360) * (2 * Math.PI * 35)}`}
              className="transition-all duration-700"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white font-display">{total}</span>
          <span className="text-xs text-slate-400">总记录</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs w-full">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-slate-400 truncate">{d.label}</span>
            <span className="text-slate-300 font-mono ml-auto">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type FilterType = 'all' | 'analysis' | 'synthesis';

export default function JournalPage() {
  const { entries, removeEntry, clearAll, getStats } = useJournalStore();
  const stats = useMemo(() => getStats(), [entries, getStats]);

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterEmotion, setFilterEmotion] = useState('all');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [page, setPage] = useState(1);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const weekRange = useMemo(getWeekRange, []);
  const weekCount = useMemo(
    () => entries.filter((e) => e.timestamp >= weekRange.start && e.timestamp < weekRange.end).length,
    [entries, weekRange]
  );
  const mostCommonEmotion = stats.topEmotions.length > 0 ? stats.topEmotions[0].emotion : null;

  const filtered = useMemo(() => {
    let list = [...entries];
    if (filterType !== 'all') list = list.filter((e) => e.type === filterType);
    if (filterEmotion !== 'all') list = list.filter((e) => e.emotion.category === filterEmotion);
    if (filterDateStart) list = list.filter((e) => e.timestamp >= new Date(filterDateStart).getTime());
    if (filterDateEnd) {
      const end = new Date(filterDateEnd);
      end.setDate(end.getDate() + 1);
      list = list.filter((e) => e.timestamp < end.getTime());
    }
    return list;
  }, [entries, filterType, filterEmotion, filterDateStart, filterDateEnd]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filterType, filterEmotion, filterDateStart, filterDateEnd]);

  const handleDelete = useCallback((id: string) => {
    if (confirmDeleteId === id) {
      removeEntry(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  }, [confirmDeleteId, removeEntry]);

  const handleClearAll = useCallback(() => {
    if (confirmClearAll) {
      clearAll();
      setConfirmClearAll(false);
    } else {
      setConfirmClearAll(true);
      setTimeout(() => setConfirmClearAll(false), 3000);
    }
  }, [confirmClearAll, clearAll]);

  const sceneMap = useMemo(() => {
    const m = new Map<string, string>();
    scenes.forEach((s) => m.set(s.name, s.icon));
    return m;
  }, []);

  const chartEmotionData = useMemo(() => {
    const countMap = new Map<string, { name: string; count: number; color: string }>();
    entries.forEach((e) => {
      const k = e.emotion.category;
      if (!countMap.has(k)) countMap.set(k, { name: e.emotion.name, count: 0, color: e.emotion.color });
      countMap.get(k)!.count++;
    });
    return Array.from(countMap.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [entries]);

  const maxEmotionCount = chartEmotionData.length > 0 ? chartEmotionData[0].count : 1;

  const chartSceneData = useMemo(() => {
    return stats.sceneDistribution.slice(0, 8).map((s, i) => ({
      label: s.scene,
      value: s.count,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [stats.sceneDistribution]);

  const statCards = [
    { icon: <FileText className="w-5 h-5" />, label: '总交互次数', value: stats.totalEntries, color: '#F59E0B', decimals: 0 },
    { icon: <TrendingUp className="w-5 h-5" />, label: '本周交互次数', value: weekCount, color: '#34D399', decimals: 0 },
    { icon: <BarChart3 className="w-5 h-5" />, label: '平均置信度', value: stats.avgConfidence * 100, color: '#60A5FA', decimals: 1, suffix: '%' },
    { icon: <Award className="w-5 h-5" />, label: '最常见情绪', value: 0, color: mostCommonEmotion?.color || '#A78BFA', decimals: 0, text: mostCommonEmotion?.name || '--' },
  ];

  return (
      <div className="max-w-6xl mx-auto space-y-8 animate-[fadeIn_0.5s_ease-out]">
        <header className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-amber-orange-light via-mood-mint to-mood-sky bg-clip-text text-transparent">
                实验日志
              </h1>
              <p className="text-slate-400 mt-1">记录每一次人宠交互实验</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="amber" size="md">共 {entries.length} 条记录</Badge>
              {entries.length > 0 && (
                <Button
                  variant={confirmClearAll ? 'danger' : 'ghost'}
                  size="sm"
                  icon={confirmClearAll ? <AlertTriangle className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  onClick={handleClearAll}
                >
                  {confirmClearAll ? '确认清空？' : '清空全部'}
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <div key={i} className="glass-card p-4 rounded-xl transition-all duration-300 hover:border-deep-sea-light/50 group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg transition-transform group-hover:scale-110" style={{ backgroundColor: `${card.color}20`, color: card.color }}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-400">{card.label}</p>
                  {card.text ? (
                    <p className="text-lg font-semibold" style={{ color: card.color }}>{card.text}</p>
                  ) : (
                    <p className="text-lg font-semibold text-white">
                      <AnimatedNumber value={card.value} suffix={card.suffix} decimals={card.decimals} />
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard padding="lg">
            <h2 className="text-lg font-display font-semibold text-white mb-5 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-orange" />高频情绪 TOP5
            </h2>
            {chartEmotionData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm">暂无数据</div>
            ) : (
              <div className="space-y-4">
                {chartEmotionData.map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium" style={{ color: item.color }}>{item.name}</span>
                      <span className="text-slate-400 font-mono">{item.count} 次</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-deep-sea-dark/50 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(item.count / maxEmotionCount) * 100}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard padding="lg">
            <h2 className="text-lg font-display font-semibold text-white mb-5 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-mood-purple" />场景分布
            </h2>
            <DonutChart data={chartSceneData} />
          </GlassCard>
        </div>

        <GlassCard padding="lg">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="text-lg font-display font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-mood-sky" />日志列表
            </h2>
            <span className="text-sm text-slate-400">共 {filtered.length} 条</span>
          </div>

          <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-xl bg-deep-sea-dark/40 border border-deep-sea-light/20">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">筛选：</span>
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-deep-sea-dark/50">
              {(['all', 'analysis', 'synthesis'] as FilterType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={cn(
                    'px-3 py-1 rounded-md text-sm transition-all',
                    filterType === t ? 'bg-amber-orange text-white' : 'text-slate-400 hover:text-white'
                  )}
                >
                  {t === 'all' ? '全部' : t === 'analysis' ? '分析' : '合成'}
                </button>
              ))}
            </div>
            <select
              value={filterEmotion}
              onChange={(e) => setFilterEmotion(e.target.value)}
              className="h-8 px-3 rounded-lg bg-deep-sea-dark/50 border border-deep-sea-light/50 text-sm text-white focus:outline-none focus:border-amber-orange/50"
            >
              <option value="all">全部情绪</option>
              {emotions.map((e) => <option key={e.id} value={e.category}>{e.name}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                className="h-8 px-2 rounded-lg bg-deep-sea-dark/50 border border-deep-sea-light/50 text-sm text-white focus:outline-none focus:border-amber-orange/50 [color-scheme:dark]"
              />
              <span className="text-slate-500">~</span>
              <input
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                className="h-8 px-2 rounded-lg bg-deep-sea-dark/50 border border-deep-sea-light/50 text-sm text-white focus:outline-none focus:border-amber-orange/50 [color-scheme:dark]"
              />
            </div>
            {(filterType !== 'all' || filterEmotion !== 'all' || filterDateStart || filterDateEnd) && (
              <button
                onClick={() => { setFilterType('all'); setFilterEmotion('all'); setFilterDateStart(''); setFilterDateEnd(''); }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-3 h-3" />清除筛选
              </button>
            )}
          </div>

          {paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-400 font-medium mb-1">暂无实验记录</p>
              <p className="text-slate-500 text-sm">开始声纹分析或语音合成，记录将自动保存于此</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paged.map((entry) => (
                <JournalCard
                  key={entry.id}
                  entry={entry}
                  sceneMap={sceneMap}
                  onDelete={handleDelete}
                  confirmDeleteId={confirmDeleteId}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button variant="ghost" size="sm" icon={<ChevronLeft className="w-4 h-4" />} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                上一页
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .reduce<(number | string)[]>((acc, n, i, arr) => {
                    if (i > 0 && typeof arr[i - 1] === 'number' && (n as number) - (arr[i - 1] as number) > 1) acc.push('...');
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    typeof item === 'string' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-slate-500">...</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={cn(
                          'w-8 h-8 rounded-lg text-sm transition-all',
                          page === item ? 'bg-amber-orange text-white' : 'text-slate-400 hover:bg-deep-sea-light/30 hover:text-white'
                        )}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>
              <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                下一页
              </Button>
            </div>
          )}
        </GlassCard>
      </div>
  );
}

function JournalCard({
  entry,
  sceneMap,
  onDelete,
  confirmDeleteId,
}: {
  entry: JournalEntry;
  sceneMap: Map<string, string>;
  onDelete: (id: string) => void;
  confirmDeleteId: string | null;
}) {
  const isConfirming = confirmDeleteId === entry.id;

  return (
    <div className="glass-card rounded-xl p-4 transition-all duration-300 hover:border-deep-sea-light/50 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-mono">{formatDate(entry.timestamp)}</span>
            <Badge variant={entry.type === 'analysis' ? 'amber' : 'sky'} size="sm">
              {entry.type === 'analysis' ? '分析' : '合成'}
            </Badge>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold" style={{ color: entry.emotion.color }}>
              {entry.emotion.name}
            </span>
            <span className="text-xs text-slate-400">
              置信度 {(entry.confidence * 100).toFixed(1)}%
            </span>
            <ProgressBar
              value={entry.confidence * 100}
              color={colorToBadge[entry.emotion.color] || 'amber'}
              size="sm"
              showPercentage={false}
              className="w-24"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>{sceneMap.get(entry.scene) || '📍'}</span>
            <span>{entry.scene}</span>
          </div>
          {entry.catReaction && (
            <p className="text-sm text-slate-300">🐱 反应：{entry.catReaction}</p>
          )}
          {entry.notes && (
            <p className="text-sm text-slate-400">📝 {entry.notes}</p>
          )}
        </div>
        <button
          onClick={() => onDelete(entry.id)}
          className={cn(
            'p-2 rounded-lg transition-all flex-shrink-0',
            isConfirming
              ? 'bg-mood-coral/20 text-mood-coral hover:bg-mood-coral/30'
              : 'text-slate-600 hover:text-mood-coral hover:bg-deep-sea-light/30 opacity-0 group-hover:opacity-100'
          )}
          title={isConfirming ? '再次点击确认删除' : '删除'}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

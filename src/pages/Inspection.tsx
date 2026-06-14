import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, Cpu, ClipboardCheck } from 'lucide-react';
import { useInspectionStore } from '@/stores/useInspectionStore';
import StatusBadge from '@/components/StatusBadge';
import CategoryIcon from '@/components/CategoryIcon';
import { CATEGORY_LABELS } from '@/utils/constants';

const CATEGORIES = ['全部', ...Object.values(CATEGORY_LABELS)];
const CATEGORY_KEY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_LABELS).map(([k, v]) => [v, k])
);

const STATUS_COLUMNS = [
  { key: 'pending', label: '待处理' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
] as const;

function getColumnType(status: string) {
  if (status === 'pending') return 'pending';
  if (['ai_screening', 'manual_check'].includes(status)) return 'in_progress';
  if (['completed', 'rejected'].includes(status)) return 'completed';
  return 'pending';
}

function formatTime(t: string) {
  if (!t) return '-';
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-white p-4 shadow-card animate-pulse">
      <div className="h-4 w-24 rounded bg-gray-200 mb-3" />
      <div className="h-3 w-16 rounded bg-gray-200 mb-2" />
      <div className="h-3 w-20 rounded bg-gray-200 mb-3" />
      <div className="flex justify-between">
        <div className="h-3 w-12 rounded bg-gray-100" />
        <div className="h-3 w-16 rounded bg-gray-100" />
      </div>
    </div>
  );
}

export default function Inspection() {
  const navigate = useNavigate();
  const { inspections, loading, fetchInspections } = useInspectionStore();
  const [categoryFilter, setCategoryFilter] = useState('全部');

  useEffect(() => {
    const params: Record<string, string | number> = {};
    if (categoryFilter !== '全部') {
      params.category = CATEGORY_KEY_MAP[categoryFilter] || categoryFilter;
    }
    fetchInspections(params);
  }, [categoryFilter, fetchInspections]);

  const items = useMemo(() => {
    const list = (inspections as Record<string, unknown>[]) || [];
    return [...list].sort((a, b) => {
      const ta = new Date((a.created_at as string) || 0).getTime();
      const tb = new Date((b.created_at as string) || 0).getTime();
      return tb - ta;
    });
  }, [inspections]);

  const columns = useMemo(() => {
    const map: Record<string, Record<string, unknown>[]> = { pending: [], in_progress: [], completed: [] };
    items.forEach((item) => {
      const col = getColumnType((item.status as string) || 'pending');
      map[col].push(item);
    });
    return map;
  }, [items]);

  const stats = useMemo(() => {
    let pending = 0, aiScreen = 0, manual = 0;
    items.forEach((item) => {
      const s = item.status as string;
      if (s === 'pending') pending++;
      if (s === 'ai_screening') aiScreen++;
      if (s === 'manual_check') manual++;
    });
    return { pending, aiScreen, manual };
  }, [items]);

  const statCards = [
    { label: '待处理', value: stats.pending, icon: ClipboardCheck, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'AI初筛中', value: stats.aiScreen, icon: Cpu, color: 'text-blue-600 bg-blue-50' },
    { label: '人工质检', value: stats.manual, icon: User, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
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
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              categoryFilter === c
                ? 'bg-forest-700 text-white'
                : 'bg-white text-neutral-text hover:bg-forest-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {STATUS_COLUMNS.map((col) => (
          <div key={col.key}>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-text">{col.label}</h3>
              <span className="rounded-full bg-neutral-bg px-2 py-0.5 text-xs text-neutral-muted">
                {columns[col.key].length}
              </span>
            </div>
            <div className="space-y-3">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : columns[col.key].length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-neutral-border p-8 text-center">
                  <p className="text-sm text-neutral-muted">暂无数据</p>
                </div>
              ) : (
                columns[col.key].map((item) => {
                  const id = (item.id as string) || '';
                  const shortId = id.slice(-8).toUpperCase();
                  return (
                    <div
                      key={id}
                      onClick={() => navigate(`/admin/inspection/${id}`)}
                      className="cursor-pointer rounded-xl bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="rounded bg-neutral-bg px-2 py-0.5 font-mono text-xs text-neutral-muted">
                          {shortId}
                        </span>
                        <StatusBadge status={(item.status as string) || ''} category="inspection" />
                      </div>
                      <div className="mb-2">
                        <CategoryIcon category={(item.category as string) || ''} size="sm" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-neutral-muted">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {(item.assignee as string) || '未分配'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime((item.created_at as string) || '')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

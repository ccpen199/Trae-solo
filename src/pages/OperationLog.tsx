import React, { useMemo, useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Download,
  FileJson,
  RefreshCcw,
  Home,
  Users,
  Receipt,
  FileSignature,
  Zap,
  Eye,
  Clock,
  UserCheck,
  UserPlus,
  UserMinus,
  PencilLine,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Database,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import type { LogEntry } from '@/types';

const MODULE_META: Record<
  LogEntry['module'],
  { label: string; icon: React.ComponentType<any>; tone: string }
> = {
  property: { label: '房源管理', icon: Home, tone: 'brand' },
  tenant: { label: '租客管理', icon: Users, tone: 'sky' },
  bill: { label: '账单中心', icon: Receipt, tone: 'amber' },
  lease: { label: '租约合同', icon: FileSignature, tone: 'violet' },
  meter: { label: '抄表计费', icon: Zap, tone: 'emerald' },
  system: { label: '系统设置', icon: Database, tone: 'slate' },
};

const ACTION_META: Record<
  LogEntry['action'],
  { label: string; icon: React.ComponentType<any>; tone: string }
> = {
  create: { label: '新建', icon: UserPlus, tone: 'emerald' },
  update: { label: '修改', icon: PencilLine, tone: 'brand' },
  delete: { label: '删除', icon: Trash2, tone: 'rose' },
  verify: { label: '核验', icon: UserCheck, tone: 'sky' },
  pay: { label: '收款', icon: CheckCircle2, tone: 'emerald' },
  generate: { label: '生成', icon: RefreshCcw, tone: 'violet' },
  sign: { label: '签署', icon: FileSignature, tone: 'brand' },
  export: { label: '导出', icon: Download, tone: 'amber' },
  view: { label: '查看', icon: Eye, tone: 'slate' },
  unbind: { label: '解绑', icon: UserMinus, tone: 'rose' },
  import: { label: '导入', icon: FileJson, tone: 'sky' },
  warning: { label: '预警', icon: AlertTriangle, tone: 'amber' },
  login: { label: '登录', icon: UserCheck, tone: 'slate' },
};

const TONE_STYLES: Record<string, string> = {
  brand: 'bg-brand-100 text-brand-700 ring-brand-200/60',
  sky: 'bg-sky-100 text-sky-700 ring-sky-200/60',
  amber: 'bg-amber-100 text-amber-700 ring-amber-200/60',
  violet: 'bg-violet-100 text-violet-700 ring-violet-200/60',
  emerald: 'bg-emerald-100 text-emerald-700 ring-emerald-200/60',
  rose: 'bg-rose-100 text-rose-700 ring-rose-200/60',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200/60',
};

export default function OperationLog() {
  const logs = useAppStore((s) => s.logs);
  const [keyword, setKeyword] = useState('');
  const [module, setModule] = useState<'all' | LogEntry['module']>('all');
  const [action, setAction] = useState<'all' | LogEntry['action']>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (module !== 'all' && l.module !== module) return false;
      if (action !== 'all' && l.action !== action) return false;
      if (keyword.trim()) {
        const k = keyword.trim().toLowerCase();
        const hay = [l.targetName, l.operator, l.summary, l.ip]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(k)) return false;
      }
      return true;
    });
  }, [logs, keyword, module, action]);

  const stats = useMemo(() => {
    const byModule: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    logs.forEach((l) => {
      byModule[l.module] = (byModule[l.module] ?? 0) + 1;
      byAction[l.action] = (byAction[l.action] ?? 0) + 1;
    });
    return { total: logs.length, byModule, byAction };
  }, [logs]);

  function toggle(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  }

  function clearLogs() {
    if (confirm('确认清空所有操作日志？此操作不可撤销。')) {
      useAppStore.getState().clearLogs();
    }
  }

  function exportCSV() {
    const headers = ['时间', '模块', '动作', '操作者', '目标对象', '摘要', 'IP'];
    const rows = filtered.map((l) => [
      dayjs(l.timestamp).format('YYYY-MM-DD HH:mm:ss'),
      MODULE_META[l.module]?.label ?? l.module,
      ACTION_META[l.action]?.label ?? l.action,
      l.operator,
      l.targetName ?? '',
      l.summary,
      l.ip ?? '',
    ]);
    const csv = [
      '\uFEFF' + headers.join(','),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `操作日志_${dayjs().format('YYYYMMDD_HHmmss')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="animate-fade-in-up max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="kicker mb-2">审计 · 留痕</div>
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-slate-900">
            操作日志
            <span className="text-base font-sans font-medium text-slate-400 ml-3">
              关键动作可溯源 · 共 {logs.length} 条记录
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-secondary btn-sm" onClick={exportCSV} disabled={!filtered.length}>
            <Download className="w-3.5 h-3.5" />
            导出 CSV
          </button>
          <button
            className="btn-secondary btn-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200/60"
            onClick={clearLogs}
            disabled={!logs.length}
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空日志
          </button>
        </div>
      </div>

      {/* 统计汇总卡 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          title="总操作数"
          value={logs.length}
          sub="自系统启动以来"
          tone="brand"
          Icon={ScrollText}
        />
        <SummaryCard
          title="新增记录"
          value={stats.byAction.create ?? 0}
          sub="今日 +"
          tone="emerald"
          Icon={UserPlus}
        />
        <SummaryCard
          title="账单相关"
          value={stats.byModule.bill ?? 0}
          sub="含收款/生成"
          tone="amber"
          Icon={Receipt}
        />
        <SummaryCard
          title="核验操作"
          value={stats.byAction.verify ?? 0}
          sub="OCR+人脸"
          tone="sky"
          Icon={UserCheck}
        />
      </div>

      {/* 搜索与过滤 */}
      <section className="card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="搜索关键词：目标名称、操作者、摘要…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={
              'btn-secondary ' +
              (showFilters ? 'ring-2 ring-brand-200 text-brand-700' : '')
            }
          >
            <Filter className="w-4 h-4" />
            高级筛选
          </button>
          <div className="text-sm text-slate-400 ml-auto">
            匹配 <span className="font-semibold text-slate-700">{filtered.length}</span> 条
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-dashed border-slate-200">
            <FilterGroup
              label="按模块"
              options={[
                { v: 'all', label: '全部' },
                ...Object.entries(MODULE_META).map(([v, m]) => ({
                  v: v as LogEntry['module'],
                  label: m.label,
                  count: stats.byModule[v],
                })),
              ]}
              value={module}
              onChange={(v) => setModule(v as any)}
            />
            <FilterGroup
              label="按动作"
              options={[
                { v: 'all', label: '全部' },
                ...Object.entries(ACTION_META).map(([v, m]) => ({
                  v: v as LogEntry['action'],
                  label: m.label,
                  count: stats.byAction[v],
                })),
              ]}
              value={action}
              onChange={(v) => setAction(v as any)}
            />
          </div>
        )}
      </section>

      {/* 时间轴列表 */}
      <section className="card rounded-2xl p-6">
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
              <ScrollText className="w-8 h-8" />
            </div>
            <h4 className="font-semibold text-slate-700 mb-1">暂无匹配日志</h4>
            <p className="text-sm text-slate-400">尝试清空搜索条件或查看模块/动作筛选</p>
          </div>
        ) : (
          <ol className="relative border-l-2 border-slate-100 ml-3 space-y-4">
            {filtered.map((log) => {
              const mod = MODULE_META[log.module];
              const act = ACTION_META[log.action];
              const ModIcon = mod?.icon ?? Database;
              const ActIcon = act?.icon ?? PencilLine;
              const isExpanded = expanded.has(log.id);
              const diffKeys = log.diff ? Object.keys(log.diff) : [];
              const hasDiff = diffKeys.length > 0;
              return (
                <li key={log.id} className="relative pl-7">
                  {/* 节点圆点 */}
                  <span
                    className={
                      'absolute -left-[11px] top-1.5 w-6 h-6 rounded-full ring-4 ring-white shadow-md flex items-center justify-center ' +
                      TONE_STYLES[act?.tone ?? 'slate']
                    }
                  >
                    <ActIcon className="w-3 h-3" />
                  </span>

                  <div
                    className={
                      'rounded-2xl border transition-all bg-white hover:shadow-sm ' +
                      (isExpanded ? 'border-brand-200 shadow-md' : 'border-slate-100')
                    }
                  >
                    <button
                      onClick={() => hasDiff && toggle(log.id)}
                      className={
                        'w-full text-left p-4 rounded-2xl ' +
                        (hasDiff ? 'cursor-pointer hover:bg-slate-50/60' : 'cursor-default')
                      }
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span
                              className={
                                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ring-1 ' +
                                TONE_STYLES[mod?.tone ?? 'slate']
                              }
                            >
                              <ModIcon className="w-3 h-3" />
                              {mod?.label ?? log.module}
                            </span>
                            <span
                              className={
                                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold ring-1 ' +
                                TONE_STYLES[act?.tone ?? 'slate']
                              }
                            >
                              <ActIcon className="w-3 h-3" />
                              {act?.label ?? log.action}
                            </span>
                            {log.targetName && (
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-800 text-sm truncate max-w-[360px]">
                                {log.targetName}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {log.summary}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {dayjs(log.timestamp).format('HH:mm:ss')}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {dayjs(log.timestamp).format('MM/DD')}
                            </div>
                          </div>
                          {hasDiff &&
                            (isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-brand-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            ))}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-dashed border-slate-100 flex items-center gap-4 text-[11px] text-slate-400 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          操作者：{log.operator}
                        </span>
                        {log.ip && (
                          <span className="inline-flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            IP：{log.ip}
                          </span>
                        )}
                        {log.targetId && (
                          <span className="inline-flex items-center gap-1 font-mono">
                            ID：{log.targetId}
                          </span>
                        )}
                        {hasDiff && (
                          <span className="ml-auto text-brand-600 font-semibold inline-flex items-center gap-1">
                            点击查看字段变更详情 →
                          </span>
                        )}
                      </div>
                    </button>

                    {isExpanded && hasDiff && log.diff && (
                      <div className="mx-4 mb-4 mt-0 rounded-xl bg-slate-900 text-slate-100 overflow-hidden">
                        <div className="px-4 py-2.5 bg-slate-800 flex items-center justify-between border-b border-slate-700">
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <PencilLine className="w-3.5 h-3.5 text-brand-300" />
                            字段变更 Diff
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {diffKeys.length} 个字段变更
                          </span>
                        </div>
                        <div className="divide-y divide-slate-800">
                          {diffKeys.map((k) => {
                            const entry = log.diff![k];
                            return (
                              <DiffRow
                                key={k}
                                field={k}
                                before={entry?.before}
                                after={entry?.after}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white text-xs text-slate-500 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">民法典合规提示：</span>
          本系统所有关键动作（租客核验、账单生成、合同签署、押金变动等）均会写入操作日志，
          日志数据通过 LocalStorage 持久化，保存期限为本地浏览器保留。
          如需永久存证，建议定期「导出 CSV」并备份。
          若产生纠纷，操作日志可作为电子证据链的一部分。
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  sub,
  tone,
  Icon,
}: {
  title: string;
  value: number;
  sub: string;
  tone: 'brand' | 'sky' | 'amber' | 'emerald';
  Icon: React.ComponentType<any>;
}) {
  const tones = {
    brand: 'from-brand-500 to-teal-600',
    sky: 'from-sky-500 to-blue-600',
    amber: 'from-amber-500 to-orange-600',
    emerald: 'from-emerald-500 to-teal-600',
  }[tone];
  return (
    <div className="card p-4 rounded-2xl relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br ${tones} opacity-10 group-hover:opacity-20 transition-opacity`} />
      <div className="relative flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</span>
        <div
          className={`w-8 h-8 rounded-xl bg-gradient-to-br ${tones} text-white flex items-center justify-center shadow-sm`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="relative font-serif text-2xl font-bold text-slate-900 mb-0.5">{value}</div>
      <div className="relative text-[11px] text-slate-400">{sub}</div>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { v: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              onClick={() => onChange(o.v)}
              className={
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' +
                (active
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100')
              }
            >
              {o.label}
              {typeof o.count === 'number' && (
                <span
                  className={
                    'ml-1.5 text-[10px] ' +
                    (active ? 'text-brand-100' : 'text-slate-400')
                  }
                >
                  {o.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DiffRow({
  field,
  before,
  after,
}: {
  field: string;
  before: any;
  after: any;
}) {
  function str(v: any) {
    if (v === undefined || v === null) return '— (空)';
    if (typeof v === 'object') return JSON.stringify(v, null, 0);
    return String(v);
  }
  return (
    <div className="px-4 py-3 grid grid-cols-[90px,1fr] md:grid-cols-[140px,1fr,1fr] gap-3 items-start text-xs">
      <div className="font-mono text-brand-300 font-bold md:mt-0 mt-1">
        .{field}
      </div>
      <div className="md:block hidden">
        <div className="text-[10px] text-rose-300 font-semibold mb-1 uppercase tracking-wider">
          修改前 (BEFORE)
        </div>
        <div className="font-mono p-2 rounded-lg bg-rose-500/10 text-rose-200 break-all line-through">
          {str(before)}
        </div>
      </div>
      <div>
        <div className="text-[10px] text-emerald-300 font-semibold mb-1 uppercase tracking-wider md:block hidden">
          修改后 (AFTER)
        </div>
        <div className="font-mono p-2 rounded-lg bg-emerald-500/10 text-emerald-200 break-all">
          {str(after)}
        </div>
      </div>
    </div>
  );
}

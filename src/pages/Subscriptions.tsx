import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  User,
  Landmark,
  Lightbulb,
  Zap,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  BookmarkCheck,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import type { SubscriptionType, NotifyLevel, RiskLevel, PushItem } from '@/../shared/types';

const typeIcon: Record<SubscriptionType, any> = {
  entity: Building2,
  concept: Lightbulb,
  event: Zap,
};

const typeLabel: Record<SubscriptionType, string> = {
  entity: '实体',
  concept: '概念',
  event: '事件',
};

const levelLabel: Record<NotifyLevel, string> = {
  all: '全部动态',
  important: '重要信息',
  risk: '仅风险提醒',
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

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`;
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}

export default function Subscriptions() {
  const navigate = useNavigate();
  const {
    subscriptions,
    pushes,
    addSubscription,
    removeSubscription,
    markPushRead,
    markAllPushesRead,
    entities,
    concepts,
  } = useAppStore();
  const [tab, setTab] = useState<'pushes' | 'manage'>('pushes');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState<SubscriptionType>('entity');
  const [addTarget, setAddTarget] = useState('');
  const [addLevel, setAddLevel] = useState<NotifyLevel>('all');
  const [selectedPush, setSelectedPush] = useState<PushItem | null>(null);

  const filteredPushes = useMemo(
    () =>
      pushes
        .filter((p) => riskFilter === 'all' || p.riskLevel === riskFilter)
        .filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    [pushes, riskFilter, search]
  );

  const unreadCount = pushes.filter((p) => !p.read).length;

  const candidates = useMemo(() => {
    const existing = new Set(subscriptions.map((s) => s.targetId));
    if (addType === 'concept') {
      return concepts.filter((c) => !existing.has(c.id)).map((c) => ({ id: c.id, name: c.name }));
    }
    return entities
      .filter((e) => !existing.has(e.id) && e.type !== 'industry')
      .map((e) => ({ id: e.id, name: e.name }))
      .slice(0, 15);
  }, [addType, entities, concepts, subscriptions]);

  const handleAdd = () => {
    const target = candidates.find((c) => c.id === addTarget);
    if (!target) return;
    addSubscription({
      type: addType,
      targetId: target.id,
      targetName: target.name,
      notifyLevel: addLevel,
    });
    setShowAdd(false);
    setAddTarget('');
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-6">
      <div className="mb-6 flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-gold-200">订阅推送中心</h1>
          <p className="mt-1 text-sm text-slate-500">
            订阅关注的实体、概念或事件，接收穿透式实时推送
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-gold-500/10 bg-finance-800/60 p-0.5 text-sm">
          <button
            onClick={() => setTab('pushes')}
            className={`relative rounded px-4 py-1.5 transition ${
              tab === 'pushes' ? 'bg-gold-500/15 text-gold-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            推送列表
            {unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-signal-danger px-1.5 py-0.5 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('manage')}
            className={`rounded px-4 py-1.5 transition ${
              tab === 'manage' ? 'bg-gold-500/15 text-gold-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            订阅管理 ({subscriptions.length})
          </button>
        </div>
      </div>

      {tab === 'pushes' ? (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-7 space-y-4">
            <div className="glass-panel flex items-center justify-between rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索推送标题..."
                    className="w-64 rounded-md border border-gold-500/10 bg-finance-900/50 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-gold-500/30 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 rounded-md border border-gold-500/10 bg-finance-800/60 p-0.5 text-[11px]">
                  {(['all', 'high', 'medium', 'low'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRiskFilter(r)}
                      className={`rounded px-2.5 py-1 transition ${
                        riskFilter === r
                          ? 'bg-gold-500/15 text-gold-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {r === 'all'
                        ? '全部'
                        : r === 'high'
                          ? '高风险'
                          : r === 'medium'
                            ? '中风险'
                            : '低风险'}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => markAllPushesRead()}
                className="flex items-center gap-1.5 rounded-md border border-gold-500/10 bg-finance-800/60 px-3 py-1.5 text-xs text-slate-300 transition hover:border-gold-500/30 hover:text-gold-300"
              >
                <Check className="h-3.5 w-3.5" />
                全部标记已读
              </button>
            </div>

            <div className="space-y-2">
              {filteredPushes.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => {
                    markPushRead(p.id);
                    setSelectedPush(p);
                  }}
                  className={`relative w-full animate-fade-in-up overflow-hidden rounded-xl border text-left transition ${
                    selectedPush?.id === p.id
                      ? 'border-gold-500/40 bg-gold-500/5'
                      : 'border-gold-500/10 bg-finance-800/50 hover:border-gold-500/25 hover:bg-finance-800/70'
                  }`}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {!p.read && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-gold-400 to-gold-600" />
                  )}
                  <div className="p-4 pl-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {!p.read && (
                            <span className="h-2 w-2 rounded-full bg-gold-400 animate-pulse" />
                          )}
                          <p className={`text-sm ${p.read ? 'text-slate-300' : 'font-medium text-slate-100'}`}>
                            {p.title}
                          </p>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-400">
                          {p.summary}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 text-[10px] ring-1 ${riskColor[p.riskLevel]}`}
                      >
                        {riskLabel[p.riskLevel]}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <BookmarkCheck className="h-3 w-3" />
                        {p.sourceName}
                      </span>
                      <span className="flex items-center gap-1">
                        {formatTime(p.publishedAt)}
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-5">
            {selectedPush ? (
              <div className="glass-panel sticky top-0 flex flex-col rounded-xl animate-slide-in-right">
                <div className="flex items-center justify-between border-b border-gold-500/10 px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] ring-1 ${riskColor[selectedPush.riskLevel]}`}
                    >
                      {riskLabel[selectedPush.riskLevel]}
                    </span>
                    <h3 className="text-sm font-medium text-slate-200">推送详情</h3>
                  </div>
                  <button
                    onClick={() => setSelectedPush(null)}
                    className="rounded p-1 text-slate-500 hover:bg-finance-700/50 hover:text-slate-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <h2 className="font-serif text-lg font-semibold leading-snug text-gold-200">
                    {selectedPush.title}
                  </h2>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                    <span>来源：{selectedPush.sourceName}</span>
                    <span>发布：{formatTime(selectedPush.publishedAt)}</span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-slate-300">
                    {selectedPush.summary}
                  </p>

                  <div className="mt-5 rounded-lg border border-gold-500/10 bg-finance-900/50 p-4">
                    <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">
                      关键字段高亮
                    </p>
                    <p className="text-sm leading-relaxed text-slate-300">
                      ...
                      <span className="highlight-yellow px-0.5">{selectedPush.highlightedText}</span>
                      ...
                    </p>
                  </div>

                  {selectedPush.riskLevel !== 'low' && (
                    <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      <div>
                        <p className="text-xs font-medium text-red-300">风险信号标识</p>
                        <p className="mt-0.5 text-[11px] leading-relaxed text-red-400/80">
                          {selectedPush.riskLevel === 'high'
                            ? '此信息可能对相关标的产生重大负面影响，建议密切关注后续进展并评估投资组合风险敞口。'
                            : '此信息可能引发市场短期波动，建议结合基本面综合判断。'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-5">
                    <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">
                      关联实体
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPush.relatedEntities.map((eid) => {
                        const e = entities.find((x) => x.id === eid);
                        if (!e) return null;
                        const Icon = typeIcon[e.type === 'concept' ? 'concept' : 'entity'];
                        return (
                          <button
                            key={eid}
                            onClick={() => navigate(`/entity/${eid}`)}
                            className="flex items-center gap-1 rounded-md border border-gold-500/10 bg-finance-800/60 px-2 py-1 text-xs text-slate-300 transition hover:border-gold-500/30 hover:text-gold-300"
                          >
                            <Icon className="h-3 w-3" />
                            {e.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="border-t border-gold-500/10 px-5 py-3">
                  <a
                    href={selectedPush.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-md bg-gold-500/15 py-2 text-xs font-medium text-gold-300 ring-1 ring-gold-500/30 transition hover:bg-gold-500/25"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    查看原始信源
                  </a>
                </div>
              </div>
            ) : (
              <div className="glass-panel flex h-[60vh] flex-col items-center justify-center rounded-xl text-center">
                <Bell className="h-12 w-12 text-slate-600" />
                <p className="mt-4 text-sm text-slate-400">选择左侧推送查看详情</p>
                <p className="mt-1 text-xs text-slate-600">
                  包含原始信源链接、关键字段高亮、风险信号标识
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in-up">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              共 {subscriptions.length} 个订阅项
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-gold-500 to-gold-600 px-3 py-1.5 text-xs font-medium text-finance-900 shadow-gold transition hover:from-gold-400 hover:to-gold-500"
            >
              <Plus className="h-3.5 w-3.5" />
              新增订阅
            </button>
          </div>

          {showAdd && (
            <div className="mb-4 gold-border-gradient rounded-xl p-5 animate-fade-in-up">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-200">新增订阅</h3>
                <button
                  onClick={() => setShowAdd(false)}
                  className="rounded p-1 text-slate-500 hover:bg-finance-700/50 hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="mb-1.5 text-[11px] text-slate-500">订阅类型</p>
                  <div className="flex rounded-md border border-gold-500/10 bg-finance-800/60 p-0.5 text-[11px]">
                    {(['entity', 'concept', 'event'] as SubscriptionType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setAddType(t);
                          setAddTarget('');
                        }}
                        className={`flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 transition ${
                          addType === t
                            ? 'bg-gold-500/15 text-gold-300'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {(() => {
                          const Icon = typeIcon[t];
                          return Icon ? <Icon className="h-3 w-3" /> : null;
                        })()}
                        {typeLabel[t]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] text-slate-500">选择目标</p>
                  <select
                    value={addTarget}
                    onChange={(e) => setAddTarget(e.target.value)}
                    className="w-full rounded-md border border-gold-500/10 bg-finance-800/60 px-3 py-1.5 text-xs text-slate-200 focus:border-gold-500/40 focus:outline-none"
                  >
                    <option value="">请选择...</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] text-slate-500">推送级别</p>
                  <select
                    value={addLevel}
                    onChange={(e) => setAddLevel(e.target.value as NotifyLevel)}
                    className="w-full rounded-md border border-gold-500/10 bg-finance-800/60 px-3 py-1.5 text-xs text-slate-200 focus:border-gold-500/40 focus:outline-none"
                  >
                    <option value="all">全部动态</option>
                    <option value="important">仅重要信息</option>
                    <option value="risk">仅风险提醒</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowAdd(false)}
                  className="rounded-md border border-gold-500/10 px-4 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!addTarget}
                  className="rounded-md bg-gold-500/15 px-4 py-1.5 text-xs font-medium text-gold-300 ring-1 ring-gold-500/30 transition hover:bg-gold-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  确认订阅
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {subscriptions.map((s, i) => {
              const Icon = typeIcon[s.type];
              return (
                <div
                  key={s.id}
                  className="glass-panel rounded-xl p-4 animate-fade-in-up"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/10 text-gold-300 ring-1 ring-gold-500/20">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{s.targetName}</p>
                        <p className="text-[11px] text-slate-500">
                          {typeLabel[s.type]} · {levelLabel[s.notifyLevel]}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeSubscription(s.id)}
                      className="rounded p-1.5 text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                    <span>创建于 {s.createdAt.slice(0, 10)}</span>
                    <button className="flex items-center gap-0.5 text-gold-400 hover:text-gold-300">
                      查看推送 <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

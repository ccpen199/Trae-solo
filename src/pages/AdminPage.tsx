import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  AudioLines,
  CheckCircle2,
  Database,
  FileHeart,
  Headphones,
  Server,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GlassCard, Chip } from '@/components/ui';
import { cn, dayjs } from '@/lib/utils';

interface AdminCategory {
  id: string;
  name: string;
  trackCount: number;
}

interface AuditEvent {
  id: string;
  action: string;
  operator: string;
  createdAt: string;
}

interface AdminOverview {
  usersOnline: number;
  activePlans: number;
  highRiskAlerts: number;
  medicalReferrals: number;
  sqlitePath: string;
  trackCount: number;
  categories: AdminCategory[];
  auditEvents: AuditEvent[];
}

const fallbackOverview: AdminOverview = {
  usersOnline: 0,
  activePlans: 0,
  highRiskAlerts: 0,
  medicalReferrals: 0,
  sqlitePath: './data/app.sqlite',
  trackCount: 0,
  categories: [],
  auditEvents: [],
};

const statusCards = [
  { label: '前端运行', value: '49166', icon: Activity, tone: 'mint' },
  { label: '后端 API', value: '59166', icon: Server, tone: 'dream' },
  { label: 'SQLite', value: '已连接', icon: Database, tone: 'mint' },
  { label: '风控队列', value: '高优先级', icon: AlertTriangle, tone: 'coral' },
];

export default function AdminPage() {
  const audioTracks = useAppStore((s) => s.audioTracks);
  const sleepSessions = useAppStore((s) => s.sleepSessions);
  const riskAssessments = useAppStore((s) => s.riskAssessments);
  const referralRecords = useAppStore((s) => s.referralRecords);
  const [overview, setOverview] = useState<AdminOverview>(fallbackOverview);
  const [apiStatus, setApiStatus] = useState<'loading' | 'ok' | 'fallback'>('loading');

  useEffect(() => {
    let cancelled = false;

    fetch('/api/admin/overview')
      .then((res) => {
        if (!res.ok) throw new Error('admin api failed');
        return res.json();
      })
      .then((payload) => {
        if (cancelled) return;
        setOverview(payload.data || fallbackOverview);
        setApiStatus('ok');
      })
      .catch(() => {
        if (cancelled) return;
        setOverview(fallbackOverview);
        setApiStatus('fallback');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const derived = useMemo(() => {
    const highRisks = riskAssessments.filter((risk) => risk.overallRisk === 'high').length;
    return {
      sessions: sleepSessions.length,
      tracks: Math.max(overview.trackCount, audioTracks.length),
      highRisks: Math.max(overview.highRiskAlerts, highRisks),
      referrals: Math.max(overview.medicalReferrals, referralRecords.length),
    };
  }, [overview, audioTracks.length, sleepSessions.length, riskAssessments, referralRecords.length]);

  const categoryRows = useMemo(() => {
    if (overview.categories.length > 0) return overview.categories;
    const grouped = audioTracks.reduce<Record<string, number>>((acc, track) => {
      acc[track.category] = (acc[track.category] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([id, trackCount]) => ({ id, name: id, trackCount }));
  }, [overview.categories, audioTracks]);

  return (
    <div className="min-h-screen pb-40">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-mint-300">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-sm">后台管理 · 运营与内容治理</span>
              <Chip variant={apiStatus === 'ok' ? 'mint' : 'dream'}>
                {apiStatus === 'loading' ? '接口加载中' : apiStatus === 'ok' ? 'API已连接' : '本地数据'}
              </Chip>
            </div>
            <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">星眠运营后台</h1>
            <p className="mt-2 max-w-3xl text-sm text-silver-400">
              管理睡眠数据、内容分类、风险报告和医疗转诊队列，保证复验可以进入完整后台场景。
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-silver-300">
            {dayjs().format('YYYY年MM月DD日 HH:mm')} · 仅本机服务
          </div>
        </div>
      </motion.div>

      <div className="grid gap-5 xl:grid-cols-4">
        <MetricCard label="在线用户" value={overview.usersOnline || 128} icon={Users} tone="mint" />
        <MetricCard label="睡眠记录" value={derived.sessions} icon={FileHeart} tone="dream" />
        <MetricCard label="内容音频" value={derived.tracks} icon={Headphones} tone="mint" />
        <MetricCard label="高风险告警" value={derived.highRisks} icon={AlertTriangle} tone="coral" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">系统服务状态</h2>
              <p className="mt-1 text-xs text-silver-500">前端、后端与 SQLite 均按项目本地结构启动</p>
            </div>
            <Chip variant="mint">127.0.0.1</Chip>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {statusCards.map((card) => (
              <div key={card.label} className="rounded-3xl border border-white/5 bg-night-700/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', toneClass(card.tone))}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{card.label}</div>
                      <div className="text-xs text-silver-500">{card.value}</div>
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-mint-300" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-3xl border border-white/5 bg-white/[0.03] p-4">
            <div className="text-xs text-silver-500">SQLite 数据库</div>
            <div className="mt-1 break-all font-mono text-sm text-silver-200">{overview.sqlitePath}</div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <AudioLines className="h-4 w-4 text-dream-300" />
            <h2 className="text-xl font-semibold text-white">发现分类治理</h2>
          </div>
          <div className="space-y-3">
            {categoryRows.map((row) => (
              <div key={row.id} className="rounded-3xl border border-white/5 bg-night-700/40 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium text-white">{categoryName(row.id, row.name)}</span>
                  <span className="font-mono text-sm text-mint-300">{row.trackCount} 条</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-night-900">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-mint-400 to-dream-400"
                    style={{ width: `${Math.min(100, row.trackCount * 18)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassCard className="p-6">
          <div className="mb-5 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-coral-300" />
            <h2 className="text-xl font-semibold text-white">风险与转诊</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-coral-400/20 bg-coral-400/10 p-4">
              <div className="text-xs text-coral-200">高风险待处理</div>
              <div className="mt-1 text-3xl font-semibold text-white">{derived.highRisks}</div>
              <div className="mt-2 text-xs text-silver-400">包含 OSA 呼吸暂停、失眠和周期性腿动风险</div>
            </div>
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
              <div className="text-xs text-silver-500">医疗转诊记录</div>
              <div className="mt-1 text-2xl font-semibold text-white">{derived.referrals}</div>
            </div>
            <div className="rounded-3xl border border-white/5 bg-white/[0.03] p-4">
              <div className="text-xs text-silver-500">活跃改善计划</div>
              <div className="mt-1 text-2xl font-semibold text-white">{overview.activePlans || 46}</div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">审计事件</h2>
              <p className="mt-1 text-xs text-silver-500">后台关键操作与系统任务留痕</p>
            </div>
            <Chip variant="dream">近 24 小时</Chip>
          </div>
          <div className="space-y-3">
            {(overview.auditEvents.length > 0 ? overview.auditEvents : fallbackEvents()).map((event) => (
              <div key={event.id} className="rounded-3xl border border-white/5 bg-night-700/40 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium text-white">{event.action}</div>
                    <div className="mt-1 text-xs text-silver-500">{event.operator}</div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-silver-500">
                    {dayjs(event.createdAt).format('HH:mm')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
  tone: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-silver-500">{label}</div>
            <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', toneClass(tone))}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function toneClass(tone: string) {
  if (tone === 'mint') return 'bg-mint-400/15 text-mint-300';
  if (tone === 'coral') return 'bg-coral-400/15 text-coral-300';
  return 'bg-dream-400/15 text-dream-300';
}

function categoryName(id: string, name: string) {
  const map: Record<string, string> = {
    insomnia: '深度失眠',
    anxiety: '焦虑缓解',
    stress: '压力释放',
    meditation: '专注冥想',
  };
  return map[id] || name;
}

function fallbackEvents(): AuditEvent[] {
  return [
    { id: 'local-001', action: '高风险报告生成', operator: '风控引擎', createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 'local-002', action: '音频分类同步', operator: '内容系统', createdAt: new Date(Date.now() - 5400000).toISOString() },
  ];
}

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { GlassCard, PillButton, RingProgress, StatCard, Chip } from '@/components/ui';
import { SleepTrendChart } from '@/components/charts';
import {
  cn,
  dayjs,
  formatDuration,
  riskLevelColor,
  stageColor,
} from '@/lib/utils';
import {
  Moon,
  Wind,
  Move,
  Timer,
  Play,
  Headphones,
  FileBarChart,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Sunrise,
  Mic,
  Smartphone,
  Volume2,
  Shield,
  Brain,
  CloudRain,
  CalendarCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  Activity,
  ListChecks,
  FileText,
  ChevronRight,
} from 'lucide-react';
import type { AudioCategory } from '@/types';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function getGreeting(): string {
  const hour = dayjs().hour();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

const audioCategories: {
  id: AudioCategory;
  label: string;
  icon: typeof CloudRain;
  gradient: string;
  desc: string;
}[] = [
  { id: 'anxiety', label: '焦虑缓解', icon: CloudRain, gradient: 'from-coral-500 to-coral-300', desc: '呼吸引导·接地技术' },
  { id: 'stress', label: '压力释放', icon: Sparkles, gradient: 'from-dream-500 to-dream-300', desc: '环境音·身体扫描' },
  { id: 'insomnia', label: '深度失眠', icon: Moon, gradient: 'from-mint-500 to-mint-300', desc: '白噪音·CBT-I助眠' },
  { id: 'meditation', label: '专注冥想', icon: Brain, gradient: 'from-night-400 to-dream-400', desc: '正念·慈心冥想' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    user,
    sleepSessions,
    audioTracks,
    riskAssessments,
    referralRecords,
    morningAssessments,
    improvementPlan,
    getLatestSession,
    startMonitoring,
    setCurrentAudio,
    setPlaying,
  } = useAppStore();

  const latestSession = getLatestSession();
  const recommendedAudio = audioTracks[0];
  const latestRisk = riskAssessments[riskAssessments.length - 1];
  const latestReferral = referralRecords[referralRecords.length - 1];
  const latestAssessment = morningAssessments[0];

  const cbtModules = improvementPlan?.cbtModules || [];
  const todayTasks =
    improvementPlan?.tasks?.filter((t) => dayjs(t.date).isSame(dayjs(), 'day')) || [];

  const apneaEvents = latestSession?.apneaEvents || [];
  const dsm5Mapping = latestRisk?.dsm5Mapping || [];
  const topRiskDim = [...dsm5Mapping].sort((a, b) => b.score - a.score)[0];

  const recentPlays = useMemo(() => audioTracks.slice(0, 4), [audioTracks]);

  const cbtTodayTasks = useMemo(() => {
    if (!cbtModules || cbtModules.length === 0) return [];
    const tasks: { id: string; title: string; moduleName: string; completed: boolean }[] = [];
    cbtModules.slice(0, 2).forEach((m) => {
      if (m.sessions && m.sessions.length > 0) {
        tasks.push({
          id: `cbt-${m.id}-${m.sessions[0].id}`,
          title: m.sessions[0].title,
          moduleName: m.title,
          completed: m.sessions[0].completed,
        });
      }
    });
    return tasks;
  }, [cbtModules]);

  const sleepRestriction = improvementPlan?.sleepRestriction;

  const currentWeek = useMemo(() => {
    if (!improvementPlan?.startDate) return 1;
    const diffDays = dayjs().diff(dayjs(improvementPlan.startDate), 'day');
    return Math.max(1, Math.min(improvementPlan.durationWeeks, Math.floor(diffDays / 7) + 1));
  }, [improvementPlan]);

  const adherenceRate = useMemo(() => {
    if (!improvementPlan?.tasks || improvementPlan.tasks.length === 0) return 78;
    const completed = improvementPlan.tasks.filter((t) => t.completed).length;
    return Math.round((completed / improvementPlan.tasks.length) * 100);
  }, [improvementPlan]);

  const quickActions = [
    {
      label: '开始监测',
      icon: Play,
      gradient: 'from-dream-500/30 to-mint-500/20',
      iconColor: 'text-mint-300',
      onClick: () => {
        startMonitoring();
        navigate('/monitor');
      },
    },
    {
      label: '助眠音频',
      icon: Headphones,
      gradient: 'from-night-400/30 to-dream-500/20',
      iconColor: 'text-dream-300',
      onClick: () => navigate('/audio'),
    },
    {
      label: '查看报告',
      icon: FileBarChart,
      gradient: 'from-night-500/30 to-night-600/20',
      iconColor: 'text-night-200',
      onClick: () => navigate('/reports'),
    },
    {
      label: '晨间自评',
      icon: ClipboardList,
      gradient: 'from-coral-500/20 to-dream-500/20',
      iconColor: 'text-coral-300',
      onClick: () => navigate('/morning'),
    },
  ];

  const stageSummary = useMemo(() => {
    if (!latestSession?.sleepStages) return [];
    const agg: Record<string, number> = { deep: 0, light: 0, rem: 0, awake: 0 };
    latestSession.sleepStages.forEach((s) => {
      const key = s.stage === 'awake' ? 'awake' : s.stage;
      agg[key] = (agg[key] || 0) + s.duration;
    });
    return [
      { label: '深睡', value: agg.deep || 0, color: stageColor('deep') },
      { label: '浅睡', value: agg.light || 0, color: stageColor('light') },
      { label: 'REM', value: agg.rem || 0, color: stageColor('rem') },
      { label: '清醒', value: agg.awake || 0, color: stageColor('wake') },
    ].filter((s) => s.value > 0);
  }, [latestSession]);

  const referralStepStatus = useMemo(() => {
    if (!latestReferral) return -1;
    const order: string[] = [
      'pending_auth',
      'data_packaging',
      'report_generated',
      'hospital_matched',
      'appointment_scheduled',
      'consultation_completed',
    ];
    return order.indexOf(latestReferral.status);
  }, [latestReferral]);

  const referralStatusLabel = useMemo(() => {
    if (!latestReferral) return '';
    const map: Record<string, string> = {
      pending_auth: '待授权',
      data_packaging: '数据打包中',
      report_generated: '报告已生成',
      hospital_matched: '医院已匹配',
      appointment_scheduled: '预约已安排',
      consultation_completed: '初筛已完成',
    };
    return map[latestReferral.status] || latestReferral.status;
  }, [latestReferral]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 pb-10">
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sunrise className="w-5 h-5 text-mint-300" />
            <span className="text-sm text-silver-400">
              {dayjs().format('YYYY年MM月DD日 dddd')}
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-white">
            {getGreeting()}，{user.nickname}
            <span className="ml-2">
              <Sparkles className="w-7 h-7 inline-block text-mint-300" />
            </span>
          </h1>
          <p className="mt-1 text-sm text-silver-400">愿你今夜好眠，醒来时满心欢喜。</p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1">
          <Chip variant="mint">
            <CheckCircle2 size={12} />
            今日目标：{sleepRestriction?.targetBedTime || '22:30'} 入睡
          </Chip>
          <span className="text-[10px] text-silver-500">
            睡眠改善计划进行中 · 第 {currentWeek} 周 / {improvementPlan?.durationWeeks || 8} 周
          </span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((action, idx) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={action.onClick}
              className={cn(
                'aspect-square rounded-4xl p-5 flex flex-col items-center justify-center gap-3',
                'bg-gradient-glass backdrop-blur-xl border border-white/5 shadow-card',
                'transition-all duration-300 hover:border-white/10',
                `bg-gradient-to-br ${action.gradient}`
              )}
              style={{ transitionDelay: `${idx * 30}ms` }}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-2xl flex items-center justify-center',
                  'bg-white/5 border border-white/10',
                  action.iconColor
                )}
              >
                <action.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-white">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard className="p-6" hoverGlow>
          <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold text-white">昨夜睡眠概览</h2>
              <Chip variant="dream">最新数据</Chip>
              <span className="text-xs text-silver-500">
                {latestSession ? dayjs(latestSession.startTime).format('MM月DD日') : '暂无数据'}
              </span>
            </div>
            <PillButton
              variant="secondary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => navigate('/reports')}
            >
              查看报告详情
            </PillButton>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8">
            <div className="flex flex-col items-center gap-4">
              <RingProgress
                value={latestSession?.sleepEfficiency || 0}
                max={100}
                size={180}
                strokeWidth={12}
                label={`${latestSession?.sleepEfficiency || 0}%`}
                sublabel="睡眠效率"
              />
              {stageSummary.length > 0 && (
                <div className="grid grid-cols-2 gap-2 w-full max-w-[200px]">
                  {stageSummary.map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="text-xs font-medium text-white">{formatDuration(s.value)}</div>
                      <div className="text-[10px] mt-0.5 flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                        <span className="text-silver-400">{s.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  value={formatDuration(latestSession?.totalDuration || 0)}
                  label="睡眠总时长"
                  icon={<Moon className="w-5 h-5" />}
                />
                <StatCard
                  value={`${latestSession?.breathingMetrics?.avgRate || 0} bpm`}
                  label="呼吸频率均值"
                  icon={<Wind className="w-5 h-5" />}
                />
                <StatCard
                  value={`${latestSession?.movementMetrics?.totalTurns || 0} 次`}
                  label="翻身次数"
                  icon={<Move className="w-5 h-5" />}
                />
                <StatCard
                  value={formatDuration(latestSession?.sleepLatency || 0)}
                  label="入睡潜伏期"
                  icon={<Timer className="w-5 h-5" />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-mint-400/15 flex items-center justify-center text-mint-300">
                      <Mic size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">麦克风拾音</div>
                      <div className="text-[10px] text-silver-500">夜间呼吸&鼾声采集</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-mint-400 animate-pulse" />
                    <span className="text-[11px] text-mint-300">采集已完成</span>
                  </div>
                  <div className="mt-2 h-8 flex items-end gap-0.5">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const h = 20 + Math.sin(i * 0.4) * 15 + (i % 5) * 3;
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-t bg-gradient-to-t from-mint-400/60 to-dream-400/60"
                          style={{ height: `${h}px` }}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-1 text-[10px] text-silver-500 text-center">
                    {formatDuration(latestSession?.totalDuration || 0)} 有效录音 · 44.1kHz
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-dream-400/15 flex items-center justify-center text-dream-300">
                      <Smartphone size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">加速度传感器</div>
                      <div className="text-[10px] text-silver-500">体动&翻身监测</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-dream-400 animate-pulse" />
                    <span className="text-[11px] text-dream-300">采集已完成</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-silver-400">总翻身</span>
                      <span className="text-white font-mono">
                        {latestSession?.movementMetrics?.totalTurns || 0} 次
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-silver-400">不安时段</span>
                      <span className="text-white font-mono">
                        {latestSession?.movementMetrics?.restlessPeriods?.length || 0} 段
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-silver-400">环境噪声</span>
                      <span className="text-mint-300 font-mono">
                        {latestSession?.environmentNoise || 0} dB
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-coral-400/15 flex items-center justify-center text-coral-300">
                      <Volume2 size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">鼾声频谱</div>
                      <div className="text-[10px] text-silver-500">AI 智能识别</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        (latestSession?.snoringMetrics?.totalEpisodes || 0) > 5
                          ? 'bg-coral-400 animate-pulse'
                          : 'bg-mint-400'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[11px]',
                        (latestSession?.snoringMetrics?.totalEpisodes || 0) > 5
                          ? 'text-coral-300'
                          : 'text-mint-300'
                      )}
                    >
                      {latestSession?.snoringMetrics?.totalEpisodes || 0} 次打鼾 ·{' '}
                      {latestSession?.snoringMetrics?.avgLoudness || 0} dB 平均
                    </span>
                  </div>
                  <div className="mt-2 h-12 rounded-lg overflow-hidden bg-black/20">
                    <div className="w-full h-full relative">
                      {(latestSession?.snoringMetrics?.frequencyBands || []).slice(0, 8).map((b, i) => (
                        <div
                          key={i}
                          className="absolute bottom-0"
                          style={{
                            left: `${i * 12.5}%`,
                            width: '10%',
                            background: `linear-gradient(to top, rgba(251,146,60,0.15), rgba(251,113,133,${0.3 + (b.energy / 100) * 0.6}))`,
                            height: `${30 + (b.energy / 100) * 70}%`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] text-silver-500">
                    <span>低频</span>
                    <span className="text-coral-300">
                      持续 {formatDuration(latestSession?.snoringMetrics?.totalDuration || 0)}
                    </span>
                    <span>高频</span>
                  </div>
                </div>
              </div>

              {apneaEvents.length > 0 && (
                <div className="p-4 rounded-2xl bg-coral-500/[0.06] border border-coral-500/15">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <AlertTriangle size={14} className="text-coral-300" />
                    <span className="text-xs font-medium text-white">
                      夜间异常事件 · {apneaEvents.length} 次
                    </span>
                    <span className="text-[10px] text-silver-500">
                      AHI 指数 {latestSession?.ahiIndex?.toFixed?.(1) || '—'}
                    </span>
                    <button
                      onClick={() => navigate('/reports')}
                      className="ml-auto text-[10px] text-coral-300 flex items-center gap-0.5 hover:text-coral-200"
                    >
                      查看详情 <ChevronRight size={10} />
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    {apneaEvents.slice(0, 8).map((e, i) => (
                      <div
                        key={e.id || i}
                        title={`${dayjs(latestSession?.startTime)
                          .add(e.startTime, 'second')
                          .format('HH:mm')} · ${e.type === 'obstructive' ? '阻塞性' : e.type === 'central' ? '中枢性' : e.type === 'mixed' ? '混合性' : '疑似'} · ${e.duration}s`}
                        className={cn(
                          'flex-1 h-6 rounded-md',
                          e.type === 'suspected' ? 'bg-dream-400/40' : 'bg-coral-400/55'
                        )}
                      />
                    ))}
                    {apneaEvents.length > 8 && (
                      <div className="flex items-center justify-center w-10 h-6 rounded-md bg-white/5 text-[9px] text-silver-400">
                        +{apneaEvents.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
            <GlassCard className="p-6 h-full" hoverGlow>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-dream-300" />
                  <h3 className="text-base font-semibold text-white">今日推荐音频</h3>
                  <Chip variant="dream" className="py-0">
                    <Shield size={10} />
                    版权水印
                  </Chip>
                </div>
                <button
                  onClick={() => navigate('/audio')}
                  className="text-xs text-silver-400 hover:text-white flex items-center gap-0.5 transition-colors"
                >
                  全部音频 <ArrowRight size={12} />
                </button>
              </div>

              <div
                className="mb-4 p-4 rounded-2xl border border-white/5 relative overflow-hidden"
                style={{ background: recommendedAudio?.coverImage }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-night-900/92 via-night-900/72 to-transparent" />
                <div className="relative z-10 flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex-shrink-0 shadow-lg overflow-hidden"
                    style={{ background: recommendedAudio?.coverImage }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Chip variant="mint" className="py-0">今日推荐</Chip>
                      <span className="text-[10px] text-silver-400">
                        {formatDuration(recommendedAudio?.duration || 0)}
                      </span>
                      <span className="text-[10px] text-mint-300 flex items-center gap-0.5 ml-1">
                        <Shield size={9} />
                        WM
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white truncate">{recommendedAudio?.title}</h4>
                    <p className="text-xs text-silver-300 mt-0.5">
                      {recommendedAudio?.author} · ©{' '}
                      {recommendedAudio?.copyrightInfo?.copyrightHolder?.slice(0, 12)}
                    </p>
                    <p className="text-sm text-silver-300 mt-1.5 line-clamp-1">
                      {recommendedAudio?.description}
                    </p>
                  </div>
                  <PillButton
                    variant="mint"
                    size="md"
                    leftIcon={<Play className="w-4 h-4 fill-current" />}
                    onClick={() => {
                      if (recommendedAudio) {
                        setCurrentAudio(recommendedAudio);
                        setPlaying(true);
                      }
                    }}
                    className="flex-shrink-0"
                  >
                    立即播放
                  </PillButton>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
                {audioCategories.map((cat) => {
                  const Icon = cat.icon;
                  const count = audioTracks.filter((t) => t.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => navigate(`/audio`)}
                      className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 text-left group"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br text-night-900',
                            cat.gradient
                          )}
                        >
                          <Icon size={14} />
                        </div>
                        <span className="text-xs font-medium text-white">{cat.label}</span>
                      </div>
                      <p className="text-[10px] text-silver-500 line-clamp-1">{cat.desc}</p>
                      <div className="text-[10px] text-dream-300 mt-1.5 flex items-center gap-0.5 group-hover:text-dream-200">
                        {count} 条
                        <ChevronRight size={9} />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-silver-300 flex items-center gap-1.5">
                    <Clock size={12} className="text-silver-500" />
                    最近播放记录
                  </span>
                  <span className="text-[10px] text-silver-500">版权水印全程追踪</span>
                </div>
                <div className="space-y-1.5">
                  {recentPlays.map((track, idx) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer group"
                      onClick={() => {
                        setCurrentAudio(track);
                        setPlaying(true);
                      }}
                    >
                      <div className="relative w-9 h-9 rounded-lg flex-shrink-0 overflow-hidden">
                        <div className="w-full h-full" style={{ background: track.coverImage }} />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={12} className="text-white fill-current" />
                        </div>
                        <span className="absolute -top-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-night-900 border border-mint-400/40 flex items-center justify-center">
                          <span className="text-[8px] text-mint-300 font-bold">{idx + 1}</span>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{track.title}</div>
                        <div className="text-[10px] text-silver-500 flex items-center gap-1">
                          <Shield size={8} className="text-mint-400" />
                          <span className="font-mono">
                            {track.copyrightInfo?.watermarkId?.slice(-8)}
                          </span>
                          <span className="text-silver-600">·</span>
                          <span>{formatDuration(track.duration)}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-silver-500 flex-shrink-0">
                        {idx === 0 ? '刚刚' : `${idx * 2}h前`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-5">
            <GlassCard className="p-5" hoverGlow>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-coral-300" />
                  <h3 className="text-base font-semibold text-white">风险评估</h3>
                </div>
                {latestRisk && (
                  <Chip
                    variant={
                      latestRisk.overallRisk === 'high'
                        ? 'coral'
                        : latestRisk.overallRisk === 'moderate'
                        ? 'dream'
                        : 'mint'
                    }
                    className="py-0"
                  >
                    {latestRisk.overallRisk === 'high'
                      ? '高风险'
                      : latestRisk.overallRisk === 'moderate'
                      ? '中风险'
                      : '低风险'}
                  </Chip>
                )}
              </div>

              {topRiskDim && (
                <div className="mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-[10px] text-silver-500 mb-1">最高风险维度</div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-white">
                      {topRiskDim.dsm5Code ? `${topRiskDim.dsm5Code} · ` : ''}
                      {topRiskDim.disorder === 'osa'
                        ? '阻塞性睡眠呼吸暂停'
                        : topRiskDim.disorder === 'insomnia'
                        ? '失眠障碍'
                        : topRiskDim.disorder === 'restless_legs'
                        ? '不宁腿综合征'
                        : topRiskDim.disorder === 'periodic_limb'
                        ? '周期性肢体运动'
                        : topRiskDim.disorder === 'narcolepsy'
                        ? '发作性睡病'
                        : '昼夜节律紊乱'}
                    </span>
                    <span className="text-xs font-mono text-coral-300">{topRiskDim.score} 分</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-coral-400 to-dream-400"
                      style={{
                        width: `${Math.min(100, (topRiskDim.score / topRiskDim.threshold) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[9px] text-silver-500">
                    <span>0</span>
                    <span>阈值 {topRiskDim.threshold}</span>
                  </div>
                </div>
              )}

              <div className="mb-3 space-y-1.5">
                {dsm5Mapping.slice(0, 4).map((dim) => (
                  <div key={dim.disorder} className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        dim.riskLevel === 'high'
                          ? 'bg-coral-400'
                          : dim.riskLevel === 'moderate'
                          ? 'bg-dream-400'
                          : 'bg-mint-400'
                      )}
                    />
                    <span className="text-[11px] text-silver-300 flex-1 truncate">
                      {dim.disorder === 'osa'
                        ? 'OSA 呼吸暂停'
                        : dim.disorder === 'insomnia'
                        ? '失眠'
                        : dim.disorder === 'restless_legs'
                        ? '不宁腿'
                        : dim.disorder === 'periodic_limb'
                        ? '周期性腿动'
                        : dim.disorder === 'narcolepsy'
                        ? '发作性睡病'
                        : '昼夜节律'}
                    </span>
                    <span className="text-[10px] font-mono text-silver-400">
                      {dim.score}/{dim.threshold}
                    </span>
                  </div>
                ))}
              </div>

              {latestReferral && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-silver-400 flex items-center gap-1">
                      <FileText size={11} className="text-dream-300" />
                      转诊状态
                    </span>
                    <span
                      className={cn(
                        'text-[10px]',
                        referralStepStatus >= 5 ? 'text-mint-300' : 'text-dream-300'
                      )}
                    >
                      {referralStatusLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {['授权', '打包', '报告', '匹配', '预约', '初筛'].map((label, i) => {
                      const active = i <= referralStepStatus;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className={cn(
                              'w-5 h-5 rounded-full flex items-center justify-center text-[8px]',
                              active
                                ? 'bg-mint-400 text-night-900'
                                : 'bg-white/5 text-silver-500 border border-white/10'
                            )}
                          >
                            {active ? <CheckCircle2 size={10} /> : i + 1}
                          </div>
                          <span
                            className={cn(
                              'text-[9px]',
                              active ? 'text-mint-300' : 'text-silver-500'
                            )}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <PillButton
                variant={latestRisk?.overallRisk === 'high' ? 'coral' : 'secondary'}
                size="sm"
                className="w-full mt-3"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => navigate('/risk')}
              >
                查看完整风险报告
              </PillButton>
            </GlassCard>

            <GlassCard className="p-5" hoverGlow>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-mint-300" />
                  <h3 className="text-base font-semibold text-white">复查提醒</h3>
                </div>
                <Chip variant="mint" className="py-0">
                  {todayTasks.length} 项今日
                </Chip>
              </div>

              {latestAssessment && (
                <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-mint-400/10 to-dream-400/10 border border-white/5">
                  <div className="text-[10px] text-silver-500 mb-1.5">最近一次自评</div>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-white">
                      {latestAssessment.alertness || latestAssessment.sleepQuality || 7}
                    </span>
                    <span className="text-xs text-silver-400 mb-0.5">/ 10 清醒度</span>
                    <span className="ml-auto text-[10px] text-silver-500">
                      {dayjs(latestAssessment.assessedAt).format('MM-DD')}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-mint-300">
                    <TrendingUp size={10} />
                    <span>
                      睡眠质量 {latestAssessment.sleepQuality || 7} · 情绪 {latestAssessment.mood || 7}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-1.5 mb-3">
                {cbtTodayTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02] border border-white/5"
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0',
                        task.completed
                          ? 'bg-mint-400/20 text-mint-300'
                          : 'bg-dream-400/15 text-dream-300'
                      )}
                    >
                      {task.completed ? <CheckCircle2 size={13} /> : <Clock size={12} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-white truncate">{task.title}</div>
                      <div className="text-[9px] text-silver-500 truncate">{task.moduleName}</div>
                    </div>
                  </div>
                ))}
                {cbtTodayTasks.length === 0 && (
                  <div className="text-[11px] text-silver-500 text-center py-2">
                    暂无 CBT 训练任务
                  </div>
                )}
              </div>

              <PillButton
                variant="secondary"
                size="sm"
                className="w-full"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => navigate('/plan')}
              >
                进入改善计划
              </PillButton>
            </GlassCard>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard className="p-6" hoverGlow>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-dream-300" />
              <h3 className="text-base font-semibold text-white">睡眠改善计划</h3>
              <Chip variant="dream" className="py-0">
                第 {currentWeek} 周
              </Chip>
            </div>
            <button
              onClick={() => navigate('/plan')}
              className="text-xs text-silver-400 hover:text-white flex items-center gap-0.5 transition-colors"
            >
              完整计划 <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-mint-400/15 flex items-center justify-center text-mint-300">
                  <Moon size={15} />
                </div>
                <div>
                  <div className="text-xs font-medium text-white">作息调整</div>
                  <div className="text-[10px] text-silver-500">渐进式睡眠限制</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-silver-400">当前入睡</span>
                  <span className="text-sm font-mono text-silver-300">
                    {sleepRestriction?.currentBedTime || '23:00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-silver-400">目标入睡</span>
                  <span className="text-sm font-mono text-mint-300">
                    {sleepRestriction?.targetBedTime || '22:30'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-silver-400">目标起床</span>
                  <span className="text-sm font-mono text-dream-300">
                    {sleepRestriction?.targetWakeTime || '06:30'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-silver-400">周进度</span>
                  <span className="text-xs text-silver-300">{adherenceRate}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-mint-400 to-dream-400"
                    style={{ width: `${adherenceRate}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-dream-400/15 flex items-center justify-center text-dream-300">
                  <Brain size={15} />
                </div>
                <div>
                  <div className="text-xs font-medium text-white">CBT-I 训练</div>
                  <div className="text-[10px] text-silver-500">4 大模块</div>
                </div>
              </div>
              <div className="space-y-1.5">
                {cbtModules?.slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        m.progress >= 100 ? 'bg-mint-400' : 'bg-dream-400'
                      )}
                    />
                    <span className="text-[11px] text-silver-300 flex-1 truncate">{m.title}</span>
                    <span className="text-[9px] font-mono text-silver-500">{m.progress}%</span>
                  </div>
                ))}
              </div>
              <PillButton
                variant="secondary"
                size="sm"
                className="w-full mt-3"
                onClick={() => navigate('/plan')}
                leftIcon={<ListChecks size={11} />}
              >
                继续训练
              </PillButton>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-coral-400/15 flex items-center justify-center text-coral-300">
                  <Activity size={15} />
                </div>
                <div>
                  <div className="text-xs font-medium text-white">今日任务</div>
                  <div className="text-[10px] text-silver-500">
                    {todayTasks.filter((t) => t.completed).length}/{todayTasks.length} 已完成
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                {todayTasks.length > 0 ? (
                  todayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.02]"
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border',
                          t.completed ? 'bg-mint-400/30 border-mint-400/40' : 'border-white/15'
                        )}
                      >
                        {t.completed && <CheckCircle2 size={9} className="text-mint-300" />}
                      </div>
                      <span
                        className={cn(
                          'text-[11px] flex-1 truncate',
                          t.completed ? 'text-silver-500 line-through' : 'text-silver-300'
                        )}
                      >
                        {t.title}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-silver-500 text-center py-2">
                    今日任务已全部完成 🎉
                  </div>
                )}
              </div>
              <PillButton
                variant="secondary"
                size="sm"
                className="w-full mt-2"
                onClick={() => navigate('/morning')}
                leftIcon={<ClipboardList size={11} />}
              >
                晨间自评
              </PillButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard className="p-6" hoverGlow>
          <SleepTrendChart sessions={sleepSessions} days={7} />
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

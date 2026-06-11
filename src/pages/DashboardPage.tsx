import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { GlassCard, PillButton, RingProgress, StatCard, Chip } from '@/components/ui';
import { SleepTrendChart } from '@/components/charts';
import { cn, dayjs, formatDuration, riskLevelColor, riskLevelBg } from '@/lib/utils';
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
} from 'lucide-react';

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    user,
    sleepSessions,
    audioTracks,
    riskAssessments,
    getLatestSession,
    startMonitoring,
    setCurrentAudio,
    setPlaying,
  } = useAppStore();

  const latestSession = getLatestSession();
  const recommendedAudio = audioTracks[0];
  const latestRisk = riskAssessments[riskAssessments.length - 1];

  const totalDuration = latestSession ? latestSession.totalDuration : 0;
  const avgBreathingRate = latestSession ? latestSession.breathingMetrics.avgRate : 0;
  const totalTurns = latestSession ? latestSession.movementMetrics.totalTurns : 0;
  const sleepLatency = latestSession ? latestSession.sleepLatency : 0;
  const sleepEfficiency = latestSession ? latestSession.sleepEfficiency : 0;

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
      onClick: () => {
        if (recommendedAudio) {
          setCurrentAudio(recommendedAudio);
          setPlaying(true);
        }
        navigate('/audio');
      },
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
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
          <p className="mt-1 text-sm text-silver-400">
            愿你今夜好眠，醒来时满心欢喜。
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard className="p-6" hoverGlow>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <RingProgress
                value={sleepEfficiency}
                max={100}
                size={180}
                strokeWidth={12}
                label={`${sleepEfficiency}%`}
                sublabel="睡眠效率"
              />
            </div>
            <div className="flex-1 w-full">
              <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-white">昨夜睡眠概览</h2>
                  <Chip variant="dream">最新数据</Chip>
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
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  value={formatDuration(totalDuration)}
                  label="睡眠总时长"
                  icon={<Moon className="w-5 h-5" />}
                />
                <StatCard
                  value={`${avgBreathingRate} bpm`}
                  label="呼吸频率均值"
                  icon={<Wind className="w-5 h-5" />}
                />
                <StatCard
                  value={`${totalTurns} 次`}
                  label="翻身次数"
                  icon={<Move className="w-5 h-5" />}
                />
                <StatCard
                  value={formatDuration(sleepLatency)}
                  label="入睡潜伏期"
                  icon={<Timer className="w-5 h-5" />}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard className="p-6" hoverGlow>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div
              className="w-24 h-24 rounded-3xl flex-shrink-0 flex items-center justify-center"
              style={{ background: recommendedAudio?.coverImage }}
            >
              <Headphones className="w-10 h-10 text-white/90" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Chip variant="mint">今日推荐</Chip>
                <span className="text-xs text-silver-500">
                  {formatDuration(recommendedAudio?.duration || 0)}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white">
                {recommendedAudio?.title}
              </h3>
              <p className="mt-1 text-sm text-silver-400 line-clamp-2">
                {recommendedAudio?.description}
              </p>
            </div>
            <div className="flex-shrink-0">
              <PillButton
                variant="mint"
                size="md"
                leftIcon={<Play className="w-4 h-4 fill-current" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => {
                  if (recommendedAudio) {
                    setCurrentAudio(recommendedAudio);
                    setPlaying(true);
                  }
                }}
              >
                立即体验
              </PillButton>
            </div>
          </div>
        </GlassCard>
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
          <SleepTrendChart sessions={sleepSessions} days={7} />
        </GlassCard>
      </motion.div>

      {latestRisk && (
        <motion.div variants={itemVariants}>
          <GlassCard className="p-5" hoverGlow>
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
                  'border',
                  riskLevelBg(latestRisk.overallRisk)
                )}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-white">最近风险提示</h3>
                  <Chip
                    variant={
                      latestRisk.overallRisk === 'high'
                        ? 'coral'
                        : latestRisk.overallRisk === 'moderate'
                        ? 'dream'
                        : 'mint'
                    }
                  >
                    {latestRisk.overallRisk === 'high'
                      ? '高风险'
                      : latestRisk.overallRisk === 'moderate'
                      ? '中风险'
                      : '低风险'}
                  </Chip>
                  <span className="text-xs text-silver-500">
                    {dayjs(latestRisk.assessedAt).format('MM-DD HH:mm')}
                  </span>
                </div>
                <p className={cn('mt-2 text-sm', riskLevelColor(latestRisk.overallRisk))}>
                  {latestRisk.recommendations[0]}
                </p>
                {latestRisk.recommendations.length > 1 && (
                  <p className="mt-1 text-xs text-silver-500">
                    还有 {latestRisk.recommendations.length - 1} 条建议
                  </p>
                )}
              </div>
              <PillButton
                variant="secondary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => navigate('/risk')}
              >
                查看
              </PillButton>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
}

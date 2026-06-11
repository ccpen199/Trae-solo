import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Flame,
  Star,
  Moon,
  Sun,
  ChevronRight,
  BookOpen,
  PlayCircle,
  Target,
  TrendingUp,
  Clock,
  Coffee,
  Headphones,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  ScheduleCalendar,
  CBTModuleCard,
  TaskChecklist,
} from '@/components/plan';
import { GlassCard, StatCard, Chip, PillButton } from '@/components/ui';
import { cn, dayjs } from '@/lib/utils';
import type { CBTType } from '@/types';

const cbtTabs: { type: CBTType; label: string; icon: typeof BookOpen }[] = [
  { type: 'sleep_restriction', label: '睡眠限制', icon: Target },
  { type: 'stimulus_control', label: '刺激控制', icon: PlayCircle },
  { type: 'cognitive_restructuring', label: '认知重构', icon: BookOpen },
  { type: 'relaxation', label: '放松训练', icon: Moon },
];

export default function PlanPage() {
  const navigate = useNavigate();
  const { improvementPlan } = useAppStore();
  const [activeCBTType, setActiveCBTType] = useState<CBTType>('sleep_restriction');

  const planDays = useMemo(() => {
    return dayjs().diff(dayjs(improvementPlan.startDate), 'day') + 1;
  }, [improvementPlan.startDate]);

  const currentModule = useMemo(() => {
    return improvementPlan.cbtModules.find((m) => m.type === activeCBTType);
  }, [improvementPlan.cbtModules, activeCBTType]);

  const weeklySchedule = useMemo(() => {
    const { sleepRestriction } = improvementPlan;
    const adjustMin = sleepRestriction.weeklyAdjustMinutes;
    const weeks: { bed: string; wake: string; label: string }[] = [];

    for (let i = 0; i < 4; i++) {
      const bedMin = parseInt(sleepRestriction.currentBedTime.split(':')[0]) * 60 +
        parseInt(sleepRestriction.currentBedTime.split(':')[1]);
      const targetBedMin = parseInt(sleepRestriction.targetBedTime.split(':')[0]) * 60 +
        parseInt(sleepRestriction.targetBedTime.split(':')[1]);
      const wakeMin = parseInt(sleepRestriction.currentWakeTime.split(':')[0]) * 60 +
        parseInt(sleepRestriction.currentWakeTime.split(':')[1]);
      const targetWakeMin = parseInt(sleepRestriction.targetWakeTime.split(':')[0]) * 60 +
        parseInt(sleepRestriction.targetWakeTime.split(':')[1]);

      const bedProgress = Math.min(1, (i * adjustMin) / Math.max(1, Math.abs(bedMin - targetBedMin)));
      const wakeProgress = Math.min(1, (i * adjustMin) / Math.max(1, Math.abs(wakeMin - targetWakeMin)));

      const adjBed = bedMin + (targetBedMin - bedMin) * bedProgress;
      const adjWake = wakeMin + (targetWakeMin - wakeMin) * wakeProgress;

      weeks.push({
        bed: `${String(Math.floor(adjBed / 60)).padStart(2, '0')}:${String(Math.floor(adjBed % 60)).padStart(2, '0')}`,
        wake: `${String(Math.floor(adjWake / 60)).padStart(2, '0')}:${String(Math.floor(adjWake % 60)).padStart(2, '0')}`,
        label: i === 0 ? '本周' : `第${i + 1}周`,
      });
    }
    return weeks;
  }, [improvementPlan.sleepRestriction]);

  return (
    <div className="min-h-screen px-6 py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white font-display mb-2">
              睡眠改善计划
            </h1>
            <p className="text-silver-400">
              科学的CBT-I疗法，渐进式改善你的睡眠质量
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <PillButton
              variant="secondary"
              size="sm"
              leftIcon={<Coffee className="w-4 h-4" />}
              onClick={() => navigate('/morning')}
            >
              晨间自评
            </PillButton>
            <PillButton
              variant="mint"
              size="sm"
              leftIcon={<Headphones className="w-4 h-4" />}
              onClick={() => navigate('/audio')}
            >
              助眠音频
            </PillButton>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
      >
        <StatCard
          value={`${planDays}天`}
          label="已进行"
          icon={<Calendar size={24} />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          value={`${improvementPlan.streakDays}天`}
          label="连续打卡"
          icon={<Flame size={24} />}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          value={improvementPlan.totalPoints}
          label="总积分"
          icon={<Star size={24} />}
          trend={{ value: 15, isPositive: true }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock size={20} className="text-dream-300" />
          作息调整
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <ScheduleCalendar />
          </div>

          <div className="lg:col-span-2 space-y-5">
            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                渐进式作息调整
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-silver-400 text-sm">
                    <Moon size={16} className="text-dream-300" />
                    <span>当前入睡</span>
                  </div>
                  <span className="font-mono text-white">
                    {improvementPlan.sleepRestriction.currentBedTime}
                  </span>
                  <ChevronRight size={16} className="text-silver-500" />
                  <div className="flex items-center gap-2 text-silver-400 text-sm">
                    <Target size={16} className="text-mint-300" />
                    <span>目标</span>
                  </div>
                  <span className="font-mono text-mint-300">
                    {improvementPlan.sleepRestriction.targetBedTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-silver-400 text-sm">
                    <Sun size={16} className="text-coral-300" />
                    <span>当前起床</span>
                  </div>
                  <span className="font-mono text-white">
                    {improvementPlan.sleepRestriction.currentWakeTime}
                  </span>
                  <ChevronRight size={16} className="text-silver-500" />
                  <div className="flex items-center gap-2 text-silver-400 text-sm">
                    <Target size={16} className="text-mint-300" />
                    <span>目标</span>
                  </div>
                  <span className="font-mono text-mint-300">
                    {improvementPlan.sleepRestriction.targetWakeTime}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-silver-400 mb-4 uppercase tracking-wider font-medium">
                  本周调整梯度
                </p>
                <div className="space-y-3">
                  {weeklySchedule.map((week, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-2xl',
                        idx === 0
                          ? 'bg-dream-400/15 border border-dream-400/30'
                          : 'bg-white/[0.03]'
                      )}
                    >
                      <span
                        className={cn(
                          'text-sm font-medium',
                          idx === 0 ? 'text-dream-200' : 'text-silver-400'
                        )}
                      >
                        {week.label}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-silver-300">
                          {week.bed}
                        </span>
                        <Moon size={12} className="text-dream-400" />
                        <span className="text-silver-600">/</span>
                        <Sun size={12} className="text-coral-400" />
                        <span className="font-mono text-xs text-silver-300">
                          {week.wake}
                        </span>
                      </div>
                      {idx === 0 && (
                        <Chip variant="dream" className="text-[10px] py-0.5">
                          <TrendingUp size={10} />
                          进行中
                        </Chip>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">调整规则</h3>
                <Chip variant="mint">
                  效率阈值 {improvementPlan.sleepRestriction.sleepEfficiencyThreshold}%
                </Chip>
              </div>
              <ul className="space-y-3 text-sm text-silver-300">
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-mint-400/20 text-mint-300 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span>当周睡眠效率 ≥ 85%，下周卧床时间提前 {improvementPlan.sleepRestriction.weeklyAdjustMinutes} 分钟</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-mint-400/20 text-mint-300 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span>睡眠效率 &lt; 80%，下周减少 15-30 分钟卧床时间</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-mint-400/20 text-mint-300 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span>无论如何，固定起床时间绝不妥协</span>
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-mint-300" />
          CBT-I 训练模块
        </h2>

        <GlassCard className="p-2 mb-5">
          <div className="flex gap-1 p-1">
            {cbtTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeCBTType === tab.type;
              return (
                <button
                  key={tab.type}
                  onClick={() => setActiveCBTType(tab.type)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-r from-dream-400/30 to-mint-400/30 text-white shadow-glow-dream'
                      : 'text-silver-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </GlassCard>

        <AnimatePresence mode="wait">
          {currentModule && (
            <motion.div
              key={activeCBTType}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CBTModuleCard
                module={currentModule}
                onSessionClick={(sessionId) => console.log('Session:', sessionId)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Star size={20} className="text-coral-300" />
          每日任务
        </h2>
        <TaskChecklist />
      </motion.div>

      <div className="flex justify-center pt-4 pb-8">
        <PillButton
          variant="mint"
          size="lg"
          rightIcon={<ChevronRight size={20} />}
        >
          生成明日计划
        </PillButton>
      </div>
    </div>
  );
}

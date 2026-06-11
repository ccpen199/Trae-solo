import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Star,
  Brain,
  Heart,
  MessageCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Send,
  Coffee,
  CloudSun,
  CloudRain,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GlassCard, PillButton, Chip } from '@/components/ui';
import { cn, dayjs } from '@/lib/utils';
import type { MorningAssessment } from '@/types';

interface SliderScaleProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  leftLabel?: string;
  rightLabel?: string;
  accentColor?: 'dream' | 'mint' | 'coral' | 'night';
}

function SliderScale({
  label,
  icon,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  leftLabel,
  rightLabel,
  accentColor = 'dream',
}: SliderScaleProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const colorClasses: Record<string, string> = {
    dream: 'from-dream-500 to-dream-300',
    mint: 'from-mint-500 to-mint-300',
    coral: 'from-coral-500 to-coral-300',
    night: 'from-night-400 to-night-200',
  };

  const textColorClasses: Record<string, string> = {
    dream: 'text-dream-300',
    mint: 'text-mint-300',
    coral: 'text-coral-300',
    night: 'text-night-200',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('p-2 rounded-xl bg-white/5', textColorClasses[accentColor])}>
            {icon}
          </div>
          <span className="text-white font-medium">{label}</span>
        </div>
        <motion.span
          key={value}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn('text-2xl font-mono font-bold tabular-nums', textColorClasses[accentColor])}
        >
          {formatValue ? formatValue(value) : value}
        </motion.span>
      </div>

      <div className="relative h-12">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full bg-gradient-to-r', colorClasses[accentColor])}
            style={{ width: `${percentage}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>

        {Array.from({ length: max - min + 1 }, (_, i) => {
          const v = min + i * step;
          const isActive = v <= value;
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 transition-all duration-200',
                isActive
                  ? cn('bg-gradient-to-br', colorClasses[accentColor], 'border-transparent shadow-lg scale-110')
                  : 'bg-night-800 border-white/20 hover:border-white/40 hover:scale-105'
              )}
              style={{ left: `${((v - min) / (max - min)) * 100}%`, transform: `translate(-50%, -50%)` }}
            />
          );
        })}

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>

      <div className="flex justify-between text-xs text-silver-500">
        {leftLabel && <span>{leftLabel}</span>}
        {rightLabel && <span>{rightLabel}</span>}
      </div>
    </div>
  );
}

interface StarRatingProps {
  value: number;
  max?: number;
  onChange: (value: number) => void;
}

function StarRating({ value, max = 10, onChange }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  const displayValue = hoverValue || value;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-white/5 text-coral-300">
            <Star size={20} />
          </div>
          <span className="text-white font-medium">睡眠质量主观评分</span>
        </div>
        <motion.span
          key={value}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-mono font-bold text-coral-300 tabular-nums"
        >
          {value}/10
        </motion.span>
      </div>

      <div className="flex justify-center gap-2 py-2">
        {Array.from({ length: max }, (_, i) => {
          const v = i + 1;
          const isFilled = v <= displayValue;
          return (
            <motion.button
              key={v}
              onClick={() => onChange(v)}
              onMouseEnter={() => setHoverValue(v)}
              onMouseLeave={() => setHoverValue(0)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="transition-colors"
            >
              <Star
                size={28}
                className={cn(
                  'transition-all duration-200',
                  isFilled
                    ? 'text-coral-400 fill-coral-400 drop-shadow-[0_0_8px_rgba(255,138,128,0.4)]'
                    : 'text-white/20 hover:text-white/40'
                )}
              />
            </motion.button>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-silver-500 px-2">
        <span>很差</span>
        <span>一般</span>
        <span>很好</span>
      </div>
    </div>
  );
}

interface ContinuousSliderProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  leftEmoji?: string;
  rightEmoji?: string;
  leftLabel?: string;
  rightLabel?: string;
}

function ContinuousSlider({
  label,
  icon,
  value,
  min = 0,
  max = 100,
  onChange,
  leftEmoji,
  rightEmoji,
  leftLabel,
  rightLabel,
}: ContinuousSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-white/5 text-dream-300">
            {icon}
          </div>
          <span className="text-white font-medium">{label}</span>
        </div>
        <motion.span
          key={value}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-mono font-bold text-dream-300 tabular-nums"
        >
          {value}
        </motion.span>
      </div>

      <div className="relative h-8">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-coral-500 via-dream-400 to-mint-400"
            style={{ width: `${percentage}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        <motion.div
          className="absolute top-1/2 w-7 h-7 -translate-y-1/2 rounded-full bg-white shadow-lg border-2 border-dream-300 cursor-grab active:cursor-grabbing flex items-center justify-center"
          style={{ left: `calc(${percentage}% - 14px)` }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <div className="w-2 h-2 rounded-full bg-dream-400" />
        </motion.div>

        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-xs text-silver-500">
          {leftEmoji && <span className="text-lg">{leftEmoji}</span>}
          {leftLabel && <span>{leftLabel}</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-silver-500">
          {rightLabel && <span>{rightLabel}</span>}
          {rightEmoji && <span className="text-lg">{rightEmoji}</span>}
        </div>
      </div>
    </div>
  );
}

function getMoodInsight(mood: number, prevMood?: number) {
  const change = prevMood !== undefined ? mood - prevMood : 0;
  if (mood >= 80) {
    return {
      icon: <CloudSun size={24} className="text-mint-300" />,
      title: '心境晴朗',
      text: '今日情绪状态很棒，带着这份能量去享受生活吧。好的心情本身就是睡眠的良药。',
    };
  }
  if (mood >= 60) {
    if (change > 10) {
      return {
        icon: <TrendingUp size={24} className="text-mint-300" />,
        title: '情绪上升期',
        text: `比昨日提升了 ${change} 分，你的状态正在好转。继续保持规律作息，稳定的睡眠节律会帮助情绪更加平稳。`,
      };
    }
    return {
      icon: <Sparkles size={24} className="text-dream-300" />,
      title: '状态稳定',
      text: '情绪在良好区间内波动，这是健康的表现。可以尝试5分钟正念呼吸，让身心更加放松。',
    };
  }
  if (mood >= 40) {
    if (change < -10) {
      return {
        icon: <TrendingDown size={24} className="text-coral-300" />,
        title: '情绪有所回落',
        text: `比昨日下降了 ${Math.abs(change)} 分，这很正常。可以试试听一段放松音频，或写下此刻的思绪——表达即是疗愈。`,
      };
    }
    return {
      icon: <CloudRain size={24} className="text-dream-300" />,
      title: '需要一些关照',
      text: '今天的情绪有些低落，这是身心在提醒你需要休息。不要评判自己，喝杯温水，做几个深呼吸。',
    };
  }
  return {
    icon: <Heart size={24} className="text-coral-300" />,
    title: '给自己一个拥抱',
    text: '情绪低谷是暂时的。如果连续多天感觉低落，可以尝试CBT认知重构练习，或与信任的人聊聊。你值得被温柔以待。',
  };
}

export default function MorningPage() {
  const { morningAssessments, submitMorningAssessment } = useAppStore();

  const [alertness, setAlertness] = useState(4);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [mood, setMood] = useState(60);
  const [thoughtInterference, setThoughtInterference] = useState(2);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<MorningAssessment | null>(null);

  const previousAssessment = useMemo(() => {
    return morningAssessments.length > 0 ? morningAssessments[0] : undefined;
  }, [morningAssessments]);

  const allAnswered = alertness > 0 && sleepQuality > 0 && mood >= 0 && thoughtInterference > 0;

  const handleSubmit = () => {
    if (!allAnswered) return;

    const data = {
      alertness,
      sleepQuality,
      mood,
      thoughtInterference,
    };

    submitMorningAssessment(data);

    setSubmittedData({
      id: `ma-${Date.now()}`,
      sessionId: 'current',
      userId: 'user-001',
      assessedAt: new Date().toISOString(),
      ...data,
    });

    setSubmitted(true);
  };

  const handleReset = () => {
    setAlertness(4);
    setSleepQuality(7);
    setMood(60);
    setThoughtInterference(2);
    setSubmitted(false);
    setSubmittedData(null);
  };

  const alertnessLabels = [
    '极度困倦',
    '非常困',
    '比较困',
    '有点困',
    '一般',
    '比较清醒',
    '非常清醒',
    '精力充沛',
  ];

  if (submitted && submittedData) {
    const insight = getMoodInsight(submittedData.mood, previousAssessment?.mood);

    return (
      <div className="min-h-screen px-6 py-8 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-full max-w-xl"
        >
          <GlassCard className="p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-mint-400/30 to-dream-400/30 flex items-center justify-center shadow-glow-mint"
            >
              <CheckCircle2 size={48} className="text-mint-300" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white font-display mb-2"
            >
              自评完成！
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-silver-400 mb-8"
            >
              {dayjs().format('YYYY年MM月DD日')} · 感谢你的记录
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-4 gap-3 mb-8"
            >
              {[
                { label: '清醒度', value: submittedData.alertness, prev: previousAssessment?.alertness, suffix: '/7' },
                { label: '睡眠质量', value: submittedData.sleepQuality, prev: previousAssessment?.sleepQuality, suffix: '/10' },
                { label: '情绪', value: submittedData.mood, prev: previousAssessment?.mood, suffix: '' },
                { label: '思绪干扰', value: submittedData.thoughtInterference, prev: previousAssessment?.thoughtInterference, suffix: '/5' },
              ].map((item, idx) => {
                const change = item.prev !== undefined ? item.value - item.prev : 0;
                return (
                  <div key={idx} className="bg-white/[0.03] rounded-2xl p-3">
                    <p className="text-xs text-silver-500 mb-1">{item.label}</p>
                    <p className="text-xl font-mono font-bold text-white tabular-nums">
                      {item.value}{item.suffix}
                    </p>
                    {item.prev !== undefined && (
                      <div
                        className={cn(
                          'flex items-center gap-0.5 text-xs mt-1',
                          change > 0 ? 'text-mint-400' : change < 0 ? 'text-coral-400' : 'text-silver-500'
                        )}
                      >
                        {change > 0 ? <TrendingUp size={12} /> : change < 0 ? <TrendingDown size={12} /> : null}
                        <span>{change > 0 ? '+' : ''}{change}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-dream-400/10 to-mint-400/10 border border-dream-400/20 rounded-3xl p-5 text-left"
            >
              <div className="flex items-center gap-3 mb-3">
                {insight.icon}
                <h3 className="text-lg font-semibold text-white">{insight.title}</h3>
              </div>
              <p className="text-sm text-silver-300 leading-relaxed">
                {insight.text}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 flex gap-3 justify-center"
            >
              <PillButton
                variant="secondary"
                size="md"
                onClick={handleReset}
              >
                重新评估
              </PillButton>
              <PillButton
                variant="mint"
                size="md"
                rightIcon={<Coffee size={18} />}
              >
                开启今日计划
              </PillButton>
            </motion.div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-coral-400/20 to-dream-400/20 border border-coral-400/30 mb-4">
          <Sun size={16} className="text-coral-300" />
          <span className="text-coral-200 text-sm font-medium">
            {dayjs().format('MM月DD日 dddd')} · 早安
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white font-display mb-2">
          晨间自评
        </h1>
        <p className="text-silver-400">
          花1分钟，诚实地记录你此刻的状态
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <GlassCard className="p-6">
            <SliderScale
              label="斯坦福嗜睡量表"
              icon={<Moon size={20} />}
              value={alertness}
              min={1}
              max={7}
              onChange={setAlertness}
              formatValue={(v) => `${v}/7`}
              leftLabel={alertnessLabels[alertness - 1]}
              accentColor="dream"
            />
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex flex-wrap gap-2">
                {['动作变慢', '说话含糊', '躺下即睡', '难以保持清醒'].map((tag) => (
                  <Chip key={tag} variant="default" className="text-[10px]">
                    {tag}
                  </Chip>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <GlassCard className="p-6">
            <StarRating value={sleepQuality} onChange={setSleepQuality} />
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <GlassCard className="p-6">
            <ContinuousSlider
              label="情绪 VAS 量表"
              icon={<Heart size={20} />}
              value={mood}
              onChange={setMood}
              leftEmoji="😔"
              leftLabel="低落"
              rightLabel="愉悦"
              rightEmoji="😊"
            />
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <GlassCard className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/5 text-night-200">
                    <Brain size={20} />
                  </div>
                  <span className="text-white font-medium">睡前思绪干扰</span>
                </div>
                <motion.span
                  key={thoughtInterference}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-mono font-bold text-night-200 tabular-nums"
                >
                  {thoughtInterference}/5
                </motion.span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((v) => {
                  const isActive = v <= thoughtInterference;
                  const labels = ['完全无', '很少', '有时', '经常', '极度'];
                  return (
                    <motion.button
                      key={v}
                      onClick={() => setThoughtInterference(v)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'py-4 px-2 rounded-2xl flex flex-col items-center gap-1 transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-br from-night-400/40 to-night-300/40 border border-night-300/50 shadow-lg'
                          : 'bg-white/[0.03] border border-white/5 hover:bg-white/[0.06]'
                      )}
                    >
                      <span className={cn(
                        'text-xl font-mono font-bold tabular-nums',
                        isActive ? 'text-night-100' : 'text-silver-500'
                      )}>
                        {v}
                      </span>
                      <span className={cn(
                        'text-[10px]',
                        isActive ? 'text-night-200' : 'text-silver-600'
                      )}>
                        {labels[v - 1]}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <MessageCircle size={20} className="text-silver-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-white font-medium mb-1">今日笔记（可选）</p>
                <p className="text-sm text-silver-500">记录昨晚印象深刻的梦境或感受</p>
              </div>
            </div>
            <textarea
              placeholder="昨晚入睡时你在想什么？有什么特别的感受？"
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-silver-600 resize-none h-24 focus:outline-none focus:border-dream-400/40 transition-colors"
            />
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="pt-4 pb-8"
        >
          <PillButton
            variant="mint"
            size="lg"
            className="w-full"
            disabled={!allAnswered}
            onClick={handleSubmit}
            leftIcon={<Send size={20} />}
          >
            提交自评
          </PillButton>
          <p className="text-center text-xs text-silver-600 mt-3">
            数据仅用于你的个人睡眠分析，完全私密
          </p>
        </motion.div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { GlassCard, PillButton, Chip } from '@/components/ui';
import { RealtimeWaveform } from '@/components/charts';
import { cn, dayjs, formatSecondsToTime, clamp } from '@/lib/utils';
import {
  Play,
  Square,
  Mic,
  Activity,
  Volume2,
  Headphones,
  ShieldAlert,
  Clock,
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

function BreathingGuide({ isMonitoring }: { isMonitoring: boolean }) {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  useEffect(() => {
    if (!isMonitoring) return;
    const phases: Array<{ name: 'inhale' | 'hold' | 'exhale'; duration: number }> = [
      { name: 'inhale', duration: 4000 },
      { name: 'hold', duration: 2000 },
      { name: 'exhale', duration: 6000 },
    ];
    let phaseIdx = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const runPhase = () => {
      setPhase(phases[phaseIdx].name);
      timeoutId = setTimeout(() => {
        phaseIdx = (phaseIdx + 1) % phases.length;
        runPhase();
      }, phases[phaseIdx].duration);
    };

    runPhase();
    return () => clearTimeout(timeoutId);
  }, [isMonitoring]);

  const scale =
    phase === 'inhale' ? 1.15 : phase === 'hold' ? 1.15 : 0.9;
  const transition = {
    duration: phase === 'inhale' ? 4 : phase === 'hold' ? 0.1 : 6,
    ease: 'easeInOut' as const,
  };
  const label = phase === 'inhale' ? '吸气' : phase === 'hold' ? '屏息' : '呼气';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-56 h-56 flex items-center justify-center">
        <motion.div
          animate={isMonitoring ? { scale } : { scale: 0.95 }}
          transition={isMonitoring ? transition : { duration: 1 }}
          className="absolute inset-0 rounded-full border-2 border-mint-400/20"
        />
        <motion.div
          animate={isMonitoring ? { scale: scale * 0.88 } : { scale: 0.85 }}
          transition={isMonitoring ? transition : { duration: 1 }}
          className="absolute rounded-full w-[88%] h-[88%] border-2 border-mint-400/30"
        />
        <motion.div
          animate={isMonitoring ? { scale: scale * 0.72 } : { scale: 0.7 }}
          transition={isMonitoring ? transition : { duration: 1 }}
          className="absolute rounded-full w-[72%] h-[72%] border-2 border-mint-400/40"
        />
        <motion.div
          animate={
            isMonitoring
              ? { scale, boxShadow: ['0 0 30px rgba(123,200,164,0.3)', '0 0 60px rgba(123,200,164,0.6)', '0 0 30px rgba(123,200,164,0.3)'] }
              : { scale: 0.55, boxShadow: '0 0 20px rgba(123,200,164,0.2)' }
          }
          transition={
            isMonitoring
              ? { ...transition, boxShadow: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }
              : { duration: 1 }
          }
          className="absolute rounded-full w-[55%] h-[55%] bg-gradient-to-br from-mint-400/30 to-dream-400/20 border border-mint-400/50 backdrop-blur-md flex items-center justify-center"
        >
          <div className="text-center">
            <p className="text-xs text-mint-300/80 uppercase tracking-widest">
              {isMonitoring ? label : '准备就绪'}
            </p>
            <p className="mt-1 text-2xl font-mono font-semibold text-white">
              4-2-6
            </p>
          </div>
        </motion.div>
      </div>
      <p className="mt-4 text-sm text-silver-400">
        {isMonitoring ? '跟随节奏呼吸，放松身心' : '点击下方按钮开始监测'}
      </p>
    </div>
  );
}

interface SensorCapsuleProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  max?: number;
  unit?: string;
  active: boolean;
  color: 'mint' | 'dream' | 'coral';
  displayValue?: string;
}

function SensorCapsule({
  icon: Icon,
  label,
  value,
  max = 100,
  unit = '%',
  active,
  color,
  displayValue,
}: SensorCapsuleProps) {
  const percentage = clamp((value / max) * 100, 0, 100);
  const colorMap = {
    mint: 'text-mint-300 bg-mint-400/20 border-mint-400/30',
    dream: 'text-dream-300 bg-dream-400/20 border-dream-400/30',
    coral: 'text-coral-300 bg-coral-400/20 border-coral-400/30',
  };
  const barColorMap = {
    mint: 'from-mint-400 to-mint-300',
    dream: 'from-dream-400 to-dream-300',
    coral: 'from-coral-400 to-coral-300',
  };

  return (
    <GlassCard className="p-4" hoverGlow>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center border',
            colorMap[color],
            active && 'animate-pulse'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-silver-400">{label}</span>
            <span className={cn('font-mono text-sm', colorMap[color].split(' ')[0])}>
              {displayValue ?? `${Math.round(percentage)}${unit}`}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className={cn('h-full rounded-full bg-gradient-to-r', barColorMap[color])}
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default function MonitorPage() {
  const {
    user,
    audioTracks,
    monitorData,
    startMonitoring,
    stopMonitoring,
    updateMonitorData,
    setCurrentAudio,
    setPlaying,
  } = useAppStore();

  const {
    isMonitoring,
    elapsedSeconds,
    micLevel,
    motionLevel,
    environmentNoise,
    breathingRate,
    waveBuffer,
  } = monitorData;

  const [showConfirmStop, setShowConfirmStop] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const breathPhaseRef = useRef(0);
  const motionNoiseRef = useRef(0);

  const recommendedAudio = audioTracks.find((t) => t.category === 'insomnia') || audioTracks[0];
  const targetWakeTime = user.settings.targetWakeTime;

  useEffect(() => {
    if (isMonitoring) {
      timerRef.current = setInterval(() => {
        breathPhaseRef.current += 0.08;
        motionNoiseRef.current = motionNoiseRef.current * 0.92 + (Math.random() - 0.5) * 0.08;

        const breathingWave = Array.from({ length: 200 }, (_, i) => {
          const t = (breathPhaseRef.current + i * 0.02) % (Math.PI * 2);
          return Math.sin(t) * 0.7 + (Math.random() - 0.5) * 0.08;
        });

        const motionWave = Array.from({ length: 200 }, (_, i) => {
          const base = Math.sin(i * 0.05) * 0.15;
          const noise = motionNoiseRef.current * 0.8;
          const spike = i > 170 && i < 180 ? Math.sin((i - 170) * 0.8) * 0.6 : 0;
          return clamp(base + noise + spike + (Math.random() - 0.5) * 0.05, -1, 1);
        });

        updateMonitorData({
          elapsedSeconds: elapsedSeconds + 1,
          micLevel: clamp(20 + Math.sin(breathPhaseRef.current * 0.5) * 15 + Math.random() * 10, 0, 100),
          motionLevel: clamp(15 + Math.abs(motionNoiseRef.current) * 60 + Math.random() * 8, 0, 100),
          environmentNoise: clamp(28 + Math.random() * 8, 0, 100),
          breathingRate: Math.round(14 + Math.sin(breathPhaseRef.current * 0.1) * 2),
          waveBuffer: { breathing: breathingWave, motion: motionWave },
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isMonitoring, elapsedSeconds, updateMonitorData]);

  const handleToggleMonitor = () => {
    if (isMonitoring) {
      setShowConfirmStop(true);
    } else {
      startMonitoring();
    }
  };

  const confirmStop = () => {
    stopMonitoring();
    setShowConfirmStop(false);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">睡眠监测</h1>
          <p className="mt-1 text-sm text-silver-400">
            放置手机于床边，保持麦克风朝向自己
          </p>
        </div>
        {isMonitoring && (
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-coral-400 animate-pulse" />
            <span className="font-mono text-lg text-white">
              {formatSecondsToTime(elapsedSeconds)}
            </span>
          </div>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard className="p-8" hoverGlow>
          <div className="flex flex-col items-center">
            <BreathingGuide isMonitoring={isMonitoring} />
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard className="p-6" hoverGlow>
          <RealtimeWaveform
            breathingWave={waveBuffer.breathing}
            motionWave={waveBuffer.motion}
            breathingRate={breathingRate}
            motionLevel={motionLevel / 100}
            isMonitoring={isMonitoring}
            elapsedSeconds={elapsedSeconds}
            height={200}
          />
        </GlassCard>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SensorCapsule
            icon={Mic}
            label="麦克风音量"
            value={micLevel}
            active={isMonitoring}
            color="mint"
          />
          <SensorCapsule
            icon={Activity}
            label="加速度活动度"
            value={motionLevel}
            active={isMonitoring}
            color="dream"
          />
          <SensorCapsule
            icon={Volume2}
            label="环境噪音"
            value={environmentNoise}
            max={100}
            unit=""
            displayValue={`${Math.round(environmentNoise)} dB`}
            active={isMonitoring}
            color="coral"
          />
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <GlassCard className="p-6" hoverGlow>
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative">
              <AnimatePresence>
                {isMonitoring && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        'radial-gradient(circle, rgba(255,107,107,0.4) 0%, rgba(255,107,107,0) 70%)',
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  />
                )}
              </AnimatePresence>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleMonitor}
                className={cn(
                  'relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500',
                  isMonitoring
                    ? 'bg-gradient-to-br from-coral-500 to-coral-600 shadow-glow-coral border-2 border-coral-300/50'
                    : 'bg-gradient-to-br from-mint-500 to-mint-600 shadow-glow-mint border-2 border-mint-300/50'
                )}
              >
                {isMonitoring ? (
                  <Square className="w-10 h-10 text-white fill-current" />
                ) : (
                  <Play className="w-10 h-10 text-white fill-current ml-1" />
                )}
              </motion.button>
            </div>

            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Sunrise className="w-4 h-4 text-mint-300" />
                  <span className="text-xs text-silver-400">预计起床时间</span>
                </div>
                <p className="text-2xl font-mono font-semibold text-white">
                  {targetWakeTime}
                </p>
              </div>

              <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-dream-300" />
                  <span className="text-xs text-silver-400">助眠音频</span>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: recommendedAudio?.coverImage }}
                  >
                    <Headphones className="w-4 h-4 text-white/90" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {recommendedAudio?.title}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (recommendedAudio) {
                        setCurrentAudio(recommendedAudio);
                        setPlaying(true);
                      }
                    }}
                    className="w-9 h-9 rounded-full bg-mint-400/20 border border-mint-400/30 flex items-center justify-center text-mint-300 hover:bg-mint-400/30 transition-all"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:w-full lg:col-span-3 flex items-center gap-2 p-3 rounded-2xl bg-night-800/50 border border-night-600/30">
              <ShieldAlert className="w-5 h-5 text-dream-300 flex-shrink-0" />
              <p className="text-xs text-silver-400">
                防误触提示：监测过程中请勿关闭应用，保持屏幕常亮可获得更精准数据。
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <AnimatePresence>
        {showConfirmStop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm"
            >
              <GlassCard className="p-6">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-coral-400/15 border border-coral-400/30 flex items-center justify-center mx-auto">
                    <Square className="w-7 h-7 text-coral-300" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">结束监测？</h3>
                  <p className="mt-2 text-sm text-silver-400">
                    当前已监测 {formatSecondsToTime(elapsedSeconds)}，确定要结束吗？
                  </p>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowConfirmStop(false)}
                    className="flex-1 py-3 rounded-full bg-white/5 border border-white/10 text-silver-200 font-medium hover:bg-white/10 transition-all"
                  >
                    继续监测
                  </button>
                  <button
                    onClick={confirmStop}
                    className="flex-1 py-3 rounded-full bg-gradient-to-r from-coral-500 to-coral-600 text-white font-medium shadow-glow-coral hover:brightness-110 transition-all"
                  >
                    确认结束
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
      `}</style>
    </motion.div>
  );
}

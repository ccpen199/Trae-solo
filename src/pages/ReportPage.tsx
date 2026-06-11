import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  Wind,
  Moon,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Volume2,
  Clock,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Heart,
  Gauge,
  AlertCircle,
  Lightbulb,
  FileText,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GlassCard, StatCard, Chip, PillButton, RingProgress } from '@/components/ui';
import { SleepStagesTimeline, BreathingBoxplot, SnoringHeatmap } from '@/components/charts';
import {
  cn,
  dayjs,
  formatDateLabel,
  formatDuration,
  sleepQualityColor,
  riskLevelBg,
} from '@/lib/utils';
import type { ApneaEvent, SleepSession } from '@/types';

const apneaTypeLabels: Record<string, string> = {
  obstructive: '阻塞性',
  central: '中枢性',
  mixed: '混合性',
  suspected: '疑似',
};

const severityLabels: Record<string, string> = {
  mild: '轻度',
  moderate: '中度',
  severe: '重度',
};

export default function ReportPage() {
  const navigate = useNavigate();
  const { sleepSessions } = useAppStore();
  const sortedSessions = useMemo(
    () => [...sleepSessions].sort((a, b) => dayjs(b.startTime).valueOf() - dayjs(a.startTime).valueOf()),
    [sleepSessions]
  );

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    if (dateParam && sortedSessions.some((s) => dayjs(s.startTime).isSame(dateParam, 'day'))) {
      return dateParam;
    }
    return sortedSessions[0] ? dayjs(sortedSessions[0].startTime).format('YYYY-MM-DD') : '';
  });
  const [expandedApneaId, setExpandedApneaId] = useState<string | null>(null);

  const currentSession = useMemo(
    () => sortedSessions.find((s) => dayjs(s.startTime).isSame(selectedDate, 'day')),
    [sortedSessions, selectedDate]
  );

  const currentIndex = sortedSessions.findIndex((s) => dayjs(s.startTime).isSame(selectedDate, 'day'));
  const lastWeekSession = useMemo(() => {
    const targetDate = dayjs(selectedDate).subtract(7, 'day');
    return sortedSessions.find((s) => dayjs(s.startTime).isSame(targetDate, 'day'));
  }, [sortedSessions, selectedDate]);

  const handlePrevDay = () => {
    if (currentIndex < sortedSessions.length - 1) {
      const next = sortedSessions[currentIndex + 1];
      setSelectedDate(dayjs(next.startTime).format('YYYY-MM-DD'));
    }
  };

  const handleNextDay = () => {
    if (currentIndex > 0) {
      const prev = sortedSessions[currentIndex - 1];
      setSelectedDate(dayjs(prev.startTime).format('YYYY-MM-DD'));
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-silver-400">暂无该日期的睡眠数据</p>
      </div>
    );
  }

  const renderTurnoverBarChart = (session: SleepSession) => {
    const { movementIntensity, totalTurns } = session.movementMetrics;
    const samples = 24;
    const step = Math.floor(movementIntensity.length / samples);
    const bars = [];
    for (let i = 0; i < samples; i++) {
      const val = movementIntensity[i * step]?.value || 0;
      bars.push(val);
    }
    const maxVal = Math.max(...bars, 0.01);
    return (
      <div className="w-full">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">翻身与体动</div>
            <div className="text-xs text-silver-400">整晚体动强度分布</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-semibold text-dream-300">
              {totalTurns}
              <span className="ml-1 text-sm font-normal text-silver-400">次</span>
            </div>
            <div className="text-xs text-silver-500">总翻身次数</div>
          </div>
        </div>
        <div className="flex items-end gap-1 h-24 mb-2">
          {bars.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-300"
              style={{
                height: `${(v / maxVal) * 100}%`,
                background: `linear-gradient(to top, #9B7EDB, #B6E5CF)`,
                opacity: 0.4 + (v / maxVal) * 0.6,
                minHeight: '4px',
              }}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] font-mono text-silver-500">
          <span>入睡</span>
          <span>半夜</span>
          <span>清晨</span>
        </div>
      </div>
    );
  };

  const renderSleepLatencyChart = (current: SleepSession, lastWeek?: SleepSession) => {
    const currentLat = current.sleepLatency;
    const lastWeekLat = lastWeek?.sleepLatency;
    const maxLat = Math.max(currentLat, lastWeekLat || 0, 40 * 60);
    return (
      <div className="w-full">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">入睡潜伏期</div>
            <div className="text-xs text-silver-400">从上床到入睡的时间</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-semibold text-night-200">
              {Math.round(currentLat / 60)}
              <span className="ml-1 text-sm font-normal text-silver-400">分钟</span>
            </div>
            <div className="text-xs text-silver-500">今日</div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-silver-300">今日</span>
              <span className="font-mono text-dream-300">{Math.round(currentLat / 60)} 分钟</span>
            </div>
            <div className="h-3 bg-night-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-dream-400 to-dream-300 transition-all duration-700"
                style={{ width: `${(currentLat / maxLat) * 100}%` }}
              />
            </div>
          </div>
          {lastWeekLat !== undefined && (
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-silver-400">上周同期</span>
                <span className="font-mono text-silver-400">{Math.round(lastWeekLat / 60)} 分钟</span>
              </div>
              <div className="h-3 bg-night-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-silver-500/50 transition-all duration-700"
                  style={{ width: `${(lastWeekLat / maxLat) * 100}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 pt-2">
            <Chip variant={currentLat <= 15 * 60 ? 'mint' : currentLat <= 30 * 60 ? 'dream' : 'coral'}>
              {currentLat <= 15 * 60 ? '理想' : currentLat <= 30 * 60 ? '正常' : '偏长'}
            </Chip>
            {lastWeekLat !== undefined && (
              <span className="text-xs text-silver-400">
                {currentLat < lastWeekLat ? '较上周改善' : currentLat > lastWeekLat ? '较上周延长' : '与上周持平'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderApneaEvent = (event: ApneaEvent, totalDuration: number) => {
    const left = (event.startTime / totalDuration) * 100;
    return (
      <div
        key={event.id}
        className="absolute top-0 h-full flex flex-col items-center group"
        style={{ left: `${left}%` }}
      >
        <div
          className={cn(
            'w-1 h-full rounded-full transition-all duration-300',
            event.severity === 'severe' ? 'bg-coral-400' : event.severity === 'moderate' ? 'bg-coral-400/70' : 'bg-dream-400/70'
          )}
        />
        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          <div className="glass-card px-3 py-1.5 rounded-lg text-xs">
            <div className="font-medium text-white">
              {apneaTypeLabels[event.type]} · {severityLabels[event.severity]}
            </div>
            <div className="text-silver-400">
              持续 {event.duration}秒
              {event.oxygenDrop && ` · 血氧↓${event.oxygenDrop}%`}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCompareItem = (
    label: string,
    current: number,
    lastWeek: number | undefined,
    unit: string,
    isBetterHigher: boolean,
    formatValue?: (v: number) => string
  ) => {
    const displayValue = formatValue ? formatValue(current) : current.toString();
    const hasLastWeek = lastWeek !== undefined;
    const diff = hasLastWeek ? current - lastWeek! : 0;
    const isImproved = hasLastWeek && (isBetterHigher ? diff > 0 : diff < 0);
    const isSame = hasLastWeek && diff === 0;

    return (
      <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
        <span className="text-sm text-silver-300">{label}</span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-white text-sm">{displayValue}{unit}</span>
          {hasLastWeek && !isSame && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-xs font-medium',
                isImproved ? 'text-mint-400' : 'text-coral-400'
              )}
            >
              {isImproved ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {diff > 0 ? '+' : ''}
              {formatValue ? formatValue(diff) : diff}
              {unit}
            </span>
          )}
          {hasLastWeek && isSame && (
            <span className="text-xs text-silver-400">持平</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-night-900/60 border-b border-white/5"
      >
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevDay}
                disabled={currentIndex >= sortedSessions.length - 1}
                className="w-10 h-10 rounded-full flex items-center justify-center text-silver-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-dream-300" />
                  <h1 className="text-xl font-semibold text-white">
                    {formatDateLabel(currentSession.startTime)}
                  </h1>
                  <span className="text-sm text-silver-400">
                    {dayjs(currentSession.startTime).format('YYYY年MM月DD日')}
                  </span>
                </div>
                <p className="text-xs text-silver-500 mt-0.5">
                  {dayjs(currentSession.startTime).format('HH:mm')} —{' '}
                  {dayjs(currentSession.endTime).format('HH:mm')}
                </p>
              </div>
              <button
                onClick={handleNextDay}
                disabled={currentIndex <= 0}
                className="w-10 h-10 rounded-full flex items-center justify-center text-silver-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-1.5 overflow-x-auto max-w-md scrollbar-hide py-1">
                {sortedSessions.slice(0, 7).map((s) => {
                  const dateStr = dayjs(s.startTime).format('YYYY-MM-DD');
                  const isSelected = dateStr === selectedDate;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleDateSelect(dateStr)}
                      className={cn(
                        'flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all duration-300',
                        isSelected
                          ? 'bg-gradient-to-r from-dream-400 to-mint-400 text-night-900 font-semibold'
                          : 'bg-white/5 text-silver-400 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      {dayjs(s.startTime).format('MM/DD')}
                    </button>
                  );
                })}
              </div>

              <PillButton
                variant="mint"
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={() => {
                  alert('报告导出功能开发中...');
                }}
              >
                导出报告
              </PillButton>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <GlassCard className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-silver-400 mb-2">睡眠质量评分</p>
                <div className="flex items-baseline gap-3">
                  <span
                    className={cn(
                      'text-6xl font-bold font-mono tabular-nums',
                      sleepQualityColor(currentSession.qualityScore)
                    )}
                  >
                    {currentSession.qualityScore}
                  </span>
                  <span className="text-lg text-silver-500">/ 100</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Chip variant={currentSession.qualityScore >= 80 ? 'mint' : currentSession.qualityScore >= 60 ? 'dream' : 'coral'}>
                    {currentSession.qualityScore >= 85 ? '优秀' : currentSession.qualityScore >= 70 ? '良好' : currentSession.qualityScore >= 55 ? '一般' : '需改善'}
                  </Chip>
                  {lastWeekSession && (
                    <span
                      className={cn(
                        'text-sm inline-flex items-center gap-1',
                        currentSession.qualityScore >= lastWeekSession.qualityScore ? 'text-mint-400' : 'text-coral-400'
                      )}
                    >
                      {currentSession.qualityScore >= lastWeekSession.qualityScore ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      较上周{' '}
                      {currentSession.qualityScore >= lastWeekSession.qualityScore ? '+' : ''}
                      {currentSession.qualityScore - lastWeekSession.qualityScore} 分
                    </span>
                  )}
                </div>
              </div>

              <RingProgress
                value={currentSession.qualityScore}
                size={140}
                strokeWidth={10}
                label={`${currentSession.qualityScore}`}
                sublabel="睡眠评分"
                gradientFrom={currentSession.qualityScore >= 70 ? '#7BC8A4' : '#FF6B6B'}
                gradientTo="#9B7EDB"
              />
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              value={formatDuration(currentSession.totalDuration)}
              label="总睡眠时长"
              icon={<Moon size={22} />}
              trend={
                lastWeekSession
                  ? {
                      value: Math.round(
                        ((currentSession.totalDuration - lastWeekSession.totalDuration) /
                          lastWeekSession.totalDuration) *
                          100
                      ),
                      isPositive: currentSession.totalDuration >= lastWeekSession.totalDuration,
                    }
                  : undefined
              }
            />
            <StatCard
              value={`${currentSession.sleepEfficiency}%`}
              label="睡眠效率"
              icon={<Activity size={22} />}
              trend={
                lastWeekSession
                  ? {
                      value: currentSession.sleepEfficiency - lastWeekSession.sleepEfficiency,
                      isPositive: currentSession.sleepEfficiency >= lastWeekSession.sleepEfficiency,
                    }
                  : undefined
              }
            />
            <StatCard
              value={currentSession.ahiIndex.toFixed(1)}
              label="AHI 呼吸暂停指数"
              icon={<AlertTriangle size={22} />}
              trend={
                lastWeekSession
                  ? {
                      value: Number(
                        (currentSession.ahiIndex - lastWeekSession.ahiIndex).toFixed(1)
                      ),
                      isPositive: currentSession.ahiIndex <= lastWeekSession.ahiIndex,
                    }
                  : undefined
              }
            />
            <StatCard
              value={`${Math.round(currentSession.environmentNoise)} dB`}
              label="环境噪声"
              icon={<BarChart3 size={22} />}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-white">睡眠分期时间轴</h2>
                <p className="text-sm text-silver-400 mt-1">整晚睡眠结构变化</p>
              </div>
            </div>
            <SleepStagesTimeline
              stages={currentSession.sleepStages}
              startTime={currentSession.startTime}
            />
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <div className="grid grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <BreathingBoxplot metrics={currentSession.breathingMetrics} />
            </GlassCard>
            <GlassCard className="p-6">
              {renderTurnoverBarChart(currentSession)}
            </GlassCard>
            <GlassCard className="p-6">
              <SnoringHeatmap metrics={currentSession.snoringMetrics} />
            </GlassCard>
            <GlassCard className="p-6">
              {renderSleepLatencyChart(currentSession, lastWeekSession)}
            </GlassCard>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-coral-400/15 border border-coral-400/30">
                  <Volume2 size={20} className="text-coral-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">异常事件时间线</h2>
                  <p className="text-sm text-silver-400 mt-1">
                    共检测到 {currentSession.apneaEvents.length} 次呼吸暂停事件
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {['mild', 'moderate', 'severe'].map((level) => (
                  <div key={level} className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        level === 'severe'
                          ? 'bg-coral-400'
                          : level === 'moderate'
                          ? 'bg-coral-400/70'
                          : 'bg-dream-400/70'
                      )}
                    />
                    <span className="text-xs text-silver-400">{severityLabels[level]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative h-16 bg-night-800/50 rounded-xl overflow-hidden mb-4">
              <div className="absolute inset-0 flex items-center px-4">
                <div className="w-full h-1 bg-white/5 rounded-full relative">
                  {currentSession.apneaEvents.map((event) =>
                    renderApneaEvent(event, currentSession.totalDuration)
                  )}
                </div>
              </div>
            </div>

            {currentSession.apneaEvents.length > 0 && (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                {currentSession.apneaEvents.map((event, index) => {
                  const expanded = expandedApneaId === event.id;
                  const eventTime = dayjs(currentSession.startTime).add(event.startTime, 'second');

                  const suggestionMap = {
                    obstructive: [
                      '建议尝试侧卧位睡眠，减少舌根后坠',
                      '避免饮酒和服用镇静类药物',
                      '若BMI超标，建议减重5-10%',
                    ],
                    central: [
                      '建议进一步做多导睡眠监测（PSG）',
                      '注意心肺基础疾病的管理',
                      '避免高海拔睡眠环境',
                    ],
                    mixed: [
                      '混合型呼吸暂停需多学科评估',
                      '建议使用CPAP呼吸机试验治疗',
                      '长期规律随访复查',
                    ],
                    suspected: [
                      '疑似事件，需连续多晚监测确认',
                      '建议记录详细睡眠日记',
                      '如白天嗜睡加重请及时就医',
                    ],
                  };
                  const suggestions = suggestionMap[event.type as keyof typeof suggestionMap];
                  const waveform = Array.from({ length: 80 }, (_, i) => {
                    if (i >= 35 && i <= 35 + Math.round((event.duration - 8) * 1.2)) {
                      return Math.sin(i * 0.15) * 0.08;
                    }
                    return Math.sin(i * 0.4 + index) * 0.55 + (Math.random() - 0.5) * 0.15;
                  });

                  return (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-white/5 overflow-hidden transition-all duration-500"
                      style={{
                        background: expanded
                          ? 'linear-gradient(180deg, rgba(255,107,107,0.08) 0%, rgba(7,14,39,0.4) 100%)'
                          : 'rgba(7,14,39,0.3)',
                        borderColor: expanded ? 'rgba(255,107,107,0.25)' : undefined,
                      }}
                    >
                      <button
                        onClick={() => setExpandedApneaId(expanded ? null : event.id)}
                        className="w-full flex items-center justify-between p-3 text-left hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono',
                            expanded ? 'bg-coral-400/20 text-coral-300' : 'bg-white/5 text-silver-400'
                          )}>
                            #{index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">
                                {apneaTypeLabels[event.type]}呼吸暂停
                              </span>
                              <span
                                className={cn(
                                  'text-xs px-2 py-0.5 rounded-full',
                                  riskLevelBg(event.severity)
                                )}
                              >
                                {severityLabels[event.severity]}
                              </span>
                            </div>
                            <div className="text-xs text-silver-400 mt-0.5 flex items-center gap-2">
                              <Clock size={10} className="inline" />
                              {eventTime.format('HH:mm:ss')}
                              <AlertCircle size={10} className="ml-2" />
                              持续 {event.duration}s · 血氧 ↓{event.oxygenDrop ?? 3}%
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex items-center gap-4 text-sm">
                            {event.oxygenDrop && (
                              <div className="text-right">
                                <div className="text-[10px] text-silver-500">SpO2</div>
                                <div className="font-mono text-coral-300">↓{event.oxygenDrop}%</div>
                              </div>
                            )}
                            <div className="text-right">
                              <div className="text-[10px] text-silver-500">模型置信</div>
                              <div className="font-mono text-dream-300">{Math.round(event.confidence * 100)}%</div>
                            </div>
                          </div>
                          <div className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300',
                            expanded ? 'bg-coral-400/20 text-coral-300 rotate-180' : 'bg-white/5 text-silver-400'
                          )}>
                            <ChevronDown size={15} />
                          </div>
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-4">
                              <div className="rounded-xl bg-night-900/60 border border-white/5 p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-[11px] text-silver-400 flex items-center gap-1.5">
                                    <Wind size={12} />
                                    呼吸气流波形（事件前后24秒）
                                  </div>
                                  <span className="text-[10px] text-coral-300 font-mono">
                                    {apneaTypeLabels[event.type]}段 ↓↓↓
                                  </span>
                                </div>
                                <div className="relative h-20 bg-night-900/80 rounded-lg overflow-hidden border border-white/5">
                                  <svg viewBox="0 0 400 80" className="w-full h-full" preserveAspectRatio="none">
                                    <defs>
                                      <linearGradient id={`apnea-wave-${event.id}`} x1="0" x2="1" y1="0" y2="0">
                                        <stop offset="0%" stopColor="#7BC8A4" />
                                        <stop offset="45%" stopColor="#7BC8A4" />
                                        <stop offset="55%" stopColor="#FF6B6B" />
                                        <stop offset="60%" stopColor="#FF6B6B" />
                                        <stop offset="100%" stopColor="#7BC8A4" />
                                      </linearGradient>
                                    </defs>
                                    <rect x="180" y="0" width="60" height="80" fill="rgba(255,107,107,0.08)" />
                                    <path
                                      d={`M 0 40 ${waveform.map((v, i) => `L ${(i / waveform.length) * 400} ${40 - v * 28}`).join(' ')}`}
                                      fill="none"
                                      stroke={`url(#apnea-wave-${event.id})`}
                                      strokeWidth="1.6"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                  <div className="absolute left-1 top-1 text-[9px] text-silver-500 font-mono">
                                    事件前 24s
                                  </div>
                                  <div className="absolute right-1 top-1 text-[9px] text-silver-500 font-mono">
                                    恢复 +24s
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                  <div className="flex items-center gap-1 text-[10px] text-silver-500 mb-1">
                                    <Gauge size={11} /> 事件时长
                                  </div>
                                  <div className="text-lg font-mono font-semibold text-coral-300">
                                    {event.duration}<span className="text-xs ml-0.5 text-silver-400">秒</span>
                                  </div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                  <div className="flex items-center gap-1 text-[10px] text-silver-500 mb-1">
                                    <Heart size={11} /> SpO₂最低点
                                  </div>
                                  <div className="text-lg font-mono font-semibold text-coral-300">
                                    {97 - (event.oxygenDrop ?? 3)}<span className="text-xs ml-0.5 text-silver-400">%</span>
                                  </div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                  <div className="flex items-center gap-1 text-[10px] text-silver-500 mb-1">
                                    <Volume2 size={11} /> 关联鼾声
                                  </div>
                                  <div className="text-lg font-mono font-semibold text-dream-300">
                                    {event.type === 'obstructive' ? 1 : event.type === 'mixed' ? 0.5 : 0}<span className="text-xs ml-0.5 text-silver-400">次</span>
                                  </div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                  <div className="flex items-center gap-1 text-[10px] text-silver-500 mb-1">
                                    <BarChart3 size={11} /> 位置
                                  </div>
                                  <div className="text-lg font-mono font-semibold text-dream-300">
                                    {Math.round(event.startTime / currentSession.totalDuration * 100)}<span className="text-xs ml-0.5 text-silver-400">%进度</span>
                                  </div>
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-dream-400/10 border border-dream-400/20">
                                <div className="flex items-start gap-2">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-mint-400/15 flex items-center justify-center mt-0.5">
                                    <Lightbulb size={13} className="text-mint-300" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-white mb-1.5">临床建议</div>
                                    <ul className="space-y-1">
                                      {suggestions.map((s, i) => (
                                        <li key={i} className="text-[11px] text-silver-300 flex gap-1.5 leading-relaxed">
                                          <span className="text-mint-400 mt-0.5 flex-shrink-0">•</span>
                                          {s}
                                        </li>
                                      ))}
                                    </ul>
                                    <div className="mt-2 flex items-center gap-2">
                                      <PillButton
                                        variant="coral"
                                        size="sm"
                                        leftIcon={<FileText size={11} />}
                                        onClick={() => navigate('/risk')}
                                      >
                                        转介至风险评估
                                      </PillButton>
                                      <PillButton variant="secondary" size="sm">
                                        添加到观察列表
                                      </PillButton>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {lastWeekSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-2xl bg-dream-400/15 border border-dream-400/30">
                  <TrendingUp size={20} className="text-dream-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">历史对比</h2>
                  <p className="text-sm text-silver-400 mt-1">
                    与上周同期（{dayjs(lastWeekSession.startTime).format('MM月DD日')}）对比
                  </p>
                </div>
              </div>

              <div>
                {renderCompareItem(
                  '睡眠质量评分',
                  currentSession.qualityScore,
                  lastWeekSession.qualityScore,
                  ' 分',
                  true
                )}
                {renderCompareItem(
                  '总睡眠时长',
                  currentSession.totalDuration,
                  lastWeekSession.totalDuration,
                  '',
                  true,
                  (v) => formatDuration(v)
                )}
                {renderCompareItem(
                  '睡眠效率',
                  currentSession.sleepEfficiency,
                  lastWeekSession.sleepEfficiency,
                  '%',
                  true
                )}
                {renderCompareItem(
                  '入睡潜伏期',
                  Math.round(currentSession.sleepLatency / 60),
                  Math.round(lastWeekSession.sleepLatency / 60),
                  ' 分钟',
                  false
                )}
                {renderCompareItem(
                  '翻身次数',
                  currentSession.movementMetrics.totalTurns,
                  lastWeekSession.movementMetrics.totalTurns,
                  ' 次',
                  false
                )}
                {renderCompareItem(
                  'AHI指数',
                  Number(currentSession.ahiIndex.toFixed(1)),
                  Number(lastWeekSession.ahiIndex.toFixed(1)),
                  '',
                  false
                )}
                {renderCompareItem(
                  '平均呼吸率',
                  currentSession.breathingMetrics.avgRate,
                  lastWeekSession.breathingMetrics.avgRate,
                  ' 次/分',
                  false
                )}
                {renderCompareItem(
                  '打鼾次数',
                  currentSession.snoringMetrics.totalEpisodes,
                  lastWeekSession.snoringMetrics.totalEpisodes,
                  ' 次',
                  false
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center pb-8"
        >
          <PillButton
            variant="mint"
            size="lg"
            leftIcon={<Download size={20} />}
            onClick={() => {
              alert('报告导出功能开发中...');
            }}
          >
            导出完整睡眠报告
          </PillButton>
        </motion.div>
      </div>
    </div>
  );
}

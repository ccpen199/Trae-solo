import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Activity,
  Shield,
  ChevronRight,
  ShieldAlert,
  FileText,
  Hospital,
  CalendarCheck,
  PackageCheck,
  Handshake,
  ArrowRight,
  TrendingUp,
  Clock,
  Gauge,
  Video,
  Phone,
  MapPin,
  Star,
  RefreshCw,
  Stethoscope,
  User,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DSM5RadarChart } from '@/components/charts';
import { GlassCard, PillButton, Chip } from '@/components/ui';
import { cn, dayjs, riskLevelColor, riskLevelBg, formatDateLabel } from '@/lib/utils';
import type { RiskLevel, ReferralStatus, ReferralRecord } from '@/types';

const riskLabelMap: Record<RiskLevel, { label: string; subLabel: string; glow: string; ring: string }> = {
  low: {
    label: '低风险',
    subLabel: '睡眠健康状态良好，继续保持',
    glow: 'shadow-glow-mint',
    ring: 'ring-mint-400/40',
  },
  moderate: {
    label: '中风险',
    subLabel: '存在睡眠健康隐患，建议关注',
    glow: 'shadow-glow-dream',
    ring: 'ring-dream-400/40',
  },
  high: {
    label: '高风险',
    subLabel: '建议尽快就医评估',
    glow: 'shadow-glow-coral',
    ring: 'ring-coral-400/40',
  },
};

const referralSteps: { key: ReferralStatus; label: string; icon: typeof ShieldAlert }[] = [
  { key: 'pending_auth', label: '授权同意', icon: Handshake },
  { key: 'data_packaging', label: '数据打包', icon: PackageCheck },
  { key: 'report_generated', label: '报告生成', icon: FileText },
  { key: 'hospital_matched', label: '匹配医院', icon: Hospital },
  { key: 'appointment_scheduled', label: '预约初筛', icon: CalendarCheck },
];

const ahiSeverityMap: Record<string, { label: string; color: string }> = {
  normal: { label: '正常', color: 'text-mint-400' },
  mild: { label: '轻度', color: 'text-dream-300' },
  moderate: { label: '中度', color: 'text-coral-300' },
  severe: { label: '重度', color: 'text-coral-400' },
};

function RiskLevelCard({ level }: { level: RiskLevel }) {
  const info = riskLabelMap[level];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <GlassCard
        className={cn(
          'relative overflow-hidden p-8 ring-1',
          info.glow,
          info.ring
        )}
      >
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-30"
          animate={{
            background: [
              `radial-gradient(circle at 20% 20%, ${level === 'low' ? '#7BC8A4' : level === 'moderate' ? '#9B7EDB' : '#FF6B6B'}20 0%, transparent 50%)`,
              `radial-gradient(circle at 80% 80%, ${level === 'low' ? '#7BC8A4' : level === 'moderate' ? '#9B7EDB' : '#FF6B6B'}15 0%, transparent 50%)`,
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse' }}
        />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-5">
            <motion.div
              className={cn(
                'flex h-20 w-20 items-center justify-center rounded-full ring-4',
                level === 'low'
                  ? 'bg-mint-400/15 ring-mint-400/30'
                  : level === 'moderate'
                    ? 'bg-dream-400/15 ring-dream-400/30'
                    : 'bg-coral-400/15 ring-coral-400/30'
              )}
              animate={{
                boxShadow: [
                  `0 0 0 0 ${level === 'low' ? '#7BC8A4' : level === 'moderate' ? '#9B7EDB' : '#FF6B6B'}40`,
                  `0 0 0 12px ${level === 'low' ? '#7BC8A4' : level === 'moderate' ? '#9B7EDB' : '#FF6B6B'}00`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {level === 'low' ? (
                <Shield className="h-10 w-10 text-mint-400" />
              ) : level === 'moderate' ? (
                <Activity className="h-10 w-10 text-dream-300" />
              ) : (
                <ShieldAlert className="h-10 w-10 text-coral-400" />
              )}
            </motion.div>

            <div>
              <div className="text-sm text-silver-400">总体风险等级</div>
              <motion.div
                className={cn('mt-1 text-4xl font-display font-bold', riskLevelColor(level))}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                {info.label}
              </motion.div>
              <div className="mt-1 text-sm text-silver-400">{info.subLabel}</div>
            </div>
          </div>

          <div className="hidden text-right md:block">
            <div className="text-xs text-silver-500">最近评估</div>
            <div className="mt-1 font-mono text-sm text-silver-300">
              {dayjs().format('MM月DD日 HH:mm')}
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function AHICard() {
  const latestRisk = useAppStore((s) => s.riskAssessments).slice(-1)[0];
  const ahiRisk = latestRisk?.ahiBasedRisk;
  const isAlert = ahiRisk && ahiRisk.ahiValue > ahiRisk.threshold;

  if (!ahiRisk) return null;

  const severityInfo = ahiSeverityMap[ahiRisk.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <GlassCard
        className={cn(
          'relative overflow-hidden p-6 transition-all',
          isAlert && 'ring-1 ring-coral-400/50'
        )}
      >
        <AnimatePresence>
          {isAlert && (
            <>
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-4xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ boxShadow: '0 0 60px rgba(255, 107, 107, 0.25)' }}
              />
              <motion.div
                className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-coral-400/20 blur-3xl"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </>
          )}
        </AnimatePresence>

        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className={cn('h-5 w-5', isAlert ? 'text-coral-400' : 'text-silver-400')} />
              <span className="text-sm font-medium text-white">呼吸暂停预警</span>
              {isAlert && (
                <motion.div
                  className="flex items-center gap-1 rounded-full bg-coral-400/20 px-2 py-0.5 text-[10px] font-medium text-coral-300"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <AlertTriangle className="h-3 w-3" />
                  超出阈值
                </motion.div>
              )}
            </div>
            <Chip variant={isAlert ? 'coral' : 'mint'}>
              AHI 指数
            </Chip>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-silver-500">AHI 指数</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={cn('text-3xl font-mono font-bold', severityInfo.color)}>
                  {ahiRisk.ahiValue.toFixed(1)}
                </span>
                <span className="text-sm text-silver-500">次/小时</span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-night-700">
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    ahiRisk.severity === 'normal'
                      ? 'bg-mint-400'
                      : ahiRisk.severity === 'mild'
                        ? 'bg-dream-400'
                        : 'bg-coral-400'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((ahiRisk.ahiValue / 30) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
              <div className="mt-1 text-[10px] text-silver-500">
                阈值 {ahiRisk.threshold} 次/小时
              </div>
            </div>

            <div>
              <div className="text-xs text-silver-500">事件次数</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-mono font-bold text-silver-200">
                  {ahiRisk.eventsCount}
                </span>
                <span className="text-sm text-silver-500">次</span>
              </div>
              <div className="mt-2 flex gap-0.5">
                {Array.from({ length: Math.min(ahiRisk.eventsCount, 10) }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={cn(
                      'h-4 w-1.5 rounded-sm',
                      i < 3 ? 'bg-mint-400/60' : i < 7 ? 'bg-dream-400/60' : 'bg-coral-400/60'
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: '1rem' }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-silver-500">严重程度</div>
              <div className={cn('mt-1 text-2xl font-display font-bold', severityInfo.color)}>
                {severityInfo.label}
              </div>
              <div className="mt-2 text-xs text-silver-500">
                {ahiRisk.severity === 'normal'
                  ? '呼吸状态正常'
                  : ahiRisk.severity === 'mild'
                    ? '建议持续观察'
                    : ahiRisk.severity === 'moderate'
                      ? '建议专科就诊'
                      : '需立即就医'}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function ReferralStepper() {
  const referralRecords = useAppStore((s) => s.referralRecords);
  const latest = referralRecords.slice(-1)[0];
  const currentIndex = referralSteps.findIndex((s) => s.key === latest?.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <GlassCard className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">互联网医院转诊流程</div>
            <div className="text-xs text-silver-500">5步快速对接睡眠专科医疗资源</div>
          </div>
          {latest && (
            <Chip variant="dream">
              <Clock className="h-3 w-3" />
              {dayjs(latest.createdAt).fromNow()}
            </Chip>
          )}
        </div>

        <div className="relative">
          <div className="absolute left-0 right-0 top-7 h-0.5 bg-night-600" />
          <motion.div
            className="absolute left-0 top-7 h-0.5 bg-gradient-to-r from-dream-400 to-mint-400"
            initial={{ width: 0 }}
            animate={{ width: `${currentIndex >= 0 ? (currentIndex / (referralSteps.length - 1)) * 100 : 0}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />

          <div className="relative grid grid-cols-5 gap-2">
            {referralSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentIndex >= index;
              const isCurrent = currentIndex === index;

              return (
                <div key={step.key} className="flex flex-col items-center">
                  <motion.div
                    className={cn(
                      'relative flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all',
                      isCompleted
                        ? 'border-mint-400 bg-mint-400/15 text-mint-300'
                        : 'border-night-600 bg-night-700/50 text-silver-500'
                    )}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
                  >
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-dream-400/50"
                        animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <Icon className="h-6 w-6" />
                  </motion.div>
                  <div
                    className={cn(
                      'mt-2 text-center text-xs font-medium',
                      isCompleted ? 'text-white' : 'text-silver-500'
                    )}
                  >
                    {step.label}
                  </div>
                  <div
                    className={cn(
                      'mt-0.5 text-[10px]',
                      isCurrent ? 'text-dream-300' : 'text-silver-600'
                    )}
                  >
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function ReferralDetailCard() {
  const referralRecords = useAppStore((s) => s.referralRecords);
  const latest = referralRecords.slice(-1)[0];

  if (!latest) return null;

  const statusLabelMap: Record<ReferralStatus, string> = {
    pending_auth: '等待用户授权',
    data_packaging: '睡眠数据打包中',
    report_generated: '已生成转诊报告',
    hospital_matched: '已匹配合作医院',
    appointment_scheduled: '已预约远程初筛',
    consultation_completed: '初筛已完成',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.25 }}
    >
      <GlassCard className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">当前转诊详情</div>
            <div className="text-xs text-silver-500">
              转诊单号 · <span className="font-mono">{latest.id.slice(-8).toUpperCase()}</span>
            </div>
          </div>
          <Chip variant={latest.status === 'consultation_completed' ? 'mint' : 'dream'}>
            {statusLabelMap[latest.status]}
          </Chip>
        </div>

        {latest.matchedHospital && (
          <div className="mb-5 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-dream-400/20 to-mint-400/20 border border-dream-400/20">
                <Hospital className="h-7 w-7 text-dream-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-white">{latest.matchedHospital.name}</h4>
                  <Chip variant="mint" className="text-[10px] py-0">
                    {latest.matchedHospital.level}
                  </Chip>
                  <Chip variant="dream" className="text-[10px] py-0">
                    {latest.matchedHospital.cooperationType}
                  </Chip>
                </div>
                <p className="mt-1 text-xs text-silver-400">
                  {latest.matchedHospital.department}
                </p>
                <div className="mt-2 flex items-center gap-4 text-[11px] text-silver-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {latest.matchedHospital.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Stethoscope size={12} />
                    {latest.matchedHospital.doctorsCount} 位睡眠专科医生
                  </span>
                  <span className="flex items-center gap-1 text-dream-300">
                    <Star size={12} className="fill-current" />
                    {latest.matchedHospital.rating}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {latest.appointment ? (
          <div className="rounded-2xl border border-mint-400/20 bg-mint-400/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <CalendarCheck className="h-4 w-4 text-mint-300" />
              <span className="text-sm font-medium text-white">远程初筛预约</span>
              {latest.appointment.status === 'completed' && (
                <Chip variant="mint" className="py-0 text-[10px]">
                  <CheckCircle2 size={10} />
                  已完成
                </Chip>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[10px] text-silver-500">预约时间</div>
                <div className="mt-0.5 font-mono text-sm text-silver-200">
                  {dayjs(latest.appointment.scheduledAt).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-silver-500">主治医生</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-sm text-silver-200">
                  <User size={14} className="text-dream-300" />
                  {latest.appointment.doctorName}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-silver-500">咨询方式</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-sm text-silver-200">
                  {latest.appointment.consultationType === 'video' ? (
                    <Video size={14} className="text-mint-300" />
                  ) : latest.appointment.consultationType === 'phone' ? (
                    <Phone size={14} className="text-dream-300" />
                  ) : (
                    <MapPin size={14} className="text-coral-300" />
                  )}
                  {latest.appointment.consultationType === 'video'
                    ? '视频问诊'
                    : latest.appointment.consultationType === 'phone'
                      ? '电话问诊'
                      : '线下到院'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-silver-500">预约时长</div>
                <div className="mt-0.5 font-mono text-sm text-silver-200">
                  {latest.appointment.duration} 分钟
                </div>
              </div>
            </div>
            {latest.appointment.meetingLink && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-night-800/60 px-4 py-3 border border-white/5">
                <div className="min-w-0">
                  <div className="text-[10px] text-silver-500">视频问诊链接</div>
                  <div className="mt-0.5 truncate font-mono text-xs text-mint-300">
                    {latest.appointment.meetingLink}
                  </div>
                </div>
                <PillButton variant="mint" size="sm">
                  进入诊室
                </PillButton>
              </div>
            )}
            {latest.consultationResult && (
              <div className="mt-4 rounded-xl bg-white/[0.03] p-3 border border-white/5">
                <div className="text-[10px] text-silver-500 mb-1">医生初筛结论</div>
                <p className="text-xs text-silver-200 leading-relaxed">{latest.consultationResult}</p>
              </div>
            )}
          </div>
        ) : (
          latest.status !== 'pending_auth' && (
            <div className="rounded-2xl border border-dream-400/20 bg-dream-400/5 p-4 flex items-center gap-3">
              <RefreshCw className="h-5 w-5 text-dream-300 animate-spin" style={{ animationDuration: '3s' }} />
              <div>
                <div className="text-sm text-white">正在为您匹配最佳就诊时间...</div>
                <div className="text-xs text-silver-400 mt-0.5">预计将在 2 小时内通知您预约结果</div>
              </div>
            </div>
          )
        )}

        <div className="mt-4 flex items-center gap-2 text-[10px] text-silver-500">
          <Shield size={11} />
          所有医疗数据均端到端加密传输，仅用于本次转诊评估
        </div>
      </GlassCard>
    </motion.div>
  );
}

function FollowUpRecords() {
  const records = [
    {
      id: 'fu-001',
      date: dayjs().subtract(2, 'day').toISOString(),
      type: '复诊提醒',
      title: '睡眠监测数据已同步至医生端',
      desc: '连续 3 晚 AHI 指数显示轻度改善，医生建议维持当前方案。',
      doctor: '李主任',
      status: 'done',
    },
    {
      id: 'fu-002',
      date: dayjs().subtract(7, 'day').toISOString(),
      type: '首次随访',
      title: '远程初筛视频问诊已完成',
      desc: '初步诊断为轻度阻塞性睡眠呼吸暂停，建议家庭呼吸机试用 + 体位治疗。',
      doctor: '王副主任',
      status: 'done',
    },
    {
      id: 'fu-003',
      date: dayjs().subtract(14, 'day').toISOString(),
      type: '复查计划',
      title: '已创建 30 天睡眠干预复查计划',
      desc: '每周数据自动上报，每 2 周进行一次远程评估。',
      doctor: '系统自动',
      status: 'done',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35 }}
    >
      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">复查与随访记录</div>
            <div className="text-xs text-silver-500">医疗闭环全程可追溯</div>
          </div>
          <RefreshCw className="h-4 w-4 text-silver-500" />
        </div>

        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-mint-400/50 via-dream-400/30 to-transparent" />

          <div className="space-y-5">
            {records.map((r, idx) => (
              <div key={r.id} className="relative pl-10">
                <div
                  className={cn(
                    'absolute left-2.5 top-1 flex h-3 w-3 items-center justify-center rounded-full',
                    r.status === 'done' ? 'bg-mint-400 shadow-[0_0_8px_rgba(123,200,164,0.6)]' : 'bg-night-500 ring-2 ring-dream-400'
                  )}
                />
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-dream-400/20 hover:bg-white/[0.04]">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Chip variant={idx === 0 ? 'mint' : 'dream'} className="py-0 text-[10px]">
                        {r.type}
                      </Chip>
                      <h5 className="text-sm font-medium text-white">{r.title}</h5>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-silver-500">
                      <Clock size={10} />
                      <span>{dayjs(r.date).format('MM-DD HH:mm')}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-silver-400 leading-relaxed">{r.desc}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-silver-500">
                    <Stethoscope size={11} className="text-dream-300" />
                    跟进：{r.doctor}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function RiskHistoryList() {
  const assessments = useAppStore((s) => s.riskAssessments);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">风险评估历史</div>
            <div className="text-xs text-silver-500">共 {assessments.length} 次评估</div>
          </div>
          <TrendingUp className="h-4 w-4 text-silver-500" />
        </div>

        <div className="space-y-2">
          {assessments
            .slice()
            .reverse()
            .map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="flex items-center gap-4 rounded-2xl border border-white/5 bg-night-800/40 p-4 transition-all hover:border-white/10 hover:bg-night-800/60"
              >
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                    riskLevelBg(item.overallRisk)
                  )}
                >
                  <Activity className={cn('h-5 w-5', riskLevelColor(item.overallRisk))} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-medium', riskLevelColor(item.overallRisk))}>
                      {item.overallRisk === 'low'
                        ? '低风险'
                        : item.overallRisk === 'moderate'
                          ? '中风险'
                          : '高风险'}
                    </span>
                    {item.referralTriggered && (
                      <Chip variant="coral" className="py-0 text-[10px]">
                        已触发转诊
                      </Chip>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-silver-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatDateLabel(item.assessedAt)}</span>
                    <span>·</span>
                    <span className="font-mono">{dayjs(item.assessedAt).format('HH:mm')}</span>
                    {item.ahiBasedRisk && (
                      <>
                        <span>·</span>
                        <span>AHI {item.ahiBasedRisk.ahiValue.toFixed(1)}</span>
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-silver-600" />
              </motion.div>
            ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default function RiskPage() {
  const assessments = useAppStore((s) => s.riskAssessments);
  const latest = useMemo(() => assessments.slice(-1)[0], [assessments]);
  const createReferral = useAppStore((s) => s.createReferral);
  const [referring, setReferring] = useState(false);

  const handleReferral = () => {
    if (!latest) return;
    setReferring(true);
    createReferral(latest.id);
    setTimeout(() => setReferring(false), 1500);
  };

  return (
    <div className="relative min-h-full space-y-6 pb-32">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-white">风险评估中心</h1>
          <p className="mt-1 text-sm text-silver-400">
            基于DSM-5标准的睡眠健康多维风险映射
          </p>
        </div>
        <Chip variant="default">
          <Shield className="h-3 w-3" />
          数据加密存储
        </Chip>
      </motion.div>

      <RiskLevelCard level={latest?.overallRisk ?? 'low'} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <GlassCard className="p-6">
            {latest && <DSM5RadarChart dimensions={latest.dsm5Mapping} />}
          </GlassCard>
        </motion.div>
        <AHICard />
      </div>

      <ReferralStepper />
      <ReferralDetailCard />
      <FollowUpRecords />
      <RiskHistoryList />

      <motion.div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-gradient-night/95 px-6 py-5 backdrop-blur-xl"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.8, type: 'spring', stiffness: 100 }}
      >
        <div className="container mx-auto max-w-3xl flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <div className="text-xs text-silver-500">对接全国TOP睡眠专科</div>
            <div className="mt-0.5 text-sm text-silver-300">
              匹配 {useAppStore.getState().hospitals.length} 家合作三甲医院
            </div>
          </div>
          <div className="flex-1 sm:flex-none">
            <PillButton
              variant="coral"
              size="lg"
              className="w-full gap-2"
              onClick={handleReferral}
              disabled={referring}
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              {referring ? '转诊中...' : '立即转诊'}
            </PillButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

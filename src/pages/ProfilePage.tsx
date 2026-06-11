import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mic,
  Smartphone,
  Database,
  HeartPulse,
  Shield,
  Bell,
  Moon,
  Sun,
  Info,
  ChevronRight,
  Download,
  Music2,
  Eye,
  X,
  Fingerprint,
  Play,
  Copyright,
  CalendarDays,
  Clock,
  Settings as SettingsIcon,
  Activity,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { GlassCard, Chip } from '@/components/ui';
import { cn, dayjs, formatDuration } from '@/lib/utils';
import type { UserSettings, AudioTrack } from '@/types';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Switch({ checked, onChange, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-dream-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-800',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-dream-400' : 'bg-night-600'
      )}
    >
      <motion.span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0',
          'transition-transform'
        )}
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

interface SettingRowProps {
  icon: React.ElementType;
  label: string;
  description?: string;
  value?: React.ReactNode;
  onClick?: () => void;
  hasArrow?: boolean;
}

function SettingRow({ icon: Icon, label, description, value, onClick, hasArrow = true }: SettingRowProps) {
  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-night-700/60 text-silver-300">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        {description && <div className="mt-0.5 text-xs text-silver-500">{description}</div>}
      </div>
      {value && <div className="shrink-0">{value}</div>}
      {hasArrow && !value && <ChevronRight className="h-4 w-4 shrink-0 text-silver-600" />}
    </>
  );

  if (value) {
    return (
      <motion.div
        whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
        className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-white/5"
    >
      {content}
    </motion.button>
  );
}

function ProfileHeader() {
  const user = useAppStore((s) => s.user);
  const registeredDays = dayjs().diff(dayjs(user.createdAt), 'day');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <GlassCard className="relative overflow-hidden p-6">
        <motion.div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-dream-400/20 blur-3xl"
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <div className="relative flex items-center gap-5">
          <motion.div
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-dream-400 to-night-500 ring-4 ring-dream-400/20"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <User className="h-9 w-9 text-white" />
            <motion.div
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-mint-400 ring-4 ring-night-800"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Shield className="h-3.5 w-3.5 text-night-800" />
            </motion.div>
          </motion.div>

          <div className="min-w-0 flex-1">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="truncate text-xl font-display font-bold text-white">
                {user.nickname}
              </h2>
              <Chip variant="dream">认证用户</Chip>
            </motion.div>
            <motion.div
              className="mt-1 flex items-center gap-2 text-sm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Smartphone className="h-3.5 w-3.5 text-silver-500" />
              <span className="font-mono text-silver-400">{user.phone}</span>
            </motion.div>
            <motion.div
              className="mt-1 flex items-center gap-2 text-xs text-silver-500"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CalendarDays className="h-3 w-3" />
              <span>已注册 {registeredDays} 天 · {dayjs(user.createdAt).format('YYYY年MM月DD日')}加入</span>
            </motion.div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function PrivacySection() {
  const user = useAppStore((s) => s.user);
  const toggleMedicalShare = useAppStore((s) => s.toggleMedicalShare);

  const [settings, setSettings] = useState<UserSettings>(user.settings);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (key === 'medicalShareAllowed') {
      toggleMedicalShare(value as boolean);
    }
  };

  const privacyItems: {
    key: keyof UserSettings;
    icon: React.ElementType;
    label: string;
    description: string;
  }[] = [
    {
      key: 'micAuthorized',
      icon: Mic,
      label: '麦克风权限',
      description: '用于夜间睡眠呼吸与鼾声监测',
    },
    {
      key: 'motionAuthorized',
      icon: Smartphone,
      label: '运动传感器',
      description: '用于体动检测与睡眠分期识别',
    },
    {
      key: 'dataLocalOnly',
      icon: Database,
      label: '数据仅本地存储',
      description: '开启后所有睡眠数据不上传云端',
    },
    {
      key: 'medicalShareAllowed',
      icon: HeartPulse,
      label: '医疗数据分享',
      description: '允许将脱敏数据共享给合作医疗机构用于转诊诊断',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <GlassCard className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-dream-300" />
          <div>
            <div className="text-sm font-medium text-white">隐私与授权</div>
            <div className="text-xs text-silver-500">管理你的数据与权限偏好</div>
          </div>
        </div>

        <div className="space-y-1">
          {privacyItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + idx * 0.05 }}
                className="flex items-center gap-4 rounded-2xl px-4 py-3 transition-colors hover:bg-white/5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-night-700/60 text-silver-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="mt-0.5 text-xs text-silver-500">{item.description}</div>
                </div>
                <Switch
                  checked={settings[item.key] as boolean}
                  onChange={(v) => updateSetting(item.key, v as UserSettings[typeof item.key])}
                />
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function AudioCopyrightModal({ track, onClose }: { track: AudioTrack; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-night-900/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative z-10 w-full max-w-lg rounded-t-3xl border border-white/10 bg-gradient-night p-6 shadow-card sm:rounded-3xl"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-14 w-14 rounded-2xl"
                style={{ background: track.coverImage }}
              />
              <div>
                <div className="text-base font-medium text-white">{track.title}</div>
                <div className="text-xs text-silver-500">{track.author}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-night-700/60 text-silver-400 transition-colors hover:bg-night-700 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/5 bg-night-800/50 p-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-silver-500">
                <Fingerprint className="h-3 w-3" />
                音频水印标识
              </div>
              <div className="font-mono text-sm text-dream-300">
                {track.copyrightInfo.watermarkId}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/5 bg-night-800/50 p-4">
                <div className="mb-1 text-xs text-silver-500">内容ID</div>
                <div className="font-mono text-sm text-silver-200">
                  {track.copyrightInfo.contentId}
                </div>
              </div>
              <div className="rounded-2xl border border-white/5 bg-night-800/50 p-4">
                <div className="mb-1 text-xs text-silver-500">播放次数</div>
                <div className="font-mono text-sm text-mint-300">
                  {track.playCount.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-night-800/50 p-4">
              <div className="mb-2 flex items-center gap-1.5 text-xs text-silver-500">
                <Copyright className="h-3 w-3" />
                版权信息
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-silver-500">版权方</span>
                  <span className="text-silver-200">{track.copyrightInfo.copyrightHolder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-silver-500">授权类型</span>
                  <span className="text-silver-200">{track.copyrightInfo.licenseType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-silver-500">结算方式</span>
                  <span className="text-silver-200">{track.copyrightInfo.royaltyInfo}</span>
                </div>
              </div>
            </div>

            {track.watermarkEmbedded && (
              <div className="flex items-center gap-2 rounded-full bg-mint-400/10 px-3 py-2 text-xs text-mint-300">
                <Shield className="h-3.5 w-3.5" />
                已嵌入不可感知音频水印，版权可追踪
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function AudioCopyrightSection() {
  const tracks = useAppStore((s) => s.audioTracks);
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
  const displayTracks = tracks.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <GlassCard className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 className="h-4 w-4 text-dream-300" />
            <div>
              <div className="text-sm font-medium text-white">音频版权追踪</div>
              <div className="text-xs text-silver-500">已播放音频的水印与版权记录</div>
            </div>
          </div>
          <Chip variant="default">{tracks.length} 条</Chip>
        </div>

        <div className="space-y-1">
          {displayTracks.map((track, idx) => (
            <motion.button
              key={track.id}
              type="button"
              onClick={() => setSelectedTrack(track)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + idx * 0.05 }}
              className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-colors hover:bg-white/5"
            >
              <div
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl"
                style={{ background: track.coverImage }}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                  <Play className="h-5 w-5 text-white" fill="white" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{track.title}</div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-silver-500">
                  <Fingerprint className="h-3 w-3" />
                  <span className="font-mono">{track.copyrightInfo.watermarkId}</span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="flex items-center gap-1 text-xs text-mint-300">
                  <Play className="h-3 w-3" />
                  <span className="font-mono">{track.playCount.toLocaleString()}</span>
                </div>
                <div className="mt-0.5 text-[10px] text-silver-500">
                  {track.copyrightInfo.copyrightHolder}
                </div>
              </div>

              <Eye className="h-4 w-4 shrink-0 text-silver-600" />
            </motion.button>
          ))}
        </div>
      </GlassCard>

      <AnimatePresence>
        {selectedTrack && (
          <AudioCopyrightModal track={selectedTrack} onClose={() => setSelectedTrack(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ReportExportSection() {
  const sleepSessions = useAppStore((s) => s.sleepSessions);
  const riskAssessments = useAppStore((s) => s.riskAssessments);

  const reportTypes = [
    {
      icon: Moon,
      label: '睡眠报告',
      description: `${sleepSessions.length} 晚睡眠数据汇总`,
      badge: 'PDF',
      variant: 'dream' as const,
    },
    {
      icon: Activity,
      label: '风险评估报告',
      description: `${riskAssessments.length} 次DSM-5风险评估`,
      badge: 'PDF',
      variant: 'coral' as const,
    },
    {
      icon: Database,
      label: '原始数据导出',
      description: 'CSV格式，可用于科研或就诊',
      badge: 'CSV',
      variant: 'mint' as const,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <GlassCard className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Download className="h-4 w-4 text-dream-300" />
          <div>
            <div className="text-sm font-medium text-white">历史报告导出</div>
            <div className="text-xs text-silver-500">下载你的睡眠健康数据报告</div>
          </div>
        </div>

        <div className="space-y-2">
          {reportTypes.map((report, idx) => {
            const Icon = report.icon;
            return (
              <motion.div
                key={report.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + idx * 0.05 }}
                className="flex items-center gap-4 rounded-2xl border border-white/5 bg-night-800/40 p-4 transition-all hover:border-white/10 hover:bg-night-800/60"
              >
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                    report.variant === 'dream'
                      ? 'bg-dream-400/15 text-dream-300'
                      : report.variant === 'coral'
                        ? 'bg-coral-400/15 text-coral-300'
                        : 'bg-mint-400/15 text-mint-300'
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">{report.label}</div>
                  <div className="mt-0.5 text-xs text-silver-500">{report.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Chip variant={report.variant}>{report.badge}</Chip>
                  <ChevronRight className="h-4 w-4 text-silver-600" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function SettingsSection() {
  const [notifEnabled, setNotifEnabled] = useState(true);
  const targetSleepMin = useAppStore((s) => s.user.settings.targetSleepDuration);
  const targetBedTime = useAppStore((s) => s.user.settings.targetBedTime);
  const targetWakeTime = useAppStore((s) => s.user.settings.targetWakeTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <GlassCard className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <SettingsIcon className="h-4 w-4 text-dream-300" />
          <div>
            <div className="text-sm font-medium text-white">设置</div>
            <div className="text-xs text-silver-500">个性化你的使用偏好</div>
          </div>
        </div>

        <div className="space-y-1">
          <SettingRow
            icon={Bell}
            label="推送通知"
            description="睡眠提醒、报告生成通知"
            value={<Switch checked={notifEnabled} onChange={setNotifEnabled} />}
            hasArrow={false}
          />

          <SettingRow
            icon={Moon}
            label="目标睡眠时长"
            description="每日推荐睡眠时长"
            value={
              <span className="font-mono text-sm text-dream-300">
                {formatDuration(targetSleepMin * 60)}
              </span>
            }
          />

          <SettingRow
            icon={Clock}
            label="目标作息"
            description="入睡与起床时间目标"
            value={
              <div className="flex items-center gap-1 text-sm">
                <Moon className="h-3.5 w-3.5 text-dream-300" />
                <span className="font-mono text-dream-300">{targetBedTime}</span>
                <span className="text-silver-600 mx-1">→</span>
                <Sun className="h-3.5 w-3.5 text-coral-300" />
                <span className="font-mono text-coral-300">{targetWakeTime}</span>
              </div>
            }
          />

          <SettingRow
            icon={Info}
            label="关于我们"
            description="版本 v1.0.0 · 用户协议 · 隐私政策"
          />
        </div>
      </GlassCard>
    </motion.div>
  );
}

export default function ProfilePage() {
  return (
    <div className="relative min-h-full space-y-6 pb-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-white">个人中心</h1>
          <p className="mt-1 text-sm text-silver-400">管理你的账户、隐私与偏好设置</p>
        </div>
        <Chip variant="default">
          <Shield className="h-3 w-3" />
          隐私保护
        </Chip>
      </motion.div>

      <ProfileHeader />
      <PrivacySection />
      <AudioCopyrightSection />
      <ReportExportSection />
      <SettingsSection />
    </div>
  );
}

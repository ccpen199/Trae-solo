import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export { dayjs };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}小时${mins}分`;
  return `${mins}分钟`;
}

export function formatTimeShort(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export function formatClockTime(isoString: string): string {
  return dayjs(isoString).format('HH:mm');
}

export function formatDateLabel(isoString: string): string {
  const d = dayjs(isoString);
  const today = dayjs().startOf('day');
  if (d.isSame(today, 'day')) return '今天';
  if (d.isSame(today.subtract(1, 'day'), 'day')) return '昨天';
  return d.format('MM月DD日');
}

export function formatSecondsToTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function sleepQualityColor(score: number): string {
  if (score >= 85) return 'text-mint-400';
  if (score >= 70) return 'text-night-200';
  if (score >= 55) return 'text-dream-300';
  return 'text-coral-400';
}

export function riskLevelColor(level: string): string {
  if (level === 'low') return 'text-mint-400';
  if (level === 'moderate') return 'text-dream-300';
  return 'text-coral-400';
}

export function riskLevelBg(level: string): string {
  if (level === 'low') return 'bg-mint-400/20 border-mint-400/30 text-mint-300';
  if (level === 'moderate') return 'bg-dream-400/20 border-dream-400/30 text-dream-300';
  return 'bg-coral-400/20 border-coral-400/30 text-coral-300';
}

export function stageColor(stage: string): string {
  switch (stage) {
    case 'deep':
      return '#3B4F8A';
    case 'rem':
      return '#9B7EDB';
    case 'light':
      return '#6B82C9';
    case 'awake':
      return '#FF6B6B';
    default:
      return '#6B82C9';
  }
}

export function stageLabel(stage: string): string {
  switch (stage) {
    case 'deep':
      return '深睡';
    case 'rem':
      return 'REM';
    case 'light':
      return '浅睡';
    case 'awake':
      return '清醒';
    default:
      return stage;
  }
}

export function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    anxiety: '焦虑缓解',
    stress: '压力释放',
    insomnia: '深度失眠',
    meditation: '专注冥想',
  };
  return map[cat] || cat;
}

export function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    anxiety: 'chip-coral',
    stress: 'chip-dream',
    insomnia: 'chip-mint',
    meditation: 'chip',
  };
  return map[cat] || 'chip';
}

export function generateDeviceFingerprint(): string {
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  const ctx = canvas?.getContext('2d');
  let fingerprint = 'device-';
  if (ctx && canvas) {
    ctx.font = '14px Arial';
    ctx.fillText('sleep-fingerprint', 0, 14);
    fingerprint += canvas.toDataURL().slice(-32);
  } else {
    fingerprint += Math.random().toString(36).slice(2, 10);
  }
  return fingerprint;
}

export function embedWatermark(audioId: string): string {
  return `WM-${audioId}-${Date.now().toString(36).toUpperCase()}`;
}

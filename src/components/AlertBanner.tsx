import { useState } from 'react';
import { AlertTriangle, ChevronDown, Clock, X } from 'lucide-react';
import type { WeatherAlert } from '../../shared/types';
import { cn } from '../lib/utils';

interface AlertBannerProps {
  alert: WeatherAlert;
  onClose?: () => void;
  onViewDetail?: (alert: WeatherAlert) => void;
}

const alertLevelConfig = {
  blue: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/30',
    bar: 'bg-blue-500',
  },
  yellow: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/30',
    bar: 'bg-yellow-500',
  },
  orange: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/30',
    bar: 'bg-orange-500',
  },
  red: {
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
    text: 'text-red-400',
    glow: 'shadow-red-500/30',
    bar: 'bg-red-500',
  },
};

function getAlertLevel(levelCode?: number, level?: string): keyof typeof alertLevelConfig {
  if (level) {
    const levelLower = level.toLowerCase();
    if (levelLower.includes('red') || levelLower.includes('红')) return 'red';
    if (levelLower.includes('orange') || levelLower.includes('橙')) return 'orange';
    if (levelLower.includes('yellow') || levelLower.includes('黄')) return 'yellow';
    if (levelLower.includes('blue') || levelLower.includes('蓝')) return 'blue';
  }
  if (levelCode !== undefined) {
    if (levelCode >= 4) return 'red';
    if (levelCode >= 3) return 'orange';
    if (levelCode >= 2) return 'yellow';
    return 'blue';
  }
  return 'blue';
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hour}:${minute}`;
}

export default function AlertBanner({ alert, onClose, onViewDetail }: AlertBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const level = getAlertLevel(alert.levelCode, alert.level);
  const config = alertLevelConfig[level];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border backdrop-blur-md transition-all duration-300',
        config.bg,
        config.border,
        'shadow-lg',
        config.glow
      )}
    >
      <div className={cn('absolute left-0 top-0 bottom-0 w-1.5', config.bar, 'animate-pulse')} />

      <div className="flex items-center justify-between p-4 pl-5">
        <div
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={() => {
            setExpanded(!expanded);
            onViewDetail?.(alert);
          }}
        >
          <div className={cn('flex-shrink-0', config.text)}>
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-bold rounded-md',
                  config.bg,
                  config.text,
                  'border',
                  config.border
                )}
              >
                {alert.level || '预警'}
              </span>
              <span className="text-white font-medium truncate">{alert.title}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-slate-400 text-xs">
                发布时间: {formatTime(alert.publishTime)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              'p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors',
              expanded && 'rotate-180'
            )}
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4 pt-0 border-t border-white/10">
          <div className="pt-4">
            <p className="text-slate-300 text-sm leading-relaxed">{alert.content}</p>
            {alert.defenseGuide && (
              <div className="mt-3">
                <p className="text-white text-sm font-medium mb-1">防御指南:</p>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {alert.defenseGuide}
                </p>
              </div>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span>预警类型: {alert.type}</span>
              <span>有效期至: {formatTime(alert.endTime)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={cn(
            'absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent',
            'animate-[shimmer_2.5s_infinite]'
          )}
          style={{ animation: 'shimmer 2.5s infinite' }}
        />
      </div>
    </div>
  );
}

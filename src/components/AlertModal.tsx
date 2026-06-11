import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  X,
  Clock,
  Shield,
  Phone,
  Check,
  Send,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import type { WeatherAlert } from '../../shared/types';
import { cn } from '../lib/utils';

interface AlertModalProps {
  alert: WeatherAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

const alertLevelConfig = {
  blue: {
    bg: 'from-blue-600/30 to-blue-900/50',
    border: 'border-blue-500/50',
    text: 'text-blue-400',
    badgeBg: 'bg-blue-500',
    ring: 'ring-blue-500/50',
    glow: 'shadow-blue-500/50',
    buttonBg: 'bg-blue-500 hover:bg-blue-600',
  },
  yellow: {
    bg: 'from-yellow-600/30 to-yellow-900/50',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    badgeBg: 'bg-yellow-500',
    ring: 'ring-yellow-500/50',
    glow: 'shadow-yellow-500/50',
    buttonBg: 'bg-yellow-500 hover:bg-yellow-600',
  },
  orange: {
    bg: 'from-orange-600/30 to-orange-900/50',
    border: 'border-orange-500/50',
    text: 'text-orange-400',
    badgeBg: 'bg-orange-500',
    ring: 'ring-orange-500/50',
    glow: 'shadow-orange-500/50',
    buttonBg: 'bg-orange-500 hover:bg-orange-600',
  },
  red: {
    bg: 'from-red-600/30 to-red-900/50',
    border: 'border-red-500/50',
    text: 'text-red-400',
    badgeBg: 'bg-red-500',
    ring: 'ring-red-500/50',
    glow: 'shadow-red-500/50',
    buttonBg: 'bg-red-500 hover:bg-red-600',
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
  return `${month}月${day}日 ${hour}:${minute}`;
}

export default function AlertModal({ alert, isOpen, onClose, onConfirm }: AlertModalProps) {
  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSmsSent(false);
      setSmsSending(false);
      setPhoneNumber('');
    }
  }, [isOpen]);

  if (!alert || !isOpen) return null;

  const level = getAlertLevel(alert.levelCode, alert.level);
  const config = alertLevelConfig[level];

  const handleSendSms = async () => {
    if (!phoneNumber) return;
    setSmsSending(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSmsSending(false);
    setSmsSent(true);
  };

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative w-full max-w-lg rounded-2xl overflow-hidden',
          'bg-gradient-to-b',
          config.bg,
          'border',
          config.border,
          'shadow-2xl',
          config.glow,
          'animate-[fadeIn_0.3s_ease-out]'
        )}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-white/5 blur-3xl" />

        <div className="relative p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl flex items-center justify-center ring-4',
                  config.badgeBg,
                  config.ring,
                  'animate-pulse'
                )}
              >
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div>
                <span
                  className={cn(
                    'inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-1',
                    config.badgeBg
                  )}
                >
                  {alert.level || '预警'}
                </span>
                <h2 className="text-xl font-bold text-white">{alert.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 text-sm">{alert.cityName}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-slate-400">发布时间: </span>
                <span className="text-white">{formatTime(alert.publishTime)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="flex-1">
                <span className="text-slate-400">预警类型: </span>
                <span className="text-white">{alert.type}</span>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl">
              <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className={cn('w-4 h-4', config.text)} />
                预警详情
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">{alert.content}</p>
            </div>

            {alert.defenseGuide && (
              <div className="glass-card p-4 rounded-xl">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  防御指南
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {alert.defenseGuide}
                </p>
              </div>
            )}

            <div className="glass-card p-4 rounded-xl">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Phone className="w-4 h-4 text-cyan-400" />
                短信通知提醒
              </h3>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="请输入手机号码"
                  className="flex-1 px-3 py-2 bg-slate-800/60 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                  disabled={smsSending || smsSent}
                />
                <button
                  onClick={handleSendSms}
                  disabled={smsSending || smsSent || !phoneNumber}
                  className={cn(
                    'px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                    config.buttonBg
                  )}
                >
                  {smsSent ? (
                    <>
                      <Check className="w-4 h-4" />
                      已发送
                    </>
                  ) : smsSending ? (
                    <>
                      <Send className="w-4 h-4 animate-pulse" />
                      发送中
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      发送
                    </>
                  )}
                </button>
              </div>
              {smsSent && (
                <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  预警通知短信已发送至 {phoneNumber}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-700/60 hover:bg-slate-600/60 text-white font-medium transition-colors border border-slate-600/50"
            >
              稍后再看
            </button>
            <button
              onClick={handleConfirm}
              className={cn(
                'flex-1 px-4 py-3 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2',
                config.buttonBg
              )}
            >
              <Check className="w-5 h-5" />
              我已知晓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

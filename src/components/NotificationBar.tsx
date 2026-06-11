import React, { useEffect } from 'react';
import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { useVoice } from '@/hooks/useVoice';
import type { NotificationLevel } from '@/store/notificationStore';

const levelConfig: Record<NotificationLevel, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  info: {
    bg: 'bg-sky-50',
    border: 'border-sky-400',
    text: 'text-sky-800',
    icon: <Info className="w-6 h-6 text-sky-500" />,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-800',
    icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
  },
  danger: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    text: 'text-red-800',
    icon: <AlertCircle className="w-6 h-6 text-red-500" />,
  },
};

export default function NotificationBar() {
  const { notifications, hideNotification } = useNotificationStore();
  const { speak } = useVoice();

  useEffect(() => {
    notifications.forEach((notification) => {
      speak(notification.message);
    });
  }, [notifications, speak]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col gap-2 p-3" role="alert" aria-live="polite">
      {notifications.map((notification) => {
        const config = levelConfig[notification.level];
        return (
          <div
            key={notification.id}
            className={`${config.bg} ${config.border} ${config.text} border-2 rounded-2xl p-4 shadow-lg flex items-center gap-4 min-h-[56px]`}
          >
            <div className="flex-shrink-0">{config.icon}</div>
            <div className="flex-1 text-xl font-medium leading-relaxed">{notification.message}</div>
            <button
              onClick={() => hideNotification(notification.id)}
              className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl hover:bg-black/10 transition-colors"
              aria-label="关闭通知"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

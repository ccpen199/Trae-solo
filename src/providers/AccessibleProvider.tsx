import React, { useEffect, useRef } from 'react';
import { useAccessibilityStore } from '@/store/accessibilityStore';
import { useNotificationStore } from '@/store/notificationStore';
import NotificationBar from '@/components/NotificationBar';

interface AccessibleProviderProps {
  children: React.ReactNode;
}

export default function AccessibleProvider({ children }: AccessibleProviderProps) {
  const { fontSize, contrast } = useAccessibilityStore();
  const { showNotification } = useNotificationStore();
  const originalOpenRef = useRef<typeof window.open | null>(null);
  const originalAlertRef = useRef<typeof window.alert | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    const fontSizeMap = {
      normal: '20px',
      large: '24px',
      xlarge: '28px',
    };

    root.style.setProperty('--font-size-base', fontSizeMap[fontSize]);

    if (contrast === 'high') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    root.setAttribute('data-font-size', fontSize);
    root.setAttribute('data-contrast', contrast);
  }, [fontSize, contrast]);

  useEffect(() => {
    originalOpenRef.current = window.open;
    originalAlertRef.current = window.alert;

    window.open = function blockedOpen() {
      showNotification('为了您的安全，已禁止外部链接跳转', 'warning');
      return null;
    };

    window.alert = function blockedAlert(message: string) {
      showNotification(message, 'info');
    };

    return () => {
      if (originalOpenRef.current) {
        window.open = originalOpenRef.current;
      }
      if (originalAlertRef.current) {
        window.alert = originalAlertRef.current;
      }
    };
  }, [showNotification]);

  return (
    <>
      <NotificationBar />
      {children}
    </>
  );
}

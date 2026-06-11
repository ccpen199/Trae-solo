import React, { useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const toastConfig: Record<ToastType, { icon: React.ComponentType<{ className?: string }>; bg: string; border: string; text: string; iconColor: string }> = {
  success: { icon: CheckCircle2, bg: 'bg-success-500/10', border: 'border-success-500/30', text: 'text-success-400', iconColor: 'text-success-400' },
  error: { icon: AlertCircle, bg: 'bg-danger-500/10', border: 'border-danger-500/30', text: 'text-danger-400', iconColor: 'text-danger-400' },
  warning: { icon: AlertTriangle, bg: 'bg-warning-500/10', border: 'border-warning-500/30', text: 'text-warning-400', iconColor: 'text-warning-400' },
  info: { icon: Info, bg: 'bg-info-500/10', border: 'border-info-500/30', text: 'text-info-400', iconColor: 'text-info-400' },
};

const ToastItem: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  React.useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div className={cn('flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg animate-slide-up', config.bg, config.border)}>
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor)} />
      <p className={cn('text-sm flex-1', config.text)}>{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

let toastId = 0;
let addToastExternal: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export function showToast(type: ToastType, message: string, duration?: number) {
  if (addToastExternal) {
    addToastExternal({ type, message, duration });
  }
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastId}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  React.useEffect(() => {
    addToastExternal = addToast;
    return () => { addToastExternal = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 w-96 max-w-[calc(100vw-2rem)]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;

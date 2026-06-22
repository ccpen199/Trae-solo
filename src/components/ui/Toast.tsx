import { CheckCircle2, XCircle, Info, X, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import type { ToastType } from '@/types';
import { cn } from '../../utils';

const toastConfig: Record<
  ToastType,
  { bg: string; icon: typeof CheckCircle2; iconColor: string }
> = {
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: CheckCircle2,
    iconColor: 'text-success',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: XCircle,
    iconColor: 'text-danger',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: Info,
    iconColor: 'text-primary',
  },
  warning: {
    bg: 'bg-yellow-50 border-yellow-200',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
  },
};

interface ToastItemProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onRemove: (id: string) => void;
}

function ToastItem({ id, type, message, duration = 3000, onRemove }: ToastItemProps) {
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 20 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: -20, x: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[280px] max-w-sm',
        config.bg,
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.iconColor)} />
      <p className="flex-1 text-sm text-gray-800 leading-relaxed">{message}</p>
      <button
        onClick={() => onRemove(id)}
        className="shrink-0 p-0.5 rounded-md hover:bg-black/5 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem
              id={toast.id}
              type={toast.type}
              message={toast.message}
              duration={toast.duration}
              onRemove={removeToast}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default ToastContainer;

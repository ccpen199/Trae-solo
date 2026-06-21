import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const iconMap = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const styleMap: Record<ToastType, string> = {
  success: 'border-jade-400 bg-rice-50',
  error: 'border-cinnabar-400 bg-rice-50',
  warning: 'border-gold-500 bg-rice-50',
  info: 'border-porcelain-400 bg-rice-50',
};

const iconColorMap: Record<ToastType, string> = {
  success: 'text-jade-600',
  error: 'text-cinnabar-500',
  warning: 'text-gold-600',
  info: 'text-porcelain-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, duration = 3000) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast],
  );

  const contextValue: ToastContextValue = {
    showToast,
    success: (message, duration) => showToast('success', message, duration),
    error: (message, duration) => showToast('error', message, duration),
    warning: (message, duration) => showToast('warning', message, duration),
    info: (message, duration) => showToast('info', message, duration),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => {
              const Icon = iconMap[toast.type];
              return (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, x: 100, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 100, scale: 0.9 }}
                  transition={{ duration: 0.2, type: 'spring', damping: 25, stiffness: 300 }}
                  className={cn(
                    'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-md border-l-4 shadow-scroll card',
                    styleMap[toast.type],
                  )}
                >
                  <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', iconColorMap[toast.type])} />
                  <p className="flex-1 text-sm text-jade-700">{toast.message}</p>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="p-0.5 -m-0.5 text-jade-400 hover:text-jade-600 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

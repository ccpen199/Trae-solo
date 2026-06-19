import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, type: ToastType = 'info', duration: number = 3000) {
  useToastStore.getState().addToast({ message, type, duration });
}

toast.success = (message: string, duration?: number) => toast(message, 'success', duration);
toast.error = (message: string, duration?: number) => toast(message, 'error', duration);
toast.warning = (message: string, duration?: number) => toast(message, 'warning', duration);
toast.info = (message: string, duration?: number) => toast(message, 'info', duration);

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-sky-500" />,
};

const bgMap: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50',
  error: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info: 'border-sky-200 bg-sky-50',
};

const textMap: Record<ToastType, string> = {
  success: 'text-emerald-800',
  error: 'text-red-800',
  warning: 'text-amber-800',
  info: 'text-sky-800',
};

function ToastNotification({ toast: t }: { toast: ToastItem }) {
  const removeToast = useToastStore((state) => state.removeToast);

  useEffect(() => {
    const duration = t.duration ?? 3000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        removeToast(t.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [t.id, t.duration, removeToast]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg min-w-[280px] max-w-[400px]',
        bgMap[t.type]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{iconMap[t.type]}</div>
      <div className={cn('flex-1 text-sm font-medium', textMap[t.type])}>{t.message}</div>
      <button
        onClick={() => removeToast(t.id)}
        className="flex-shrink-0 rounded-md p-1 opacity-60 hover:opacity-100 hover:bg-white/50 transition-all"
      >
        <X className={cn('h-4 w-4', textMap[t.type])} />
      </button>
    </motion.div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastNotification toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

import { useToastStore } from '@/store';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/utils';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertCircle,
};

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type] || Info;
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-[280px]',
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'success' ? 'bg-green-500' :
              'bg-blue-500'
            )}
          >
            <Icon size={20} />
            <span className="flex-1 text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="hover:opacity-80 transition-opacity"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

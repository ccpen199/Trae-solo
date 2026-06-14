import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useAppStore, type ToastType } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap: Record<ToastType, string> = {
  success: "text-emerald-500",
  error: "text-rose-500",
  warning: "text-amber-500",
  info: "text-brand-500",
};

const bgMap: Record<ToastType, string> = {
  success: "bg-emerald-50 border-emerald-200",
  error: "bg-rose-50 border-rose-200",
  warning: "bg-amber-50 border-amber-200",
  info: "bg-brand-50 border-brand-200",
};

export default function Toast() {
  const { toasts, hideToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-down backdrop-blur-sm",
              bgMap[toast.type]
            )}
          >
            <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", colorMap[toast.type])} />
            <p className="flex-1 text-sm text-slate-700 leading-relaxed">{toast.message}</p>
            <button
              onClick={() => hideToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

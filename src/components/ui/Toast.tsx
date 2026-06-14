import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useAppStore, type ToastType } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

const toastStyles: Record<
  ToastType,
  { bg: string; border: string; icon: string; iconBg: string }
> = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "text-emerald-600",
    iconBg: "bg-emerald-100",
  },
  error: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    icon: "text-rose-600",
    iconBg: "bg-rose-100",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-600",
    iconBg: "bg-amber-100",
  },
  info: {
    bg: "bg-brand-50",
    border: "border-brand-200",
    icon: "text-brand-600",
    iconBg: "bg-brand-100",
  },
};

const ToastIcon = ({ type }: { type: ToastType }) => {
  const styles = toastStyles[type];
  const Icon =
    type === "success"
      ? CheckCircle2
      : type === "error"
      ? XCircle
      : type === "warning"
      ? AlertTriangle
      : Info;

  return (
    <div
      className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        styles.iconBg
      )}
    >
      <Icon className={cn("w-5 h-5", styles.icon)} />
    </div>
  );
};

export default function Toast() {
  const { toasts, hideToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => {
        const styles = toastStyles[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              "w-full flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg animate-slide-down pointer-events-auto",
              styles.bg,
              styles.border
            )}
          >
            <ToastIcon type={toast.type} />
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-medium text-slate-800 break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => hideToast(toast.id)}
              className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full hover:bg-white/60 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

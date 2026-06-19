import { useBusinessStore } from '@/store/business'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export default function ToastContainer() {
  const { toasts, removeToast } = useBusinessStore()

  const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  }

  const colorMap = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800',
  }

  const iconColor = {
    success: 'text-emerald-500',
    error: 'text-rose-500',
    warning: 'text-amber-500',
    info: 'text-sky-500',
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type]
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur animate-in slide-in-from-right duration-300 ${colorMap[toast.type]}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor[toast.type]}`} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{toast.title}</div>
              {toast.description && (
                <div className="text-sm opacity-80 mt-0.5">{toast.description}</div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/5 rounded-md transition"
            >
              <X className="w-4 h-4 opacity-60" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

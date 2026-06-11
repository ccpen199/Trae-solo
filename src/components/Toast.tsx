import { useStore } from '@/store'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export default function Toast() {
  const { toasts, dismissToast } = useStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border min-w-[280px] max-w-[400px] animate-fade-in',
            toast.type === 'success' && 'bg-green-50 border-green-200 text-green-800',
            toast.type === 'error' && 'bg-red-50 border-red-200 text-red-800',
            toast.type === 'info' && 'bg-blue-50 border-blue-200 text-blue-800',
          )}
        >
          {toast.type === 'success' && <CheckCircle size={18} className="text-green-500 flex-shrink-0" />}
          {toast.type === 'error' && <XCircle size={18} className="text-red-500 flex-shrink-0" />}
          {toast.type === 'info' && <Info size={18} className="text-blue-500 flex-shrink-0" />}
          <span className="text-sm flex-1">{toast.message}</span>
          <button onClick={() => dismissToast(toast.id)} className="flex-shrink-0 opacity-50 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

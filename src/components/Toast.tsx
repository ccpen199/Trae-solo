import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  show: (toast: Omit<ToastItem, 'id'>) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, duration: 3000, ...toast }])
    const d = toast.duration ?? 3000
    if (d > 0) {
      setTimeout(() => remove(id), d)
    }
    return id
  }, [remove])

  const success = useCallback((title: string, description?: string) => {
    show({ type: 'success', title, description })
  }, [show])

  const error = useCallback((title: string, description?: string) => {
    show({ type: 'error', title, description, duration: 5000 })
  }, [show])

  const info = useCallback((title: string, description?: string) => {
    show({ type: 'info', title, description })
  }, [show])

  return (
    <ToastContext.Provider value={{ show, success, error, info }}>
      {children}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className={`pointer-events-auto w-80 rounded-xl border backdrop-blur-md p-4 shadow-xl ${
                toast.type === 'success'
                  ? 'bg-green-900/80 border-green-500/40'
                  : toast.type === 'error'
                  ? 'bg-shujin-900/80 border-shujin-600/50'
                  : 'bg-wudu-900/80 border-wudu-600/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`shrink-0 w-5 h-5 mt-0.5 ${
                  toast.type === 'success' ? 'text-green-400' :
                  toast.type === 'error' ? 'text-shujin-500' : 'text-jinguan-400'
                }`}>
                  {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                  {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                  {toast.type === 'info' && <Info className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{toast.title}</div>
                  {toast.description && (
                    <div className="text-xs text-wudu-300 mt-0.5 break-words">{toast.description}</div>
                  )}
                </div>
                <button
                  onClick={() => remove(toast.id)}
                  className="shrink-0 p-0.5 rounded hover:bg-white/10 text-wudu-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

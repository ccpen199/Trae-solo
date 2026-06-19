import { Inbox, AlertTriangle, RefreshCw, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title = '暂无数据',
  description = '当前筛选条件下没有相关内容',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('empty-state', className)}>
      {icon || <Inbox className="empty-state-icon" />}
      <h3 className="text-base font-medium text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-4 max-w-sm">{description}</p>
      {action}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = '加载失败',
  description = '网络异常或服务暂时不可用，请稍后重试',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('error-state', className)}>
      <AlertTriangle className="w-10 h-10 text-red-400 mb-2" />
      <h3 className="text-base font-medium text-red-700 mb-1">{title}</h3>
      <p className="text-sm text-red-500 mb-3">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          重新加载
        </button>
      )}
    </div>
  )
}

interface PermissionDeniedProps {
  title?: string
  description?: string
}

export function PermissionDenied({
  title = '无访问权限',
  description = '您当前的角色无权访问此内容，请联系管理员',
}: PermissionDeniedProps) {
  return (
    <div className="empty-state">
      <Lock className="empty-state-icon text-amber-400" />
      <h3 className="text-base font-medium text-amber-700 mb-1">{title}</h3>
      <p className="text-sm text-amber-500 max-w-sm">{description}</p>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="h-40 bg-slate-100 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-100 rounded animate-pulse w-4/5" />
        <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
        <div className="flex justify-between">
          <div className="h-3 bg-slate-100 rounded animate-pulse w-16" />
          <div className="h-3 bg-slate-100 rounded animate-pulse w-16" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
      ))}
    </div>
  )
}

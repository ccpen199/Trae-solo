import { cn } from '@/lib/utils'

interface EmptyProps {
  title?: string;
  description?: string;
  className?: string;
}

export default function Empty({ title = "暂无数据", description = "", className = "" }: EmptyProps) {
  return (
    <div className={cn('flex h-full flex-col items-center justify-center py-12', className)}>
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
      {description && <p className="text-xs text-slate-400">{description}</p>}
    </div>
  )
}

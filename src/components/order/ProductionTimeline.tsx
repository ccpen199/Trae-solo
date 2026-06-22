import {
  FileCheck,
  CreditCard,
  ScanEye,
  Printer,
  Package,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductionNode } from '@/types'

interface ProductionTimelineProps {
  nodes: ProductionNode[]
  className?: string
}

const nodeIconMap: Record<string, typeof FileCheck> = {
  order_received: FileCheck,
  payment_confirmed: CreditCard,
  design_review: ScanEye,
  printing: Printer,
  binding: Package,
  quality_check: ShieldCheck,
  shipping: Truck,
  delivered: CheckCircle2,
  completed: CheckCircle2,
}

export default function ProductionTimeline({ nodes, className }: ProductionTimelineProps) {
  const getNodeIcon = (nodeKey: string) => {
    return nodeIconMap[nodeKey] || Clock
  }

  const formatTime = (timestamp: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCurrentNodeIndex = () => {
    const processingIndex = nodes.findIndex(n => n.status === 'processing')
    if (processingIndex !== -1) return processingIndex
    const completedIndex = nodes.filter(n => n.status === 'completed').length - 1
    if (completedIndex >= 0) return completedIndex
    return 0
  }

  const currentIndex = getCurrentNodeIndex()

  return (
    <div className={cn('rounded-lg bg-white p-6 shadow-soft', className)}>
      <h3 className="mb-6 font-display text-lg font-semibold text-paper-900">
        生产进度
      </h3>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-paper-200" />

        <div className="space-y-6">
          {nodes.map((node, index) => {
            const Icon = getNodeIcon(node.nodeKey)
            const isCompleted = node.status === 'completed'
            const isProcessing = node.status === 'processing'
            const isPending = node.status === 'pending'
            const isFailed = node.status === 'failed'
            const isCurrent = index === currentIndex

            return (
              <div key={node.id} className="relative flex gap-4">
                <div
                  className={cn(
                    'relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted && 'border-brand-500 bg-brand-500 text-white shadow-glow',
                    isProcessing && 'border-brand-400 bg-white text-brand-500 animate-pulse-soft',
                    isPending && 'border-paper-300 bg-paper-100 text-paper-400',
                    isFailed && 'border-red-500 bg-red-50 text-red-500',
                    isCurrent && isProcessing && 'ring-4 ring-brand-200'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}

                  {isProcessing && (
                    <div className="absolute inset-0 rounded-full animate-ping bg-brand-400 opacity-30" />
                  )}
                </div>

                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between">
                    <h4
                      className={cn(
                        'font-medium',
                        isCompleted || isProcessing ? 'text-paper-900' : 'text-paper-400'
                      )}
                    >
                      {node.nodeName}
                    </h4>
                    {node.timestamp && (
                      <span
                        className={cn(
                          'text-xs',
                          isCompleted ? 'text-paper-500' : 'text-paper-400'
                        )}
                      >
                        {formatTime(node.timestamp)}
                      </span>
                    )}
                  </div>

                  {node.operator && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-paper-500">
                      <User className="h-3 w-3" />
                      <span>{node.operator}</span>
                    </div>
                  )}

                  {node.remark && (
                    <p className="mt-2 text-sm text-paper-500">{node.remark}</p>
                  )}

                  {isProcessing && (
                    <div className="mt-2">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-paper-200">
                        <div className="h-full w-1/3 rounded-full bg-gradient-brand animate-shimmer bg-[length:200%_100%]" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

import { motion } from 'framer-motion'
import { Check, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TransferStep } from '@/types'

interface TimelineProps {
  steps: TransferStep[]
}

const stepConfig = {
  done: {
    icon: Check,
    dotColor: 'bg-emerald-500',
    ringColor: 'ring-emerald-500/20',
    lineColor: 'bg-emerald-500',
    textColor: 'text-emerald-700',
  },
  current: {
    icon: Loader2,
    dotColor: 'bg-gov-blue',
    ringColor: 'ring-gov-blue/20',
    lineColor: 'bg-gov-blue',
    textColor: 'text-gov-blue',
  },
  pending: {
    icon: Clock,
    dotColor: 'bg-gray-300',
    ringColor: 'ring-gray-300/20',
    lineColor: 'bg-gray-200',
    textColor: 'text-gov-text-muted',
  },
  timeout: {
    icon: AlertCircle,
    dotColor: 'bg-gov-red',
    ringColor: 'ring-gov-red/20',
    lineColor: 'bg-gov-red',
    textColor: 'text-gov-red',
  },
}

export default function Timeline({ steps }: TimelineProps) {
  return (
    <div className="relative">
      {steps.map((step, index) => {
        const config = stepConfig[step.status]
        const StepIcon = config.icon
        const isLast = index === steps.length - 1

        return (
          <motion.div
            key={step.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: index * 0.1 }}
            className="flex gap-4 relative"
          >
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 ring-4',
                  config.dotColor,
                  config.ringColor
                )}
              >
                <StepIcon
                  className={cn(
                    'w-4 h-4 text-white',
                    step.status === 'current' && 'animate-spin'
                  )}
                />
              </div>

              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 flex-1 my-1',
                    config.lineColor,
                    step.status === 'pending' && 'bg-gray-200'
                  )}
                />
              )}
            </div>

            <div className={cn('pb-8', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  step.status === 'pending' ? 'text-gov-text-secondary' : config.textColor
                )}
              >
                {step.name}
              </p>
              <p className="text-xs text-gov-text-secondary mt-0.5">
                {step.description}
              </p>
              {step.completedAt && (
                <p className="text-xs text-gov-text-muted mt-1">
                  完成时间：{step.completedAt}
                </p>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

import { motion } from 'framer-motion'
import { cn } from '@shared/utils'
import { CheckCircle, Clock } from 'lucide-react'

interface Step {
  id: number
  title: string
  description?: string
  status: 'completed' | 'current' | 'pending'
}

interface SwapFlowProps {
  steps: Step[]
  className?: string
}

export function SwapFlow({ steps, className }: SwapFlowProps) {
  return (
    <div className={cn('w-full', className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="relative flex items-start">
          {index < steps.length - 1 && (
            <div
              className={cn(
                'absolute left-4 top-10 w-0.5 h-16 -translate-x-1/2',
                step.status === 'completed' ? 'bg-cyber-success' : 'bg-cyber-border'
              )}
            />
          )}

          <div className="flex-shrink-0 z-10">
            <motion.div
              initial={false}
              animate={{
                scale: step.status === 'current' ? [1, 1.1, 1] : 1,
              }}
              transition={{ duration: 1, repeat: step.status === 'current' ? Infinity : 0 }}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold',
                step.status === 'completed'
                  ? 'bg-cyber-success border-cyber-success text-cyber-darker'
                  : step.status === 'current'
                  ? 'bg-cyber-accent border-cyber-accent text-cyber-darker shadow-neon-cyan'
                  : 'bg-cyber-darker border-cyber-border text-cyber-muted'
              )}
            >
              {step.status === 'completed' ? (
                <CheckCircle className="w-5 h-5" />
              ) : step.status === 'current' ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : (
                step.id
              )}
            </motion.div>
          </div>

          <div className="ml-4 pb-10 flex-1">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <h4
                className={cn(
                  'font-rajdhani font-semibold text-lg',
                  step.status === 'completed'
                    ? 'text-cyber-success'
                    : step.status === 'current'
                    ? 'text-cyber-accent'
                    : 'text-cyber-muted'
                )}
              >
                {step.title}
              </h4>
              {step.description && (
                <p
                  className={cn(
                    'mt-1 text-sm',
                    step.status === 'pending' ? 'text-cyber-muted/60' : 'text-cyber-muted'
                  )}
                >
                  {step.description}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      ))}
    </div>
  )
}

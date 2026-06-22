import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  label: string
}

interface StepFlowProps {
  steps: Step[]
  currentStep: number
}

export default function StepFlow({ steps, currentStep }: StepFlowProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isPending = index > currentStep

        return (
          <div key={index} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  isCompleted && 'bg-success text-white',
                  isCurrent && 'bg-primary text-white',
                  isPending && 'bg-stone-200 text-stone-400'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-xs mt-1.5 whitespace-nowrap',
                  isCompleted && 'text-success font-medium',
                  isCurrent && 'text-primary font-medium',
                  isPending && 'text-stone-400'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2',
                  isCompleted ? 'bg-success' : 'bg-stone-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

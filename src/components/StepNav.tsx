import { Palette, Package, Hammer, Shield, CheckCircle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepNavProps {
  activeStep: number
  onStepClick?: (step: number) => void
}

const steps = [
  { id: 1, name: '设计', icon: Palette, description: '方案设计' },
  { id: 2, name: '选材', icon: Package, description: '建材选购' },
  { id: 3, name: '施工', icon: Hammer, description: '装修施工' },
  { id: 4, name: '监理', icon: Shield, description: '质量监督' },
  { id: 5, name: '验收', icon: CheckCircle, description: '验收交付' },
]

export default function StepNav({ activeStep, onStepClick }: StepNavProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = activeStep === step.id
          const isCompleted = activeStep > step.id
          const Icon = step.icon

          return (
            <div key={step.id} className="flex-1 relative">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onStepClick?.(step.id)}
                  className={cn(
                    'relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-200'
                      : isCompleted
                      ? 'bg-teal-100 text-teal-600'
                      : 'bg-slate-100 text-slate-400',
                    onStepClick && 'cursor-pointer hover:scale-105'
                  )}
                >
                  {isCompleted ? (
                    <Check size={24} strokeWidth={2.5} />
                  ) : (
                    <Icon size={24} strokeWidth={1.5} />
                  )}
                </button>

                <div className="mt-3 text-center">
                  <p
                    className={cn(
                      'text-sm font-semibold transition-colors',
                      isActive ? 'text-teal-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                    )}
                  >
                    {step.name}
                  </p>
                  <p
                    className={cn(
                      'text-xs mt-0.5',
                      isActive ? 'text-teal-500' : 'text-slate-400'
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="absolute top-7 left-1/2 w-full h-0.5 -translate-y-1/2 z-0">
                  <div
                    className={cn(
                      'h-full transition-all duration-500',
                      isCompleted ? 'bg-teal-500' : 'bg-slate-200'
                    )}
                    style={{
                      width: isCompleted ? '100%' : isActive && index === activeStep - 2 ? '50%' : '0%',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

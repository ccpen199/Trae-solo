import { Check } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: number
}

const steps = ['身份核验', '信息查询', '结果展示']

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1
        const isCompleted = stepNum < currentStep
        const isCurrent = stepNum === currentStep
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                  isCompleted
                    ? 'bg-success border-success text-white'
                    : isCurrent
                    ? 'bg-primary border-primary text-white'
                    : 'border-gray-300 text-gray-400 bg-white'
                }`}
              >
                {isCompleted ? <Check size={18} /> : stepNum}
              </div>
              <span
                className={`mt-1.5 text-xs ${
                  isCurrent ? 'text-primary font-medium' : isCompleted ? 'text-success' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-20 h-0.5 mx-2 mb-5 transition-colors ${
                  stepNum < currentStep ? 'bg-success' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

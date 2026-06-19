import * as React from 'react'
import { cn } from '@/lib/utils'

const LEVEL_LABELS = ['入门', '了解', '熟练', '精通', '专家'] as const
export type SkillLevel = 1 | 2 | 3 | 4 | 5

export interface SkillSliderProps {
  label: string
  value: SkillLevel
  onChange: (value: SkillLevel) => void
  className?: string
  disabled?: boolean
}

const SkillSlider: React.FC<SkillSliderProps> = ({
  label,
  value,
  onChange,
  className = '',
  disabled = false,
}) => {
  const handleClick = (level: SkillLevel) => {
    if (!disabled) {
      onChange(level)
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-semibold gradient-text">
          {LEVEL_LABELS[value - 1]} · L{value}
        </span>
      </div>

      <div className="relative">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-space-indigo-500 via-lavender-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(value / 5) * 100}%` }}
          />
        </div>

        <div className="flex justify-between mt-3">
          {(LEVEL_LABELS as readonly string[]).map((labelText, index) => {
            const level = (index + 1) as SkillLevel
            const isActive = level <= value
            const isCurrent = level === value
            return (
              <button
                key={level}
                type="button"
                onClick={() => handleClick(level)}
                disabled={disabled}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 flex-1 group',
                  'transition-all duration-200',
                  disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                <span
                  className={cn(
                    'w-4 h-4 rounded-full border-2 transition-all duration-300',
                    'group-hover:scale-125',
                    isCurrent
                      ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)] scale-110'
                      : isActive
                        ? 'bg-emerald-300 border-emerald-400'
                        : 'bg-white border-slate-200 group-hover:border-lavender-300',
                  )}
                />
                <span
                  className={cn(
                    'text-[11px] font-medium transition-all duration-200',
                    isActive ? 'text-slate-700' : 'text-slate-400',
                    isCurrent && 'text-emerald-600 font-semibold',
                  )}
                >
                  {labelText}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { SkillSlider }

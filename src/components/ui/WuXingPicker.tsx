import * as React from 'react'
import { cn, getWuXingColor, getWuXingName, type WuXingElement } from '@/lib/utils'

const WU_XING_ELEMENTS: WuXingElement[] = ['metal', 'wood', 'water', 'fire', 'earth']

export interface WuXingPickerProps {
  value?: WuXingElement[]
  onChange?: (value: WuXingElement[]) => void
  size?: 'sm' | 'md' | 'lg'
  multi?: boolean
  className?: string
  disabled?: boolean
}

const sizeStyles = {
  sm: { btn: 'w-10 h-10 text-xs', icon: 'w-4 h-4' },
  md: { btn: 'w-14 h-14 text-base', icon: 'w-5 h-5' },
  lg: { btn: 'w-16 h-16 text-lg', icon: 'w-6 h-6' },
}

export const WuXingPicker: React.FC<WuXingPickerProps> = ({
  value = [],
  onChange,
  size = 'md',
  multi = true,
  className,
  disabled = false,
}) => {
  const [ripples, setRipples] = React.useState<Record<WuXingElement, number>>({
    metal: 0,
    wood: 0,
    water: 0,
    fire: 0,
    earth: 0,
  })

  const handleToggle = (element: WuXingElement, _e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return

    setRipples((prev) => ({ ...prev, [element]: prev[element] + 1 }))

    let newValue: WuXingElement[]
    if (multi) {
      if (value.includes(element)) {
        newValue = value.filter((v) => v !== element)
      } else {
        newValue = [...value, element]
      }
    } else {
      newValue = value.includes(element) ? [] : [element]
    }
    onChange?.(newValue)
  }

  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      {WU_XING_ELEMENTS.map((element) => {
        const isSelected = value.includes(element)
        const color = getWuXingColor(element)
        const rippleCount = ripples[element]

        return (
          <button
            key={element}
            type="button"
            disabled={disabled}
            onClick={(e) => handleToggle(element, e)}
            className={cn(
              'relative rounded-full font-serif font-bold transition-all duration-300 overflow-hidden',
              sizeStyles[size].btn,
              'flex items-center justify-center',
              'border-2',
              isSelected
                ? 'scale-110 shadow-lg'
                : 'hover:scale-105',
              disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
            )}
            style={{
              backgroundColor: isSelected ? color : `${color}20`,
              borderColor: isSelected ? color : `${color}60`,
              color: isSelected ? '#fff' : color,
            }}
          >
            <span className="relative z-10">{getWuXingName(element)}</span>
            {Array.from({ length: rippleCount }).map((_, idx) => (
              <span
                key={`${element}-${idx}`}
                className="absolute rounded-full pointer-events-none animate-ripple"
                style={{
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: `${color}40`,
                  transformOrigin: 'center',
                }}
              />
            ))}
          </button>
        )
      })}
    </div>
  )
}
WuXingPicker.displayName = 'WuXingPicker'

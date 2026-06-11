import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
  max?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

const sizeMap = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

const STAR_COLOR = '#C9A962'

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  max = 5,
  size = 'sm',
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const displayValue = hoverValue !== null ? hoverValue : value

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, rating: number) => {
    if (readOnly) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isHalf = x < rect.width / 2
    setHoverValue(isHalf ? rating - 0.5 : rating)
  }

  const handleMouseLeave = () => {
    setHoverValue(null)
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>, rating: number) => {
    if (readOnly || !onChange) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isHalf = x < rect.width / 2
    const newValue = isHalf ? rating - 0.5 : rating
    onChange(newValue === value ? 0 : newValue)
  }

  const renderStar = (rating: number) => {
    const isFilled = rating <= displayValue
    const isHalfFilled = !isFilled && rating - 0.5 <= displayValue

    return (
      <div
        key={rating}
        onMouseMove={(e) => handleMouseMove(e, rating)}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => handleClick(e, rating)}
        className={cn(
          'relative transition-transform',
          !readOnly && 'cursor-pointer hover:scale-110',
          readOnly && 'cursor-default'
        )}
      >
        <Star
          className={cn(
            sizeMap[size],
            isFilled
              ? `text-[${STAR_COLOR}]`
              : 'fill-transparent text-slate-300'
          )}
          style={isFilled ? { fill: STAR_COLOR, color: STAR_COLOR } : {}}
        />
        {isHalfFilled && (
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <Star
              className={cn(sizeMap[size])}
              style={{ fill: STAR_COLOR, color: STAR_COLOR }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, index) => renderStar(index + 1))}
    </div>
  )
}

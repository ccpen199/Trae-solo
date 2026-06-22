import { cn } from '@/lib/utils'

interface PriceTagProps {
  price: number
  originalPrice?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

export default function PriceTag({ price, originalPrice, size = 'md', className }: PriceTagProps) {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  }

  const symbolSizeClasses = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  return (
    <div className={cn('flex items-baseline gap-1', className)}>
      <span className={cn('font-medium text-brand-500', symbolSizeClasses[size])}>¥</span>
      <span className={cn('font-display font-semibold text-brand-500', sizeClasses[size])}>
        {price.toFixed(2)}
      </span>
      {originalPrice !== undefined && originalPrice > price && (
        <span className={cn('text-paper-500 line-through', symbolSizeClasses[size])}>
          ¥{originalPrice.toFixed(2)}
        </span>
      )}
    </div>
  )
}

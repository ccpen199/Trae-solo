import * as React from 'react'
import { Star, User, Briefcase, Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { Master } from '@/types'

export interface MasterCardProps extends React.HTMLAttributes<HTMLDivElement> {
  master: Master
  onViewProfile?: () => void
  onConsult?: () => void
}

export const MasterCard = React.forwardRef<HTMLDivElement, MasterCardProps>(
  ({ master, onViewProfile, onConsult, className, ...props }, ref) => {
    const renderStars = (rating: number) => {
      return Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.floor(rating)
        const half = !filled && i < rating
        return (
          <Star
            key={i}
            className={cn(
              'h-4 w-4',
              filled ? 'fill-gold-500 text-gold-500' : 'text-ink-300'
            )}
            style={half ? { fill: 'url(#halfStar)' } : undefined}
          />
        )
      })
    }

    return (
      <Card
        ref={ref}
        hoverable
        className={cn('flex flex-col', className)}
        {...props}
      >
        <CardContent className="pt-6 flex-1 flex flex-col">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full bg-jade-50 flex items-center justify-center border-[3px] border-gold-400 shadow-lg">
                {master.avatar ? (
                  <img
                    src={master.avatar}
                    alt={master.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-jade-600" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-serif text-2xl font-bold text-ink-800">
                {master.name}
              </h3>
            </div>

            <Badge variant="jade" className="mb-3">
              <Award className="h-3 w-3" />
              {master.title}
            </Badge>

            <div className="flex items-center gap-4 text-sm text-ink-500 mb-3">
              <div className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                <span>{master.experience}年</span>
              </div>
              <span>·</span>
              <span>{master.caseCount}案例</span>
            </div>

            <div className="flex items-center gap-0.5">
              {renderStars(master.rating)}
              <span className="ml-2 text-sm font-medium text-ink-700">
                {master.rating.toFixed(2)}
              </span>
              <span className="ml-1 text-xs text-ink-400">
                ({master.reviewCount})
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 mb-4">
            {master.specialties.map((s, i) => (
              <Badge key={i} variant="default" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>

          <p className="text-ink-600 text-sm text-center leading-relaxed line-clamp-2 mb-4">
            {master.introduction}
          </p>

          <div className="mt-auto flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={onViewProfile}
            >
              查看主页
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={onConsult}
            >
              在线咨询
            </Button>
          </div>
        </CardContent>

        <svg width="0" height="0">
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="#b8860b" />
              <stop offset="50%" stopColor="#d4c4a6" />
            </linearGradient>
          </defs>
        </svg>
      </Card>
    )
  }
)
MasterCard.displayName = 'MasterCard'

export default MasterCard

import * as React from 'react'
import { Heart, User, CalendarDays } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn, formatDate } from '@/lib/utils'
import type { CaseStudy } from '@/types'

export interface CaseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  caseData: CaseStudy
  onClick?: () => void
}

const genderMap: Record<string, { label: string; variant: 'jade' | 'cinnabar' | 'default' }> = {
  male: { label: '男', variant: 'jade' },
  female: { label: '女', variant: 'cinnabar' },
  neutral: { label: '中性', variant: 'default' },
}

export const CaseCard = React.forwardRef<HTMLDivElement, CaseCardProps>(
  ({ caseData, onClick, className, ...props }, ref) => {
    const [liked, setLiked] = React.useState(false)
    const [likes, setLikes] = React.useState(caseData.likes)

    const gender = genderMap[caseData.babyInfo.gender] || genderMap.neutral

    const handleLike = (e: React.MouseEvent) => {
      e.stopPropagation()
      setLiked(!liked)
      setLikes(liked ? likes - 1 : likes + 1)
    }

    return (
      <Card
        ref={ref}
        variant="bamboo"
        hoverable
        onClick={onClick}
        className={cn(
          'cursor-pointer flex flex-col',
          className
        )}
        {...props}
      >
        <CardContent className="pt-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant={gender.variant}>{gender.label}宝</Badge>
              {caseData.isAuthorized && (
                <Badge variant="gold">
                  <span className="inline-flex items-center gap-1">
                    <span>已授权</span>
                  </span>
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={cn(
                'h-8 px-2 gap-1',
                liked ? 'text-cinnabar-600 hover:text-cinnabar-700' : ''
              )}
            >
              <Heart className={cn('h-4 w-4', liked ? 'fill-current' : '')} />
              <span className="text-sm">{likes}</span>
            </Button>
          </div>

          <h3 className="font-serif text-[40px] font-bold text-ink-800 leading-tight mb-3 tracking-wide">
            {caseData.name}
          </h3>

          <div className="flex items-center gap-1 text-ink-500 text-sm mb-3">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{formatDate(caseData.babyInfo.birthDate, 'short')}</span>
          </div>

          <p className="text-ink-600 text-sm line-clamp-2 mb-4 leading-relaxed">
            {caseData.inputSummary}
          </p>

          <div className="mt-auto pt-4 border-t border-ink-300/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-jade-100 flex items-center justify-center border border-jade-300">
                <User className="h-4 w-4 text-jade-600" />
              </div>
              <span className="text-ink-700 text-sm font-medium">
                {caseData.masterName || '匿名命名师'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
)
CaseCard.displayName = 'CaseCard'

export default CaseCard

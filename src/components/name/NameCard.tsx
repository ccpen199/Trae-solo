import * as React from 'react'
import { Heart, Eye, GitCompare } from 'lucide-react'
import type { NameProposal } from '@/types'
import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ScoreBar } from './ScoreBar'
import { useAppStore } from '@/store'
import { cn, type WuXingElement } from '@/lib/utils'

export interface NameCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: NameProposal
  onViewDetail?: (id: string) => void
  onCompare?: (name: NameProposal) => void
}

export function NameCard({ name, onViewDetail, onCompare, className, ...props }: NameCardProps) {
  const { toggleFavorite, isFavorite } = useAppStore()
  const favorited = isFavorite(name.id)
  const wuxingElements = name.characters.map((c) => c.wuXing as WuXingElement)

  return (
    <Card hoverable className={cn('overflow-hidden animate-fade-in-up', className)} {...props}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-serif text-[48px] leading-none text-ink-900 tracking-wider">
                    {name.fullName}
                  </h3>
                  <button
                    onClick={() => toggleFavorite(name.id)}
                    className={cn(
                      'p-1.5 rounded-full transition-all hover:scale-110',
                      favorited ? 'text-cinnabar-500' : 'text-ink-300 hover:text-cinnabar-400'
                    )}
                  >
                    <Heart className={cn('w-5 h-5', favorited && 'fill-current')} />
                  </button>
                </div>
                <p className="text-sm text-ink-500 font-mono mb-3">{name.pinyin}</p>
                <p className="text-sm text-ink-600 leading-relaxed mb-4 line-clamp-2">
                  {name.meaning}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {wuxingElements.map((el, i) => (
                    <Badge key={i} variant="wuxing" element={el} dot />
                  ))}
                  {name.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="jade">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="md:w-56 flex-shrink-0 space-y-3">
            <ScoreBar label="吉祥度" value={name.score.auspiciousness} color="jade" />
            <ScoreBar label="独特性" value={name.score.uniqueness} color="gold" />
            <ScoreBar label="书写便捷" value={name.score.writingEase} color="cinnabar" />
            <ScoreBar label="音律和谐" value={name.score.phoneticHarmony} color="ink" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-6 py-3 border-t border-ink-100 flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Eye className="w-4 h-4" />}
          onClick={() => onViewDetail?.(name.id)}
        >
          查看详情
        </Button>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<GitCompare className="w-4 h-4" />}
          onClick={() => onCompare?.(name)}
        >
          加入对比
        </Button>
      </CardFooter>
    </Card>
  )
}

export default NameCard

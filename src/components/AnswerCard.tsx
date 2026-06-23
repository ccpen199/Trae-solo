import { ThumbsUp, Stethoscope, Award, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from './StatusBadge'

interface AnswerCardProps {
  answer: any
  isVet: boolean
  onCertify: (answerId: number) => void
  onLike: (answerId: number) => void
  index: number
}

export default function AnswerCard({ answer, isVet, onCertify, onLike, index }: AnswerCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-5 shadow-sm opacity-0 animate-slideUp relative overflow-hidden',
        `stagger-${Math.min(index + 1, 6)}`
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {answer.isCertified && (
        <div className="bg-emerald-600 text-white px-5 py-2 -mx-5 -mt-5 mb-4 flex items-center gap-2">
          <Award className="w-4 h-4" />
          <span className="text-sm font-medium">认证答案 · 由执业兽医提供专业解答</span>
        </div>
      )}
      <div className="flex items-start gap-3">
        <img
          src={answer.author?.avatar || `https://picsum.photos/seed/vet${answer.author?.id}/40/40`}
          alt={answer.author?.name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-text-primary">{answer.author?.name}</span>
            {answer.author?.role === 'vet' && (
              <StatusBadge
                status="success"
                label={
                  <span className="inline-flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" />
                    执业兽医 {answer.author?.certificateNumber || 'VET-001'}
                  </span>
                }
              />
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {answer.createdAt || '2024-01-15'}
            </span>
          </div>
          <p className="mt-3 text-text-primary leading-relaxed whitespace-pre-wrap">{answer.content}</p>
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => onLike(answer.id)}
              className={cn(
                'inline-flex items-center gap-1.5 text-sm transition-colors',
                answer.liked ? 'text-primary' : 'text-text-secondary hover:text-primary'
              )}
            >
              <ThumbsUp className={cn('w-4 h-4', answer.liked && 'fill-current')} />
              赞同 {answer.likeCount || 0}
            </button>
            {isVet && !answer.isCertified && (
              <button
                onClick={() => onCertify(answer.id)}
                className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Stethoscope className="w-4 h-4" />
                兽医认证
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

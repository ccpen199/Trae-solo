import { Phone, MapPin, MessageCircle, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Followup } from '@/types'

interface FollowupTimelineProps {
  followups: Followup[]
  className?: string
}

const typeConfig = {
  call: { icon: Phone, color: 'bg-blue-500', label: '电话' },
  visit: { icon: MapPin, color: 'bg-green-500', label: '带看' },
  wechat: { icon: MessageCircle, color: 'bg-emerald-500', label: '微信' },
  other: { icon: MoreHorizontal, color: 'bg-gray-500', label: '其他' },
}

export default function FollowupTimeline({ followups, className }: FollowupTimelineProps) {
  if (followups.length === 0) {
    return (
      <div className={cn('flex h-40 items-center justify-center text-gray-400', className)}>
        暂无跟进记录
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {followups.map((followup, index) => {
        const config = typeConfig[followup.type] || typeConfig.other
        const Icon = config.icon
        const isLast = index === followups.length - 1

        return (
          <div key={followup.id} className="relative flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', config.color)}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-gray-200" />}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn('rounded px-2 py-0.5 text-xs font-medium text-white', config.color)}>
                    {config.label}
                  </span>
                  <span className="text-sm text-gray-500">
                    {followup.agent_name || '经纪人'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(followup.created_at).toLocaleString('zh-CN')}
                </span>
              </div>
              <p className="mt-2 text-gray-700">{followup.content}</p>
              {followup.next_followup && (
                <p className="mt-1 text-xs text-orange-500">
                  下次跟进：{new Date(followup.next_followup).toLocaleDateString('zh-CN')}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

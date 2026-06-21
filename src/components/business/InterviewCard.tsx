import { useState, useEffect } from 'react'
import { MapPin, Clock, Phone, User, Timer } from 'lucide-react'
import type { Interview } from '../../../shared/types'
import { formatDateTime, getTimeRemaining } from '@/utils/helpers'
import StatusBadge from '@/components/ui/StatusBadge'

interface InterviewCardProps {
  interview: Interview
  role: 'employer' | 'jobseeker'
  onAccept?: () => void
  onReject?: () => void
}

export default function InterviewCard({ interview, role, onAccept, onReject }: InterviewCardProps) {
  const isPending = interview.status === 'pending'
  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (!isPending) return null
    const deadline = new Date(interview.scheduledAt)
    deadline.setHours(deadline.getHours() + interview.ttlHours)
    return getTimeRemaining(deadline.toISOString())
  })

  useEffect(() => {
    if (!isPending) return

    const deadline = new Date(interview.scheduledAt)
    deadline.setHours(deadline.getHours() + interview.ttlHours)

    const timer = setInterval(() => {
      setTimeRemaining(getTimeRemaining(deadline.toISOString()))
    }, 60000)

    return () => clearInterval(timer)
  }, [interview.scheduledAt, interview.ttlHours, isPending])

  return (
    <div className="glass rounded-2xl p-5 transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {interview.jobTitle || '面试邀请'}
          </h3>
          <p className="mt-0.5 text-sm text-gray-500">
            {role === 'jobseeker' ? interview.companyName : interview.userName}
          </p>
        </div>
        <StatusBadge status={interview.status} type="interview" />
      </div>

      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>{formatDateTime(interview.scheduledAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span>{interview.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span>{interview.contactPerson}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-gray-400" />
          <span>{interview.contactPhone}</span>
        </div>
      </div>

      {isPending && timeRemaining && !timeRemaining.expired && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent">
          <Timer className="h-4 w-4" />
          <span>
            剩余响应时间：{timeRemaining.hours}小时{timeRemaining.minutes}分钟
          </span>
        </div>
      )}

      {isPending && timeRemaining?.expired && (
        <div className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
          面试邀请已过期
        </div>
      )}

      {isPending && role === 'jobseeker' && !timeRemaining?.expired && (
        <div className="mt-4 flex gap-2">
          {onReject && (
            <button
              onClick={onReject}
              className="flex-1 rounded-lg border border-danger py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/5"
            >
              拒绝
            </button>
          )}
          {onAccept && (
            <button
              onClick={onAccept}
              className="flex-1 rounded-lg bg-success py-2 text-sm font-medium text-white transition-colors hover:bg-success/90"
            >
              接受
            </button>
          )}
        </div>
      )}

      {interview.notes && (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
          {interview.notes}
        </div>
      )}
    </div>
  )
}

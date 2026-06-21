import { MapPin, Clock, Briefcase } from 'lucide-react'
import type { Job } from '../../../shared/types'
import { cn } from '@/lib/utils'
import { formatSalary, getMatchScoreColor } from '@/utils/helpers'
import Tag from '@/components/ui/Tag'

interface JobCardProps {
  job: Job
  matchScore?: number
  matchReasons?: string[]
  onApply?: () => void
  showApplyButton?: boolean
}

function formatWorkHours(hours: { day: number; startTime: string; endTime: string }[]): string {
  if (!hours || hours.length === 0) return ''
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const days = hours.map(h => dayNames[h.day]).filter(Boolean)
  const first = hours[0]
  return `${days.join('/')} ${first.startTime}-${first.endTime}`
}

export default function JobCard({ job, matchScore, matchReasons, onApply, showApplyButton }: JobCardProps) {
  return (
    <div className="glass rounded-2xl p-5 transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-gray-900">{job.title}</h3>
          <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <Briefcase className="h-4 w-4" />
            <span>{job.companyName}</span>
          </div>
        </div>
        {matchScore !== undefined && (
          <div
            className={cn(
              'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 font-bold',
              getMatchScoreColor(matchScore),
              matchScore >= 80
                ? 'border-success/30 bg-success/10'
                : matchScore >= 60
                  ? 'border-info/30 bg-info/10'
                  : matchScore >= 40
                    ? 'border-accent/30 bg-accent/10'
                    : 'border-danger/30 bg-danger/10'
            )}
          >
            {matchScore}
          </div>
        )}
      </div>

      <div className="mt-3 text-lg font-semibold text-accent">
        {formatSalary(job.salaryMin, job.salaryMax, job.salaryType)}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {job.location}
        </span>
        {job.workHours && job.workHours.length > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatWorkHours(job.workHours)}
          </span>
        )}
      </div>

      {job.tags && job.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.tags.map(tag => (
            <Tag key={tag} label={tag} color="blue" />
          ))}
        </div>
      )}

      {matchReasons && matchReasons.length > 0 && (
        <div className="mt-3 rounded-lg bg-success/5 p-3">
          <p className="text-xs font-medium text-success">匹配原因：</p>
          <ul className="mt-1 space-y-0.5">
            {matchReasons.map((reason, i) => (
              <li key={i} className="text-xs text-gray-600">
                · {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showApplyButton && onApply && (
        <button
          onClick={onApply}
          className="mt-4 w-full rounded-lg bg-primary py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          立即投递
        </button>
      )}
    </div>
  )
}

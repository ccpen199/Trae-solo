import { Link } from 'react-router-dom'
import { MapPin, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Consultation, Lawyer } from '@/types'
import {
  formatCaseType,
  formatConsultationStatus,
  formatRelativeTime,
} from '@/utils/format'

interface ConsultationCardProps {
  consultation: Consultation
  lawyer?: Lawyer
}

const statusColorMap: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  dispatched: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-purple-50 text-purple-700 border-purple-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-slate-50 text-slate-600 border-slate-200',
}

export default function ConsultationCard({
  consultation,
  lawyer,
}: ConsultationCardProps) {
  return (
    <Link
      to={`/consultations/${consultation.id}`}
      className={cn(
        'group block rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5'
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="line-clamp-1 text-base font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
          {consultation.title}
        </h3>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-md border bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
          {formatCaseType(consultation.caseType)}
        </span>
        <span
          className={cn(
            'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
            statusColorMap[consultation.status]
          )}
        >
          {formatConsultationStatus(consultation.status)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          <span>{consultation.region}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>{formatRelativeTime(consultation.createdAt)}</span>
        </div>
        {lawyer && (
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>{lawyer.realName}律师</span>
          </div>
        )}
      </div>
    </Link>
  )
}

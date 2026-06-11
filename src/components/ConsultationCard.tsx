import { FileText, Clock, MapPin, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Consultation, LegalCaseType, ConsultationStatus } from '@/types'
import { formatDate } from '@/utils/format'

interface ConsultationCardProps {
  consultation: Consultation
  onClick?: (consultation: Consultation) => void
}

const caseTypeMap: Record<LegalCaseType, string> = {
  marriage: '婚姻家庭',
  labor: '劳动纠纷',
  debt: '债务纠纷',
  property: '房产纠纷',
  contract: '合同纠纷',
  traffic: '交通事故',
  criminal: '刑事辩护',
  other: '其他',
}

const statusMap: Record<ConsultationStatus, { label: string; className: string }> = {
  pending: {
    label: '待分派',
    className: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  dispatched: {
    label: '已分派',
    className: 'bg-blue-50 text-blue-600 border-blue-200',
  },
  in_progress: {
    label: '进行中',
    className: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  },
  completed: {
    label: '已结案',
    className: 'bg-slate-100 text-slate-500 border-slate-200',
  },
  cancelled: {
    label: '已取消',
    className: 'bg-red-50 text-red-600 border-red-200',
  },
}

export default function ConsultationCard({ consultation, onClick }: ConsultationCardProps) {
  const status = statusMap[consultation.status]

  return (
    <div
      onClick={() => onClick?.(consultation)}
      className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                status.className
              )}
            >
              {status.label}
            </span>
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {caseTypeMap[consultation.caseType]}
            </span>
          </div>
          <h3 className="line-clamp-1 text-base font-medium text-slate-800 group-hover:text-blue-600">
            {consultation.title}
          </h3>
          <p className="line-clamp-2 text-sm text-slate-500">{consultation.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDate(consultation.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {consultation.region}
            </span>
            {consultation.evidences.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {consultation.evidences.length} 份证据
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
      </div>
    </div>
  )
}

import { Briefcase, Clock, Star as StarIcon, FileText, Timer } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Lawyer } from '@/types'
import {
  formatCaseType,
  formatLawyerStatus,
  formatResponseTime,
} from '@/utils/format'
import StarRating from '@/components/ui/StarRating'

interface LawyerCardProps {
  lawyer: Lawyer
  onClick?: () => void
}

const statusColorMap: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  inactive: 'bg-slate-50 text-slate-600 border-slate-200',
  frozen: 'bg-red-50 text-red-700 border-red-200',
  pending_review: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default function LawyerCard({ lawyer, onClick }: LawyerCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200',
        onClick &&
          'cursor-pointer hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5'
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200">
          <span className="text-lg font-semibold text-blue-600">
            {lawyer.realName.charAt(0)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">
              {lawyer.realName}律师
            </h3>
            <span
              className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
                statusColorMap[lawyer.status]
              )}
            >
              {formatLawyerStatus(lawyer.status)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            执业证号：{lawyer.licenseNumber}
          </p>
          <p className="mt-1 text-xs text-slate-500">{lawyer.lawFirm}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {lawyer.expertise.map((type) => (
          <span
            key={type}
            className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
          >
            {formatCaseType(type)}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4">
        <div className="flex items-center gap-1.5 text-sm">
          <StarIcon className="h-4 w-4 text-amber-400 fill-amber-400" />
          <div className="flex items-center gap-1">
            <StarRating value={lawyer.avgRating} readOnly size="xs" />
            <span className="font-medium text-slate-700">{lawyer.avgRating}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Clock className="h-4 w-4 text-slate-400" />
          <span>响应 {lawyer.responseRate}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Timer className="h-4 w-4 text-slate-400" />
          <span>平均 {formatResponseTime(lawyer.avgResponseTime)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Briefcase className="h-4 w-4 text-slate-400" />
          <span>
            <FileText className="mr-1 inline h-3 w-3" />
            {lawyer.completedCases} 件
          </span>
        </div>
      </div>
    </div>
  )
}

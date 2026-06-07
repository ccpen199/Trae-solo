import { Link } from 'react-router-dom'
import { Star, Award, Briefcase, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import SmartImage from './SmartImage'

export interface RenovationCompanyCardProps {
  id: number
  name: string
  logoUrl?: string
  certificationStatus: string
  qualificationLevel?: string
  casesCount: number
  rating: number
  priceRange?: string
  description?: string
}

export default function RenovationCompanyCard({
  id,
  name,
  logoUrl,
  certificationStatus,
  qualificationLevel,
  casesCount,
  rating,
  priceRange,
  description,
}: RenovationCompanyCardProps) {
  const isCertified = certificationStatus === 'approved'

  return (
    <Link to={`/renovation/company/${id}`} className="group block">
      <div className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 card-hover">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-50 to-amber-50 flex items-center justify-center overflow-hidden border-2 border-teal-100 shrink-0">
            {logoUrl ? (
              <SmartImage
                src={logoUrl}
                alt={name}
                className="w-full h-full object-cover"
                fallbackText={name.charAt(0)}
                aspectRatio="1/1"
              />
            ) : (
              <span className="text-2xl font-bold text-teal-600">{name.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 truncate group-hover:text-teal-600 transition-colors">
                {name}
              </h3>
              {isCertified && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-600 text-xs font-medium rounded-full">
                  <Award size={12} strokeWidth={1.5} />
                  已认证
                </span>
              )}
            </div>

            {qualificationLevel && (
              <p className="text-sm text-slate-500 mb-2">{qualificationLevel}</p>
            )}

            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-amber-500">
                <Star size={14} className="fill-amber-400" strokeWidth={1.5} />
                <span className="font-semibold">{rating}</span>
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <Briefcase size={14} strokeWidth={1.5} />
                {casesCount}个案例
              </span>
              {priceRange && (
                <span className="flex items-center gap-1 text-slate-600">
                  <DollarSign size={14} strokeWidth={1.5} />
                  {priceRange}
                </span>
              )}
            </div>
          </div>
        </div>

        {description && (
          <p className="mt-3 text-sm text-slate-600 line-clamp-2">{description}</p>
        )}

        <div className={cn(
          'mt-4 pt-4 border-t flex items-center justify-between',
          isCertified ? 'border-teal-100' : 'border-slate-100'
        )}>
          <span className="text-xs text-slate-500">
            {isCertified ? '平台认证商家，质量保障' : '认证审核中'}
          </span>
          <span className="text-sm font-medium text-teal-600 group-hover:text-teal-700">
            查看详情 →
          </span>
        </div>
      </div>
    </Link>
  )
}

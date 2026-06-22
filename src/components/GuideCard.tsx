import { Link } from 'react-router-dom'
import { Clock, FileText, Building, Eye, ExternalLink, ChevronRight } from 'lucide-react'
import { ServiceGuide } from '../types'
import { categoryLabels, categoryColors, subjectLabels, subjectColors } from '../data/constants'

export default function GuideCard({ guide }: { guide: ServiceGuide }) {
  return (
    <Link
      to={`/guide/${guide.id}`}
      className="card p-5 hover:shadow-md hover:border-primary-200 transition-all group cursor-pointer block"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge ${categoryColors[guide.category]}`}>
            {categoryLabels[guide.category]}
          </span>
          <span className={`badge ${subjectColors[guide.subjectType]}`}>
            {subjectLabels[guide.subjectType]}
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors line-clamp-1">
        {guide.title}
      </h3>

      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
        {guide.description}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Building className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{guide.department}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{guide.timeLimit.promise}</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>{guide.materials.length}项材料</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{guide.views.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-primary-600 font-medium">
          <span>立即办理</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>
    </Link>
  )
}

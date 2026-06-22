import { Link } from 'react-router-dom'
import {
  Clock, FileText, Building, Eye, ExternalLink, ChevronRight,
  AlertTriangle, CheckCircle2, Globe, Image as ImageIcon, XCircle
} from 'lucide-react'
import { ServiceGuide } from '../types'
import { categoryLabels, categoryColors, subjectLabels, subjectColors } from '../data/constants'

export default function GuideCard({ guide }: { guide: ServiceGuide }) {
  const requiredMaterials = guide.materials.filter(m => m.required)
  const materialsWithImages = guide.materials.filter(m => m.exampleImage)
  const totalCommonErrors = guide.materials.reduce((sum, m) => sum + m.commonErrors.length, 0)

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
          {materialsWithImages.length > 0 && (
            <span className="badge bg-purple-100 text-purple-700">
              <ImageIcon className="w-3 h-3 mr-1" />
              {materialsWithImages.length}张示例图
            </span>
          )}
          {totalCommonErrors > 0 && (
            <span className="badge bg-red-100 text-red-600">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {totalCommonErrors}项易错点
            </span>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-700 transition-colors line-clamp-1">
        {guide.title}
      </h3>

      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
        {guide.description}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">法定时限</p>
          <p className="text-sm font-medium text-gray-700">{guide.timeLimit.legal}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">承诺时限</p>
          <p className="text-sm font-bold text-primary-600">{guide.timeLimit.promise}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">必备材料</p>
          <p className="text-sm font-medium text-gray-700">{requiredMaterials.length}项</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">线上办理</p>
          <p className="text-sm font-medium text-green-600">
            {guide.onlineEntries.length > 0 ? `${guide.onlineEntries.length}个入口` : '暂不支持'}
          </p>
        </div>
      </div>

      {materialsWithImages.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5" />
            材料示例预览
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
            {materialsWithImages.slice(0, 4).map((material, idx) => (
              <div
                key={idx}
                className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white"
                title={material.name}
              >
                <img
                  src={material.exampleImage}
                  alt={material.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {materialsWithImages.length > 4 && (
              <div className="shrink-0 w-16 h-16 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                <span className="text-xs text-gray-500">+{materialsWithImages.length - 4}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {totalCommonErrors > 0 && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-center gap-1.5 text-xs text-red-600 mb-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span className="font-medium">常见错误提示</span>
          </div>
          <ul className="text-xs text-red-700/80 space-y-1">
            {guide.materials
              .filter(m => m.commonErrors.length > 0)
              .slice(0, 2)
              .map((material, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span className="line-clamp-1">{material.commonErrors[0]}</span>
                </li>
              ))}
            {totalCommonErrors > 2 && (
              <li className="text-red-500 text-xs">
                还有 {totalCommonErrors - 2} 项易错提醒，点击查看详情
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Building className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{guide.department}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{guide.views.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {guide.onlineEntries.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Globe className="w-3.5 h-3.5" />
              <span>可在线办理</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-primary-600 font-medium">
            <span>查看详情</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  )
}

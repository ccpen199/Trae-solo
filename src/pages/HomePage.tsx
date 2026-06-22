import { TrendingUp, FileCheck, AlertTriangle, Star } from 'lucide-react'
import { useApp } from '../context/AppContext'
import SearchFilters from '../components/SearchFilters'
import GuideCard from '../components/GuideCard'
import { searchRecords, complaintPoints } from '../data/analytics'
import { categoryLabels } from '../data/constants'

export default function HomePage() {
  const { filteredGuides, currentCity } = useApp()

  const hotSearches = searchRecords.slice(0, 6)
  const hotComplaints = complaintPoints.slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-government-600 via-primary-600 to-primary-700 text-white p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm mb-4">
            <Star className="w-4 h-4" />
            <span>{currentCity.name}市 · 政务服务总入口</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            办事指南一站式查询
          </h2>
          <p className="text-white/80 text-base mb-6">
            汇集全市 {currentCity.serviceCount}+ 项办事服务指南，支持多维度检索，材料清单带示例图与常见错误提示，让您"最多跑一次"。
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm text-white/90">
              <FileCheck className="w-5 h-5" />
              <span>100% 权威发布</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <TrendingUp className="w-5 h-5" />
              <span>实时更新</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/90">
              <AlertTriangle className="w-5 h-5" />
              <span>常见错误提示</span>
            </div>
          </div>
        </div>
      </div>

      <SearchFilters />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">办事指南</h3>
              <p className="text-sm text-gray-500 mt-1">
                共找到 <span className="font-medium text-primary-600">{filteredGuides.length}</span> 项符合条件的服务
              </p>
            </div>
          </div>

          {filteredGuides.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGuides.map((guide) => (
                <GuideCard key={guide.id} guide={guide} />
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">暂无匹配的办事指南</p>
              <p className="text-sm text-gray-400">请尝试调整搜索关键词或筛选条件</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h4 className="font-semibold text-gray-900">热门搜索</h4>
            </div>
            <div className="space-y-3">
              {hotSearches.map((item, idx) => (
                <div key={item.keyword} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                    idx < 3 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{item.keyword}</span>
                  {item.category && item.category !== 'other' && (
                    <span className="text-xs text-gray-400">{categoryLabels[item.category]}</span>
                  )}
                  <span className={`text-xs font-medium ${
                    item.trend > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {item.trend > 0 ? '+' : ''}{item.trend}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h4 className="font-semibold text-gray-900">办事堵点预警</h4>
            </div>
            <div className="space-y-4">
              {hotComplaints.map((item) => (
                <div key={item.id} className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-red-700 text-sm">{item.keyword}</span>
                    <span className="text-xs text-red-500 font-medium">+{item.trend}%</span>
                  </div>
                  <p className="text-xs text-red-600/80 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-red-500 bg-red-100 px-2 py-0.5 rounded-full">
                      {item.count} 次反馈
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

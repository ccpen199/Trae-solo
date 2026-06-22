import { TrendingUp, FileCheck, AlertTriangle, Star, ChevronRight, CheckCircle, Clock, Lightbulb, BarChart3, Building2, User, Calendar, ClipboardCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import SearchFilters from '../components/SearchFilters'
import GuideCard from '../components/GuideCard'
import { searchRecords, complaintPoints, optimizationSuggestions } from '../data/analytics'
import { categoryLabels } from '../data/constants'

const statusConfig: Record<string, { label: string; color: string; bg: string; border: string; progress: string }> = {
  pending: { label: '待处理', color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-200', progress: 'bg-red-400' },
  processing: { label: '处理中', color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-200', progress: 'bg-orange-400' },
  resolved: { label: '已解决', color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-200', progress: 'bg-green-500' },
  reviewed: { label: '已复查', color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200', progress: 'bg-blue-500' },
}

export default function HomePage() {
  const navigate = useNavigate()
  const { filteredGuides, currentCity, resetFilters, filters, setFilters } = useApp()

  const hotSearches = searchRecords.slice(0, 6)
  const hotComplaints = complaintPoints.slice(0, 3)

  const handleSearchKeyword = (keyword: string) => {
    setFilters({ ...filters, keyword })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FileCheck className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium mb-2">暂无匹配的办事指南</p>
              <p className="text-sm text-gray-400 mb-6">请尝试调整搜索关键词或筛选条件</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={resetFilters}
                  className="btn-primary text-sm"
                >
                  重置筛选条件
                </button>
                <button
                  onClick={() => navigate('/services')}
                  className="btn-secondary text-sm"
                >
                  查看便民服务
                </button>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-3">您也可以试试这些热门关键词：</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['居住证', '小学入学', '社保转移', '驾驶证换证'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleSearchKeyword(tag)}
                      className="px-3 py-1 bg-primary-50 text-primary-600 text-xs rounded-full hover:bg-primary-100 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h4 className="font-semibold text-gray-900">热门搜索</h4>
              </div>
              <span className="text-xs text-gray-400">点击搜索</span>
            </div>
            <div className="space-y-2">
              {hotSearches.map((item, idx) => (
                <button
                  key={item.keyword}
                  onClick={() => handleSearchKeyword(item.keyword)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left group"
                >
                  <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                    idx < 3 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 truncate group-hover:text-primary-600 transition-colors">
                    {item.keyword}
                  </span>
                  {item.category && item.category !== 'other' && (
                    <span className="text-xs text-gray-400 shrink-0">{categoryLabels[item.category]}</span>
                  )}
                  <span className={`text-xs font-medium shrink-0 ${
                    item.trend > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {item.trend > 0 ? '↑' : '↓'}{Math.abs(item.trend)}%
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {['居住证', '社保', '公积金', '入学', '驾驶证'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleSearchKeyword(tag)}
                    className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-primary-100 hover:text-primary-700 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h4 className="font-semibold text-gray-900">办事堵点预警</h4>
              </div>
              <button
                onClick={() => navigate('/analytics?tab=complaints')}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
              >
                查看全部
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {hotComplaints.map((item) => {
                const sc = statusConfig[item.status] || statusConfig.pending
                const relatedSuggestion = optimizationSuggestions.find(s => s.id === item.relatedSuggestionId)
                const latestRecord = item.disposalRecords.length > 0
                  ? item.disposalRecords[item.disposalRecords.length - 1]
                  : null

                return (
                  <div key={item.id} className={`p-3 rounded-lg border ${sc.bg.replace('bg-', 'bg-').replace('100', '50')} ${sc.border}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-medium text-sm ${sc.color}`}>
                        {item.keyword}
                      </span>
                      <span className={`text-xs font-medium ${item.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {item.trend > 0 ? '+' : ''}{item.trend}%
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color} ${sc.border}`}>
                        {sc.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.count} 次反馈
                      </span>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>处置进度</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${sc.progress}`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="bg-white/60 rounded p-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Building2 className="w-2.5 h-2.5" />
                          责任部门
                        </div>
                        <p className="text-[10px] font-medium text-gray-700 mt-0.5 truncate">{item.responsibleDept.replace(/市/g, '').substring(0, 6)}</p>
                      </div>
                      <div className="bg-white/60 rounded p-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <User className="w-2.5 h-2.5" />
                          责任人
                        </div>
                        <p className="text-[10px] font-medium text-gray-700 mt-0.5 truncate">{item.responsiblePerson}</p>
                      </div>
                      <div className="bg-white/60 rounded p-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          <Calendar className="w-2.5 h-2.5" />
                          完成时限
                        </div>
                        <p className="text-[10px] font-medium text-gray-700 mt-0.5 truncate">{item.disposalDeadline.substring(5)}</p>
                      </div>
                    </div>

                    {item.disposalConclusion && (
                      <div className="flex items-start gap-1.5 p-2 bg-green-50/80 rounded-lg mb-2 border border-green-100">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-green-700 line-clamp-2">{item.disposalConclusion}</p>
                      </div>
                    )}

                    {item.reviewRecords.length > 0 && (
                      <div className="flex items-start gap-1.5 p-2 bg-blue-50/80 rounded-lg mb-2 border border-blue-100">
                        <ClipboardCheck className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-blue-700 line-clamp-1">
                            {item.reviewRecords[item.reviewRecords.length - 1].content}
                          </p>
                          <p className="text-[9px] text-blue-400 mt-0.5">
                            {item.reviewRecords[item.reviewRecords.length - 1].operator} · {item.reviewRecords[item.reviewRecords.length - 1].date.substring(5, 10)}
                          </p>
                        </div>
                      </div>
                    )}

                    {latestRecord && !item.disposalConclusion && (
                      <div className="flex items-start gap-1.5 p-2 bg-white/60 rounded-lg mb-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-600 line-clamp-1">
                            {latestRecord.action}：{latestRecord.content.substring(0, 20)}...
                          </p>
                          <p className="text-[9px] text-gray-400 mt-0.5">
                            {latestRecord.operator} · {latestRecord.date.substring(5, 10)}
                          </p>
                        </div>
                      </div>
                    )}

                    {relatedSuggestion && (
                      <div className="flex items-start gap-1.5 p-2 bg-white/60 rounded-lg mb-2">
                        <Lightbulb className="w-3.5 h-3.5 text-yellow-500 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-medium text-gray-700 line-clamp-1">
                            优化建议：{relatedSuggestion.title}
                          </p>
                          <p className="text-[9px] text-gray-400 mt-0.5">
                            优先级：{relatedSuggestion.priority === 'high' ? '高' : relatedSuggestion.priority === 'medium' ? '中' : '低'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      {item.relatedGuideIds.length > 0 && (
                        <button
                          onClick={() => navigate(`/guide/${item.relatedGuideIds[0]}`)}
                          className="text-[11px] text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
                        >
                          <FileCheck className="w-3 h-3" />
                          关联指南
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/analytics?tab=complaints')}
                        className="text-[11px] text-gray-500 hover:text-gray-700 flex items-center gap-0.5"
                      >
                        <BarChart3 className="w-3 h-3" />
                        查看分析
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>本周新增堵点 3 个</span>
                <span>已处置 {complaintPoints.filter(c => c.status === 'resolved' || c.status === 'reviewed').length} 个 · 处置率 {Math.round(complaintPoints.filter(c => c.status === 'resolved' || c.status === 'reviewed').length / complaintPoints.length * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

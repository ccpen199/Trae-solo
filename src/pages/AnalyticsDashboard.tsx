import React, { useMemo, useState } from 'react'
import {
  BarChart3, TrendingUp, AlertTriangle, Lightbulb, Users, Search as SearchIcon,
  FileText, ChevronRight, AlertCircle, CheckCircle2, Clock, Zap, Eye,
  Filter, Calendar, Download, RefreshCw, X, Building2, User, Target,
  MessageSquare, CheckCircle, ChevronDown, ChevronUp, ClipboardCheck
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, Area, AreaChart
} from 'recharts'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { searchRecords, complaintPoints, optimizationSuggestions, dailyVisitTrend, categoryDistribution } from '../data/analytics'
import { categoryLabels } from '../data/constants'

const COLORS = ['#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#6366f1']
const CHART_COLORS = {
  visits: '#3b82f6',
  searches: '#8b5cf6',
  conversion: '#10b981',
}

export default function AnalyticsDashboard() {
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') as 'overview' | 'searches' | 'complaints' | 'suggestions' | null
  const [activeTab, setActiveTab] = useState<'overview' | 'searches' | 'complaints' | 'suggestions'>(initialTab || 'overview')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('7d')
  const [selectedSearchTerm, setSelectedSearchTerm] = useState<string | null>(null)
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [expandedComplaints, setExpandedComplaints] = useState<Set<string>>(new Set())

  const navigate = useNavigate()
  const { filteredGuides, guides } = useApp()

  const totalVisits = dailyVisitTrend.reduce((a, b) => a + b.visits, 0)
  const totalSearches = dailyVisitTrend.reduce((a, b) => a + b.searches, 0)
  const totalComplaints = complaintPoints.reduce((a, b) => a + b.count, 0)
  const publishedCount = guides.filter(g => g.reviewStatus === 'published').length
  const conversionRate = totalSearches > 0 ? ((totalVisits / totalSearches) * 100).toFixed(1) : '0'

  const conversionData = useMemo(() => {
    return dailyVisitTrend.map(d => ({
      ...d,
      conversion: d.searches > 0 ? Math.round((d.visits / d.searches) * 100) : 0,
    }))
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleAcceptSuggestion = (id: string) => {
    setAcceptedSuggestions(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleJumpToGuide = (guideId: string) => {
    navigate(`/guide/${guideId}`)
  }

  const handleSearchForTerm = (keyword: string) => {
    navigate('/')
  }

  const tabs = [
    { id: 'overview' as const, label: '数据概览', icon: BarChart3 },
    { id: 'searches' as const, label: '搜索词分析', icon: SearchIcon },
    { id: 'complaints' as const, label: '办事堵点', icon: AlertTriangle },
    { id: 'suggestions' as const, label: '优化建议', icon: Lightbulb },
  ]

  const priorityStyles = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-blue-100 text-blue-700 border-blue-200',
  }

  const priorityLabels = { high: '高优先级', medium: '中优先级', low: '低优先级' }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3 text-sm">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600">{entry.name}:</span>
              <span className="font-medium text-gray-900">
                {entry.value.toLocaleString()}
                {entry.name.includes('转化率') && '%'}
              </span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary-600" />
            用户行为分析仪表盘
          </h2>
          <p className="text-sm text-gray-500 mt-1">自动识别高频搜索词、办事堵点，生成运营优化建议</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  dateRange === r
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r === '7d' ? '近7天' : r === '30d' ? '近30天' : '近90天'}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="刷新数据"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.id === 'complaints' && complaintPoints.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {complaintPoints.length}
                </span>
              )}
              {tab.id === 'suggestions' && optimizationSuggestions.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center">
                  {optimizationSuggestions.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('searches')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">7日访问量</p>
                  <p className="text-2xl font-bold text-gray-900">{totalVisits.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                较上周 +12.5%
              </p>
            </div>
            <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('searches')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <SearchIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">7日搜索量</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSearches.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                较上周 +8.3%
              </p>
            </div>
            <div className="card p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('complaints')}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">堵点投诉量</p>
                  <p className="text-2xl font-bold text-gray-900">{totalComplaints}</p>
                </div>
              </div>
              <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                较上周 +28.7%
              </p>
            </div>
            <div className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">已发布指南</p>
                  <p className="text-2xl font-bold text-gray-900">{publishedCount.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                本月新增 42 项
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">访问、搜索与转化率趋势</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{dateRange === '7d' ? '近7天' : dateRange === '30d' ? '近30天' : '近90天'}</span>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={conversionData}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.visits} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={CHART_COLORS.visits} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.searches} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={CHART_COLORS.searches} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="visits"
                      name="访问量"
                      stroke={CHART_COLORS.visits}
                      strokeWidth={2}
                      fill="url(#colorVisits)"
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="searches"
                      name="搜索量"
                      stroke={CHART_COLORS.searches}
                      strokeWidth={2}
                      fill="url(#colorSearches)"
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="conversion"
                      name="访问搜索转化率(%)"
                      stroke={CHART_COLORS.conversion}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-4">服务类别分布</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {categoryDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {categoryDistribution.map((item, idx) => (
                  <button
                    key={item.name}
                    className="flex items-center gap-1.5 text-xs p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    onClick={() => {
                      navigate('/')
                    }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx] }} />
                    <span className="text-gray-600 truncate flex-1">{item.name}</span>
                    <span className="text-gray-900 font-medium">{item.value}%</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">热门搜索词 TOP 5</h3>
                <button
                  onClick={() => setActiveTab('searches')}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  查看全部 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {searchRecords.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.keyword}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedSearchTerm(item.keyword)}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx < 3 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-medium text-gray-900 flex-1">{item.keyword}</span>
                    <span className="text-sm text-gray-500">{item.count.toLocaleString()} 次</span>
                    <span className={`text-sm font-medium ${
                      item.trend > 0 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {item.trend > 0 ? '+' : ''}{item.trend}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">最新办事堵点</h3>
                <button
                  onClick={() => setActiveTab('complaints')}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  查看全部 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {complaintPoints.slice(0, 3).map((point, idx) => (
                  <div
                    key={point.id}
                    className="p-3 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100/50 transition-colors cursor-pointer"
                    onClick={() => setActiveTab('complaints')}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-medium text-red-700 text-sm flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        {point.keyword}
                      </h4>
                      <span className="text-xs text-red-500 font-medium whitespace-nowrap">↑ {point.trend}%</span>
                    </div>
                    <p className="text-xs text-red-600/80 line-clamp-2 pl-7">{point.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'searches' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">高频搜索词 TOP 10</h3>
              <p className="text-sm text-gray-500">近7日数据 · 共 {searchRecords.length} 个热门搜索词</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm">
                <Filter className="w-4 h-4 mr-1.5" />
                分类筛选
              </button>
              <button className="btn-secondary text-sm">
                <Download className="w-4 h-4 mr-1.5" />
                导出报告
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-5 lg:col-span-2">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={searchRecords} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis
                      type="category"
                      dataKey="keyword"
                      tick={{ fontSize: 12 }}
                      stroke="#9ca3af"
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="count"
                      name="搜索次数"
                      radius={[0, 6, 6, 0]}
                      onClick={(data) => setSelectedSearchTerm(data.keyword)}
                      cursor="pointer"
                    >
                      {searchRecords.map((_, index) => (
                        <Cell
                          key={index}
                          fill={index < 3 ? '#ef4444' : index < 6 ? '#f59e0b' : '#3b82f6'}
                          fillOpacity={selectedSearchTerm === searchRecords[index].keyword ? 1 : 0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5">
              <h4 className="font-semibold text-gray-900 mb-4">搜索词详情</h4>
              {selectedSearchTerm ? (
                <div className="space-y-4">
                  <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                    <p className="font-bold text-lg text-primary-700">{selectedSearchTerm}</p>
                    {(() => {
                      const data = searchRecords.find(s => s.keyword === selectedSearchTerm)
                      if (!data) return null
                      return (
                        <>
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-500">搜索次数</p>
                              <p className="text-xl font-bold text-gray-900">{data.count.toLocaleString()}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-500">趋势</p>
                              <p className={`text-xl font-bold ${data.trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {data.trend > 0 ? '+' : ''}{data.trend}%
                              </p>
                            </div>
                          </div>
                          {data.category && (
                            <p className="text-sm text-gray-600 mt-3">
                              分类：<span className="font-medium">{categoryLabels[data.category]}</span>
                            </p>
                          )}
                        </>
                      )
                    })()}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">相关办事指南</p>
                    {(() => {
                      const related = filteredGuides.filter(g =>
                        g.title.includes(selectedSearchTerm) ||
                        g.description.includes(selectedSearchTerm) ||
                        g.materials.some(m => m.name.includes(selectedSearchTerm))
                      ).slice(0, 5)
                      return related.length > 0 ? (
                        <div className="space-y-2">
                          {related.map(g => (
                            <button
                              key={g.id}
                              onClick={() => handleJumpToGuide(g.id)}
                              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                            >
                              <span className="text-sm text-gray-700 truncate flex-1">{g.title}</span>
                              <Eye className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 p-3 bg-gray-50 rounded-lg text-center">暂无相关指南</p>
                      )
                    })()}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSearchForTerm(selectedSearchTerm)}
                      className="flex-1 btn-primary text-sm"
                    >
                      <SearchIcon className="w-4 h-4 mr-1.5" />
                      搜索相关指南
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <SearchIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">点击左侧图表查看搜索词详情</p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="py-3 px-3 font-medium">排名</th>
                    <th className="py-3 px-3 font-medium">搜索词</th>
                    <th className="py-3 px-3 font-medium">分类</th>
                    <th className="py-3 px-3 font-medium text-right">搜索次数</th>
                    <th className="py-3 px-3 font-medium text-right">趋势</th>
                    <th className="py-3 px-3 font-medium">趋势占比</th>
                    <th className="py-3 px-3 font-medium text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {searchRecords.map((item, idx) => (
                    <tr
                      key={item.keyword}
                      className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                        selectedSearchTerm === item.keyword ? 'bg-primary-50/50' : ''
                      }`}
                      onClick={() => setSelectedSearchTerm(item.keyword)}
                    >
                      <td className="py-3 px-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx < 3 ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-gray-900">{item.keyword}</td>
                      <td className="py-3 px-3">
                        {item.category && (
                          <span className="badge bg-gray-100 text-gray-600">
                            {categoryLabels[item.category]}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-gray-900 text-right">
                        {item.count.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`text-sm font-medium ${
                          item.trend > 0 ? 'text-red-500' : 'text-green-500'
                        }`}>
                          {item.trend > 0 ? '+' : ''}{item.trend}%
                        </span>
                      </td>
                      <td className="py-3 px-3 w-48">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.trend > 20 ? 'bg-red-500' : item.trend > 0 ? 'bg-orange-400' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min((item.count / searchRecords[0].count) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSearchForTerm(item.keyword) }}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <SearchIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{complaintPoints.length}</p>
                  <p className="text-xs text-gray-500">堵点总数</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{complaintPoints.filter(c => c.status === 'processing').length}</p>
                  <p className="text-xs text-gray-500">处理中</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{complaintPoints.filter(c => c.status === 'resolved' || c.status === 'reviewed').length}</p>
                  <p className="text-xs text-gray-500">已解决</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <ClipboardCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(complaintPoints.filter(c => c.status === 'resolved' || c.status === 'reviewed').length / complaintPoints.length * 100)}%</p>
                  <p className="text-xs text-gray-500">处置率</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {complaintPoints.map((point, idx) => {
              const relatedGuides = guides.filter(g => point.relatedGuideIds.includes(g.id))
              const relatedSuggestion = optimizationSuggestions.find(s => s.id === point.relatedSuggestionId)
              const severity = point.trend > 50 ? 'critical' : point.trend > 20 ? 'high' : 'medium'
              const expanded = expandedComplaints.has(point.id)

              const toggleExpanded = (id: string) => {
                setExpandedComplaints(prev => {
                  const next = new Set(prev)
                  if (next.has(id)) {
                    next.delete(id)
                  } else {
                    next.add(id)
                  }
                  return next
                })
              }

              const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                pending: { label: '待处理', color: 'text-gray-600', bg: 'bg-gray-100' },
                processing: { label: '处理中', color: 'text-orange-600', bg: 'bg-orange-100' },
                resolved: { label: '已解决', color: 'text-green-600', bg: 'bg-green-100' },
                reviewed: { label: '已复查', color: 'text-blue-600', bg: 'bg-blue-100' },
              }
              const status = statusConfig[point.status] || statusConfig.pending

              return (
                <div key={point.id} className={`card overflow-hidden ${
                  point.status === 'reviewed' ? 'border-blue-200' :
                  point.status === 'resolved' ? 'border-green-200' : ''
                }`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3">
                        <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          severity === 'critical' ? 'bg-red-100 text-red-600' :
                          severity === 'high' ? 'bg-orange-100 text-orange-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-gray-900 text-lg">{point.keyword}</h4>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className={`text-sm font-medium ${
                              severity === 'critical' ? 'text-red-600' :
                              severity === 'high' ? 'text-orange-500' :
                              'text-yellow-600'
                            }`}>
                              {point.trend > 0 ? '↑' : '↓'} {Math.abs(point.trend)}%
                            </span>
                            <span className="text-sm text-gray-500">周环比</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-sm text-gray-500">{point.count} 次反馈</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleExpanded(point.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                      >
                        {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">{point.description}</p>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          处置进度
                        </span>
                        <span className="font-medium text-gray-900">{point.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            point.status === 'reviewed' ? 'bg-blue-500' :
                            point.status === 'resolved' ? 'bg-green-500' :
                            point.status === 'processing' ? 'bg-orange-500' :
                            'bg-gray-400'
                          }`}
                          style={{ width: `${point.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                          <Building2 className="w-3.5 h-3.5" />
                          责任部门
                        </div>
                        <p className="text-sm font-medium text-gray-900">{point.responsibleDept}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                          <User className="w-3.5 h-3.5" />
                          责任人
                        </div>
                        <p className="text-sm font-medium text-gray-900">{point.responsiblePerson}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                          <Calendar className="w-3.5 h-3.5" />
                          完成时限
                        </div>
                        <p className="text-sm font-medium text-gray-900">{point.disposalDeadline}</p>
                      </div>
                    </div>

                    {point.disposalConclusion && (
                      <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-green-800 text-sm mb-1">处置结论</p>
                            <p className="text-sm text-green-700">{point.disposalConclusion}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {relatedSuggestion && (
                      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-yellow-800 text-sm mb-1">关联优化方案</p>
                            <p className="text-sm text-yellow-700 line-clamp-2">{relatedSuggestion.title}</p>
                            <button
                              onClick={() => setActiveTab('suggestions')}
                              className="text-xs text-yellow-700 hover:text-yellow-800 mt-1.5 flex items-center gap-0.5"
                            >
                              查看详情 <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {expanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50">
                      {point.disposalRecords.length > 0 && (
                        <div className="p-5 border-b border-gray-100">
                          <h5 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary-600" />
                            处置时间轴
                          </h5>
                          <div className="space-y-4">
                            {point.disposalRecords.map((record, i) => (
                              <div key={record.id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={`w-3 h-3 rounded-full ${
                                    i === 0 ? 'bg-primary-500' : 'bg-gray-300'
                                  }`} />
                                  {i < point.disposalRecords.length - 1 && (
                                    <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                                  )}
                                </div>
                                <div className="flex-1 pb-4">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-gray-900 text-sm">{record.action}</span>
                                    <span className="text-xs text-gray-400">{record.date}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {record.department} · {record.operator}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">{record.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {point.reviewRecords.length > 0 && (
                        <div className="p-5 border-b border-gray-100">
                          <h5 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                            <ClipboardCheck className="w-4 h-4 text-blue-600" />
                            复查记录
                          </h5>
                          <div className="space-y-3">
                            {point.reviewRecords.map((record) => (
                              <div key={record.id} className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-blue-800 text-sm">{record.action}</span>
                                  <span className="text-xs text-blue-400">{record.date}</span>
                                </div>
                                <p className="text-xs text-blue-600">
                                  {record.department} · {record.operator}
                                </p>
                                <p className="text-sm text-blue-700 mt-1">{record.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {relatedGuides.length > 0 && (
                        <div className="p-5">
                          <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            关联办事指南 ({relatedGuides.length})
                          </h5>
                          <div className="space-y-2">
                            {relatedGuides.map(g => (
                              <button
                                key={g.id}
                                onClick={() => handleJumpToGuide(g.id)}
                                className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-colors text-left"
                              >
                                <span className="text-sm text-gray-700 truncate">{g.title}</span>
                                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!expanded && (
                    <div className="px-5 pb-5">
                      <button
                        onClick={() => toggleExpanded(point.id)}
                        className="w-full text-sm text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        展开详情
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
            <div className="text-sm text-yellow-800 flex-1">
              <p className="font-medium">共生成 {optimizationSuggestions.length} 条运营优化建议</p>
              <p className="text-yellow-700 mt-0.5">AI 智能分析用户行为数据后自动生成，可按优先级处理。已采纳 {acceptedSuggestions.size} 条。</p>
            </div>
            <div className="flex items-center gap-1 text-sm font-medium text-yellow-700">
              <CheckCircle2 className="w-4 h-4" />
              {acceptedSuggestions.size}/{optimizationSuggestions.length}
            </div>
          </div>

          <div className="space-y-4">
            {optimizationSuggestions.map((sug, idx) => {
              const isAccepted = acceptedSuggestions.has(sug.id)
              return (
                <div key={sug.id} className={`card p-6 transition-all ${
                  isAccepted ? 'bg-green-50/50 border-green-200' : ''
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      sug.priority === 'high' ? 'bg-red-100' :
                      sug.priority === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      {isAccepted ? (
                        <CheckCircle2 className={`w-6 h-6 ${
                          sug.priority === 'high' ? 'text-red-600' :
                          sug.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                      ) : (
                        <Zap className={`w-6 h-6 ${
                          sug.priority === 'high' ? 'text-red-600' :
                          sug.priority === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900">
                            {idx + 1}. {sug.title}
                          </h4>
                          <span className={`badge border ${priorityStyles[sug.priority]}`}>
                            {priorityLabels[sug.priority]}
                          </span>
                          <span className="badge bg-gray-100 text-gray-600">
                            {sug.type === 'content' ? '内容优化' : sug.type === 'process' ? '流程优化' : '服务优化'}
                          </span>
                          {isAccepted && (
                            <span className="badge bg-green-100 text-green-700">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              已采纳
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mt-2">{sug.description}</p>
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5" />
                        数据来源：{sug.dataSource}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        {sug.relatedMetrics.map((m, i) => (
                          <div key={i} className="bg-white rounded-xl p-3 border border-gray-100">
                            <p className="text-xs text-gray-500">{m.name}</p>
                            <p className="text-lg font-bold text-gray-900">
                              {m.value.toLocaleString()}{m.unit || ''}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                        {isAccepted ? (
                          <button
                            onClick={() => handleAcceptSuggestion(sug.id)}
                            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                          >
                            <X className="w-4 h-4" />
                            取消采纳
                          </button>
                        ) : (
                          <>
                            <button className="text-sm text-gray-500 hover:text-gray-700">
                              稍后处理
                            </button>
                            <button
                              onClick={() => handleAcceptSuggestion(sug.id)}
                              className="btn-primary text-sm py-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1.5" />
                              采纳建议
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

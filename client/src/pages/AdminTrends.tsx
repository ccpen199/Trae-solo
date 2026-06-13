import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { IndustryTrend, SkillGap } from '../types'
import {
  TrendingUp, TrendingDown, BarChart3, AlertTriangle, CheckCircle,
  Minus, Award, Briefcase, Users
} from 'lucide-react'

export default function AdminTrends() {
  const [trends, setTrends] = useState<IndustryTrend[]>([])
  const [skillGaps, setSkillGaps] = useState<SkillGap[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tRes, gRes] = await Promise.all([
          api.get('/admin/industry-trends'),
          api.get('/admin/skill-gaps'),
        ])
        setTrends(tRes.data || [])
        setSkillGaps(gRes.data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const categoryLabels: Record<string, string> = {
    DESIGN: '设计服务',
    DEVELOPMENT: '开发服务',
    COPYWRITING: '文案撰写',
    MARKETING: '营销推广',
    DECORATION: '装修设计',
    VIDEO: '视频制作',
    CONSULTING: '咨询服务',
    OTHER: '其他',
  }

  const gapInfo: Record<string, { label: string; color: string; icon: any }> = {
    SHORTAGE: { label: '供不应求', color: 'text-red-600 bg-red-50', icon: AlertTriangle },
    BALANCE: { label: '供需平衡', color: 'text-green-600 bg-green-50', icon: CheckCircle },
    SURPLUS: { label: '供过于求', color: 'text-blue-600 bg-blue-50', icon: Minus },
  }

  const maxTaskCount = trends.length > 0 ? Math.max(...trends.map((t) => t.taskCount)) : 1

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">行业趋势分析</h1>
          <p className="text-gray-500 mt-1">需求趋势、技能供需缺口预警</p>
        </div>
        <Link to="/admin" className="btn-secondary">
          返回仪表盘
        </Link>
      </div>

      {/* Industry Trends */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
          行业需求趋势
        </h2>

        {loading ? (
          <div className="space-y-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : trends.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无数据</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trends.map((trend) => (
              <div key={trend.category} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{categoryLabels[trend.category] || trend.category}</h3>
                    <span className="badge bg-primary-50 text-primary-700 flex items-center">
                      <Briefcase className="w-3 h-3 mr-1" />
                      {trend.taskCount} 个任务
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      <Users className="w-3.5 h-3.5 inline mr-1" />
                      平均预算: <span className="font-semibold text-amber-600">¥{trend.avgBudget?.toLocaleString() || 0}</span>
                    </span>
                    <span className="text-gray-500">
                      完成率: <span className={`font-semibold ${
                        (trend.completionRate || 0) >= 80 ? 'text-green-600' :
                        (trend.completionRate || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>{trend.completionRate || 0}%</span>
                    </span>
                  </div>
                </div>
                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${(trend.taskCount / maxTaskCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skill Gaps */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Award className="w-5 h-5 mr-2 text-primary-600" />
            技能供需缺口预警
          </h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center text-red-600">
              <AlertTriangle className="w-4 h-4 mr-1" /> 缺口预警
            </span>
            <span className="flex items-center text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" /> 平衡
            </span>
            <span className="flex items-center text-blue-600">
              <Minus className="w-4 h-4 mr-1" /> 过剩
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : skillGaps.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无技能供需数据</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {skillGaps.map((gap) => {
              const info = gapInfo[gap.gapType] || gapInfo.BALANCE
              const Icon = info.icon
              return (
                <div key={gap.skillId} className="p-5 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{gap.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{gap.category}</p>
                    </div>
                    <span className={`badge ${info.color} flex items-center`}>
                      <Icon className="w-3.5 h-3.5 mr-1" />
                      {info.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{gap.demandCount}</p>
                      <p className="text-xs text-blue-600/70">需求量</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{gap.supplyCount}</p>
                      <p className="text-xs text-green-600/70">供应量</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">缺口率</span>
                    <span className={`font-semibold flex items-center ${
                      gap.gapPercentage > 20 ? 'text-red-600' :
                      gap.gapPercentage < -20 ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {gap.gapPercentage > 0 ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : gap.gapPercentage < 0 ? (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      ) : null}
                      {gap.gapPercentage > 0 ? '+' : ''}{gap.gapPercentage}%
                    </span>
                  </div>

                  {gap.gapType === 'SHORTAGE' && gap.gapPercentage > 30 && (
                    <div className="mt-3 p-2.5 bg-red-50 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700">
                        该技能存在严重供需缺口，建议重点招募相关服务商
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

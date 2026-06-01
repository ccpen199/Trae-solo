import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Clock, AlertTriangle, TrendingUp, Plus, BarChart3, Activity, FileText, MessageSquare, User } from 'lucide-react'
import type { Comment } from '@/types'
import { useSchemesStore } from '@/store/schemes'
import { roleLabels } from '@/types'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  number: number
  label: string
}

function StatCard({ icon: Icon, iconBg, iconColor, number, label }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-5">
      <div className="flex items-center gap-4">
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-6 h-6', iconColor)} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{number}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { schemes, fetchSchemes, getRisks } = useSchemesStore()
  const [risks, setRisks] = useState<Comment[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchSchemes()
    getRisks().then(setRisks)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalSchemes = schemes.length
  const pendingReview = schemes.filter((s) => s.status === 'in_review').length
  const openRisks = risks.length
  const weeklyChanges = Math.floor(schemes.length * 0.3) + 2

  const mockActivities = [
    { id: 1, type: 'comment', scheme: '会员购买流程优化', user: 'pm1', role: 'pm', time: '10分钟前', content: '提出了一个文案风险问题' },
    { id: 2, type: 'step', scheme: '会员购买流程优化', user: 'designer1', role: 'designer', time: '30分钟前', content: '更新了步骤"选择支付方式"的状态' },
    { id: 3, type: 'decision', scheme: '首页改版方案', user: 'pm1', role: 'pm', time: '1小时前', content: '创建了新的决策记录' },
    { id: 4, type: 'scheme', scheme: '个人中心重构', user: 'designer1', role: 'designer', time: '2小时前', content: '创建了新方案' },
    { id: 5, type: 'approve', scheme: '登录流程优化', user: 'developer1', role: 'developer', time: '3小时前', content: '通过了步骤"输入验证码"' },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment': return MessageSquare
      case 'step': return Activity
      case 'decision': return FileText
      case 'scheme': return FolderKanban
      case 'approve': return Clock
      default: return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'comment': return 'bg-orange-100 text-orange-600'
      case 'step': return 'bg-blue-100 text-blue-600'
      case 'decision': return 'bg-purple-100 text-purple-600'
      case 'scheme': return 'bg-green-100 text-green-600'
      case 'approve': return 'bg-emerald-100 text-emerald-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} iconBg="bg-blue-100" iconColor="text-blue-600" number={totalSchemes} label="方案总数" />
        <StatCard icon={Clock} iconBg="bg-orange-100" iconColor="text-orange-600" number={pendingReview} label="待评审" />
        <StatCard icon={AlertTriangle} iconBg="bg-red-100" iconColor="text-red-600" number={openRisks} label="未关闭风险" />
        <StatCard icon={TrendingUp} iconBg="bg-green-100" iconColor="text-green-600" number={weeklyChanges} label="本周变更" />
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => navigate('/schemes')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#e8723a] text-white rounded-lg font-medium hover:bg-[#d6612a] transition-colors"
        >
          <Plus className="w-5 h-5" />
          创建方案
        </button>
        <button
          onClick={() => navigate('/retrospective')}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          <BarChart3 className="w-5 h-5" />
          查看复盘
        </button>
      </div>

      <div className="bg-white rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h2>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-4">
            {mockActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type)
              return (
                <div key={activity.id} className="relative flex items-start gap-4 pl-10">
                  <div className={cn('absolute left-0 w-8 h-8 rounded-full flex items-center justify-center', getActivityColor(activity.type))}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1e3a5f]">{activity.scheme}</span>
                        <span className="px-2 py-0.5 text-xs bg-[#dbeafe] text-[#1e3a5f] rounded">
                          {roleLabels[activity.role]}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{activity.user}</span>
                      <span>{activity.content}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Users, Heart, PawPrint, FileCheck, Database, BarChart3, PieChart, Activity, Clock, CheckSquare, RefreshCw, Settings, ChevronRight, UserPlus, AlertTriangle } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import AdminSidebar from '@/components/admin/AdminSidebar'

const mockStats = {
  todayRegistered: 128,
  todayAdoption: 47,
  todayBreeding: 23,
  pendingReviews: 56,
  filingSuccessRate: 94,
}

const mockActivities = [
  { id: 1, type: 'register', user: '张三', time: '10分钟前', desc: '新用户注册' },
  { id: 2, type: 'review', user: '系统', time: '12分钟前', desc: 'AI审核通过领养申请 #A2049' },
  { id: 3, type: 'filing', user: '系统', time: '25分钟前', desc: '备案成功 #BL8847291' },
  { id: 4, type: 'review', user: '李四', time: '38分钟前', desc: '发布了新的配种需求' },
  { id: 5, type: 'register', user: '王五', time: '45分钟前', desc: '新用户注册并完成实名认证' },
  { id: 6, type: 'filing', user: '系统', time: '1小时前', desc: '备案重试成功 #BL8847288' },
  { id: 7, type: 'review', user: '系统', time: '1小时前', desc: 'AI拦截违规内容 #C3829' },
  { id: 8, type: 'block', user: '系统', time: '2小时前', desc: '拦截活体交易尝试 #T20481' },
  { id: 9, type: 'register', user: '赵六', time: '2小时前', desc: '新用户注册' },
  { id: 10, type: 'review', user: '管理员', time: '3小时前', desc: '人工审核通过内容 #C3820' },
]

function getActivityIcon(type: string) {
  switch (type) {
    case 'register': return UserPlus
    case 'review': return FileCheck
    case 'filing': return Database
    case 'block': return AlertTriangle
    default: return Activity
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'register': return 'bg-blue-100 text-blue-600'
    case 'review': return 'bg-primary/10 text-primary'
    case 'filing': return 'bg-success/10 text-success'
    case 'block': return 'bg-danger/10 text-danger'
    default: return 'bg-stone-100 text-text-secondary'
  }
}

function BarChart({ data, color = 'bg-primary' }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 ${color} rounded-t transition-all hover:opacity-80`}
          style={{ height: `${(v / max) * 100}%` }}
        />
      ))}
    </div>
  )
}

export default function Admin() {
  const { fetchReviewQueue, fetchFilings } = useAdminStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try { await Promise.all([fetchReviewQueue(), fetchFilings()]) } catch {}
      setLoading(false)
    }
    load()
  }, [fetchReviewQueue, fetchFilings])

  return (
    <div className="min-h-screen bg-cream flex">
      <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0">
        <div className="sticky top-0 z-30 bg-white border-b border-stone-200 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-stone-100 rounded-lg transition"
              >
                <Menu className="w-5 h-5 text-text-secondary" />
              </button>
              <div>
                <h1 className="heading-font text-lg font-bold text-text-primary">数据概览</h1>
                <p className="text-xs text-text-secondary">平台运营核心指标与实时动态</p>
              </div>
            </div>
            <button className="p-2 hover:bg-stone-100 rounded-lg transition">
              <Settings className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </div>

        <div className="p-4 lg:p-8 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: '今日注册用户', value: mockStats.todayRegistered, icon: Users, color: 'blue', trend: '+12%', data: [10, 18, 22, 15, 28, 35, mockStats.todayRegistered] },
              { label: '今日领养申请', value: mockStats.todayAdoption, icon: Heart, color: 'danger', trend: '+8%', data: [5, 8, 12, 10, 15, 20, mockStats.todayAdoption] },
              { label: '今日配种需求', value: mockStats.todayBreeding, icon: PawPrint, color: 'primary', trend: '+15%', data: [3, 5, 8, 12, 10, 18, mockStats.todayBreeding] },
              { label: '待审核内容', value: mockStats.pendingReviews, icon: FileCheck, color: 'warning', trend: '-5%', data: [80, 72, 68, 65, 60, 58, mockStats.pendingReviews] },
              { label: '备案成功率', value: `${mockStats.filingSuccessRate}%`, icon: Database, color: 'success', trend: '+2%', data: [88, 90, 92, 91, 93, 94, mockStats.filingSuccessRate] },
            ].map((stat, i) => {
              const Icon = stat.icon
              const colorMap: Record<string, string> = {
                blue: 'bg-blue-100 text-blue-600',
                danger: 'bg-danger/10 text-danger',
                primary: 'bg-primary/10 text-primary',
                warning: 'bg-warning/10 text-warning',
                success: 'bg-success/10 text-success',
              }
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 shadow-sm opacity-0 animate-slideUp"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[stat.color]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`text-xs font-medium ${stat.trend.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary mb-1">{stat.value}</p>
                  <p className="text-xs text-text-secondary mb-3">{stat.label}</p>
                  <BarChart data={stat.data} color={stat.color === 'warning' ? 'bg-warning' : stat.color === 'danger' ? 'bg-danger' : stat.color === 'success' ? 'bg-success' : stat.color === 'blue' ? 'bg-blue-500' : 'bg-primary'} />
                </div>
              )
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="heading-font text-lg font-semibold text-text-primary flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    最近动态
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">平台最新操作记录</p>
                </div>
                <button className="text-sm text-primary hover:underline flex items-center gap-1">
                  查看全部 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 animate-pulse">
                      <div className="w-10 h-10 bg-stone-200 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-stone-200 rounded w-1/3" />
                        <div className="h-3 bg-stone-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))
                ) : (
                  mockActivities.map((activity, i) => {
                    const Icon = getActivityIcon(activity.type)
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-stone-50 transition animate-fadeIn"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getActivityColor(activity.type)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">
                            <span className="text-primary">{activity.user}</span>
                            <span className="text-text-secondary"> · </span>
                            {activity.desc}
                          </p>
                          <p className="text-xs text-text-secondary">{activity.time}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn stagger-1">
                <h3 className="heading-font text-lg font-semibold text-text-primary flex items-center gap-2 mb-6">
                  <PieChart className="w-5 h-5 text-secondary" />
                  用户构成
                </h3>
                <div className="space-y-4">
                  {[
                    { label: '实名认证用户', value: 86, color: 'bg-secondary' },
                    { label: '普通注册用户', value: 12, color: 'bg-primary' },
                    { label: '新注册用户', value: 2, color: 'bg-blue-500' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-text-secondary">{item.label}</span>
                        <span className="font-medium text-text-primary">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6 animate-fadeIn stagger-2">
                <h3 className="heading-font text-lg font-semibold text-text-primary flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  快捷操作
                </h3>
                <div className="space-y-3">
                  <Link
                    to="/admin/review"
                    className="w-full flex items-center gap-3 p-4 bg-warning/5 border border-warning/20 rounded-xl hover:bg-warning/10 transition"
                  >
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <CheckSquare className="w-5 h-5 text-warning" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">批量审核待处理内容</p>
                      <p className="text-xs text-text-secondary">{mockStats.pendingReviews} 条待审核</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-secondary" />
                  </Link>
                  <Link
                    to="/admin/filing"
                    className="w-full flex items-center gap-3 p-4 bg-success/5 border border-success/20 rounded-xl hover:bg-success/10 transition"
                  >
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-primary">同步所有待备案数据</p>
                      <p className="text-xs text-text-secondary">农业农村部门接口</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-secondary" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

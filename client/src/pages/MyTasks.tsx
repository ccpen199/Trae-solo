import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api'
import { Task } from '../types'
import { Clock, DollarSign, Users, Briefcase } from 'lucide-react'

export default function MyTasks() {
  const { user, isAuthenticated } = useAuthStore()
  const [role, setRole] = useState<'employer' | 'provider'>('employer')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('ALL')

  const statusFilters = [
    { value: 'ALL', label: '全部' },
    { value: 'BIDDING', label: '招标中' },
    { value: 'SELECTED', label: '已选标' },
    { value: 'IN_PROGRESS', label: '进行中' },
    { value: 'COMPLETED', label: '已完成' },
    { value: 'DISPUTED', label: '争议中' },
  ]

  useEffect(() => {
    if (!isAuthenticated) return
    const fetchTasks = async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/tasks/my?role=${role}${activeFilter !== 'ALL' ? `&status=${activeFilter}` : ''}`)
        setTasks(data.data || data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [role, activeFilter, isAuthenticated])

  const statusBadge: Record<string, { label: string; color: string }> = {
    DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
    BIDDING: { label: '招标中', color: 'bg-blue-50 text-blue-700' },
    SELECTED: { label: '已选标', color: 'bg-yellow-50 text-yellow-700' },
    IN_PROGRESS: { label: '进行中', color: 'bg-green-50 text-green-700' },
    COMPLETED: { label: '已完成', color: 'bg-gray-100 text-gray-600' },
    DISPUTED: { label: '争议中', color: 'bg-red-50 text-red-700' },
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold mb-4">请先登录</h2>
        <Link to="/login" className="btn-primary">去登录</Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的任务</h1>
          <p className="text-gray-500 mt-1">管理您的任务和项目</p>
        </div>
        {role === 'employer' && (
          <Link to="/tasks/create" className="btn-primary">
            发布新需求
          </Link>
        )}
      </div>

      {/* Role Switcher */}
      {(user?.role === 'BOTH') && (
        <div className="flex mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setRole('employer')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              role === 'employer' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
            }`}
          >
            我发布的任务
          </button>
          <button
            onClick={() => setRole('provider')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              role === 'provider' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
            }`}
          >
            我承接的任务
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{tasks.length}</div>
              <div className="text-sm text-gray-500">总任务数</div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter((t) => ['BIDDING', 'SELECTED', 'IN_PROGRESS'].includes(t.status)).length}
              </div>
              <div className="text-sm text-gray-500">进行中</div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {tasks.filter((t) => t.status === 'COMPLETED').length}
              </div>
              <div className="text-sm text-gray-500">已完成</div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ¥{tasks.reduce((sum, t) => sum + (t.totalAmount || (t.budgetMax + t.budgetMin) / 2), 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">累计金额</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card p-1 mb-6 inline-flex flex-wrap">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeFilter === filter.value
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-16 text-center">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无任务</h3>
          <p className="text-gray-500 mb-6">
            {role === 'employer' ? '开始发布您的第一个需求吧' : '去任务大厅看看有没有适合您的项目'}
          </p>
          {role === 'employer' ? (
            <Link to="/tasks/create" className="btn-primary">
              发布需求
            </Link>
          ) : (
            <Link to="/tasks" className="btn-primary">
              浏览任务
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const badge = statusBadge[task.status] || { label: task.status, color: 'bg-gray-100 text-gray-600' }
            return (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="card p-5 hover:shadow-md transition-all block"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`badge ${badge.color}`}>{badge.label}</span>
                      <span className="badge bg-gray-100 text-gray-600">
                        {task.category === 'DESIGN' ? '设计' : task.category === 'DEVELOPMENT' ? '开发' : task.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 hover:text-primary-600 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{task.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {task.skills?.slice(0, 4).map((s) => (
                        <span key={s.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-xl font-bold text-amber-600">
                      ¥{task.budgetMin.toLocaleString()}~{task.budgetMax.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {task._count?.bids || 0} 人投标
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

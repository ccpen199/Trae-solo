import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Filter, SlidersHorizontal, ChevronDown, Clock, MapPin } from 'lucide-react'
import api from '../api'
import { Task } from '../types'

export default function TaskList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minBudget: '',
    maxBudget: '',
    skillId: searchParams.get('skillId') || '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const categories = [
    { value: '', label: '全部' },
    { value: 'DESIGN', label: '设计服务' },
    { value: 'DEVELOPMENT', label: '开发服务' },
    { value: 'COPYWRITING', label: '文案撰写' },
    { value: 'MARKETING', label: '营销推广' },
    { value: 'DECORATION', label: '装修设计' },
    { value: 'VIDEO', label: '视频制作' },
    { value: 'CONSULTING', label: '咨询服务' },
    { value: 'OTHER', label: '其他' },
  ]

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (filters.category) params.append('category', filters.category)
        if (filters.minBudget) params.append('minBudget', filters.minBudget)
        if (filters.maxBudget) params.append('maxBudget', filters.maxBudget)
        if (filters.skillId) params.append('skillId', filters.skillId)
        params.append('sortBy', filters.sortBy)
        params.append('sortOrder', filters.sortOrder)
        params.append('page', page.toString())
        params.append('pageSize', '20')

        const { data } = await api.get(`/tasks?${params}`)
        setTasks(data.data || data)
        setTotal(data.total || (data.data || data).length)
      } catch (error) {
        console.error('获取任务列表失败', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTasks()
  }, [filters, page])

  const getCategoryLabel = (cat: string) => {
    const c = categories.find((c) => c.value === cat)
    return c?.label || cat
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      BIDDING: { label: '招标中', color: 'bg-blue-50 text-blue-700' },
      SELECTED: { label: '已选标', color: 'bg-yellow-50 text-yellow-700' },
      IN_PROGRESS: { label: '进行中', color: 'bg-green-50 text-green-700' },
      COMPLETED: { label: '已完成', color: 'bg-gray-100 text-gray-600' },
      DISPUTED: { label: '争议中', color: 'bg-red-50 text-red-700' },
    }
    return map[status] || { label: status, color: 'bg-gray-100 text-gray-600' }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">任务大厅</h1>
          <p className="text-gray-500 mt-1">共 {total} 个任务待您承接</p>
        </div>
        <Link to="/tasks/create" className="btn-primary">
          发布需求
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索任务标题、描述..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            <span className="text-gray-700">高级筛选</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">任务分类</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input-field"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">最低预算</label>
              <input
                type="number"
                value={filters.minBudget}
                onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
                placeholder="¥"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">最高预算</label>
              <input
                type="number"
                value={filters.maxBudget}
                onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
                placeholder="¥"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">排序方式</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="input-field"
              >
                <option value="createdAt">最新发布</option>
                <option value="budgetMax">预算从高到低</option>
                <option value="deadline">截止时间</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Category Quick Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => {
              setFilters({ ...filters, category: cat.value })
              setPage(1)
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filters.category === cat.value
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-16 text-center">
          <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无符合条件的任务</h3>
          <p className="text-gray-500">试试调整筛选条件</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tasks.map((task) => {
            const status = getStatusBadge(task.status)
            return (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="card p-5 hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge ${status.color}`}>{status.label}</span>
                  <span className="text-amber-600 font-bold">
                    ¥{task.budgetMin.toLocaleString()}~{task.budgetMax.toLocaleString()}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {task.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {task.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {task.skills?.slice(0, 3).map((skill) => (
                    <span key={skill.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {skill.name}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <img
                      src={task.employer?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.employerId}`}
                      alt=""
                      className="w-7 h-7 rounded-full"
                    />
                    <span className="text-sm text-gray-600">{task.employer?.username}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {task.daysLeft && task.daysLeft > 0 ? `剩余${task.daysLeft}天` : '已截止'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center mt-8 space-x-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="px-4 py-2 bg-primary-600 text-white rounded-lg">
            {page}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}

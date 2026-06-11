import { useEffect, useState } from 'react'
import { Search, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useTaskStore } from '@/stores/task'
import TaskCard from '@/components/TaskCard'

const categories = [
  { value: '', label: '全部' },
  { value: 'physical', label: '实物交付' },
  { value: 'online', label: '线上代办' },
  { value: 'skill', label: '技能支援' },
]

const sortTabs = [
  { value: 'hot', label: '热度' },
  { value: 'new', label: '最新' },
  { value: 'bounty', label: '悬赏' },
]

const hotTags = ['急件', '本地', '远程', '高薪', '技术支援', '搬运', '辅导', '设计', '翻译', '代购']

function SkeletonCard() {
  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-lg bg-navy-700" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-navy-700 rounded w-3/4" />
          <div className="flex gap-1">
            <div className="h-5 w-12 bg-navy-700 rounded-full" />
            <div className="h-5 w-14 bg-navy-700 rounded-full" />
          </div>
          <div className="h-3 bg-navy-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuthStore()
  const { tasks, total, page, totalPages, filters, loading, fetchTasks } = useTaskStore()
  const [searchValue, setSearchValue] = useState('')
  const [activeTag, setActiveTag] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      login('13800000001', '123456')
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [filters.category, filters.sort, filters.page])

  const handleSearch = () => {
    fetchTasks({ keyword: searchValue, page: 1 })
  }

  const handleCategoryChange = (category: string) => {
    fetchTasks({ category, page: 1 })
  }

  const handleSortChange = (sort: string) => {
    fetchTasks({ sort, page: 1 })
  }

  const handleTagClick = (tag: string) => {
    const newTag = activeTag === tag ? '' : tag
    setActiveTag(newTag)
    fetchTasks({ keyword: newTag || searchValue, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchTasks({ page: newPage })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-navy-900 pb-8">
      <div className="glass mx-auto max-w-4xl mt-4 p-6 glow-primary">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-emerald-primary">互助链</h1>
            <p className="text-cyber-muted text-sm mt-1">去中心化互助任务协作平台 · 信任创造价值</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/publish')}>
            <Send className="w-4 h-4" />
            发布任务
          </button>
        </div>
        <div className="flex gap-6 mt-4">
          <div className="text-center">
            <div className="text-xl font-bold text-emerald-primary">{total}</div>
            <div className="text-xs text-cyber-dim">任务总数</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-amber-primary">128</div>
            <div className="text-xs text-cyber-dim">活跃用户</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-cyber-text">2,460</div>
            <div className="text-xs text-cyber-dim">助利币流通</div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl mt-4 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-dim" />
            <input
              className="input-dark pl-9"
              placeholder="搜索任务..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn-primary px-4" onClick={handleSearch}>搜索</button>
        </div>

        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                filters.category === cat.value
                  ? 'bg-emerald-primary text-navy-900 font-semibold'
                  : 'bg-navy-700 text-cyber-muted hover:bg-navy-600'
              }`}
              onClick={() => handleCategoryChange(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 border-b border-navy-600 pb-2">
          {sortTabs.map((tab) => (
            <button
              key={tab.value}
              className={`px-3 py-1 text-sm transition-all ${
                filters.sort === tab.value
                  ? 'text-emerald-primary font-semibold border-b-2 border-emerald-primary'
                  : 'text-cyber-dim hover:text-cyber-muted'
              }`}
              onClick={() => handleSortChange(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {hotTags.map((tag) => (
            <button
              key={tag}
              className={`badge transition-all ${
                activeTag === tag
                  ? 'bg-emerald-primary/20 text-emerald-primary'
                  : 'bg-navy-700 text-cyber-dim hover:bg-navy-600 hover:text-cyber-muted'
              }`}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl mt-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 text-cyber-dim">暂无任务</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              上一页
            </button>
            <span className="text-cyber-muted text-sm">
              {page} / {totalPages}
            </span>
            <button
              className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

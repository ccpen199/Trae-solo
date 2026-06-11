import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Clock, Coins } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import type { Task } from '@/stores/task'

type TabKey = 'all' | 'published' | 'accepted' | 'completed'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'published', label: '已发布' },
  { key: 'accepted', label: '已承接' },
  { key: 'completed', label: '已完成' },
]

const statusLabels: Record<string, { text: string; color: string }> = {
  open: { text: '待接单', color: 'text-emerald-primary' },
  in_progress: { text: '进行中', color: 'text-amber-primary' },
  verifying: { text: '验证中', color: 'text-amber-primary' },
  completed: { text: '已完成', color: 'text-emerald-primary' },
  disputed: { text: '争议中', color: 'text-danger' },
  cancelled: { text: '已取消', color: 'text-cyber-dim' },
}

export default function ProfileHistory() {
  const { user, token } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token || !user) return
    setLoading(true)
    const params = new URLSearchParams({ limit: '50' })
    if (activeTab === 'published') params.set('publisher_id', user.id)
    else if (activeTab === 'accepted') params.set('assignee_id', user.id)
    else if (activeTab === 'completed') {
      params.set('assignee_id', user.id)
      params.set('status', 'completed')
    }

    fetch(`/api/tasks?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => { if (json.success) setTasks(json.data.items) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeTab, token, user])

  return (
    <div className="p-6 max-w-2xl mx-auto pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/profile" className="text-cyber-muted hover:text-cyber-text transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold font-heading text-cyber-text">任务历史</h1>
      </div>

      <div className="flex gap-1 mb-4 bg-navy-800 rounded-lg p-1 border border-navy-600">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`flex-1 py-2 text-sm rounded-md transition-all ${
              activeTab === tab.key
                ? 'bg-emerald-primary text-navy-900 font-semibold'
                : 'text-cyber-muted hover:text-cyber-text'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-dark !cursor-default animate-pulse">
              <div className="h-4 bg-navy-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-navy-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card-dark !cursor-default flex items-center justify-center py-16">
          <p className="text-cyber-dim text-sm">暂无任务记录</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => {
            const st = statusLabels[task.status] || { text: task.status, color: 'text-cyber-dim' }
            return (
              <Link key={task.id} to={`/task/${task.id}`} className="card-dark block">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-cyber-text truncate">{task.title}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-xs font-medium ${st.color}`}>{st.text}</span>
                      <span className="text-xs text-cyber-dim flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(task.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-primary text-sm font-medium flex-shrink-0">
                    <Coins size={14} />
                    {task.bounty_amount}
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

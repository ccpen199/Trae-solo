import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTasks, completeTask, claimTaskReward, getBeanBalance, getExchangeRate, exchangeBeans } from '../api/client'

const taskCategories = [
  { key: 'daily', label: '每日任务', icon: '📅' },
  { key: 'weekly', label: '每周任务', icon: '📆' },
  { key: 'special', label: '特殊任务', icon: '🌟' },
]

interface TaskItem {
  id: string
  title: string
  description: string
  lili_beans: number
  category: string
  status: 'pending' | 'completed' | 'claimed'
  progress?: number
  max_progress?: number
}

export default function Task() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [beanBalance, setBeanBalance] = useState(0)
  const [exchangeRate, setExchangeRate] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('daily')
  const [exchangeAmount, setExchangeAmount] = useState('')
  const [exchangeLoading, setExchangeLoading] = useState(false)
  const navigate = useNavigate()

  const loadData = async () => {
    setLoading(true)
    try {
      const [tasksRes, balanceRes, rateRes] = await Promise.allSettled([
        getTasks(),
        getBeanBalance(),
        getExchangeRate(),
      ])
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data?.items ?? tasksRes.value.data ?? [])
      if (balanceRes.status === 'fulfilled') setBeanBalance(balanceRes.value.data?.balance ?? 0)
      if (rateRes.status === 'fulfilled') setExchangeRate(rateRes.value.data?.rate ?? 0)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const handleComplete = async (id: string) => {
    try {
      await completeTask(id)
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: 'completed' } : t))
    } catch {}
  }

  const handleClaim = async (id: string) => {
    try {
      const res = await claimTaskReward(id)
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: 'claimed' } : t))
      setBeanBalance(res.data?.balance ?? beanBalance)
    } catch {}
  }

  const handleExchange = async () => {
    const amount = Number(exchangeAmount)
    if (!amount || amount <= 0) return
    setExchangeLoading(true)
    try {
      await exchangeBeans(amount)
      setBeanBalance((prev) => prev - amount)
      setExchangeAmount('')
      alert('兑换成功！')
    } catch (err: any) {
      alert(err.response?.data?.message || '兑换失败')
    } finally {
      setExchangeLoading(false)
    }
  }

  const filteredTasks = tasks.filter((t) => t.category === activeCategory)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="badge-verified">已完成</span>
      case 'claimed': return <span className="badge bg-gray-100 text-gray-500">已领取</span>
      default: return <span className="badge-pending">待完成</span>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">任务中心</h2>

      <div className="card p-5 mb-6 bg-gradient-to-r from-primary/5 to-yellow-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">我的里里豆</p>
            <p className="text-3xl font-bold text-primary mt-1">🫘 {beanBalance}</p>
          </div>
          <button onClick={() => navigate('/beans')} className="btn-secondary text-sm">
            查看明细
          </button>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">🎁 兑换话费</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-2">
              当前汇率: <span className="text-primary font-semibold">{exchangeRate || 100} 里里豆 = 1元话费</span>
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={exchangeAmount}
                onChange={(e) => setExchangeAmount(e.target.value)}
                placeholder="输入兑换数量"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                min={1}
              />
              <button
                onClick={handleExchange}
                disabled={exchangeLoading || !exchangeAmount}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {exchangeLoading ? '兑换中...' : '兑换'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {taskCategories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeCategory === cat.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div key={task.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{task.title}</h4>
                    {getStatusBadge(task.status)}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{task.description}</p>
                  {task.max_progress && task.max_progress > 1 && (
                    <div className="w-48">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>进度</span>
                        <span>{task.progress ?? 0}/{task.max_progress}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${((task.progress ?? 0) / task.max_progress) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-primary font-bold">+{task.lili_beans}</p>
                  <p className="text-xs text-gray-400">里里豆</p>
                  <div className="mt-2">
                    {task.status === 'pending' && (
                      <button onClick={() => handleComplete(task.id)} className="text-xs btn-primary py-1 px-3">
                        去完成
                      </button>
                    )}
                    {task.status === 'completed' && (
                      <button onClick={() => handleClaim(task.id)} className="text-xs btn-secondary py-1 px-3">
                        领取奖励
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🎯</p>
          <p>暂无{taskCategories.find((c) => c.key === activeCategory)?.label}</p>
        </div>
      )}

      <div className="card p-4 mt-6 bg-yellow-50 border-yellow-200">
        <p className="text-xs text-yellow-700">
          ⚠️ 反作弊提示：系统会检测异常行为，包括设备指纹伪造、IP频率异常等。违规操作将导致账号封禁。
        </p>
      </div>
    </div>
  )
}

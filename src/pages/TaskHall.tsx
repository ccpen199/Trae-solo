import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, Flame, TrendingUp, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import type { DifficultyLevel, AcceptancePeriod } from '@/types'
import TaskCard from '@/components/common/TaskCard'

const DIFFICULTY_PILLS: { value: DifficultyLevel | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'L1', label: 'L1' },
  { value: 'L2', label: 'L2' },
  { value: 'L3', label: 'L3' },
  { value: 'L4', label: 'L4' },
  { value: 'L5', label: 'L5' },
]

const ACCEPTANCE_PERIOD_PILLS: { value: AcceptancePeriod | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: '24h', label: '24小时' },
  { value: '72h', label: '72小时' },
  { value: '7d', label: '7天' },
]

const SORT_OPTIONS: { value: 'heat' | 'price' | 'newest'; label: string; icon: typeof Flame }[] = [
  { value: 'heat', label: '热度', icon: Flame },
  { value: 'price', label: '佣金', icon: TrendingUp },
  { value: 'newest', label: '最新', icon: Clock },
]

export default function TaskHall() {
  const tasks = useStore((s) => s.tasks)
  const difficultyFilter = useStore((s) => s.difficultyFilter)
  const setDifficultyFilter = useStore((s) => s.setDifficultyFilter)
  const acceptancePeriodFilter = useStore((s) => s.acceptancePeriodFilter)
  const setAcceptancePeriodFilter = useStore((s) => s.setAcceptancePeriodFilter)
  const searchQuery = useStore((s) => s.searchQuery)
  const setSearchQuery = useStore((s) => s.setSearchQuery)
  const sortBy = useStore((s) => s.sortBy)
  const setSortBy = useStore((s) => s.setSortBy)

  const filteredTasks = useMemo(() => {
    let result = tasks.filter((t) => t.status === 'open' && t.complianceStatus === 'approved')

    if (difficultyFilter !== 'all') {
      result = result.filter((t) => t.difficulty === difficultyFilter)
    }

    if (acceptancePeriodFilter !== 'all') {
      result = result.filter((t) => t.acceptancePeriod === acceptancePeriodFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      )
    }

    switch (sortBy) {
      case 'heat':
        result = [...result].sort((a, b) => (b.heatScore ?? 0) - (a.heatScore ?? 0))
        break
      case 'price':
        result = [...result].sort((a, b) => b.currentPrice - a.currentPrice)
        break
      case 'newest':
        result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }

    return result
  }, [tasks, difficultyFilter, acceptancePeriodFilter, searchQuery, sortBy])

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 font-serif text-2xl font-bold text-zinc-900">任务大厅</h1>

        <div className="mb-4">
          <div className="mb-1 text-xs font-medium text-zinc-500">难度筛选</div>
          <div className="flex flex-wrap items-center gap-2">
            {DIFFICULTY_PILLS.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setDifficultyFilter(pill.value)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  difficultyFilter === pill.value
                    ? 'bg-primary-400 text-white shadow-sm'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200',
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-1 text-xs font-medium text-zinc-500">验收时效</div>
          <div className="flex flex-wrap items-center gap-2">
            {ACCEPTANCE_PERIOD_PILLS.map((pill) => (
              <button
                key={pill.value}
                onClick={() => setAcceptancePeriodFilter(pill.value)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                  acceptancePeriodFilter === pill.value
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200',
                )}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="搜索任务标题或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-primary-400 focus:ring-1 focus:ring-primary-400"
            />
          </div>

          <div className="relative">
            <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'heat' | 'price' | 'newest')}
              className="appearance-none rounded-lg border border-zinc-200 bg-white py-2.5 pl-8 pr-8 text-sm outline-none transition-colors focus:border-primary-400"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}优先</option>
              ))}
            </select>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {filteredTasks.length === 0 ? (
            <motion.div
              key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="py-20 text-center text-zinc-400"
            >
              <div className="mb-2 text-4xl">📋</div>
              <p>无匹配任务</p>
            </motion.div>
          ) : (
            <motion.div
              key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredTasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <TaskCard task={task} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

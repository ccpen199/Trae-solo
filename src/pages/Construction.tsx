import { useState, useMemo } from 'react'
import { mockGanttTasks } from '@/store/platformStore'
import { usePlatformStore } from '@/store/platformStore'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  Calendar,
  Users,
  Filter,
  Bell,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

const categoryColors: Record<string, string> = {
  水电: 'bg-blue-500',
  泥木: 'bg-amber-500',
  油漆: 'bg-emerald-500',
  安装: 'bg-purple-500',
  软装: 'bg-rose-500',
}

const categoryColorsLight: Record<string, string> = {
  水电: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  泥木: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  油漆: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  安装: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  软装: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
}

const statusIcons: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  completed: { icon: CheckCircle2, color: 'text-accent-500' },
  in_progress: { icon: Play, color: 'text-brand-500' },
  delayed: { icon: AlertTriangle, color: 'text-warn-500' },
  pending: { icon: Clock, color: 'text-surface-400' },
}

const statusLabels: Record<string, string> = {
  completed: '已完成',
  in_progress: '进行中',
  delayed: '已延期',
  pending: '待开始',
}

export default function Construction() {
  const { ganttView, setGanttView } = usePlatformStore()
  const [filterCategory, setFilterCategory] = useState<string>('全部')
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const totalDays = 61
  const dayWidth = ganttView === 'week' ? 10 : 4

  const filteredTasks = useMemo(() => {
    if (filterCategory === '全部') return mockGanttTasks
    return mockGanttTasks.filter((t) => t.category === filterCategory)
  }, [filterCategory])

  const categories = ['全部', '水电', '泥木', '油漆', '安装', '软装']
  const delayedCount = mockGanttTasks.filter((t) => t.status === 'delayed').length
  const inProgressCount = mockGanttTasks.filter((t) => t.status === 'in_progress').length
  const completedCount = mockGanttTasks.filter((t) => t.status === 'completed').length

  const weekLabels = Array.from({ length: Math.ceil(totalDays / 7) }, (_, i) => `第${i + 1}周`)

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-title">施工进度</h1>
          <p className="mt-1 text-surface-500">甘特图绑定水电/泥木/油漆等节点，自动预警延期</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Bell size={14} className="mr-1.5" /> 预警设置
          </button>
          <div className="flex gap-1 rounded-lg bg-surface-100 p-1 dark:bg-surface-800">
            <button
              onClick={() => setGanttView('week')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                ganttView === 'week'
                  ? 'bg-white text-brand-600 shadow-sm dark:bg-surface-700 dark:text-brand-400'
                  : 'text-surface-600 dark:text-surface-400'
              }`}
            >
              周视图
            </button>
            <button
              onClick={() => setGanttView('month')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                ganttView === 'month'
                  ? 'bg-white text-brand-600 shadow-sm dark:bg-surface-700 dark:text-brand-400'
                  : 'text-surface-600 dark:text-surface-400'
              }`}
            >
              月视图
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 dark:bg-accent-900/20">
              <CheckCircle2 size={20} className="text-accent-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-surface-900 dark:text-white">{completedCount}</div>
              <div className="text-xs text-surface-500">已完成节点</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
              <Play size={20} className="text-brand-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-surface-900 dark:text-white">{inProgressCount}</div>
              <div className="text-xs text-surface-500">进行中</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warn-50 dark:bg-warn-900/20">
              <AlertTriangle size={20} className="text-warn-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-surface-900 dark:text-white">{delayedCount}</div>
              <div className="text-xs text-surface-500">延期预警</div>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <Calendar size={20} className="text-purple-500" />
            </div>
            <div>
              <div className="text-2xl font-bold text-surface-900 dark:text-white">{totalDays}</div>
              <div className="text-xs text-surface-500">总工期(天)</div>
            </div>
          </div>
        </div>
      </div>

      {delayedCount > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-warn-200 bg-warn-50 px-4 py-3 dark:border-warn-800 dark:bg-warn-900/20">
          <AlertTriangle size={18} className="text-warn-500" />
          <div className="flex-1">
            <span className="font-medium text-warn-700 dark:text-warn-300">延期预警</span>
            <span className="ml-2 text-sm text-warn-600 dark:text-warn-400">
              窗帘配饰节点已延期，请及时跟进
            </span>
          </div>
          <button className="text-sm font-medium text-warn-600 hover:text-warn-700 dark:text-warn-400">处理</button>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <Filter size={14} className="text-surface-400" />
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                filterCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="flex items-center border-b border-surface-200 bg-surface-50 px-4 py-2 dark:border-surface-700 dark:bg-surface-800">
              <div className="w-44 shrink-0 text-sm font-medium text-surface-600 dark:text-surface-400">工序名称</div>
              <div className="flex-1 relative" style={{ width: totalDays * dayWidth }}>
                {ganttView === 'week' && weekLabels.map((label, i) => (
                  <div
                    key={label}
                    className="absolute top-0 text-[10px] text-surface-400"
                    style={{ left: i * 7 * dayWidth + 2 }}
                  >
                    {label}
                  </div>
                ))}
                {ganttView === 'week' &&
                  Array.from({ length: Math.ceil(totalDays / 7) }, (_, i) => (
                    <div
                      key={`grid-${i}`}
                      className="absolute top-0 h-full border-l border-surface-200 dark:border-surface-700"
                      style={{ left: i * 7 * dayWidth }}
                    />
                  ))
                }
              </div>
            </div>

            <div className="divide-y divide-surface-100 dark:divide-surface-700">
              {filteredTasks.map((task) => {
                const si = statusIcons[task.status]
                const StatusIcon = si.icon
                const isExpanded = expandedTask === task.id
                return (
                  <div key={task.id}>
                    <div
                      className="flex items-center px-4 py-2 hover:bg-surface-50 dark:hover:bg-surface-800/50 cursor-pointer transition-colors"
                      onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                    >
                      <div className="w-44 shrink-0 flex items-center gap-2 pr-2">
                        <span className={categoryColorsLight[task.category]}>
                          <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: categoryColors[task.category].replace('bg-', '') }} />
                        </span>
                        <span className="badge" style={{
                          backgroundColor: task.category === '水电' ? '#eff6ff' : task.category === '泥木' ? '#fffbeb' : task.category === '油漆' ? '#ecfdf5' : task.category === '安装' ? '#f5f3ff' : '#fff1f2',
                          color: task.category === '水电' ? '#1d4ed8' : task.category === '泥木' ? '#b45309' : task.category === '油漆' ? '#15803d' : task.category === '安装' ? '#7c3aed' : '#be123c',
                          fontSize: '10px',
                          padding: '1px 6px',
                        }}>{task.category}</span>
                        <span className="text-sm text-surface-700 dark:text-surface-300 truncate">{task.name}</span>
                        {isExpanded ? <ChevronUp size={12} className="text-surface-400 ml-auto shrink-0" /> : <ChevronDown size={12} className="text-surface-400 ml-auto shrink-0" />}
                      </div>
                      <div className="flex-1 relative" style={{ width: totalDays * dayWidth, height: 36 }}>
                        <div
                          className={`gantt-bar ${categoryColors[task.category]} ${task.status === 'delayed' ? 'ring-2 ring-warn-400 animate-pulse' : ''}`}
                          style={{ left: task.start * dayWidth, width: task.duration * dayWidth, top: 4 }}
                        >
                          <div
                            className="absolute left-0 top-0 h-full rounded-full bg-white/20"
                            style={{ width: `${task.progress}%` }}
                          />
                          <span className="relative z-10 truncate">{task.name}</span>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="bg-surface-50 px-4 py-3 dark:bg-surface-800/50 animate-slide-up">
                        <div className="ml-44 grid grid-cols-2 gap-4 sm:grid-cols-4">
                          <div>
                            <div className="text-xs text-surface-500">状态</div>
                            <div className="flex items-center gap-1 text-sm">
                              <StatusIcon size={14} className={si.color} />
                              <span className="text-surface-700 dark:text-surface-300">{statusLabels[task.status]}</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-surface-500">负责人</div>
                            <div className="flex items-center gap-1 text-sm text-surface-700 dark:text-surface-300">
                              <Users size={14} className="text-surface-400" /> {task.assignee}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-surface-500">进度</div>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-200 dark:bg-surface-600">
                                <div
                                  className={`h-full rounded-full ${categoryColors[task.category]}`}
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-surface-500">{task.progress}%</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-surface-500">工期</div>
                            <div className="text-sm text-surface-700 dark:text-surface-300">
                              第{task.start + 1}天 ~ 第{task.start + task.duration}天（{task.duration}天）
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 card p-5">
        <h3 className="mb-4 font-semibold text-surface-900 dark:text-white">工种进度统计</h3>
        <div className="space-y-4">
          {['水电', '泥木', '油漆', '安装', '软装'].map((cat) => {
            const catTasks = mockGanttTasks.filter((t) => t.category === cat)
            const avgProgress = catTasks.length > 0
              ? Math.round(catTasks.reduce((sum, t) => sum + t.progress, 0) / catTasks.length)
              : 0
            return (
              <div key={cat}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="badge" style={{
                      backgroundColor: cat === '水电' ? '#eff6ff' : cat === '泥木' ? '#fffbeb' : cat === '油漆' ? '#ecfdf5' : cat === '安装' ? '#f5f3ff' : '#fff1f2',
                      color: cat === '水电' ? '#1d4ed8' : cat === '泥木' ? '#b45309' : cat === '油漆' ? '#15803d' : cat === '安装' ? '#7c3aed' : '#be123c',
                      fontSize: '10px',
                      padding: '1px 6px',
                    }}>{cat}</span>
                    <span className="text-surface-600 dark:text-surface-400">
                      {catTasks.length}个节点
                    </span>
                  </div>
                  <span className="text-surface-500">{avgProgress}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${categoryColors[cat]}`}
                    style={{ width: `${avgProgress}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

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
  X,
  Settings,
  User,
  Mail,
  MessageSquare,
  Phone,
  History,
  FileText,
  BadgeCheck,
  Timer,
  ShieldAlert,
  AlertCircle,
  CheckCheck,
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
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [warningTab, setWarningTab] = useState<'threshold' | 'owner' | 'notify' | 'history'>('threshold')

  const [thresholds, setThresholds] = useState({
    delayAlert: 2,
    delayWarning: 5,
    delaySevere: 7,
    qualityFail: 1,
    budgetOver: 3,
    notifyHours: 24,
  })

  const [owners, setOwners] = useState([
    { id: '1', name: '陈先生', role: '业主', scope: '全部节点', notify: ['站内信', '短信', '微信'], enabled: true },
    { id: '2', name: '李工', role: '项目经理', scope: '水电/泥木/油漆/安装', notify: ['站内信', '电话', '微信'], enabled: true },
    { id: '3', name: '王工', role: '水电负责人', scope: '水电全部分项', notify: ['站内信', '电话'], enabled: true },
    { id: '4', name: '刘工', role: '质检工程师', scope: '全部质检节点', notify: ['站内信', '短信'], enabled: true },
    { id: '5', name: '平台监理', role: '第三方监督', scope: '节点验收及延期>3天', notify: ['站内信'], enabled: false },
  ])

  const [notifyRecords] = useState([
    { id: 'N001', time: '6/14 09:15', type: '延期预警', level: '严重', content: '水电隐蔽工程验收已延期8天，触发严重级通知', to: '陈先生/李工/平台监理', channel: '短信+站内信', status: '已处理', handler: '李工', handleTime: '6/14 11:30', result: '已申请平台监理介入，协商6/16复检' },
    { id: 'N002', time: '6/12 14:05', type: '延期预警', level: '警告', content: '水电节点预计超期2天，触发工期预警', to: '李工/王工', channel: '站内信+电话', status: '已处理', handler: '李工', handleTime: '6/12 18:00', result: '增派1名电工，预计追回1天工期' },
    { id: 'N003', time: '6/10 08:30', type: '节点提醒', level: '常规', content: '防水分项施工将于6/17开始，请提前准备防水材料', to: '李工/王工', channel: '站内信', status: '已处理', handler: '王工', handleTime: '6/10 10:00', result: '材料已下单，预计6/15到场' },
    { id: 'N004', time: '6/5 16:00', type: '质量预警', level: '严重', content: '电路布线质检1项未通过（地线未接）', to: '陈先生/李工/王工/刘工', channel: '全部渠道', status: '已处理', handler: '王工', handleTime: '6/5 20:00', result: '已整改并通过二次验收，记录上链' },
    { id: 'N005', time: '6/3 10:00', type: '启动提醒', level: '常规', content: '水电分项工程于今日开工', to: '陈先生/李工/王工', channel: '站内信+微信', status: '已处理', handler: '李工', handleTime: '6/3 10:30', result: '业主已确认开工' },
  ])

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
          <button
            className="btn-secondary relative"
            onClick={() => setShowWarningModal(true)}
          >
            <Bell size={14} className="mr-1.5 text-warn-500" /> 预警设置
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-warn-500 px-1 text-[10px] font-bold text-white">
              1
            </span>
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
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={() => setShowWarningModal(false)}>
          <div className="card max-h-[85vh] w-full max-w-3xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4 dark:border-surface-700">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warn-50 dark:bg-warn-900/20">
                  <ShieldAlert size={18} className="text-warn-600 dark:text-warn-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-surface-900 dark:text-white">延期预警设置</h2>
                  <p className="text-xs text-surface-500">配置阈值、责任人、通知方式与处理留痕</p>
                </div>
              </div>
              <button onClick={() => setShowWarningModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-100 dark:hover:bg-surface-800">
                <X size={18} className="text-surface-500" />
              </button>
            </div>

            <div className="flex border-b border-surface-200 dark:border-surface-700 px-6">
              {([
                { key: 'threshold', label: '预警阈值', icon: Timer },
                { key: 'owner', label: '责任人', icon: User },
                { key: 'notify', label: '通知方式', icon: Bell },
                { key: 'history', label: '处理留痕', icon: History },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setWarningTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    warningTab === tab.key
                      ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                      : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                  }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                  {tab.key === 'history' && (
                    <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-warn-500 px-1 text-[10px] font-bold text-white">5</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {warningTab === 'threshold' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="rounded-lg border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800">
                    <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                      <Timer size={15} className="text-brand-500" /> 延期天数阈值
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { key: 'delayAlert', label: '关注级', desc: '开始关注，站内提醒', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
                        { key: 'delayWarning', label: '警告级', desc: '升级通知，短信+电话', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800' },
                        { key: 'delaySevere', label: '严重级', desc: '全员通知，平台介入', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
                      ].map((item) => (
                        <div key={item.key} className={`rounded-lg border p-3 ${item.border} ${item.bg}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-semibold ${item.color}`}>{item.label}</span>
                            <span className="text-xs text-surface-500">逾期≥</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={thresholds[item.key as keyof typeof thresholds]}
                              onChange={(e) => setThresholds({ ...thresholds, [item.key]: parseInt(e.target.value) || 0 })}
                              className="w-16 rounded-lg border border-surface-200 bg-white px-2 py-1.5 text-center text-lg font-bold text-surface-900 dark:border-surface-600 dark:bg-surface-700 dark:text-white"
                            />
                            <span className="text-sm text-surface-500">天</span>
                          </div>
                          <p className="mt-2 text-[11px] text-surface-500">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800">
                    <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                      <AlertCircle size={15} className="text-warn-500" /> 其他预警规则
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-surface-200 bg-white p-3 dark:border-surface-600 dark:bg-surface-900">
                        <div className="text-xs text-surface-500 mb-1">质检不通过次数阈值</div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={thresholds.qualityFail}
                            onChange={(e) => setThresholds({ ...thresholds, qualityFail: parseInt(e.target.value) || 0 })}
                            className="w-14 rounded-lg border border-surface-200 bg-white px-2 py-1 text-center font-bold dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                          />
                          <span className="text-sm text-surface-500">次未通过即预警</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-surface-200 bg-white p-3 dark:border-surface-600 dark:bg-surface-900">
                        <div className="text-xs text-surface-500 mb-1">预算超支预警阈值</div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={thresholds.budgetOver}
                            onChange={(e) => setThresholds({ ...thresholds, budgetOver: parseInt(e.target.value) || 0 })}
                            className="w-14 rounded-lg border border-surface-200 bg-white px-2 py-1 text-center font-bold dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                          />
                          <span className="text-sm text-surface-500">%超支即预警</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-surface-200 bg-white p-3 dark:border-surface-600 dark:bg-surface-900">
                        <div className="text-xs text-surface-500 mb-1">节点提前通知时间</div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={thresholds.notifyHours}
                            onChange={(e) => setThresholds({ ...thresholds, notifyHours: parseInt(e.target.value) || 0 })}
                            className="w-14 rounded-lg border border-surface-200 bg-white px-2 py-1 text-center font-bold dark:border-surface-600 dark:bg-surface-800 dark:text-white"
                          />
                          <span className="text-sm text-surface-500">小时前通知</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className="btn-primary w-full">保存阈值设置</button>
                </div>
              )}

              {warningTab === 'owner' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-surface-500">配置各责任人的预警接收范围与启用状态</p>
                    <button className="btn-outline text-sm">+ 添加责任人</button>
                  </div>
                  {owners.map((owner) => (
                    <div key={owner.id} className="rounded-lg border border-surface-200 dark:border-surface-700 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/30">
                            <User size={16} className="text-brand-600 dark:text-brand-400" />
                          </div>
                          <div>
                            <div className="font-medium text-surface-900 dark:text-white">{owner.name}</div>
                            <div className="text-xs text-surface-500">{owner.role}</div>
                          </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <span className="text-xs text-surface-500">{owner.enabled ? '已启用' : '已禁用'}</span>
                          <div
                            onClick={() => setOwners(owners.map((o) => o.id === owner.id ? { ...o, enabled: !o.enabled } : o))}
                            className={`relative h-6 w-11 rounded-full transition-colors cursor-pointer ${owner.enabled ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-600'}`}
                          >
                            <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${owner.enabled ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                          </div>
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-xs text-surface-500 mb-1">负责范围</div>
                          <div className="rounded-lg bg-surface-50 px-3 py-1.5 text-surface-700 dark:bg-surface-800 dark:text-surface-300">{owner.scope}</div>
                        </div>
                        <div>
                          <div className="text-xs text-surface-500 mb-1">通知方式</div>
                          <div className="flex flex-wrap gap-1">
                            {owner.notify.map((n) => (
                              <span key={n} className="inline-flex items-center gap-0.5 rounded bg-brand-100 px-2 py-0.5 text-[11px] text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                                {n === '站内信' && <Mail size={10} />}
                                {n === '短信' && <MessageSquare size={10} />}
                                {n === '电话' && <Phone size={10} />}
                                {n === '微信' && <MessageSquare size={10} />}
                                {n}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {warningTab === 'notify' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
                    <h4 className="text-sm font-semibold text-surface-900 dark:text-white mb-2 flex items-center gap-2">
                      <Bell size={15} className="text-brand-500" /> 通知策略
                    </h4>
                    <p className="text-xs text-surface-600 dark:text-surface-400">
                      不同预警级别触发不同通知策略。关注级仅站内信通知责任人；警告级自动短信+电话通知项目经理；严重级全员多渠道通知并抄送平台监理。
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { level: '关注级', trigger: '逾期 2 天', channel: '站内信', to: '项目相关人员', color: 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20', badge: 'bg-blue-500' },
                      { level: '警告级', trigger: '逾期 5 天', channel: '短信 + 电话 + 站内信', to: '项目经理 + 业主', color: 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20', badge: 'bg-amber-500' },
                      { level: '严重级', trigger: '逾期 7 天', channel: '全部渠道（短信/电话/微信/站内信）', to: '全员 + 平台监理', color: 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20', badge: 'bg-red-500' },
                      { level: '质检失败', trigger: '1 次不通过', channel: '短信 + 站内信', to: '质检工程师 + 项目经理', color: 'border-purple-300 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20', badge: 'bg-purple-500' },
                      { level: '预算超支', trigger: '超支 3%', channel: '站内信 + 短信', to: '业主 + 项目经理', color: 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20', badge: 'bg-emerald-500' },
                    ].map((rule) => (
                      <div key={rule.level} className={`rounded-lg border p-3 ${rule.color}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block h-2 w-2 rounded-full ${rule.badge}`} />
                            <span className="text-sm font-semibold text-surface-900 dark:text-white">{rule.level}</span>
                          </div>
                          <span className="text-xs text-surface-500">触发条件: {rule.trigger}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-surface-500">通知方式: </span>
                            <span className="text-surface-700 dark:text-surface-300">{rule.channel}</span>
                          </div>
                          <div>
                            <span className="text-surface-500">通知对象: </span>
                            <span className="text-surface-700 dark:text-surface-300">{rule.to}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {warningTab === 'history' && (
                <div className="space-y-3 animate-fade-in">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm text-surface-500">所有预警通知的处理留痕记录</p>
                    <button className="text-xs text-brand-600 dark:text-brand-400">导出记录</button>
                  </div>
                  {notifyRecords.map((rec) => (
                    <div key={rec.id} className="rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden">
                      <div className="flex items-center justify-between bg-surface-50 px-4 py-2.5 dark:bg-surface-800">
                        <div className="flex items-center gap-2">
                          {rec.level === '严重' ? (
                            <AlertTriangle size={14} className="text-red-500" />
                          ) : rec.level === '警告' ? (
                            <AlertCircle size={14} className="text-amber-500" />
                          ) : (
                            <Bell size={14} className="text-blue-500" />
                          )}
                          <span className="text-sm font-medium text-surface-900 dark:text-white">{rec.type}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${
                            rec.level === '严重' ? 'bg-red-500' : rec.level === '警告' ? 'bg-amber-500' : 'bg-blue-500'
                          }`}>
                            {rec.level}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-surface-500">
                          <span>{rec.time}</span>
                          <span className="flex items-center gap-0.5 text-accent-600 dark:text-accent-400">
                            <CheckCheck size={12} /> {rec.status}
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        <p className="text-sm text-surface-700 dark:text-surface-300">{rec.content}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-surface-500">通知对象: </span>
                            <span className="text-surface-700 dark:text-surface-300">{rec.to}</span>
                          </div>
                          <div>
                            <span className="text-surface-500">通知渠道: </span>
                            <span className="text-surface-700 dark:text-surface-300">{rec.channel}</span>
                          </div>
                        </div>
                        <div className="rounded-lg bg-accent-50 border border-accent-200 p-2.5 dark:bg-accent-900/20 dark:border-accent-800">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-accent-700 dark:text-accent-300 mb-1">
                            <BadgeCheck size={12} />
                            处理留痕
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[11px]">
                            <div>
                              <span className="text-surface-500">处理人: </span>
                              <span className="text-surface-700 dark:text-surface-300">{rec.handler}</span>
                            </div>
                            <div>
                              <span className="text-surface-500">处理时间: </span>
                              <span className="text-surface-700 dark:text-surface-300">{rec.handleTime}</span>
                            </div>
                            <div>
                              <span className="text-surface-500">处理结果: </span>
                              <span className="text-accent-700 dark:text-accent-300">{rec.result}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

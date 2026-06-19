import { useAuthStore } from '@/store/auth'
import { useNavigate } from 'react-router-dom'
import { useBusinessStore, Task } from '@/store/business'
import {
  TrendingUp,
  Users,
  Package,
  Wallet,
  QrCode,
  Share2,
  ClipboardList,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Bell,
  Star,
  AlertCircle,
  ChevronRight,
  Award,
  Target,
  Zap,
  MapPin,
  Check,
  Phone,
  MessageCircle,
  Plus,
  RefreshCw,
} from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { customers, appointments, addToast, openModal, tasks, completeTask, addTask } = useBusinessStore()

  const stats = [
    {
      key: 'revenue',
      label: '本月业绩',
      value: '¥128,600',
      change: '+23.5%',
      trend: 'up',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-600',
      detail: 'revenue',
    },
    {
      key: 'customers',
      label: '累计客户',
      value: customers.length.toString(),
      change: `+${Math.min(12, customers.length)} 本周`,
      trend: 'up',
      icon: Users,
      gradient: 'from-sky-500 to-blue-600',
      detail: 'customers',
    },
    {
      key: 'orders',
      label: '本月订单',
      value: '42',
      change: '+8',
      trend: 'up',
      icon: Package,
      gradient: 'from-violet-500 to-purple-600',
      detail: 'revenue',
    },
    {
      key: 'commission',
      label: '待结算佣金',
      value: '¥15,320',
      change: '-5.2%',
      trend: 'down',
      icon: Wallet,
      gradient: 'from-amber-500 to-orange-600',
      detail: 'commission',
    },
  ]

  const quickActions = [
    {
      label: '生成展业码',
      icon: QrCode,
      color: 'emerald',
      path: '/qrcode',
      toast: { title: '正在生成展业码', desc: '专属动态二维码生成中...', type: 'info' as const },
    },
    {
      label: '分享产品',
      icon: Share2,
      color: 'sky',
      path: '/share',
      toast: { title: '已进入分享中心', desc: '选择素材一键分享到微信', type: 'success' as const },
    },
    {
      label: '新增客户',
      icon: Plus,
      color: 'violet',
      path: null,
      toast: null,
      action: () => openModal('add_customer'),
    },
    {
      label: '预约服务',
      icon: ClipboardList,
      color: 'amber',
      path: '/stores',
      toast: { title: '生活馆预约', desc: '选择门店和时间快速预约', type: 'info' as const },
    },
  ]

  const teamMembers = [
    { id: 'TM01', name: '赵小明', avatar: '赵', performance: '¥45,200', rank: '新星' },
    { id: 'TM02', name: '孙丽华', avatar: '孙', performance: '¥38,800', rank: '骨干' },
    { id: 'TM03', name: '周建国', avatar: '周', performance: '¥25,600', rank: '新星' },
  ]

  const alerts = [
    { id: 'A001', type: 'info', title: '新品上市通知', desc: '松花粉片升级版已上线，点击查看产品详情', path: '/products' },
    { id: 'A002', type: 'warning', title: '合规提醒', desc: '近期分享内容请避免敏感话术，已为您推送合规培训', path: '/compliance' },
  ]

  const stores = [
    { name: '浦东旗舰店', distance: '1.2km', rating: 4.9, slots: 3 },
    { name: '徐汇体验店', distance: '2.8km', rating: 4.8, slots: 0 },
    { name: '长宁服务中心', distance: '3.5km', rating: 4.7, slots: 5 },
  ]

  const roleLabels: Record<string, string> = {
    direct_seller: '直销员工作台',
    store_owner: '生活馆工作台',
    hq_admin: '总部运营中心',
  }

  const roleGreetings: Record<string, string> = {
    direct_seller: '开启今日展业，稳步拓展客户网络',
    store_owner: '管理门店日常，提升客户服务体验',
    hq_admin: '全局运营监控，驱动业务高效增长',
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500'
      case 'pending':
        return 'bg-amber-500'
      case 'new':
        return 'bg-sky-500'
      default:
        return 'bg-slate-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200'
    }
  }

  const getAlertColor = (type: string) => {
    return type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-sky-50 border-sky-200 text-sky-800'
  }

  const getActionColor = (color: string) => {
    const map: Record<string, string> = {
      emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
      sky: 'from-sky-500 to-blue-600 shadow-sky-500/30',
      violet: 'from-violet-500 to-purple-600 shadow-violet-500/30',
      amber: 'from-amber-500 to-orange-600 shadow-amber-500/30',
    }
    return map[color] || map.emerald
  }

  const handleAction = (action: (typeof quickActions)[0]) => {
    if (action.action) {
      action.action()
    } else if (action.path) {
      navigate(action.path)
    }
    if (action.toast) {
      addToast({ type: action.toast.type, title: action.toast.title, description: action.toast.desc })
    }
  }

  const handleCreateTask = () => {
    const title = prompt('请输入任务标题')
    if (!title) return
    addTask({
      title,
      priority: 'medium',
      deadline: '今天内',
      status: 'todo',
      type: 'other',
    })
    addToast({ type: 'success', title: '任务已创建', description: title })
  }

  const handleTaskComplete = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    if (task.status === 'done') {
      addToast({ type: 'info', title: '任务已恢复', description: task.title })
    } else {
      completeTask(task.id)
      addToast({ type: 'success', title: '任务已完成', description: task.title })
    }
  }

  return (
    <div className="space-y-6">
      {/* 欢迎横幅 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 lg:p-8 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
          <h1 className="mt-3 text-2xl lg:text-3xl font-bold">
            你好，{user?.name}！欢迎回到{roleLabels[user?.role || 'direct_seller']}
          </h1>
          <p className="mt-2 text-white/80">{roleGreetings[user?.role || 'direct_seller']}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => handleAction(quickActions[0])}
              className="px-5 py-2.5 bg-white text-emerald-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 active:scale-95"
            >
              <QrCode className="w-5 h-5" />
              生成展业码
            </button>
            <button
              onClick={() => handleAction(quickActions[2])}
              className="px-5 py-2.5 bg-white/20 backdrop-blur text-white font-semibold rounded-xl border border-white/30 hover:bg-white/30 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              新增客户
            </button>
            <button
              onClick={() => {
                addToast({ type: 'success', title: '数据已刷新', description: '所有业务数据已同步至最新' })
              }}
              className="px-4 py-2.5 bg-white/10 backdrop-blur text-white/90 font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              刷新数据
            </button>
          </div>
        </div>
      </div>

      {/* 告警通知 */}
      <div className="grid gap-3 md:grid-cols-2">
        {alerts.map((alert) => (
          <button
            key={alert.id}
            onClick={() => {
              navigate(alert.path)
              addToast({ type: 'info', title: '正在跳转', description: alert.title })
            }}
            className={`p-4 rounded-xl border flex items-start gap-3 text-left hover:shadow-md transition-all active:scale-[0.99] cursor-pointer ${getAlertColor(alert.type)}`}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{alert.title}</div>
              <div className="text-sm opacity-80 mt-0.5">{alert.desc}</div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-50" />
          </button>
        ))}
      </div>

      {/* 数据统计卡片 - 可点击查看明细 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <button
              key={stat.key}
              onClick={() => {
                openModal('performance_detail', { type: stat.detail })
                addToast({ type: 'info', title: `正在加载${stat.label}明细` })
              }}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-xl hover:border-emerald-200 transition-all text-left active:scale-[0.98] group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${
                    stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl lg:text-3xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                  {stat.label}
                  <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* 快捷操作 */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            快捷操作
          </h2>
          <button
            onClick={() => addToast({ type: 'info', title: '工具中心', description: '更多展业工具正在开发中' })}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            更多工具
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={() => handleAction(action)}
                className={`group p-5 rounded-xl border border-slate-200 hover:border-transparent hover:text-white bg-white hover:bg-gradient-to-br ${getActionColor(
                  action.color
                )} hover:shadow-xl transition-all active:scale-95`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon className="w-7 h-7 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-sm">{action.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 主内容网格 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左列 - 客户和任务 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 最近客户 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-500" />
                最近客户动态
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal('add_customer')}
                  className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新增
                </button>
                <button
                  onClick={() => navigate('/customers')}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                >
                  查看全部
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {customers.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    openModal('customer_detail', c)
                    addToast({ type: 'info', title: '正在打开客户档案', description: `${c.name} 的详细信息` })
                  }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer -mx-2 active:bg-slate-100 group"
                >
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                      {c.avatar}
                    </div>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(c.status)}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 group-hover:text-emerald-600 transition-colors">{c.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{c.tag}</span>
                      <span>最近联系 · {c.lastContact}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        addToast({ type: 'success', title: '正在呼叫', description: `正在拨打 ${c.phone}` })
                      }}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        addToast({ type: 'info', title: '打开对话', description: `与 ${c.name} 的聊天窗口` })
                      }}
                      className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition" />
                </div>
              ))}
            </div>
          </div>

          {/* 今日待办 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-violet-500" />
                今日待办
              </h2>
              <button
                onClick={handleCreateTask}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                新建任务
              </button>
            </div>
            <div className="space-y-2">
              {tasks
                .filter((t) => t.status !== 'cancelled')
                .map((task) => {
                  const done = task.status === 'done'
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 p-3.5 rounded-xl border transition group cursor-pointer ${
                        done ? 'bg-slate-50 border-slate-100 opacity-70' : 'bg-white border-slate-200 hover:border-violet-200 hover:shadow-sm'
                      }`}
                      onClick={() => {
                        openModal('task_detail', task)
                      }}
                    >
                      <button
                        onClick={(e) => handleTaskComplete(task, e)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition flex-shrink-0 ${
                          done
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-slate-300 hover:border-emerald-500 group-hover:scale-110'
                        }`}
                      >
                        {done && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${done ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                          {task.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">截止时间 · {task.deadline}</div>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-md border ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority === 'high' ? '高优' : task.priority === 'medium' ? '中优' : '低优'}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

        {/* 右列 - 团队与培训 */}
        <div className="space-y-6">
          {/* 业绩进度 */}
          <button
            onClick={() => {
              openModal('performance_detail', { type: 'revenue' })
              addToast({ type: 'info', title: '业绩明细', description: '正在加载业绩构成和历史数据...' })
            }}
            className="w-full text-left bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center justify-between">
              <Award className="w-7 h-7 group-hover:scale-110 transition" />
              <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">月度目标</span>
            </div>
            <div className="mt-4">
              <div className="text-sm text-white/80">本月目标完成度</div>
              <div className="text-4xl font-bold mt-1">64%</div>
            </div>
            <div className="mt-4 w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full w-[64%] bg-white rounded-full" />
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-white/80">已完成 ¥128,600</span>
              <span className="text-white/80 flex items-center gap-1">
                目标 ¥200,000
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </button>

          {/* 团队成员 */}
          {user?.role === 'direct_seller' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="font-bold text-slate-800 flex items-center gap-2 cursor-pointer hover:text-violet-600"
                  onClick={() => {
                    openModal('performance_detail', { type: 'team' })
                    addToast({ type: 'info', title: '团队明细' })
                  }}
                >
                  <Users className="w-5 h-5 text-emerald-500" />
                  我的团队
                </h3>
                <span className="text-xs text-slate-500">共 3 人</span>
              </div>
              <div className="space-y-3">
                {teamMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      openModal('performance_detail', { type: 'team' })
                      addToast({ type: 'info', title: m.name, description: `查看团队成员详情` })
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer active:bg-slate-100 text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                      {m.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-800 text-sm">{m.name}</div>
                      <div className="text-xs text-slate-500">{m.rank}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-600">{m.performance}</div>
                      <div className="text-[10px] text-slate-400">本月</div>
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  openModal('performance_detail', { type: 'team' })
                }}
                className="w-full mt-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition font-medium flex items-center justify-center gap-1"
              >
                查看团队裂变图谱
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 附近生活馆 */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-rose-500" />
              附近生活馆
            </h3>
            <div className="space-y-3">
              {stores.map((s) => (
                <button
                  key={s.name}
                  onClick={() => {
                    navigate('/stores')
                    addToast({
                      type: 'info',
                      title: s.name,
                      description: s.slots > 0 ? `今日可预约，剩余 ${s.slots} 位` : '今日已约满，可预约明天',
                    })
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer transition active:scale-[0.99] text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-800 text-sm">{s.name}</div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs">
                      <Star className="w-3 h-3 fill-amber-500" />
                      {s.rating}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-slate-500">距离 {s.distance}</span>
                    <span className={`font-medium ${s.slots > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {s.slots > 0 ? `今日剩余 ${s.slots} 位` : '已约满'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 培训中心 */}
          <button
            onClick={() => {
              navigate('/exams')
              addToast({ type: 'info', title: '培训考试中心', description: '新品知识考核待完成' })
            }}
            className="w-full text-left bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-lg hover:border-indigo-200 transition-all active:scale-[0.99] group"
          >
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 group-hover:text-indigo-600 transition">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              培训考试
              <ChevronRight className="w-4 h-4 ml-auto opacity-50 group-hover:translate-x-0.5 transition" />
            </h3>
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-sm truncate">新品知识考核</div>
                  <div className="text-xs text-slate-500 mt-0.5">15 题 · 及格 80 分</div>
                </div>
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">待完成</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              今日新增 {appointments.filter((a) => a.status === 'pending').length} 个待处理预约
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

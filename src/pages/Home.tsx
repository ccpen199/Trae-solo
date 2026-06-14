import { Link } from 'react-router-dom'
import {
  Lightbulb,
  PenTool,
  BarChart3,
  ShoppingBag,
  ClipboardCheck,
  Shield,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  FileText,
  Zap,
} from 'lucide-react'

const quickStats = [
  { label: '进行中项目', value: '1', icon: Zap, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20' },
  { label: '待验收项', value: '3', icon: ClipboardCheck, color: 'text-warn-600', bg: 'bg-warn-50 dark:bg-warn-900/20' },
  { label: '设计迭代', value: '6', icon: PenTool, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { label: '上链存证', value: '7', icon: Shield, color: 'text-accent-600', bg: 'bg-accent-50 dark:bg-accent-900/20' },
]

const modules = [
  { path: '/inspiration', label: '灵感库', desc: '按户型/预算/风格筛选真实完工案例', icon: Lightbulb, gradient: 'from-amber-500 to-orange-500' },
  { path: '/design', label: '设计协作', desc: 'CAD+效果图在线批注/投票/版本对比', icon: PenTool, gradient: 'from-violet-500 to-purple-500' },
  { path: '/construction', label: '施工进度', desc: '甘特图绑定节点，自动预警延期', icon: BarChart3, gradient: 'from-brand-500 to-cyan-500' },
  { path: '/materials', label: '建材商城', desc: '自营SKU+品牌入驻，标注产地/环保等级', icon: ShoppingBag, gradient: 'from-emerald-500 to-teal-500' },
  { path: '/inspection', label: '验收系统', desc: 'AR实景标注问题，整改自动进待办', icon: ClipboardCheck, gradient: 'from-rose-500 to-pink-500' },
  { path: '/blockchain', label: '上链存证', desc: '合同与支付凭证上链，纠纷可追溯', icon: Shield, gradient: 'from-sky-500 to-indigo-500' },
]

const recentActivities = [
  { time: '10分钟前', content: '王工程师上传了水电施工图', type: 'upload' },
  { time: '2小时前', content: '水电管线铺设进度更新至85%', type: 'progress' },
  { time: '昨天 16:20', content: '厨房地砖升级变更已上链存证', type: 'blockchain' },
  { time: '昨天 14:30', content: '业主批注了主卧效果图，需修改', type: 'comment' },
  { time: '前天 10:05', content: '水电隐蔽工程验收存争议', type: 'alert' },
]

export default function Home() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          欢迎回来，陈先生
        </h1>
        <p className="mt-1 text-surface-500">
          您的全屋装修项目正在进行中，当前处于水电施工阶段
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        {quickStats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <div>
                <div className="text-2xl font-bold text-surface-900 dark:text-white">{stat.value}</div>
                <div className="text-xs text-surface-500">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="section-title mb-4">核心模块</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <Link
              key={mod.path}
              to={mod.path}
              className="card group relative overflow-hidden p-5"
            >
              <div className={`absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br ${mod.gradient} opacity-10 transition-transform group-hover:scale-150`} />
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${mod.gradient} text-white`}>
                <mod.icon size={20} />
              </div>
              <h3 className="mb-1 font-semibold text-surface-900 dark:text-white">{mod.label}</h3>
              <p className="mb-3 text-sm text-surface-500">{mod.desc}</p>
              <div className="flex items-center text-sm font-medium text-brand-600 dark:text-brand-400">
                进入模块 <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-white">项目进度概览</h3>
            <Link to="/construction" className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">
              查看详情 →
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { name: '水电工程', progress: 85, status: 'in_progress', color: 'bg-brand-500' },
              { name: '泥木工程', progress: 0, status: 'pending', color: 'bg-surface-300 dark:bg-surface-600' },
              { name: '油漆工程', progress: 0, status: 'pending', color: 'bg-surface-300 dark:bg-surface-600' },
              { name: '安装工程', progress: 0, status: 'pending', color: 'bg-surface-300 dark:bg-surface-600' },
              { name: '软装工程', progress: 0, status: 'pending', color: 'bg-surface-300 dark:bg-surface-600' },
            ].map((item) => (
              <div key={item.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-surface-700 dark:text-surface-300">{item.name}</span>
                  <div className="flex items-center gap-2">
                    {item.status === 'in_progress' && (
                      <span className="badge-brand">施工中</span>
                    )}
                    <span className="text-surface-500">{item.progress}%</span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-white">最近动态</h3>
          </div>
          <div className="space-y-3">
            {recentActivities.map((act, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800">
                <div className="mt-0.5">
                  {act.type === 'upload' && <FileText size={16} className="text-brand-500" />}
                  {act.type === 'progress' && <TrendingUp size={16} className="text-accent-500" />}
                  {act.type === 'blockchain' && <Shield size={16} className="text-indigo-500" />}
                  {act.type === 'comment' && <Users size={16} className="text-purple-500" />}
                  {act.type === 'alert' && <AlertTriangle size={16} className="text-warn-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-700 dark:text-surface-300">{act.content}</p>
                  <p className="text-xs text-surface-400 flex items-center gap-1 mt-0.5">
                    <Clock size={10} /> {act.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-warn-500" />
          <h3 className="font-semibold text-surface-900 dark:text-white">待办事项</h3>
        </div>
        <div className="space-y-2">
          {[
            { text: '水电隐蔽工程验收争议待处理', priority: 'high', tag: '紧急' },
            { text: '确认主卧效果图修改意见', priority: 'medium', tag: '待处理' },
            { text: '厨房地砖变更差价支付', priority: 'medium', tag: '待支付' },
            { text: '防水施工节点即将开始（预计6/17）', priority: 'low', tag: '提醒' },
          ].map((todo, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-surface-200 dark:border-surface-700 p-3">
              <div className={`h-2 w-2 rounded-full ${
                todo.priority === 'high' ? 'bg-red-500' : todo.priority === 'medium' ? 'bg-warn-500' : 'bg-brand-500'
              }`} />
              <span className="flex-1 text-sm text-surface-700 dark:text-surface-300">{todo.text}</span>
              <span className={`badge ${
                todo.priority === 'high' ? 'badge-warn' : todo.priority === 'medium' ? 'badge-brand' : 'badge-accent'
              }`}>{todo.tag}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={18} className="text-accent-500" />
          <h3 className="font-semibold text-surface-900 dark:text-white">已完成的里程碑</h3>
        </div>
        <div className="flex items-center">
          {[
            { name: '签约', done: true },
            { name: '设计', done: true },
            { name: '水电', done: false },
            { name: '泥木', done: false },
            { name: '油漆', done: false },
            { name: '安装', done: false },
            { name: '验收', done: false },
          ].map((step, i, arr) => (
            <div key={step.name} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                  step.done
                    ? 'bg-accent-500 text-white'
                    : 'bg-surface-200 text-surface-500 dark:bg-surface-700 dark:text-surface-400'
                }`}>
                  {step.done ? '✓' : i + 1}
                </div>
                <span className={`mt-1 text-xs ${step.done ? 'text-accent-600 dark:text-accent-400 font-medium' : 'text-surface-400'}`}>
                  {step.name}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className={`mx-1 h-0.5 w-8 sm:w-12 md:w-16 lg:w-20 ${
                  step.done && arr[i + 1].done ? 'bg-accent-500' : 'bg-surface-200 dark:bg-surface-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

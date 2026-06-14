import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  ChevronRight,
  ExternalLink,
  Wallet,
  Home as HomeIcon,
  Gavel,
  FileEdit,
  CreditCard,
  History,
  Search,
  SlidersHorizontal,
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
  { time: '10分钟前', content: '王工程师上传了水电施工图', type: 'upload', module: 'design' },
  { time: '2小时前', content: '水电管线铺设进度更新至85%', type: 'progress', module: 'construction' },
  { time: '昨天 16:20', content: '厨房地砖升级变更已上链存证', type: 'blockchain', module: 'blockchain' },
  { time: '昨天 14:30', content: '业主批注了主卧效果图，需修改', type: 'comment', module: 'design' },
  { time: '前天 10:05', content: '水电隐蔽工程验收存争议', type: 'alert', module: 'inspection' },
]

const todoItems = [
  {
    id: 't1',
    text: '水电隐蔽工程验收争议待处理',
    priority: 'high',
    tag: '紧急',
    module: '验收系统',
    modulePath: '/inspection',
    action: '查看争议详情',
    relatedRecords: ['验收报告', '施工合同'],
  },
  {
    id: 't2',
    text: '确认主卧效果图修改意见',
    priority: 'medium',
    tag: '待处理',
    module: '设计协作',
    modulePath: '/design',
    action: '去批注',
    relatedRecords: ['设计方案V4'],
  },
  {
    id: 't3',
    text: '厨房地砖变更差价支付 ¥3,200',
    priority: 'medium',
    tag: '待支付',
    module: '上链存证',
    modulePath: '/blockchain',
    action: '去支付',
    relatedRecords: ['变更单', '施工合同'],
  },
  {
    id: 't4',
    text: '防水施工节点即将开始（预计6/17）',
    priority: 'low',
    tag: '提醒',
    module: '施工进度',
    modulePath: '/construction',
    action: '查看排期',
    relatedRecords: ['施工甘特图'],
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [globalSearch, setGlobalSearch] = useState('')
  const [paymentSubmitted, setPaymentSubmitted] = useState(false)

  const getModuleIcon = (mod: string) => {
    switch (mod) {
      case 'design': return <PenTool size={14} className="text-purple-500" />
      case 'construction': return <BarChart3 size={14} className="text-brand-500" />
      case 'blockchain': return <Shield size={14} className="text-indigo-500" />
      case 'inspection': return <ClipboardCheck size={14} className="text-rose-500" />
      default: return <FileText size={14} className="text-surface-400" />
    }
  }

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

      <div className="mb-6 card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="搜索案例、施工节点、建材、支付凭证..."
              className="input-field pl-9 w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {['风格筛选', '预算筛选', '施工详情', '后台管理'].map((label) => (
              <button
                key={label}
                onClick={() => {
                  if (label.includes('筛选')) navigate('/inspiration')
                  else if (label === '施工详情') navigate('/construction/detail')
                  else navigate('/blockchain')
                }}
                className="btn-secondary text-sm"
              >
                <SlidersHorizontal size={14} className="mr-1" />
                {label}
              </button>
            ))}
          </div>
        </div>
        {globalSearch.trim() && (
          <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300">
            搜索结果：已筛选出与“{globalSearch.trim()}”相关的案例、节点详情、建材商品和链上凭证。
          </div>
        )}
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

      <div className="mb-6 card p-5 border-l-4 border-l-warn-500 dark:border-l-warn-400 bg-warn-50/50 dark:bg-warn-900/10">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warn-100 dark:bg-warn-900/30">
            <AlertTriangle size={20} className="text-warn-600 dark:text-warn-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-surface-900 dark:text-white">
              重要提醒：水电隐蔽工程验收存在争议
            </h3>
            <p className="mt-1 text-sm text-surface-600 dark:text-surface-400">
              验收报告已上链存证锁定，建议您尽快与施工方协商，或申请平台监理介入。所有沟通记录将同步存证。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/inspection')}
                className="btn-primary text-sm"
              >
                查看争议详情
              </button>
              <button
                onClick={() => navigate('/blockchain')}
                className="btn-outline text-sm"
              >
                <Shield size={14} className="mr-1" />
                查看链上存证
              </button>
              <button className="btn-secondary text-sm">
                申请平台介入
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 mb-8">
        <div className="lg:col-span-3 card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-white">项目进度概览</h3>
            <Link to="/construction/detail" className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1">
              查看详情 <ChevronRight size={14} />
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { name: '水电工程', progress: 85, status: 'in_progress', color: 'bg-brand-500', alert: '验收存争议' },
              { name: '泥木工程', progress: 0, status: 'pending', color: 'bg-amber-500', next: '预计6/17开始' },
              { name: '油漆工程', progress: 0, status: 'pending', color: 'bg-emerald-500', next: '预计7/2开始' },
              { name: '安装工程', progress: 0, status: 'pending', color: 'bg-purple-500', next: '预计7/20开始' },
              { name: '软装工程', progress: 0, status: 'delayed', color: 'bg-rose-500', alert: '窗帘配饰延期' },
            ].map((item) => (
              <div key={item.name} className="group">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-surface-700 dark:text-surface-300 font-medium">{item.name}</span>
                    {item.status === 'in_progress' && <span className="badge-brand">施工中</span>}
                    {item.status === 'delayed' && <span className="badge-warn">延期</span>}
                    {item.alert && <span className="text-warn-600 text-xs dark:text-warn-400">· {item.alert}</span>}
                    {item.next && <span className="text-surface-400 text-xs">· {item.next}</span>}
                  </div>
                  <span className="text-surface-500">{item.progress}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-surface-500">
              <HomeIcon size={14} />
              <span>全屋装修项目 · 总工期61天</span>
            </div>
            <button
              onClick={() => navigate('/construction')}
              className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              查看甘特图 →
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-white">最近动态</h3>
            <button className="text-xs text-surface-400 hover:text-surface-600">
              全部动态
            </button>
          </div>
          <div className="space-y-1">
            {recentActivities.map((act, i) => (
              <button
                key={i}
                onClick={() => {
                  if (act.module === 'design') navigate('/design')
                  else if (act.module === 'construction') navigate('/construction')
                  else if (act.module === 'blockchain') navigate('/blockchain')
                  else if (act.module === 'inspection') navigate('/inspection')
                }}
                className="w-full flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-surface-50 dark:hover:bg-surface-800 text-left"
              >
                <div className="mt-0.5">
                  {act.type === 'upload' && <FileText size={16} className="text-brand-500" />}
                  {act.type === 'progress' && <TrendingUp size={16} className="text-accent-500" />}
                  {act.type === 'blockchain' && <Shield size={16} className="text-indigo-500" />}
                  {act.type === 'comment' && <Users size={16} className="text-purple-500" />}
                  {act.type === 'alert' && <AlertTriangle size={16} className="text-warn-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-700 dark:text-surface-300">{act.content}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    {getModuleIcon(act.module)}
                    <span className="text-xs text-surface-400">{act.time}</span>
                  </div>
                </div>
                <ChevronRight size={14} className="mt-1 text-surface-300 group-hover:text-brand-500" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={18} className="text-warn-500" />
          <h3 className="font-semibold text-surface-900 dark:text-white">待办事项</h3>
          <span className="badge-warn">{todoItems.length}项</span>
        </div>
        <div className="space-y-3">
          {todoItems.map((todo) => (
            <div
              key={todo.id}
              className="group flex items-stretch gap-3 rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
            >
              <div className={`w-1.5 ${
                todo.priority === 'high' ? 'bg-red-500' : todo.priority === 'medium' ? 'bg-warn-500' : 'bg-brand-500'
              }`} />
              <div className="flex-1 py-3 pr-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{todo.text}</p>
                      <span className={`badge ${
                        todo.priority === 'high' ? 'badge-warn' : todo.priority === 'medium' ? 'badge-brand' : 'badge-accent'
                      }`}>{todo.tag}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-surface-500">
                      <span className="flex items-center gap-1">
                        {todo.module === '设计协作' && <PenTool size={10} />}
                        {todo.module === '施工进度' && <BarChart3 size={10} />}
                        {todo.module === '验收系统' && <ClipboardCheck size={10} />}
                        {todo.module === '上链存证' && <Shield size={10} />}
                        {todo.module}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileEdit size={10} />
                        关联: {todo.relatedRecords.join('、')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (todo.action === '去支付') {
                        setPaymentSubmitted(true)
                      } else {
                        navigate(todo.modulePath)
                      }
                    }}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700 transition-colors"
                  >
                    {todo.action}
                    <ExternalLink size={10} />
                  </button>
                </div>
              </div>
            </div>
            ))}
        </div>
        {paymentSubmitted && (
          <div className="mt-4 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700 dark:border-accent-800 dark:bg-accent-900/20 dark:text-accent-300">
            购买/提交成功：厨房地砖变更差价 ¥3,200 已提交支付申请，支付凭证将自动上链存证。
          </div>
        )}
      </div>

      <div className="mb-6 card p-5">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={18} className="text-accent-500" />
          <h3 className="font-semibold text-surface-900 dark:text-white">项目里程碑</h3>
        </div>
        <div className="flex items-center justify-between">
          {[
            { name: '签约', done: true, date: '5/15', amount: '¥185,000' },
            { name: '设计', done: true, date: '5/28', amount: '6版方案' },
            { name: '水电', done: false, active: true, date: '进行中', alert: '验收争议' },
            { name: '泥木', done: false, date: '预计6/17' },
            { name: '油漆', done: false, date: '预计7/2' },
            { name: '安装', done: false, date: '预计7/20' },
            { name: '验收', done: false, date: '预计8/1' },
          ].map((step, i, arr) => (
            <div key={step.name} className="flex-1 flex flex-col items-center relative">
              <div className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold border-2 ${
                step.done
                  ? 'bg-accent-500 text-white border-accent-500'
                  : step.active
                    ? 'bg-brand-600 text-white border-brand-600 animate-pulse'
                    : 'bg-white text-surface-400 border-surface-200 dark:bg-surface-800 dark:border-surface-600'
              }`}>
                {step.done ? '✓' : i + 1}
              </div>
              <span className={`mt-2 text-xs font-medium ${
                step.done ? 'text-accent-600 dark:text-accent-400' :
                step.active ? 'text-brand-600 dark:text-brand-400' : 'text-surface-400'
              }`}>
                {step.name}
              </span>
              <span className="text-[10px] text-surface-400 mt-0.5">{step.date}</span>
              {step.amount && (
                <span className="text-[10px] text-surface-500 mt-0.5">{step.amount}</span>
              )}
              {step.alert && (
                <span className="text-[10px] text-warn-600 mt-0.5 flex items-center gap-0.5">
                  <AlertTriangle size={9} /> {step.alert}
                </span>
              )}
              {i < arr.length - 1 && (
                <div className={`absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2 ${
                  step.done && arr[i + 1].done ? 'bg-accent-500' : 'bg-surface-200 dark:bg-surface-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-900/20">
              <CreditCard size={16} className="text-brand-600 dark:text-brand-400" />
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-white">支付进度</h3>
          </div>
          <div className="space-y-3">
            {[
              { name: '首期30%', amount: '¥55,500', done: true, date: '5/16' },
              { name: '二期40%', amount: '¥74,000', done: true, date: '6/5' },
              { name: '变更差价', amount: '¥3,200', done: false, alert: '待支付' },
              { name: '三期25%', amount: '¥46,250', done: false, date: '水电验收后' },
              { name: '尾款5%', amount: '¥9,250', done: false, date: '竣工验收后' },
            ].map((pay, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {pay.done ? (
                    <CheckCircle2 size={14} className="text-accent-500" />
                  ) : pay.alert ? (
                    <AlertTriangle size={14} className="text-warn-500" />
                  ) : (
                    <Clock size={14} className="text-surface-400" />
                  )}
                  <span className={`${pay.done ? 'text-surface-700 dark:text-surface-300' : 'text-surface-500'}`}>
                    {pay.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-surface-900 dark:text-white">{pay.amount}</div>
                  <div className="text-[10px] text-surface-400">{pay.date}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/blockchain')}
            className="w-full mt-4 pt-3 border-t border-surface-100 dark:border-surface-700 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center justify-center gap-1"
          >
            <Shield size={14} />
            查看支付凭证上链记录
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warn-50 dark:bg-warn-900/20">
              <Gavel size={16} className="text-warn-600 dark:text-warn-400" />
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-white">纠纷追溯入口</h3>
          </div>
          <div className="rounded-lg border border-warn-200 bg-warn-50 p-3 dark:border-warn-800 dark:bg-warn-900/20 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-warn-600 dark:text-warn-400" />
              <span className="text-sm font-medium text-warn-700 dark:text-warn-300">1项正在争议</span>
            </div>
            <p className="text-xs text-warn-600 dark:text-warn-400">
              水电隐蔽工程验收存争议，链上证据已锁定
            </p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/inspection')}
              className="w-full flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2 text-sm hover:bg-surface-100 dark:bg-surface-800 dark:hover:bg-surface-700"
            >
              <span className="text-surface-700 dark:text-surface-300">查看争议详情</span>
              <ChevronRight size={14} className="text-surface-400" />
            </button>
            <button
              onClick={() => navigate('/blockchain')}
              className="w-full flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2 text-sm hover:bg-surface-100 dark:bg-surface-800 dark:hover:bg-surface-700"
            >
              <span className="text-surface-700 dark:text-surface-300">调取链上证据</span>
              <ChevronRight size={14} className="text-surface-400" />
            </button>
            <button className="w-full flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-300">
              <span>申请平台监理介入</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <History size={16} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-surface-900 dark:text-white">合同与变更</h3>
          </div>
          <div className="space-y-3">
            {[
              { name: '主施工合同', amount: '¥185,000', status: '已确认', type: '合同' },
              { name: '设计方案确认书', amount: '-', status: '已确认', type: '设计确认' },
              { name: '地砖升级变更单', amount: '+¥3,200', status: '已确认', type: '变更单', alert: '待支付' },
              { name: '水电验收报告', amount: '-', status: '争议中', type: '验收报告', alert: true },
            ].map((doc, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  {doc.type === '合同' && <FileText size={14} className="text-brand-500 shrink-0" />}
                  {doc.type === '设计确认' && <PenTool size={14} className="text-purple-500 shrink-0" />}
                  {doc.type === '变更单' && <FileEdit size={14} className="text-rose-500 shrink-0" />}
                  {doc.type === '验收报告' && <ClipboardCheck size={14} className="text-amber-500 shrink-0" />}
                  <span className="text-surface-700 dark:text-surface-300 truncate">{doc.name}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className={`text-xs ${
                    doc.status === '已确认' ? 'text-accent-600 dark:text-accent-400' :
                    doc.status === '争议中' ? 'text-warn-600 dark:text-warn-400' :
                    'text-surface-500'
                  }`}>
                    {doc.status}
                  </div>
                  <div className="text-xs text-surface-400">{doc.amount}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/blockchain')}
            className="w-full mt-4 pt-3 border-t border-surface-100 dark:border-surface-700 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center justify-center gap-1"
          >
            <Shield size={14} />
            全部上链存证
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

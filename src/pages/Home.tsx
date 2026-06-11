import { Link } from 'react-router-dom'
import {
  Users,
  Package,
  Store,
  ShieldAlert,
  TrendingUp,
  Calendar,
  ArrowRight,
  Megaphone,
  BookOpen,
  BarChart3,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import StatCard from '@/components/StatCard'
import PageHeader from '@/components/PageHeader'
import { homeStats, performanceTrend, todoItems } from '@/data/mockData'

const priorityConfig = {
  high: { label: '紧急', className: 'bg-red-100 text-red-700' },
  medium: { label: '一般', className: 'bg-amber-100 text-amber-700' },
  low: { label: '普通', className: 'bg-emerald-100 text-emerald-700' },
}

const navItems = [
  { label: '展业管理', icon: Megaphone, path: '/exhibition', color: 'bg-emerald-50 text-emerald-600' },
  { label: '产品管理', icon: Package, path: '/products', color: 'bg-blue-50 text-blue-600' },
  { label: '门店管理', icon: Store, path: '/stores', color: 'bg-purple-50 text-purple-600' },
  { label: '合规管理', icon: ShieldAlert, path: '/compliance', color: 'bg-red-50 text-red-600' },
  { label: '培训学习', icon: BookOpen, path: '/training', color: 'bg-amber-50 text-amber-600' },
  { label: '数据看板', icon: BarChart3, path: '/dashboard', color: 'bg-cyan-50 text-cyan-600' },
]

const typeIcons: Record<string, React.ReactNode> = {
  审批: <CheckCircle2 size={14} className="text-blue-500" />,
  活动: <Calendar size={14} className="text-purple-500" />,
  培训: <BookOpen size={14} className="text-amber-500" />,
  库存: <AlertCircle size={14} className="text-orange-500" />,
  考试: <Clock size={14} className="text-cyan-500" />,
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 px-4 py-3 text-sm">
      <p className="font-medium text-gray-700 mb-2">{label}</p>
      {payload.map((item: any) => (
        <p key={item.dataKey} className="flex items-center gap-2" style={{ color: item.color }}>
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.dataKey === 'actual' ? '实际' : '目标'}：¥{(item.value / 10000).toFixed(1)}万
        </p>
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <div className="page-container">
      <PageHeader title="首页概览" subtitle="新时代健康产业展览平台" />

      <div className="relative rounded-2xl overflow-hidden mb-6 animate-fade-in-up stagger-1"
        style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)' }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/20 translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative px-8 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">欢迎回来，李晓芳</h2>
              <p className="text-emerald-100 text-sm">高级直销经理 · 华东大区 · 今日有 3 项待办事项</p>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{homeStats.totalDealers.toLocaleString()}</p>
                <p className="text-emerald-200 text-xs mt-1">活跃经销商</p>
              </div>
              <div className="w-px h-10 bg-emerald-300/30" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{homeStats.storeActivity}%</p>
                <p className="text-emerald-200 text-xs mt-1">门店活跃度</p>
              </div>
              <div className="w-px h-10 bg-emerald-300/30" />
              <div className="text-center">
                <p className="text-3xl font-bold text-white">{homeStats.productSalesRate}%</p>
                <p className="text-emerald-200 text-xs mt-1">产品动销率</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="animate-fade-in-up stagger-1">
          <StatCard
            title="经销商总数"
            value={homeStats.totalDealers}
            change={homeStats.dealerGrowth}
            icon={<Users size={20} />}
            iconBg="bg-emerald-50 text-emerald-600"
          />
        </div>
        <div className="animate-fade-in-up stagger-2">
          <StatCard
            title="产品动销率"
            value={homeStats.productSalesRate}
            change={homeStats.salesRateChange}
            icon={<Package size={20} />}
            iconBg="bg-blue-50 text-blue-600"
            suffix="%"
          />
        </div>
        <div className="animate-fade-in-up stagger-3">
          <StatCard
            title="门店活跃度"
            value={homeStats.storeActivity}
            change={homeStats.storeActivityChange}
            icon={<Store size={20} />}
            iconBg="bg-purple-50 text-purple-600"
            suffix="%"
          />
        </div>
        <div className="animate-fade-in-up stagger-4">
          <StatCard
            title="合规预警"
            value={homeStats.complianceAlerts}
            change={homeStats.complianceAlertsChange}
            icon={<ShieldAlert size={20} />}
            iconBg="bg-red-50 text-red-600"
            suffix="条"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-600" />
              <h3 className="text-base font-semibold text-gray-800">业绩趋势</h3>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                实际
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                目标
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={performanceTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#9ca3af" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="target" stroke="#d1d5db" strokeWidth={2} strokeDasharray="5 5" fill="url(#targetGradient)" />
              <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} fill="url(#actualGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-emerald-600" />
              <h3 className="text-base font-semibold text-gray-800">待办事项</h3>
            </div>
            <span className="text-xs text-gray-400">{todoItems.length} 项</span>
          </div>
          <div className="space-y-3">
            {todoItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer">
                <div className="mt-0.5">{typeIcons[item.type] || <Clock size={14} className="text-gray-400" />}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 group-hover:text-emerald-700 transition-colors truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityConfig[item.priority].className}`}>
                      {priorityConfig[item.priority].label}
                    </span>
                    <span className="text-[10px] text-gray-400">{item.dueDate}</span>
                  </div>
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-emerald-500 transition-colors mt-1 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up stagger-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-emerald-600" />
          <h3 className="text-base font-semibold text-gray-800">快速导航</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon size={24} />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700 transition-colors">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

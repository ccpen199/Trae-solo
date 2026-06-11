import { Link } from 'react-router-dom'
import { BarChart3, TrendingUp, Network, AlertTriangle, ArrowRight } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import { salesAnalysisData } from '@/data/mockData'

const totalRevenue = salesAnalysisData.trend.reduce((sum, item) => sum + item.sales, 0)
const avgGrowth = salesAnalysisData.byRegion.reduce((sum, item) => sum + item.growth, 0) / salesAnalysisData.byRegion.length

const quickLinks = [
  { to: '/dashboard/fission', icon: Network, label: '团队裂变', desc: '团队层级与增长分析', color: 'bg-emerald-50 text-emerald-600' },
  { to: '/dashboard/sales', icon: TrendingUp, label: '销售分析', desc: '销售趋势与品类分布', color: 'bg-blue-50 text-blue-600' },
  { to: '/dashboard/saturation', icon: AlertTriangle, label: '饱和度预警', desc: '区域市场饱和度监控', color: 'bg-amber-50 text-amber-600' },
]

export default function DashboardIndex() {
  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="数据看板" subtitle="核心经营数据一览" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stagger-1 animate-fade-in-up">
          <StatCard
            title="总营收"
            value={(totalRevenue / 10000).toFixed(1)}
            suffix="万元"
            change={8.3}
            icon={<BarChart3 size={20} />}
            iconBg="bg-emerald-50 text-emerald-600"
          />
        </div>
        <div className="stagger-2 animate-fade-in-up">
          <StatCard
            title="团队增长率"
            value={avgGrowth.toFixed(1)}
            suffix="%"
            change={5.2}
            icon={<TrendingUp size={20} />}
            iconBg="bg-blue-50 text-blue-600"
          />
        </div>
        <div className="stagger-3 animate-fade-in-up">
          <StatCard
            title="产品品类"
            value={salesAnalysisData.byCategory.length}
            suffix="类"
            change={2.0}
            icon={<BarChart3 size={20} />}
            iconBg="bg-purple-50 text-purple-600"
          />
        </div>
        <div className="stagger-4 animate-fade-in-up">
          <StatCard
            title="市场覆盖"
            value={salesAnalysisData.byRegion.length}
            suffix="大区"
            change={14.3}
            icon={<Network size={20} />}
            iconBg="bg-amber-50 text-amber-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-4">销售趋势</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={salesAnalysisData.trend}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`} />
              <Tooltip
                formatter={(value: number) => [`${(value / 10000).toFixed(1)}万元`, '销售额']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}
              />
              <Area type="monotone" dataKey="sales" stroke="#059669" fill="url(#salesGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-gray-800 mb-4">区域分布</h3>
          <div className="space-y-3">
            {salesAnalysisData.byRegion.map((item) => (
              <div key={item.region} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.region}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${(item.sales / 400000) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-14 text-right">{(item.sales / 10000).toFixed(1)}万</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">快捷入口</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 group"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${link.color}`}>
                <link.icon size={22} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{link.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

import { Users, Briefcase, AlertTriangle, CheckCircle } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { cityDataList, dashboardStats } from '@/mocks/admin'

const statCards = [
  {
    label: '参保总人数',
    value: '8,265万',
    icon: Users,
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100/50',
    iconBg: 'bg-blue-500',
  },
  {
    label: '就业总人数',
    value: '6,850万',
    icon: Briefcase,
    gradient: 'from-green-500 to-green-600',
    bgGradient: 'from-green-50 to-green-100/50',
    iconBg: 'bg-green-500',
  },
  {
    label: '欠薪案件',
    value: '12,850件',
    icon: AlertTriangle,
    gradient: 'from-orange-500 to-orange-600',
    bgGradient: 'from-orange-50 to-orange-100/50',
    iconBg: 'bg-orange-500',
  },
  {
    label: '处置率',
    value: '96.2%',
    icon: CheckCircle,
    gradient: 'from-purple-500 to-purple-600',
    bgGradient: 'from-purple-50 to-purple-100/50',
    iconBg: 'bg-purple-500',
  },
]

const barData = cityDataList
  .slice()
  .sort((a, b) => b.insuredRate - a.insuredRate)
  .slice(0, 8)
  .map((c) => ({ name: c.name, insuredRate: c.insuredRate }))

const pieData = [
  { name: '已处置', value: 8560 },
  { name: '调查中', value: 2150 },
  { name: '待受理', value: 1340 },
  { name: '已关闭', value: 800 },
]

const PIE_COLORS = ['#38A169', '#3182CE', '#D69E2E', '#A0AEC0']

function rateColor(rate: number) {
  if (rate > 95) return 'text-green-600 bg-green-50'
  if (rate > 90) return 'text-blue-600 bg-blue-50'
  if (rate > 85) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="gov-section-title">数据治理看板</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`gov-card p-5 bg-gradient-to-br ${card.bgGradient} relative overflow-hidden`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gov-muted text-sm">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>
                  {card.value}
                </p>
              </div>
              <div className={`${card.iconBg} p-3 rounded-xl text-white shadow-lg`}>
                <card.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="gov-card p-5">
          <h2 className="text-base font-semibold text-gov-text mb-4">各地市参保率排名</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [`${value}%`, '参保率']}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              <Bar dataKey="insuredRate" fill="#1A4B8C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="gov-card p-5">
          <h2 className="text-base font-semibold text-gov-text mb-4">欠薪案件状态分布</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}件`, '数量']}
                contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="gov-card overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="text-base font-semibold text-gov-text">各地市数据概览</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="gov-table-header">
                <th className="px-5 py-3 text-left">地市</th>
                <th className="px-5 py-3 text-right">常住人口(万)</th>
                <th className="px-5 py-3 text-right">参保人数(万)</th>
                <th className="px-5 py-3 text-center">参保率</th>
                <th className="px-5 py-3 text-center">就业率</th>
                <th className="px-5 py-3 text-center">欠薪处置率</th>
              </tr>
            </thead>
            <tbody>
              {cityDataList.map((city) => (
                <tr key={city.name} className="gov-table-row">
                  <td className="px-5 py-3 font-medium text-gov-text">{city.name}</td>
                  <td className="px-5 py-3 text-right text-gov-muted">{city.population}</td>
                  <td className="px-5 py-3 text-right text-gov-muted">{city.insuredCount}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${rateColor(city.insuredRate)}`}>
                      {city.insuredRate}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${rateColor(city.employedRate)}`}>
                      {city.employedRate}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${rateColor(city.salaryResolvedRate)}`}>
                      {city.salaryResolvedRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

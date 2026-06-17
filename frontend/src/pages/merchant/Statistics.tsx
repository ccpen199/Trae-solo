import { useState } from 'react'
import { ShoppingBag, TrendingUp, Wallet, Flame } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'

type TimeRange = '7d' | '30d' | '90d'

const dailyData = [
  { date: '01/09', orders: 42, revenue: 3680 },
  { date: '01/10', orders: 38, revenue: 3120 },
  { date: '01/11', orders: 55, revenue: 4560 },
  { date: '01/12', orders: 47, revenue: 3920 },
  { date: '01/13', orders: 63, revenue: 5280 },
  { date: '01/14', orders: 71, revenue: 6140 },
  { date: '01/15', orders: 58, revenue: 4960 },
]

const topProducts = [
  { rank: 1, name: '招牌牛肉面', sales: 326, revenue: 9128 },
  { rank: 2, name: '酸辣粉', sales: 218, revenue: 3924 },
  { rank: 3, name: '红烧排骨饭', sales: 189, revenue: 6615 },
  { rank: 4, name: '宫保鸡丁', sales: 156, revenue: 4992 },
  { rank: 5, name: '快递代取服务', sales: 145, revenue: 725 },
  { rank: 6, name: '文件送达服务', sales: 98, revenue: 1176 },
  { rank: 7, name: '鲜花配送', sales: 87, revenue: 1305 },
  { rank: 8, name: '排队代办', sales: 76, revenue: 2280 },
  { rank: 9, name: '糖醋里脊', sales: 64, revenue: 2048 },
  { rank: 10, name: '蛋炒饭', sales: 52, revenue: 676 },
]

export default function Statistics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">经营统计</h1>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['7d', '30d', '90d'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                timeRange === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {r === '7d' ? '近7日' : r === '30d' ? '近30日' : '近90日'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="订单量"
          value={374}
          icon={<ShoppingBag className="w-5 h-5" />}
          trend="up"
          trendValue="+18%"
          color="blue"
        />
        <StatCard
          title="营业额"
          value="¥31,660"
          icon={<Wallet className="w-5 h-5" />}
          trend="up"
          trendValue="+12%"
          color="green"
        />
        <StatCard
          title="客单价"
          value="¥84.7"
          icon={<TrendingUp className="w-5 h-5" />}
          trend="down"
          trendValue="-2%"
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">订单量趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} name="订单量" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-gray-900 mb-4">营业额趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="营业额(元)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="text-base font-semibold text-gray-900">热销 Top 10</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-gray-500 font-medium">排名</th>
                <th className="text-left py-3 px-2 text-gray-500 font-medium">商品名称</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">销量</th>
                <th className="text-right py-3 px-2 text-gray-500 font-medium">营收</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((p) => (
                <tr key={p.rank} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 px-2">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        p.rank <= 3
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.rank}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-medium text-gray-900">{p.name}</td>
                  <td className="py-3 px-2 text-right text-gray-600">{p.sales}</td>
                  <td className="py-3 px-2 text-right text-gray-900 font-medium">¥{p.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

import { Wallet, TrendingUp, Calendar, Coins } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'

interface StatCard {
  label: string
  value: string
  icon: typeof Wallet
  color: string
  iconBg: string
}

const STATS: StatCard[] = [
  { label: '今日', value: '¥195', icon: Wallet, color: 'text-amber-600', iconBg: 'bg-amber-50' },
  { label: '本周', value: '¥1,605', icon: TrendingUp, color: 'text-brand-600', iconBg: 'bg-brand-50' },
  { label: '本月', value: '¥5,830', icon: Calendar, color: 'text-green-600', iconBg: 'bg-green-50' },
  { label: '累计', value: '¥42,680', icon: Coins, color: 'text-purple-600', iconBg: 'bg-purple-50' },
]

const WEEKLY_DATA = [
  { day: '周一', amount: 165 },
  { day: '周二', amount: 210 },
  { day: '周三', amount: 145 },
  { day: '周四', amount: 280 },
  { day: '周五', amount: 320 },
  { day: '周六', amount: 295 },
  { day: '周日', amount: 190 },
]

interface EarningRecord {
  id: string
  orderNo: string
  category: string
  amount: number
  tip: number
  time: string
}

const EARNING_RECORDS: EarningRecord[] = [
  { id: '1', orderNo: 'PT20260617001', category: '帮我买', amount: 12.5, tip: 0, time: '10:32' },
  { id: '2', orderNo: 'PT20260617002', category: '帮我送', amount: 18.0, tip: 5, time: '09:15' },
  { id: '3', orderNo: 'PT20260617003', category: '帮我取', amount: 8.5, tip: 2, time: '08:40' },
  { id: '4', orderNo: 'PT20260616005', category: '帮我办', amount: 35.0, tip: 10, time: '昨天 16:22' },
  { id: '5', orderNo: 'PT20260616004', category: '帮我买', amount: 15.0, tip: 3, time: '昨天 14:10' },
  { id: '6', orderNo: 'PT20260616003', category: '帮我送', amount: 22.0, tip: 0, time: '昨天 11:30' },
  { id: '7', orderNo: 'PT20260615002', category: '帮我取', amount: 10.0, tip: 0, time: '6/15 17:05' },
  { id: '8', orderNo: 'PT20260615001', category: '帮我送', amount: 28.5, tip: 5, time: '6/15 09:20' },
]

export default function RiderEarnings() {
  return (
    <div className="p-4 space-y-4 pb-28">
      <h1 className="text-xl font-bold text-gray-900">收入明细</h1>

      <div className="grid grid-cols-2 gap-3">
        {STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">{stat.label}</div>
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card>
        <div className="text-base font-bold text-gray-900 mb-4">近7天收入</div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={WEEKLY_DATA} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
                formatter={(value: number) => [`¥${value}`, '收入']}
              />
              <Bar dataKey="amount" fill="url(#earningsGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div className="text-base font-bold text-gray-900 mb-3">收入明细</div>
        <div className="space-y-3">
          {EARNING_RECORDS.map((record) => (
            <div key={record.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <div className="text-sm font-medium text-gray-800">{record.category}</div>
                <div className="text-xs text-gray-400 mt-0.5">{record.orderNo} · {record.time}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-amber-600">+¥{record.amount.toFixed(1)}</div>
                {record.tip > 0 && (
                  <Tag color="orange" size="sm">小费¥{record.tip}</Tag>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="fixed bottom-20 left-0 right-0 px-4 z-10">
        <Button
          variant="primary"
          size="xl"
          fullWidth
          className="!bg-gradient-to-r !from-amber-400 !to-amber-500 hover:!from-amber-500 hover:!to-amber-600 !shadow-xl !shadow-amber-500/30"
        >
          提现
        </Button>
      </div>
    </div>
  )
}

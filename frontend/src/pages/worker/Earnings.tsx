import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'

type Period = 'today' | 'week' | 'month' | 'total'

const chartData = [
  { day: '周一', amount: 280 },
  { day: '周二', amount: 320 },
  { day: '周三', amount: 180 },
  { day: '周四', amount: 450 },
  { day: '周五', amount: 380 },
  { day: '周六', amount: 520 },
  { day: '周日', amount: 350 },
]

interface EarningRecord {
  id: string
  date: string
  orderTitle: string
  amount: number
  commission: number
  actual: number
  status: 'completed' | 'pending'
}

const mockRecords: EarningRecord[] = [
  {
    id: '1', date: '06-14', orderTitle: '办公区域搬迁', amount: 320, commission: 16, actual: 304, status: 'completed' },
  {
    id: '2', date: '06-14', orderTitle: '家电安装', amount: 240, commission: 12, actual: 228, status: 'completed' },
  {
    id: '3', date: '06-13', orderTitle: '家具组装', amount: 180, commission: 9, actual: 171, status: 'pending' },
  {
    id: '4', date: '06-13', orderTitle: '仓库装卸', amount: 260, commission: 13, actual: 247, status: 'completed' },
  {
    id: '5', date: '06-12', orderTitle: '居民楼搬家', amount: 450, commission: 22.5, actual: 427.5, status: 'completed' },
  {
    id: '6', date: '06-11', orderTitle: '展会布置', amount: 380, commission: 19, actual: 361, status: 'completed' },
]

const periodOptions: { key: Period; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'total', label: '累计' },
]

export default function WorkerEarnings() {
  const [activePeriod, setActivePeriod] = useState<Period>('week')

  const statMap = {
    today: { amount: 560, trend: '+18%' },
    week: { amount: 2480, trend: '+12%' },
    month: { amount: 8650, trend: '+25%' },
    total: { amount: 48620, trend: '+8%' },
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-lg px-4 pt-2 pb-3 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">收入面板</h1>
      </div>

      <div className="p-4 space-y-4 pb-32">
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl p-5 text-white shadow-xl shadow-emerald-500/30 overflow-hidden relative"
      >
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
          <span className="text-white/80 text-sm">
            {activePeriod === 'today' ? '今日收入' : activePeriod === 'week' ? '本周收入' : activePeriod === 'month' ? '本月收入' : '累计收入'}
          </span>
          <div className="flex items-center gap-0.5 text-xs bg-white/20 px-2 py-0.5 rounded-md text-white">
            <ArrowUpRight className="w-3 h-3" />
            <span className="font-medium">{statMap[activePeriod].trend}</span>
          </div>
        </div>
        <div className="text-4xl font-extrabold mt-1 tracking-tight">¥{statMap[activePeriod].amount.toLocaleString()}</div>

        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-white/70 text-xs">已完成</p>
            <p className="text-base font-bold mt-0.5">¥{statMap[activePeriod].amount > 0 ? Math.floor(statMap[activePeriod].amount / 200) : 0} 单</p>
          </div>
          <div>
            <p className="text-white/70 text-xs">平均单价</p>
          <p className="text-base font-bold mt-0.5">¥295</p>
          </div>
          <div>
            <p className="text-white/70 text-xs">可提现</p>
            <p className="text-base font-bold mt-0.5">¥2,180</p>
          </div>
        </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-100 mb-3">
          {periodOptions.map(({ key, label }) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActivePeriod(key)}
              className={`relative flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activePeriod === key
                  ? 'text-emerald-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {activePeriod === key && (
                <motion.div
                  layoutId="earningTabBg"
                  className="absolute inset-0 bg-emerald-50 rounded-lg"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative">{label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            收入趋势
          </h3>
          <Tag color="green" size="sm">近7天</Tag>
        </div>
        <div className="h-48 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number) => [`¥${value}`, '收入']}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#earningsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            收入明细
          </h3>
          <button className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
            查看全部 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {mockRecords.map((record, index) => (
              <motion.div
                key={record.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
              >
                <Card className="!py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{record.orderTitle}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500">{record.date}</span>
                          <Tag
                            color={record.status === 'completed' ? 'green' : 'yellow'}
                            size="sm"
                          >
                            {record.status === 'completed' ? '已到账' : '待结算'}
                          </Tag>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">+¥{record.actual}</p>
                      <p className="text-xs text-gray-400">平台抽佣 ¥{record.commission}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-lg border-t border-gray-100 px-4 py-3 pb-safe-area-inset-bottom z-40">
        <div className="flex items-center gap-3">
          <Button size="lg" variant="secondary" fullWidth>
            <Download className="w-5 h-5" />
            收入明细
          </Button>
          <Button
            size="lg"
            fullWidth
            className="!bg-gradient-to-r !from-emerald-500 !to-teal-600 hover:!from-emerald-600 hover:!to-teal-700 shadow-emerald-500/30"
          >
            <Wallet className="w-5 h-5" />
            提现 ¥2,180
          </Button>
        </div>
      </div>
    </div>
  )
}

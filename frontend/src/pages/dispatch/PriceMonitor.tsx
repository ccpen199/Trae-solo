import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Truck,
  Home,
  AlertTriangle,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPricingData,
  getCityPrices,
  getPriceAlertRules,
  getPriceAlerts,
  updatePriceAlertRule,
  type PricePoint,
  type CityPrice,
  type PriceAlertRule,
  type PriceAlert,
  type OrderCategory,
} from '../../services/dispatch.api'

const CATEGORIES: { value: OrderCategory | 'all'; label: string; icon: React.ElementType }[] = [
  { value: 'labor', label: '用工服务', icon: Users },
  { value: 'vehicle', label: '找车服务', icon: Truck },
  { value: 'moving', label: '搬家服务', icon: Home },
]

const generateMockPriceData = (days = 30): PricePoint[] => {
  const data: PricePoint[] = []
  const basePrice = 350
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const baseline = basePrice + Math.sin(i / 5) * 20
    const actual = baseline + (Math.random() - 0.5) * 80
    const changeRate = ((actual - baseline) / baseline) * 100
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      actualPrice: Math.round(actual),
      baselinePrice: Math.round(baseline),
      isAnomaly: Math.abs(changeRate) > 15,
      changeRate: Number(changeRate.toFixed(2)),
    })
  }
  return data
}

const CITY_NAMES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安',
  '南京', '重庆', '苏州', '天津', '长沙', '郑州', '青岛', '沈阳',
  '宁波', '厦门', '合肥', '福州',
]

const generateMockCityPrices = (): CityPrice[] => {
  return CITY_NAMES.map((city) => {
    const avgPrice = 250 + Math.random() * 300
    const changeRate = (Math.random() - 0.5) * 40
    return {
      city,
      avgPrice: Math.round(avgPrice),
      changeRate: Number(changeRate.toFixed(2)),
      isAnomaly: Math.abs(changeRate) > 15,
    }
  }).sort((a, b) => b.avgPrice - a.avgPrice)
}

const mockAlertRules: PriceAlertRule[] = [
  {
    id: '1',
    name: '价格异常上涨',
    threshold: 15,
    enabled: true,
    notifyEmail: true,
    notifySms: false,
    notifyPush: true,
  },
  {
    id: '2',
    name: '价格异常下跌',
    threshold: 15,
    enabled: true,
    notifyEmail: false,
    notifySms: true,
    notifyPush: true,
  },
  {
    id: '3',
    name: '区域价差预警',
    threshold: 25,
    enabled: false,
    notifyEmail: true,
    notifySms: true,
    notifyPush: false,
  },
]

const mockPriceAlerts: PriceAlert[] = [
  {
    id: '1',
    city: '北京市',
    category: '用工服务',
    price: 520,
    changeRate: 18.5,
    triggeredAt: '10分钟前',
  },
  {
    id: '2',
    city: '上海市',
    category: '找车服务',
    price: 680,
    changeRate: -16.2,
    triggeredAt: '35分钟前',
  },
  {
    id: '3',
    city: '深圳市',
    category: '搬家服务',
    price: 890,
    changeRate: 22.1,
    triggeredAt: '1小时前',
  },
  {
    id: '4',
    city: '杭州市',
    category: '用工服务',
    price: 445,
    changeRate: -17.8,
    triggeredAt: '2小时前',
  },
]

function formatCurrency(value: number): string {
  return `¥${value.toLocaleString()}`
}

export default function PriceMonitor() {
  const [activeCategory, setActiveCategory] = useState<OrderCategory | 'all'>('labor')
  const [searchCity, setSearchCity] = useState('')
  const queryClient = useQueryClient()

  const { data: priceData } = useQuery({
    queryKey: ['pricing-trend', activeCategory],
    queryFn: () => getPricingData({ category: activeCategory === 'all' ? undefined : activeCategory, days: 30 }),
    initialData: generateMockPriceData(30),
  })

  const { data: cityPrices } = useQuery({
    queryKey: ['city-prices', activeCategory],
    queryFn: () => getCityPrices({ category: activeCategory === 'all' ? undefined : activeCategory }),
    initialData: generateMockCityPrices(),
  })

  const { data: alertRules } = useQuery({
    queryKey: ['price-alert-rules'],
    queryFn: getPriceAlertRules,
    initialData: mockAlertRules,
  })

  const { data: priceAlerts } = useQuery({
    queryKey: ['price-alerts'],
    queryFn: () => getPriceAlerts({ limit: 10 }),
    initialData: mockPriceAlerts,
  })

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PriceAlertRule> }) =>
      updatePriceAlertRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alert-rules'] })
    },
  })

  const filteredCities = cityPrices.filter((c) =>
    c.city.toLowerCase().includes(searchCity.toLowerCase())
  )

  return (
    <div className="p-6 min-w-[1440px]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-white">价格波动监控</h1>
        <p className="text-slate-400 mt-1">实时监控各品类价格波动与异常预警</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 p-1.5 bg-slate-800/50 rounded-xl border border-slate-700/50 w-fit mb-6"
      >
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.value
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cat.label}
            </button>
          )
        })}
      </motion.div>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="col-span-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              30天价格趋势
            </h3>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-500" />
                实际均价
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-slate-500 border-dashed" />
                历史基准
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                异常波动
              </span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={priceData}>
                <defs>
                  <linearGradient id="anomalyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tick={{ fill: '#64748B' }} />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickFormatter={(v) => formatCurrency(v)}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'actualPrice' ? '实际均价' : name === 'baselinePrice' ? '历史基准' : name,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="actualPrice"
                  fill="url(#anomalyGradient)"
                  stroke="transparent"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="baselinePrice"
                  stroke="#64748B"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actualPrice"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  dot={(props: { cx: number; cy: number; payload: PricePoint }) =>
                    props.payload.isAnomaly ? (
                      <g>
                        <circle cx={props.cx} cy={props.cy} r={8} fill="#EF4444" opacity={0.2} />
                        <circle cx={props.cx} cy={props.cy} r={5} fill="#EF4444" stroke="#fff" strokeWidth={2} />
                      </g>
                    ) : null
                  }
                  activeDot={{ r: 6, fill: '#06B6D4', stroke: '#fff', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="col-span-4 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 flex flex-col"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-400" />
            价格预警规则配置
          </h3>

          <div className="space-y-3 flex-1">
            {alertRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">{rule.name}</span>
                  <button
                    onClick={() =>
                      updateRuleMutation.mutate({ id: rule.id, data: { enabled: !rule.enabled } })
                    }
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      rule.enabled ? 'bg-cyan-500' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                        rule.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>波动阈值</span>
                    <span className="text-cyan-400 font-mono font-medium">{rule.threshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={rule.threshold}
                    onChange={(e) =>
                      updateRuleMutation.mutate({
                        id: rule.id,
                        data: { threshold: Number(e.target.value) },
                      })
                    }
                    disabled={!rule.enabled}
                    className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer disabled:opacity-50
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-3.5
                      [&::-webkit-slider-thumb]:h-3.5
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-cyan-500
                      [&::-webkit-slider-thumb]:shadow-md
                      [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2">
                  {[
                    { key: 'notifyEmail', icon: Mail, label: '邮件' },
                    { key: 'notifySms', icon: MessageSquare, label: '短信' },
                    { key: 'notifyPush', icon: Smartphone, label: '推送' },
                  ].map((item) => {
                    const enabled = rule[item.key as keyof PriceAlertRule] as boolean
                    const Icon = item.icon
                    return (
                      <button
                        key={item.key}
                        onClick={() =>
                          updateRuleMutation.mutate({
                            id: rule.id,
                            data: { [item.key]: !enabled },
                          })
                        }
                        disabled={!rule.enabled}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                          enabled
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              最新预警
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {priceAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-2.5 bg-red-500/5 rounded-lg border border-red-500/20"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {alert.city} - {alert.category}
                    </p>
                    <p className="text-xs text-slate-400">{alert.triggeredAt}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm text-white font-mono font-medium">{formatCurrency(alert.price)}</p>
                    <p
                      className={`text-xs font-medium flex items-center gap-0.5 justify-end ${
                        alert.changeRate > 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {alert.changeRate > 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : alert.changeRate < 0 ? (
                        <ArrowDownRight className="w-3 h-3" />
                      ) : (
                        <Minus className="w-3 h-3" />
                      )}
                      {Math.abs(alert.changeRate)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            城市价格排行 TOP20
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="搜索城市..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors w-52"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-slate-700/50">
                <th className="pb-3 pr-4 font-medium w-12">排名</th>
                <th className="pb-3 pr-4 font-medium">城市</th>
                <th className="pb-3 pr-4 font-medium text-right">平均价格</th>
                <th className="pb-3 pr-4 font-medium text-right">涨跌幅</th>
                <th className="pb-3 pr-4 font-medium text-center">状态</th>
                <th className="pb-3 font-medium w-32">价格走势</th>
              </tr>
            </thead>
            <tbody>
              {filteredCities.slice(0, 20).map((city, index) => (
                <motion.tr
                  key={city.city}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-slate-700/30 last:border-b-0 hover:bg-slate-900/30 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold ${
                        index < 3
                          ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-white'
                          : 'bg-slate-700/50 text-slate-400'
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm font-medium text-white">{city.city}</span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-sm font-mono font-semibold text-white">
                      {formatCurrency(city.avgPrice)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span
                      className={`inline-flex items-center gap-0.5 text-sm font-medium ${
                        city.changeRate > 0
                          ? 'text-red-400'
                          : city.changeRate < 0
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {city.changeRate > 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : city.changeRate < 0 ? (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                      {Math.abs(city.changeRate).toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-center">
                    {city.isAnomaly ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        异常
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-medium">
                        正常
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="h-10 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generateMockPriceData(7)}>
                          <Line
                            type="monotone"
                            dataKey="actualPrice"
                            stroke={city.isAnomaly ? '#EF4444' : '#06B6D4'}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

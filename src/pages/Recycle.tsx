import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import { useApi } from '@/hooks/useApi'

const priceHistory = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}日`,
  price: Math.round(1800 + Math.sin(i / 5) * 200 + (i > 20 ? -100 : 0)),
}))

const deviceModels = ['iPhone 15 Pro', 'iPhone 14', 'MacBook Air M2', 'iPad Pro', '华为 Mate 60 Pro', '小米 14']
const repairHistoryOptions = ['屏幕更换', '电池更换', '主板维修', '无维修记录']

interface ValuationResult {
  price: number
  trend: 'up' | 'down' | 'stable'
  change: number
}

export default function Recycle() {
  const { request, loading } = useApi<ValuationResult>()
  const [model, setModel] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [repairHistory, setRepairHistory] = useState<string[]>([])
  const [appearance, setAppearance] = useState(80)
  const [screen, setScreen] = useState(90)
  const [battery, setBattery] = useState(85)
  const [functions, setFunctions] = useState<string[]>([])
  const [valuation, setValuation] = useState<ValuationResult | null>(null)

  const estimatedPrice = useMemo(() => {
    const base = 2000
    const appearFactor = appearance / 100
    const screenFactor = screen / 100
    const batteryFactor = battery / 100
    const repairPenalty = repairHistory.length * 200
    return Math.max(0, Math.round((base * appearFactor * screenFactor * batteryFactor) - repairPenalty))
  }, [appearance, screen, battery, repairHistory])

  const toggleRepairHistory = (item: string) => {
    setRepairHistory((prev) =>
      prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item],
    )
  }

  const toggleFunction = (fn: string) => {
    setFunctions((prev) =>
      prev.includes(fn) ? prev.filter((f) => f !== fn) : [...prev, fn],
    )
  }

  const handleEstimate = async () => {
    try {
      const data = await request('/api/recycle/estimate', {
        method: 'POST',
        body: JSON.stringify({ model, appearance, screen, battery, repairHistory }),
      })
      setValuation(data)
    } catch {
      setValuation({ price: estimatedPrice, trend: 'down', change: -5.2 })
    }
  }

  return (
    <div className="min-h-screen bg-surface-light px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl animate-fade-in">
        <h1 className="font-title text-3xl font-bold text-primary">回收估价</h1>
        <p className="mt-2 text-gray-500">智能评估设备价值，一键快速回收</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-title text-lg font-semibold text-primary">设备信息</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">设备型号</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">请选择型号</option>
                    {deviceModels.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">购买日期</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">维修历史</label>
                  <div className="flex flex-wrap gap-2">
                    {repairHistoryOptions.map((item) => (
                      <button
                        key={item}
                        onClick={() => toggleRepairHistory(item)}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-sm transition-all',
                          repairHistory.includes(item)
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300',
                        )}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-title text-lg font-semibold text-primary">状况评估</h3>
              <div className="mt-4 space-y-5">
                {[
                  { label: '外观成色', value: appearance, setter: setAppearance },
                  { label: '屏幕状态', value: screen, setter: setScreen },
                  { label: '电池健康度', value: battery, setter: setBattery },
                ].map((slider) => (
                  <div key={slider.label}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{slider.label}</span>
                      <span className={cn(
                        'font-title text-sm font-bold',
                        slider.value >= 80 ? 'text-accent' : slider.value >= 50 ? 'text-alert' : 'text-red-500',
                      )}>
                        {slider.value}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={slider.value}
                      onChange={(e) => slider.setter(Number(e.target.value))}
                      className="mt-2 w-full accent-accent"
                    />
                  </div>
                ))}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">功能检测</label>
                  <div className="flex flex-wrap gap-2">
                    {['摄像头', 'WiFi', '蓝牙', '麦克风', '扬声器', '面容ID'].map((fn) => (
                      <button
                        key={fn}
                        onClick={() => toggleFunction(fn)}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-sm transition-all',
                          functions.includes(fn)
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300',
                        )}
                      >
                        {fn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleEstimate}
              disabled={!model || loading}
              className="gradient-accent w-full rounded-lg py-3 font-medium text-primary transition-all disabled:opacity-50"
            >
              {loading ? '评估中...' : '获取估价'}
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-title text-lg font-semibold text-primary">实时估价</h3>
              <div className="mt-4 text-center">
                <p className="font-title text-5xl font-bold text-accent">
                  ¥{valuation?.price || estimatedPrice}
                </p>
                {valuation && (
                  <div className={cn(
                    'mt-2 flex items-center justify-center gap-1 text-sm font-medium',
                    valuation.trend === 'up' ? 'text-accent' : valuation.trend === 'down' ? 'text-red-500' : 'text-gray-400',
                  )}>
                    {valuation.trend === 'up' ? <TrendingUp className="h-4 w-4" /> :
                     valuation.trend === 'down' ? <TrendingDown className="h-4 w-4" /> :
                     <Minus className="h-4 w-4" />}
                    近30日{valuation.trend === 'up' ? '上涨' : valuation.trend === 'down' ? '下跌' : '持平'} {Math.abs(valuation.change)}%
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="font-title text-lg font-semibold text-primary">价格走势</h3>
              <p className="mt-1 text-xs text-gray-400">近30天价格趋势</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      formatter={(value: number) => [`¥${value}`, '回收价']}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#06D6A0"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#06D6A0' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { Battery, TrendingUp, Save, Calendar, ChevronLeft, ChevronRight, Heart, Activity, Clock } from 'lucide-react'

const sparklineData = [
  { v: 120 }, { v: 150 }, { v: 130 }, { v: 180 }, { v: 200 }, { v: 170 }, { v: 220 },
  { v: 190 }, { v: 240 }, { v: 210 }, { v: 260 }, { v: 280 },
]

interface Strategy {
  id: string
  name: string
  dischargePower: number
  minSoc: number
  peakStart: string
  peakEnd: string
  valleyStart: string
  valleyEnd: string
  enabled: boolean
}

const mockStrategy: Strategy = {
  id: 'st1', name: '工作日V2G策略', dischargePower: 30, minSoc: 40,
  peakStart: '17:00', peakEnd: '21:00', valleyStart: '00:00', valleyEnd: '06:00', enabled: true,
}

function MiniCalendar() {
  const [currentDate] = useState(new Date(2026, 5, 1))
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const today = 9
  const peakDays = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26]
  const valleyDays = [6, 7, 13, 14, 20, 21, 27, 28]
  const v2gDays = [2, 3, 5, 9, 10, 12, 16, 17, 19, 23, 24, 26]
  const weeks = ['日', '一', '二', '三', '四', '五', '六']
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <ChevronLeft className="w-4 h-4 text-gray-500 cursor-pointer" />
        <span className="text-sm font-medium text-gray-200">{year}年{month + 1}月</span>
        <ChevronRight className="w-4 h-4 text-gray-500 cursor-pointer" />
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {weeks.map(w => <div key={w} className="text-gray-500 py-1">{w}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const isToday = day === today
          return (
            <div key={day} className={`relative py-1 rounded ${isToday ? 'ring-1 ring-electric-green' : ''} ${peakDays.includes(day) ? 'bg-amber-orange/15' : ''} ${valleyDays.includes(day) ? 'bg-ice-blue/15' : ''}`}>
              <span className={`${isToday ? 'text-electric-green font-bold' : peakDays.includes(day) ? 'text-amber-orange' : valleyDays.includes(day) ? 'text-ice-blue' : 'text-gray-400'}`}>{day}</span>
              {v2gDays.includes(day) && <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-electric-green" />}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-orange/50" /> 峰时</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-ice-blue/50" /> 谷时</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-electric-green" /> V2G放电</span>
      </div>
    </div>
  )
}

export default function V2G() {
  const [form, setForm] = useState<Strategy>(mockStrategy)
  const [_strategy, setStrategy] = useState<Strategy>(mockStrategy)
  const [mode, setMode] = useState<'auto' | 'manual' | 'off'>('auto')
  const [countdown, setCountdown] = useState(7200)

  useEffect(() => {
    fetch('/api/v2g/strategies').then(r => r.json()).then(data => {
      const list = Array.isArray(data) ? data : data?.data
      const next = Array.isArray(list) ? list[0] : data?.data || data
      if (next?.id) setStrategy({
        id: next.id,
        name: next.name || '工作日V2G策略',
        dischargePower: next.dischargePower ?? next.maxDischargeKwh ?? 30,
        minSoc: next.minSoc ?? 40,
        peakStart: next.peakStart || '17:00',
        peakEnd: next.peakEnd || '21:00',
        valleyStart: next.valleyStart || '00:00',
        valleyEnd: next.valleyEnd || '06:00',
        enabled: next.enabled ?? true,
      })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [])

  const batteryHealth = Math.max(90, 99 - (form.dischargePower - 20) * 0.15)
  const batteryLife = Math.max(5, 8.5 - (form.dischargePower - 20) * 0.04)
  const totalDischarge = 1280
  const wearEstimate = (0.1 + (form.dischargePower - 20) * 0.01).toFixed(1)

  const peakKwh = Math.round(form.dischargePower * 4 * 24)
  const peakPrice = 1.2
  const valleyKwh = Math.round(form.dischargePower * 6 * 24)
  const valleyPrice = 0.35
  const grossRevenue = peakKwh * peakPrice
  const chargeCost = valleyKwh * valleyPrice
  const netRevenue = grossRevenue - chargeCost
  const batteryWearCost = Math.round(form.dischargePower * 1.5)
  const actualNet = netRevenue - batteryWearCost

  const modeLabel = mode === 'off' ? '待机中' : mode === 'manual' ? '充电中' : '放电中'
  const modeColor = mode === 'off' ? 'text-gray-400' : mode === 'manual' ? 'text-electric-green' : 'text-amber-orange'
  const modeDot = mode === 'off' ? 'bg-gray-400' : mode === 'manual' ? 'bg-electric-green' : 'bg-amber-orange'
  const currentPower = mode === 'off' ? 0 : mode === 'manual' ? form.dischargePower * 0.6 : form.dischargePower

  const cdH = Math.floor(countdown / 3600)
  const cdM = Math.floor((countdown % 3600) / 60)
  const cdS = countdown % 60

  const handleSave = () => setStrategy({ ...form })

  return (
    <div className="flex gap-6 animate-slide-up h-[calc(100vh-8rem)]">
      <div className="w-[380px] shrink-0 glass-card p-5 overflow-y-auto space-y-5">
        <h2 className="section-title flex items-center gap-2">
          <Battery className="w-5 h-5 text-electric-green" />
          V2G策略配置
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">策略名称</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 flex items-center justify-between">
              <span>放电功率上限</span>
              <span className="data-text text-electric-green">{form.dischargePower}kW</span>
            </label>
            <input type="range" min={0} max={50} value={form.dischargePower} onChange={e => setForm(f => ({ ...f, dischargePower: Number(e.target.value) }))} className="w-full h-1.5 bg-deep-blue-lighter rounded-lg appearance-none cursor-pointer accent-electric-green" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 flex items-center justify-between">
              <span>最低SOC保留</span>
              <span className="data-text text-amber-orange">{form.minSoc}%</span>
            </label>
            <input type="range" min={20} max={80} value={form.minSoc} onChange={e => setForm(f => ({ ...f, minSoc: Number(e.target.value) }))} className="w-full h-1.5 bg-deep-blue-lighter rounded-lg appearance-none cursor-pointer accent-amber-orange" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 mb-1 block">峰时开始</label><input type="time" value={form.peakStart} onChange={e => setForm(f => ({ ...f, peakStart: e.target.value }))} className="input-field w-full" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">峰时结束</label><input type="time" value={form.peakEnd} onChange={e => setForm(f => ({ ...f, peakEnd: e.target.value }))} className="input-field w-full" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 mb-1 block">谷时开始</label><input type="time" value={form.valleyStart} onChange={e => setForm(f => ({ ...f, valleyStart: e.target.value }))} className="input-field w-full" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">谷时结束</label><input type="time" value={form.valleyEnd} onChange={e => setForm(f => ({ ...f, valleyEnd: e.target.value }))} className="input-field w-full" /></div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-300">启用策略</span>
            <button onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))} className={`relative w-11 h-6 rounded-full transition-colors ${form.enabled ? 'bg-electric-green' : 'bg-gray-600'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform left-0.5`} style={{ transform: form.enabled ? 'translateX(22px)' : 'translateX(0)' }} />
            </button>
          </div>
          <button onClick={handleSave} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
            <Save className="w-4 h-4" /> 保存策略
          </button>
        </div>

        <div className="border-t border-white/5 pt-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2"><Heart className="w-4 h-4 text-amber-orange" />电池健康评估</h3>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">电池健康度</span>
              <span className="data-text text-electric-green">{batteryHealth.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-deep-blue-lighter overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-electric-green to-ice-blue transition-all duration-500" style={{ width: `${batteryHealth}%` }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-deep-blue/60 rounded-lg p-2.5">
              <div className="text-gray-500 mb-0.5">预计电池寿命</div>
              <div className="data-text text-sm text-ice-blue">{batteryLife.toFixed(1)}年</div>
            </div>
            <div className="bg-deep-blue/60 rounded-lg p-2.5">
              <div className="text-gray-500 mb-0.5">V2G累计放电</div>
              <div className="data-text text-sm text-electric-green">{totalDischarge.toLocaleString()} kWh</div>
            </div>
            <div className="col-span-2 bg-deep-blue/60 rounded-lg p-2.5">
              <div className="text-gray-500 mb-0.5">累计损耗估算</div>
              <div className="data-text text-sm text-amber-orange">{wearEstimate}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-electric-green" />收益计算明细
            </h3>
            <span className="text-xs text-electric-green/70">↑ 12.3% 较上月</span>
          </div>
          <div className="flex items-end gap-6 mb-4">
            <div className="data-text text-4xl font-bold text-electric-green glow-text">¥{actualNet.toLocaleString()}</div>
            <div className="w-40 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line type="monotone" dataKey="v" stroke="#00E599" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-2 text-sm border-t border-white/5 pt-3">
            <div className="flex justify-between"><span className="text-gray-400">峰时放电: {peakKwh} kWh × ¥{peakPrice.toFixed(2)}/kWh</span><span className="text-ice-blue">¥{grossRevenue.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">谷时充电: {valleyKwh} kWh × ¥{valleyPrice.toFixed(2)}/kWh</span><span className="text-ice-blue">¥{chargeCost.toLocaleString()}</span></div>
            <div className="flex justify-between border-t border-white/5 pt-2"><span className="text-gray-300">净收益</span><span className={netRevenue >= 0 ? 'text-electric-green' : 'text-red-400'}>¥{netRevenue.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">电池损耗成本</span><span className="text-amber-orange">¥{batteryWearCost}</span></div>
            <div className="flex justify-between border-t border-white/5 pt-2"><span className="text-gray-200 font-medium">实际净收益</span><span className={`data-text text-lg font-bold ${actualNet >= 0 ? 'text-electric-green glow-text' : 'text-red-400'}`}>¥{actualNet.toLocaleString()}</span></div>
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-electric-green" />V2G运行状态
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">当前模式</div>
              <div className={`flex items-center gap-2 ${modeColor}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${modeDot} animate-pulse`} />
                <span className="data-text text-lg font-semibold">{modeLabel}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">当前功率</div>
              <div className="data-text text-lg font-semibold text-ice-blue">{currentPower} kW</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">电网指令</div>
              <div className={`text-sm ${mode === 'auto' ? 'text-electric-green' : 'text-gray-400'}`}>{mode === 'auto' ? '执行中' : '等待中'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">下次调度</div>
              <div className="flex items-center gap-1 text-sm text-ice-blue">
                <Clock className="w-3.5 h-3.5" />17:00
                <span className="text-xs text-gray-500 ml-1">({cdH}时{cdM}分{cdS}秒后)</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {([['auto', '自动'], ['manual', '手动'], ['off', '关闭']] as const).map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-electric-green/15 text-electric-green border border-electric-green/30' : 'bg-deep-blue-lighter text-gray-400 border border-transparent hover:text-gray-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-ice-blue" />V2G日历
          </h3>
          <MiniCalendar />
        </div>
      </div>
    </div>
  )
}

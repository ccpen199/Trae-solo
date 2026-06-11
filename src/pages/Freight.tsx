import { useState, useMemo } from 'react'
import { MapPin, Truck, Zap, Rocket, Clock, Route, Calculator, Minus, Plus } from 'lucide-react'

const ADDRESSES = [
  '北京市朝阳区建国路88号',
  '上海市浦东新区陆家嘴环路1000号',
  '广州市天河区天河路385号',
  '深圳市南山区科技园南路18号',
  '杭州市西湖区文三路478号',
  '成都市武侯区人民南路四段1号',
  '武汉市江汉区解放大道688号',
  '南京市鼓楼区中山北路283号',
  '重庆市渝中区解放碑民权路28号',
  '西安市雁塔区高新路2号',
  '苏州市工业园区星湖街218号',
  '天津市和平区南京路189号',
]

const SERVICE_LEVELS = [
  { key: 'standard', label: '标准快递', multiplier: 1, desc: '3-5天送达', icon: Truck, days: '3-5' },
  { key: 'express', label: '特快专递', multiplier: 1.5, desc: '1-2天送达', icon: Zap, days: '1-2' },
  { key: 'sameday', label: '当日达', multiplier: 2.5, desc: '当日送达', icon: Rocket, days: '0' },
]

function AddressInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const filtered = useMemo(
    () => ADDRESSES.filter((a) => a.includes(value) && a !== value).slice(0, 5),
    [value],
  )
  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          className="input-field w-full pl-9"
          placeholder="输入地址"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => value.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
          {filtered.map((addr) => (
            <button
              key={addr}
              className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
              onMouseDown={() => { onChange(addr); setOpen(false) }}
            >{addr}</button>
          ))}
        </div>
      )}
    </div>
  )
}

interface CalcResult {
  totalFee: number
  days: string
  distance: number
  baseFee: number
  distanceFee: number
  weightFee: number
  serviceFee: number
  discount: number
  from: string
  to: string
}

export default function Freight() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [weight, setWeight] = useState(1)
  const [volume, setVolume] = useState('')
  const [service, setService] = useState('standard')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CalcResult | null>(null)

  const adjustWeight = (delta: number) => {
    setWeight((prev) => Math.max(0.1, +(prev + delta).toFixed(1)))
  }

  const handleCalculate = async () => {
    if (!from || !to) return
    setLoading(true)
    try {
      const res = await fetch('/api/freight/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, weight, volume, serviceLevel: service }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      const lvl = SERVICE_LEVELS.find((l) => l.key === service)!
      const dist = Math.floor(Math.random() * 1800 + 200)
      const base = 12
      const distanceFee = +(dist * 0.05).toFixed(2)
      const weightFee = +((weight - 1) * 3).toFixed(2)
      const serviceFee = +((base + distanceFee + weightFee) * (lvl.multiplier - 1)).toFixed(2)
      const discount = +((base + distanceFee + weightFee + serviceFee) * 0.05).toFixed(2)
      const totalFee = +(base + distanceFee + weightFee + serviceFee - discount).toFixed(2)
      setResult({ totalFee, days: lvl.days, distance: dist, baseFee: base, distanceFee, weightFee, serviceFee, discount, from, to })
    } finally {
      setLoading(false)
    }
  }

  const canCalculate = from && to && weight >= 0.1

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="section-title">运费计算</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">寄出地址</label>
              <AddressInput value={from} onChange={setFrom} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">送达地址</label>
              <AddressInput value={to} onChange={setTo} />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">重量 (kg)</label>
              <div className="flex items-center gap-2">
                <button onClick={() => adjustWeight(-0.1)} className="btn-secondary p-2"><Minus className="w-4 h-4" /></button>
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={weight}
                  onChange={(e) => setWeight(Math.max(0.1, +e.target.value || 0.1))}
                  className="input-field w-full text-center font-mono-num"
                />
                <button onClick={() => adjustWeight(0.1)} className="btn-secondary p-2"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">体积 (cm³) <span className="text-slate-600">选填</span></label>
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="可选"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-2 block">服务等级</label>
              <div className="grid grid-cols-3 gap-3">
                {SERVICE_LEVELS.map((lvl) => {
                  const Icon = lvl.icon
                  const selected = service === lvl.key
                  return (
                    <button
                      key={lvl.key}
                      onClick={() => setService(lvl.key)}
                      className={`card p-3 text-center cursor-pointer transition-all ${selected ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30' : 'hover:border-slate-600'}`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1.5 ${selected ? 'text-amber-500' : 'text-slate-500'}`} />
                      <p className={`text-xs font-medium ${selected ? 'text-amber-400' : 'text-slate-200'}`}>{lvl.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{lvl.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              onClick={handleCalculate}
              disabled={!canCalculate || loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
              style={!canCalculate || loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              {loading ? <><span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />计算中...</> : '计算运费'}
            </button>
          </div>
        </div>

        <div className="card flex flex-col">
          <h2 className="section-title">计算结果</h2>
          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Calculator className="w-10 h-10 mb-3 text-slate-600" />
              <p className="text-sm">输入信息后计算运费</p>
            </div>
          ) : (
            <div className="space-y-4 animate-slide-up flex-1">
              <div className="text-center py-4">
                <p className="text-sm text-slate-400 mb-1">总运费</p>
                <p className="font-mono-num text-4xl text-amber-400 font-bold">¥{result.totalFee.toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-500" />约{result.days}天送达</span>
                <span className="flex items-center gap-1.5"><Route className="w-4 h-4 text-amber-500" />约{result.distance}km</span>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-1 flex items-center gap-1 overflow-hidden">
                <div className="flex-1 text-[10px] text-slate-400 truncate text-center bg-amber-500/10 rounded px-2 py-1">{result.from.slice(0, 6)}</div>
                <div className="flex-shrink-0 w-8 h-px bg-slate-600" />
                <div className="flex-shrink-0 text-amber-500">→</div>
                <div className="flex-shrink-0 w-8 h-px bg-slate-600" />
                <div className="flex-1 text-[10px] text-slate-400 truncate text-center bg-amber-500/10 rounded px-2 py-1">{result.to.slice(0, 6)}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-2.5">
                <p className="text-xs text-slate-400 mb-2">费用明细</p>
                <div className="flex justify-between text-sm"><span className="text-slate-400">基础运费</span><span className="text-slate-200 font-mono-num">¥{result.baseFee.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">距离附加费</span><span className="text-slate-200 font-mono-num">¥{result.distanceFee.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">重量附加费</span><span className="text-slate-200 font-mono-num">¥{result.weightFee.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">服务等级附加费</span><span className="text-slate-200 font-mono-num">¥{result.serviceFee.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">优惠折扣</span><span className="text-emerald-400 font-mono-num">-¥{result.discount.toFixed(2)}</span></div>
                <div className="border-t border-slate-700 my-2" />
                <div className="flex justify-between text-sm"><span className="text-slate-200 font-semibold">合计</span><span className="text-amber-400 font-bold font-mono-num">¥{result.totalFee.toFixed(2)}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

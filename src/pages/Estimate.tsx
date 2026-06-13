import { useState } from 'react'
import { Calculator, ArrowRight, Zap, Truck, Package, Loader2 } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

const CITIES = [
  { province: '上海市', city: '上海市', district: '浦东新区' },
  { province: '北京市', city: '北京市', district: '朝阳区' },
  { province: '广东省', city: '广州市', district: '天河区' },
  { province: '广东省', city: '深圳市', district: '南山区' },
  { province: '浙江省', city: '杭州市', district: '西湖区' },
  { province: '江苏省', city: '南京市', district: '鼓楼区' },
  { province: '四川省', city: '成都市', district: '武侯区' },
  { province: '湖北省', city: '武汉市', district: '洪山区' },
  { province: '湖南省', city: '长沙市', district: '岳麓区' },
  { province: '福建省', city: '厦门市', district: '思明区' },
]

const TIER_CONFIG = {
  economy: { icon: Package, color: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500', bg: 'bg-blue-50' },
  standard: { icon: Truck, color: 'bg-navy', border: 'border-navy', text: 'text-navy', bg: 'bg-navy/5' },
  express: { icon: Zap, color: 'bg-accent', border: 'border-accent', text: 'text-accent', bg: 'bg-accent/5' },
}

const MOCK_TIERS = [
  { type: 'economy' as const, name: '经济件', price: 12.0, estimatedDays: '3-5天', description: '经济实惠，适合不急的包裹' },
  { type: 'standard' as const, name: '标准件', price: 23.5, estimatedDays: '2-3天', description: '性价比之选，时效稳定' },
  { type: 'express' as const, name: '特快件', price: 38.0, estimatedDays: '1-2天', description: '极速达，急件首选' },
]

export default function Estimate() {
  const { estimateTiers, fetchEstimate, loading } = useAppStore()
  const [origin, setOrigin] = useState(0)
  const [destination, setDestination] = useState(1)
  const [weight, setWeight] = useState(1)
  const [volume, setVolume] = useState(0.01)
  const [selected, setSelected] = useState<'economy' | 'standard' | 'express' | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const tiers = estimateTiers.length > 0 ? estimateTiers : MOCK_TIERS

  const handleSubmit = async () => {
    if (origin === destination) return
    setSubmitted(true)
    setSelected(null)
    await fetchEstimate({
      origin: CITIES[origin],
      destination: CITIES[destination],
      weight,
      volume,
    })
  }

  const originCity = CITIES[origin]
  const destCity = CITIES[destination]

  return (
    <div className="space-y-5 pb-4">
      <div className="gradient-navy rounded-2xl p-5 text-white relative overflow-hidden animate-slide-up">
        <svg className="absolute top-0 right-0 w-32 h-32 opacity-10" viewBox="0 0 100 100">
          <rect x="10" y="30" width="80" height="4" rx="2" fill="white" />
          <rect x="10" y="50" width="60" height="4" rx="2" fill="white" />
          <rect x="10" y="70" width="40" height="4" rx="2" fill="white" />
        </svg>
        <div className="relative z-10">
          <h1 className="text-xl font-bold mb-1">运费试算</h1>
          <p className="text-white/70 text-sm">快速比较不同服务类型的价格与时效</p>
        </div>
      </div>

      <div className="card p-4 space-y-4 animate-slide-up stagger-2">
        <div>
          <label className="text-xs font-medium text-text-light mb-1.5 block">寄出地</label>
          <select
            className="input-field"
            value={origin}
            onChange={(e) => setOrigin(Number(e.target.value))}
          >
            {CITIES.map((c, i) => (
              <option key={i} value={i}>{c.city} {c.district}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-center">
          <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-text-lighter" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-light mb-1.5 block">目的地</label>
          <select
            className="input-field"
            value={destination}
            onChange={(e) => setDestination(Number(e.target.value))}
          >
            {CITIES.map((c, i) => (
              <option key={i} value={i}>{c.city} {c.district}</option>
            ))}
          </select>
        </div>

        {origin === destination && (
          <p className="text-xs text-danger">寄出地和目的地不能相同</p>
        )}

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-text-light">重量</span>
            <span className="font-medium text-navy">{weight}kg</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="20"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-text-lighter mt-0.5">
            <span>0.1kg</span>
            <span>20kg</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-text-light">体积</span>
            <span className="font-medium text-navy">{volume}m³</span>
          </div>
          <input
            type="range"
            min="0.001"
            max="0.2"
            step="0.001"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-text-lighter mt-0.5">
            <span>0.001m³</span>
            <span>0.2m³</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || origin === destination}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              计算中...
            </>
          ) : (
            <>
              <Calculator className="w-4 h-4" />
              开始试算
            </>
          )}
        </button>
      </div>

      {submitted && !loading && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4 text-xs text-text-light">
            <span>{originCity.city} {originCity.district}</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span>{destCity.city} {destCity.district}</span>
            <span className="mx-1">|</span>
            <span>{weight}kg / {volume}m³</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {tiers.map((tier) => {
              const config = TIER_CONFIG[tier.type]
              const Icon = config.icon
              const isSelected = selected === tier.type
              return (
                <button
                  key={tier.type}
                  onClick={() => setSelected(tier.type)}
                  className={`card p-3 text-center transition-all duration-200 ${
                    isSelected
                      ? `border-2 ${config.border} ${config.bg} shadow-md -translate-y-1`
                      : 'border border-gray-100 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 ${config.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className={`text-xs font-bold ${isSelected ? config.text : 'text-navy'}`}>
                    {tier.name}
                  </p>
                  <p className="text-2xl font-bold text-navy font-display mt-1">
                    ¥{tier.price.toFixed(1)}
                  </p>
                  <p className="text-xs text-accent font-medium mt-0.5">{tier.estimatedDays}</p>
                  <p className="text-[10px] text-text-lighter mt-1.5 leading-tight">{tier.description}</p>
                  {isSelected && (
                    <div className={`mt-2 text-[10px] font-medium ${config.text} ${config.bg} rounded-full py-0.5 px-2 inline-block`}>
                      已选择
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {selected && (
            <div className="card p-4 mt-4 animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-light">已选择服务</p>
                  <p className="text-sm font-bold text-navy mt-0.5">
                    {tiers.find((t) => t.type === selected)?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-light">预估运费</p>
                  <p className="text-xl font-bold text-accent font-display mt-0.5">
                    ¥{tiers.find((t) => t.type === selected)?.price.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!submitted && !loading && (
        <div className="text-center py-12 text-text-lighter">
          <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">填写寄递信息，开始运费试算</p>
        </div>
      )}
    </div>
  )
}

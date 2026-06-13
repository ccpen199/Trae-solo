import { useState, useMemo } from 'react'
import {
  Calculator, ArrowRight, Zap, Truck, Package, Loader2,
  ChevronRight, Info, Ruler, Scale, MapPin
} from 'lucide-react'
import { useNavigate, createSearchParams } from 'react-router-dom'
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
  economy: { icon: Package, color: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-500', bg: 'bg-blue-50', ring: 'ring-blue-500' },
  standard: { icon: Truck, color: 'bg-navy', border: 'border-navy', text: 'text-navy', bg: 'bg-navy/5', ring: 'ring-navy' },
  express: { icon: Zap, color: 'bg-accent', border: 'border-accent', text: 'text-accent', bg: 'bg-accent/5', ring: 'ring-accent' },
}

const BASE_PRICES = {
  economy: { first: 12, continue: 4 },
  standard: { first: 18, continue: 6 },
  express: { first: 25, continue: 8 },
}

const MOCK_TIERS = [
  { type: 'economy' as const, name: '经济件', price: 12.0, estimatedDays: '3-5天', description: '经济实惠，适合不急的包裹' },
  { type: 'standard' as const, name: '标准件', price: 23.5, estimatedDays: '2-3天', description: '性价比之选，时效稳定' },
  { type: 'express' as const, name: '特快件', price: 38.0, estimatedDays: '1-2天', description: '极速达，急件首选' },
]

type ServiceType = 'economy' | 'standard' | 'express'

interface BreakdownLine {
  label: string
  detail?: string
  amount: number
}

function getDistanceFactor(origin: typeof CITIES[0], dest: typeof CITIES[0]) {
  if (origin.city === dest.city) return { factor: 0, label: '同城', km: 30 }
  if (origin.province === dest.province) return { factor: 2, label: '省内', km: 300 }
  const east = ['上海市', '江苏省', '浙江省', '安徽省', '福建省', '山东省']
  const south = ['广东省', '广西壮族自治区', '海南省', '湖南省', '湖北省', '江西省']
  const north = ['北京市', '天津市', '河北省', '山西省', '内蒙古自治区']
  const west = ['四川省', '重庆市', '贵州省', '云南省', '陕西省', '甘肃省', '青海省']
  const oRegion = east.includes(origin.province) ? 'east' : south.includes(origin.province) ? 'south' : north.includes(origin.province) ? 'north' : 'west'
  const dRegion = east.includes(dest.province) ? 'east' : south.includes(dest.province) ? 'south' : north.includes(dest.province) ? 'north' : 'west'
  if (oRegion === dRegion) return { factor: 5, label: '跨省', km: 1000 }
  return { factor: 8, label: '远距', km: 1800 }
}

function calcBreakdown(type: ServiceType, weight: number, volume: number, distanceFactor: number) {
  const base = BASE_PRICES[type]
  const lines: BreakdownLine[] = []
  const firstWeightAmount = base.first
  lines.push({ label: '首重运费', detail: `1kg × ¥${base.first}`, amount: firstWeightAmount })
  let continueWeightAmount = 0
  if (weight > 1) {
    const continueKg = Math.ceil(weight - 1)
    continueWeightAmount = continueKg * base.continue
    lines.push({ label: '续重运费', detail: `${continueKg}kg × ¥${base.continue}`, amount: continueWeightAmount })
  }
  let volumeSurcharge = 0
  if (volume > 0.05) {
    const steps = Math.ceil((volume - 0.05) / 0.02)
    volumeSurcharge = steps * 2
    lines.push({ label: '体积附加费', detail: `超${steps * 0.02}m³ × ¥2`, amount: volumeSurcharge })
  }
  if (distanceFactor > 0) {
    lines.push({ label: '距离附加费', detail: `${distanceFactor === 2 ? '省内' : distanceFactor === 5 ? '跨省' : '远距'}`, amount: distanceFactor })
  }
  lines.push({ label: '操作费+面单费', detail: '固定费用', amount: 2 })
  const subtotal = firstWeightAmount + continueWeightAmount + volumeSurcharge + distanceFactor + 2
  return { lines, subtotal, firstWeightAmount, continueWeightAmount }
}

export default function Estimate() {
  const { estimateTiers, fetchEstimate, loading } = useAppStore()
  const navigate = useNavigate()
  const [origin, setOrigin] = useState(0)
  const [destination, setDestination] = useState(1)
  const [weight, setWeight] = useState(1)
  const [volume, setVolume] = useState(0.01)
  const [selected, setSelected] = useState<ServiceType | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const tiers = estimateTiers.length > 0 ? estimateTiers : MOCK_TIERS
  const originCity = CITIES[origin]
  const destCity = CITIES[destination]

  const distanceInfo = useMemo(() => getDistanceFactor(originCity, destCity), [origin, destination])

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

  const selectedTier = tiers.find((t) => t.type === selected)
  const selectedBreakdown = selected
    ? calcBreakdown(selected, weight, volume, distanceInfo.factor)
    : null

  const handleOrder = () => {
    if (!selected) return
    const params = createSearchParams({
      origin_city: `${originCity.province}${originCity.city}${originCity.district}`,
      dest_city: `${destCity.province}${destCity.city}${destCity.district}`,
      weight: String(weight),
      volume: String(volume),
      service_type: selected,
    })
    navigate({ pathname: '/order', search: `?${params.toString()}` })
  }

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
          <label className="text-xs font-medium text-text-light mb-1.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" />寄出地
          </label>
          <select className="input-field" value={origin} onChange={(e) => setOrigin(Number(e.target.value))}>
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
          <label className="text-xs font-medium text-text-light mb-1.5 flex items-center gap-1">
            <MapPin className="w-3 h-3" />目的地
          </label>
          <select className="input-field" value={destination} onChange={(e) => setDestination(Number(e.target.value))}>
            {CITIES.map((c, i) => (
              <option key={i} value={i}>{c.city} {c.district}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface/60 border border-gray-100">
          <Ruler className="w-3.5 h-3.5 text-navy shrink-0" />
          <span className="text-xs text-text-light">
            <span className="font-medium text-navy">📏 寄递距离估算:</span>{' '}
            {originCity.province === destCity.province ? '省内' : '跨省'}约{' '}
            <span className="font-semibold text-accent">{distanceInfo.km}</span>km
          </span>
          <Info className="w-3 h-3 text-text-lighter ml-auto" />
        </div>

        {origin === destination && (
          <p className="text-xs text-danger">寄出地和目的地不能相同</p>
        )}

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-text-light flex items-center gap-1"><Scale className="w-3 h-3" />重量</span>
            <span className="font-medium text-navy">{weight}kg</span>
          </div>
          <input type="range" min="0.1" max="20" step="0.1" value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value))} className="w-full" />
          <div className="flex justify-between text-[10px] text-text-lighter mt-0.5">
            <span>0.1kg</span><span>20kg</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-text-light flex items-center gap-1"><Package className="w-3 h-3" />体积</span>
            <span className="font-medium text-navy">{volume}m³</span>
          </div>
          <input type="range" min="0.001" max="0.2" step="0.001" value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full" />
          <div className="flex justify-between text-[10px] text-text-lighter mt-0.5">
            <span>0.001m³</span><span>0.2m³</span>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading || origin === destination}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />计算中...</>
          ) : (
            <><Calculator className="w-4 h-4" />开始试算</>
          )}
        </button>
      </div>

      {submitted && !loading && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4 text-xs text-text-light flex-wrap">
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
              const b = calcBreakdown(tier.type, weight, volume, distanceInfo.factor)
              return (
                <button key={tier.type} onClick={() => setSelected(tier.type)}
                  className={`card p-3 text-left transition-all duration-200 ${
                    isSelected
                      ? `border-2 ${config.border} ${config.bg} shadow-md -translate-y-0.5`
                      : 'border border-gray-100 hover:shadow-sm'
                  }`}>
                  <div className={`w-8 h-8 ${config.color} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className={`text-xs font-bold text-center ${isSelected ? config.text : 'text-navy'}`}>
                    {tier.name}
                  </p>
                  <p className="text-xl font-bold text-navy font-display mt-1 text-center">
                    ¥{tier.price.toFixed(1)}
                  </p>
                  <div className="mt-2 space-y-0.5 text-[10px] text-text-lighter">
                    <div className="flex justify-between">
                      <span>首重:</span>
                      <span className="text-text-light font-medium">¥{b.firstWeightAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>续重:</span>
                      <span className="text-text-light font-medium">
                        {weight > 1 ? `¥${b.continueWeightAmount}` : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>时效:</span>
                      <span className="text-accent font-semibold">{tier.estimatedDays}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className={`mt-2 text-[10px] font-medium text-center ${config.text} ${config.bg} rounded-full py-0.5`}>
                      ✓ 已选择
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {selected && selectedTier && selectedBreakdown && (
            <div className="mt-4 space-y-3 animate-slide-up">
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className={`w-4 h-4 ${TIER_CONFIG[selected].text}`} />
                    <p className="text-sm font-bold text-navy">费用明细</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${TIER_CONFIG[selected].bg} ${TIER_CONFIG[selected].text} font-medium`}>
                    {selectedTier.name}
                  </span>
                </div>
                <div className="space-y-2">
                  {selectedBreakdown.lines.map((line, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-3 h-3 text-text-lighter" />
                        <div>
                          <p className="text-xs text-text-medium font-medium">{line.label}</p>
                          {line.detail && (
                            <p className="text-[10px] text-text-lighter">{line.detail}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-navy">¥{line.amount.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-light">
                      {Math.abs(selectedBreakdown.subtotal - selectedTier.price) > 0.5
                        ? '计价参考' : '计算小计'}
                    </p>
                    <p className="text-[10px] text-text-lighter">
                      参考: ¥{selectedBreakdown.subtotal.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-text-light">实际报价</p>
                    <p className="text-2xl font-bold text-accent font-display leading-none">
                      ¥{selectedTier.price.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => alert('服务详情：\n\n' + selectedTier.name + '\n' + selectedTier.description + '\n\n时效：' + selectedTier.estimatedDays)}
                  className="btn-outline flex items-center justify-center gap-1.5 text-xs py-2.5">
                  <Info className="w-3.5 h-3.5" />查看服务详情
                </button>
                <button onClick={handleOrder}
                  className="btn-primary flex items-center justify-center gap-1.5 text-xs py-2.5 shadow-md">
                  使用此服务下单<ChevronRight className="w-3.5 h-3.5" />
                </button>
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

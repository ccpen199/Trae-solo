import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { mockListings } from '@/data/mockData'
import type { Listing, ListingType, CommuteMode } from '@/types'
import {
  Bed, Maximize, Compass, Train, Bus, Car,
  Check, Star, Shield, ArrowLeft, ShieldCheck, ChevronRight,
} from 'lucide-react'

const typeBadge: Record<ListingType, string> = {
  ccb_direct: 'badge-ccb',
  partner: 'badge-partner',
  personal: 'badge-personal',
}
const typeLabel: Record<ListingType, string> = {
  ccb_direct: '建行直营',
  partner: '合作房源',
  personal: '个人房源',
}

const roomColors: Record<string, string> = {
  主卧: '#003DA5', 次卧: '#2563EB', 卧室: '#3B82F6',
  次卧A: '#60A5FA', 次卧B: '#93C5FD', 客厅: '#C9A96E',
  餐厅: '#D4A853', 厨房: '#10B981', 卫生间: '#6366F1',
  阳台: '#F59E0B', 储物间: '#8B5CF6', 玄关: '#EC4899', 起居室: '#C9A96E',
}

const commuteIcons: Record<CommuteMode, React.ReactNode> = {
  metro: <Train className="w-4 h-4" />,
  bus: <Bus className="w-4 h-4" />,
  drive: <Car className="w-4 h-4" />,
}

const amenityIcons: Record<string, string> = {
  空调: '❄️', 洗衣机: '🧺', 冰箱: '🧊', 热水器: '🔥',
  智能门锁: '🔐', 健身房: '💪', 停车位: '🅿️', 共享办公区: '💻',
  快递柜: '📦', 公共厨房: '🍳', 公共客厅: '🛋️', 燃气灶: '🔥',
  洗碗机: '🍽️',
}

const flowSteps = ['搜索房源', '查看详情', '预约看房', '签署合同', '租金支付', '租后服务']

function FlowBreadcrumb() {
  return (
    <div className="px-4 py-2.5 flex items-center gap-1 overflow-x-auto text-xs whitespace-nowrap">
      {flowSteps.map((step, i) => (
        <span key={step} className="flex items-center gap-1">
          <span className={i === 1 ? 'text-ccb-500 font-bold' : i < 1 ? 'text-space-400' : 'text-space-300'}>
            {i === 1 ? `${step}(当前)` : step}
          </span>
          {i < flowSteps.length - 1 && <ChevronRight className="w-3 h-3 text-space-300 shrink-0" />}
        </span>
      ))}
    </div>
  )
}

function VerificationPanel({ listing }: { listing: Listing }) {
  const v = listing.verification
  if (listing.type === 'ccb_direct') {
    return (
      <div className="glass-panel rounded-xl p-4 border-l-4 border-ccb-500">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-ccb-500" />
          <h2 className="section-title text-lg">建行直营认证</h2>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-ccb-500" />
            <span className="text-space-700">直营管理体系</span>
            <span className="text-space-400 text-xs ml-auto">{v.managementStandard ?? '建行自营标准'}</span>
            <Check className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-ccb-500" />
            <span className="text-space-700">品质保障体系</span>
            <span className="text-space-400 text-xs ml-auto">全流程管控</span>
            <Check className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
        <span className="inline-block mt-3 badge-ccb text-xs px-2 py-1 rounded">建行品质保障</span>
      </div>
    )
  }
  if (listing.type === 'partner') {
    return (
      <div className="glass-panel rounded-xl p-4 border-l-4 border-emerald-500">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <h2 className="section-title text-lg">合作运营认证</h2>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-space-700">资质白名单</span>
            <span className="text-space-400 text-xs ml-auto">有效期至 {v.whitelistExpiry ?? '2026-12-31'}</span>
            <Check className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-space-700">服务标准契约</span>
            <span className="text-space-400 text-xs ml-auto">合同号 {v.serviceContractNo ?? 'CCB-SV-2025-001'}</span>
            <Check className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
        <span className="inline-block mt-3 badge-partner text-xs px-2 py-1 rounded">白名单运营商</span>
      </div>
    )
  }
  return (
    <div className="glass-panel rounded-xl p-4 border-l-4 border-amber-500">
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheck className="w-5 h-5 text-amber-500" />
        <h2 className="section-title text-lg">个人房源核验</h2>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-amber-500" />
          <span className="text-space-700">产权核验</span>
          <span className="text-space-400 text-xs ml-auto">证书号 {v.propertyCertNo ?? 'CR-2025-0892'}</span>
          <Check className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Shield className="w-4 h-4 text-amber-500" />
          <span className="text-space-700">人脸识别</span>
          <span className="text-space-400 text-xs ml-auto">{v.faceVerifiedAt ?? '2025-06-01'} 已验证</span>
          <Check className="w-4 h-4 text-emerald-500" />
        </div>
      </div>
      <span className="inline-block mt-3 badge-personal text-xs px-2 py-1 rounded">双重验证</span>
    </div>
  )
}

function LightingGauge({ score }: { score: number }) {
  const r = 36, c = 2 * Math.PI * r
  const pct = score / 100
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#E5E7EB" strokeWidth="6" />
      <circle cx="44" cy="44" r={r} fill="none" stroke="#003DA5" strokeWidth="6"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
        strokeLinecap="round" transform="rotate(-90 44 44)"
        className="transition-all duration-700" />
      <text x="44" y="40" textAnchor="middle" className="fill-space-800 text-lg font-bold" fontSize="18">{score}</text>
      <text x="44" y="54" textAnchor="middle" className="fill-space-400" fontSize="10">/100</text>
    </svg>
  )
}

function HeatMapGrid({ data }: { data: number[][] }) {
  const cellColor = (v: number) => {
    if (v >= 9) return '#FDE68A'
    if (v >= 7) return '#FBBF24'
    if (v >= 5) return '#60A5FA'
    return '#3B82F6'
  }
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${data[0]?.length ?? 1}, 1fr)` }}>
      {data.flat().map((v, i) => (
        <div key={i} className="w-8 h-8 rounded text-[10px] flex items-center justify-center text-space-800 font-medium"
          style={{ backgroundColor: cellColor(v) }}>{v}</div>
      ))}
    </div>
  )
}

function FloorPlanSVG({ rooms }: { rooms: { room: string; area: number }[] }) {
  const layout: { room: string; x: number; y: number; w: number; h: number }[] = []
  const cols = rooms.length <= 4 ? 2 : 3
  const cellW = 180 / cols
  const cellH = 60
  rooms.forEach((r, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    layout.push({ room: r.room, x: 10 + col * cellW, y: 10 + row * (cellH + 4), w: cellW - 4, h: cellH })
  })
  const svgH = 10 + Math.ceil(rooms.length / cols) * (cellH + 4) + 24

  const dirs = [
    { label: '北', x: 100, y: 6, anchor: 'middle' },
    { label: '南', x: 100, y: svgH - 2, anchor: 'middle' },
    { label: '西', x: 4, y: svgH / 2, anchor: 'start' },
    { label: '东', x: 196, y: svgH / 2, anchor: 'end' },
  ]

  return (
    <svg viewBox={`0 0 200 ${svgH}`} className="w-full max-w-xs mx-auto mb-2">
      {dirs.map(d => (
        <text key={d.label} x={d.x} y={d.y} textAnchor={d.anchor as 'middle' | 'start' | 'end'}
          fontSize="8" fill="#9CA3AF" fontWeight="bold">{d.label}</text>
      ))}
      <rect x="10" y="10" width="180" height={svgH - 20} rx="4" fill="none" stroke="#003DA5" strokeWidth="1.5" />
      {layout.map(l => (
        <g key={l.room}>
          <rect x={l.x} y={l.y} width={l.w} height={l.h} rx="2"
            fill={`${roomColors[l.room] ?? '#003DA5'}20`} stroke={roomColors[l.room] ?? '#003DA5'} strokeWidth="1" />
          <text x={l.x + l.w / 2} y={l.y + l.h / 2 - 4} textAnchor="middle" fontSize="9"
            fill={roomColors[l.room] ?? '#003DA5'}>{l.room}</text>
          <text x={l.x + l.w / 2} y={l.y + l.h / 2 + 8} textAnchor="middle" fontSize="7"
            fill="#6B7280">{rooms.find(r => r.room === l.room)?.area}㎡</text>
        </g>
      ))}
    </svg>
  )
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { listings, setCurrentListing } = useStore()
  const [commuteTab, setCommuteTab] = useState<CommuteMode>('metro')

  const listing: Listing | undefined = listings.find(l => l.id === id) ?? mockListings.find(l => l.id === id)
  if (!listing) return <div className="p-8 text-center text-space-400">房源未找到</div>

  setCurrentListing(listing)
  const { aiAnalysis } = listing
  const maxArea = Math.max(...aiAnalysis.areaBreakdown.map(r => r.area))

  const commuteData: Record<CommuteMode, { label: string; items: { name: string; minutes: number }[] }> = {
    metro: { label: '地铁', items: listing.commuteInfo.metro.map(s => ({ name: s.station, minutes: s.minutes })) },
    bus: { label: '公交', items: listing.commuteInfo.bus.map(s => ({ name: s.station, minutes: s.minutes })) },
    drive: { label: '驾车', items: listing.commuteInfo.drive.map(d => ({ name: d.destination, minutes: d.minutes })) },
  }

  const costs = [
    { label: '租金', amount: listing.price },
    { label: '物业费', amount: 300 },
    { label: '服务费', amount: 200 },
    { label: '押金', amount: listing.price * 2 },
  ]
  const total = costs.reduce((s, c) => s + c.amount, 0)
  const monthlyInstallment = Math.round(total / 12)

  return (
    <div className="pb-20">
      <FlowBreadcrumb />
      <div className="relative">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 w-9 h-9 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-md">
          <ArrowLeft className="w-5 h-5 text-space-800" />
        </button>
        <div className="h-72 bg-space-200 overflow-hidden">
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
        </div>
        <span className={`absolute top-4 right-4 ${typeBadge[listing.type]}`}>{typeLabel[listing.type]}</span>
        {listing.images.length > 1 && (
          <div className="flex gap-2 px-4 -mt-8 relative z-10">
            {listing.images.slice(1).map((img, i) => (
              <img key={i} src={img} alt="" className="w-20 h-14 rounded-lg object-cover border-2 border-white shadow" />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="glass-panel rounded-xl p-4">
          <h1 className="text-xl font-bold text-space-800">{listing.title}</h1>
          <p className="text-space-400 text-sm mt-1">{listing.address}</p>
          <div className="flex items-end gap-1 mt-3">
            <span className="text-3xl font-bold text-red-500">¥{listing.price.toLocaleString()}</span>
            <span className="text-space-400 text-sm mb-1">/月</span>
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-sm text-space-600">
            <span className="flex items-center gap-1"><Maximize className="w-4 h-4" />{listing.area}㎡</span>
            <span className="flex items-center gap-1"><Bed className="w-4 h-4" />{listing.rooms}室{listing.halls}厅</span>
            <span>{listing.floor}层</span>
            <span className="flex items-center gap-1"><Compass className="w-4 h-4" />{listing.orientation}</span>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-space-100">
            <div className="w-8 h-8 rounded-full bg-ccb-100 flex items-center justify-center text-ccb-500 font-bold text-sm">
              {listing.landlord.name[0]}
            </div>
            <span className="text-sm font-medium text-space-800">{listing.landlord.name}</span>
            {listing.landlord.verified && <Shield className="w-4 h-4 text-ccb-500" />}
            <div className="flex items-center gap-0.5 ml-auto">
              <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
              <span className="text-sm text-space-600">{listing.landlord.rating}</span>
            </div>
          </div>
        </div>

        <VerificationPanel listing={listing} />

        <div className="glass-panel rounded-xl p-4">
          <h2 className="section-title text-lg mb-3">AI 户型分析</h2>
          <FloorPlanSVG rooms={aiAnalysis.areaBreakdown} />
          <div className="space-y-2">
            {aiAnalysis.areaBreakdown.map(r => (
              <div key={r.room} className="flex items-center gap-2 text-sm">
                <span className="w-12 text-space-600 text-right">{r.room}</span>
                <div className="flex-1 bg-space-100 rounded-full h-4 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(r.area / maxArea) * 100}%`, backgroundColor: roomColors[r.room] ?? '#003DA5' }} />
                </div>
                <span className="w-10 text-space-800 font-medium">{r.area}㎡</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 mt-4 pt-3 border-t border-space-100">
            <div className="text-center">
              <p className="text-xs text-space-400 mb-1">采光评分</p>
              <LightingGauge score={aiAnalysis.lightingScore} />
            </div>
            <div className="text-center">
              <p className="text-xs text-space-400 mb-1">朝向</p>
              <Compass className="w-10 h-10 text-ccb-500 mx-auto" />
              <p className="text-sm font-medium text-space-800 mt-1">{aiAnalysis.orientation}</p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-space-400 mb-1">采光热力图</p>
              <HeatMapGrid data={aiAnalysis.lightingMap} />
            </div>
          </div>
          <p className="text-sm text-space-600 mt-3 leading-relaxed">
            采光评分{aiAnalysis.lightingScore}分，客厅与主卧朝南采光充足，次卧东南向有晨光照射，建议选用浅色窗帘增强光线反射。
          </p>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <h2 className="section-title text-lg mb-3">费用明细</h2>
          {costs.map(c => (
            <div key={c.label} className="flex justify-between py-2 text-sm border-b border-space-50 last:border-0">
              <span className="text-space-600">{c.label}</span>
              <span className="text-space-800 font-medium">¥{c.amount.toLocaleString()}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 mt-1 border-t-2 border-space-200">
            <span className="font-bold text-space-800">合计</span>
            <span className="font-bold text-red-500 text-lg">¥{total.toLocaleString()}</span>
          </div>
          <p className="text-xs text-space-400 mt-2">支持建行卡/银联/分期付款</p>
          <p className="text-xs text-ccb-500 font-medium">月供约¥{monthlyInstallment.toLocaleString()}起</p>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <h2 className="section-title text-lg mb-3">通勤信息</h2>
          <div className="flex gap-2 mb-3">
            {(Object.keys(commuteData) as CommuteMode[]).map(mode => (
              <button key={mode} onClick={() => setCommuteTab(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${commuteTab === mode ? 'bg-ccb-500 text-white' : 'bg-space-100 text-space-600'}`}>
                {commuteIcons[mode]}{commuteData[mode].label}
              </button>
            ))}
          </div>
          {commuteData[commuteTab].items.map(item => (
            <div key={item.name} className="flex justify-between py-2 text-sm">
              <span className="text-space-600">{item.name}</span>
              <span className="text-ccb-500 font-medium">{item.minutes}分钟</span>
            </div>
          ))}
        </div>

        <div className="glass-panel rounded-xl p-4">
          <h2 className="section-title text-lg mb-3">配套设施</h2>
          <div className="grid grid-cols-3 gap-3">
            {listing.amenities.map(a => (
              <div key={a} className="flex items-center gap-2 text-sm text-space-700 bg-space-50 rounded-lg px-3 py-2">
                <span>{amenityIcons[a] ?? '🏠'}</span>
                <span>{a}</span>
                <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 glass-panel border-t border-white/20 px-4 py-3 flex gap-3 z-20">
        <button onClick={() => navigate('/appointment')} className="ccb-btn-outline flex-1">预约看房 →</button>
        <button onClick={() => navigate('/contract')} className="ccb-btn-primary flex-1">立即签约 →</button>
      </div>
    </div>
  )
}

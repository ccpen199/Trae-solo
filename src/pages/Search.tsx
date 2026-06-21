import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import type { CommuteMode, ListingType, Listing } from '@/types'
import { Search as SearchIcon, Train, Bus, Car, Filter, Sparkles, Sun, Compass, X, TrendingUp, Star, MapPin } from 'lucide-react'

const ROOMS_OPTIONS = [1, 2, 3, 4]
const TYPE_OPTIONS: { value: ListingType; label: string; badge: string }[] = [
  { value: 'ccb_direct', label: 'CCB自营', badge: 'badge-ccb' },
  { value: 'partner', label: '合作运营', badge: 'badge-partner' },
  { value: 'personal', label: '个人房源', badge: 'badge-personal' },
]
const COMMUTE_TABS: { mode: CommuteMode; label: string; icon: typeof Train }[] = [
  { mode: 'metro', label: '地铁', icon: Train },
  { mode: 'bus', label: '公交', icon: Bus },
  { mode: 'drive', label: '驾车', icon: Car },
]
const DISTRICTS = ['', '浦东新区', '徐汇区', '黄浦区', '静安区', '长宁区', '虹口区']
const METRO_LINES = [
  { color: '#E4002B', d: 'M80,180 Q200,140 350,200 Q500,260 620,190' },
  { color: '#003DA5', d: 'M120,300 Q280,200 400,280 Q520,360 640,260' },
  { color: '#FFD700', d: 'M60,250 Q250,320 420,220 Q560,140 680,210' },
]
const MARKER_POSITIONS = [
  { x: 200, y: 170 }, { x: 350, y: 210 }, { x: 480, y: 190 },
  { x: 300, y: 260 }, { x: 550, y: 240 }, { x: 160, y: 230 },
]
const STATIONS = [
  { x: 150, y: 200 }, { x: 280, y: 170 }, { x: 400, y: 230 },
  { x: 520, y: 200 }, { x: 350, y: 290 }, { x: 480, y: 310 },
]

const ISOCHRONE_MAP: Record<CommuteMode, { r: number[]; mins: number[] }> = {
  metro: { r: [160, 110, 60], mins: [30, 20, 10] },
  bus: { r: [150, 100, 55], mins: [40, 25, 15] },
  drive: { r: [175, 125, 70], mins: [60, 40, 20] },
}

const typeBadge = (t: ListingType) =>
  TYPE_OPTIONS.find(o => o.value === t)?.badge ?? 'badge-ccb'

const typeColor = (t: ListingType) =>
  t === 'ccb_direct' ? '#003DA5' : t === 'partner' ? '#10B981' : '#F59E0B'

export default function Search() {
  const { searchParams, setSearchParams, filterListings } = useStore()
  const navigate = useNavigate()
  const [aiPanel, setAiPanel] = useState(false)
  const [aiListing, setAiListing] = useState<string | null>(null)
  const results = filterListings()
  const listing = aiListing ? results.find(l => l.id === aiListing) : null

  const recommended = useMemo(() => {
    const sorted = [...results].sort((a, b) => (a.price / a.area) - (b.price / b.area))
    return sorted.slice(0, 2)
  }, [results])

  const toggleRoom = (r: number) => {
    const next = searchParams.rooms.includes(r)
      ? searchParams.rooms.filter(v => v !== r)
      : [...searchParams.rooms, r]
    setSearchParams({ rooms: next })
  }

  const toggleType = (t: ListingType) => {
    const next = searchParams.listingType.includes(t)
      ? searchParams.listingType.filter(v => v !== t)
      : [...searchParams.listingType, t]
    setSearchParams({ listingType: next })
  }

  const getCommuteLabel = (l: Listing) => {
    const mode = searchParams.commuteMode
    if (mode === 'metro' && l.commuteInfo.metro[0])
      return `地铁${l.commuteInfo.metro[0].minutes}分钟 · ${l.commuteInfo.metro[0].station}`
    if (mode === 'bus' && l.commuteInfo.bus[0])
      return `公交${l.commuteInfo.bus[0].minutes}分钟 · ${l.commuteInfo.bus[0].station}`
    if (mode === 'drive' && l.commuteInfo.drive[0])
      return `驾车${l.commuteInfo.drive[0].minutes}分钟 · ${l.commuteInfo.drive[0].destination}`
    return ''
  }

  const openAi = (id: string) => { setAiListing(id); setAiPanel(true) }

  const isochrone = ISOCHRONE_MAP[searchParams.commuteMode]

  const renderVerificationBadges = (l: Listing) => {
    if (l.type === 'ccb_direct') {
      return <span className="inline-flex items-center gap-0.5 text-[11px] text-ccb-500 font-medium"><Star className="w-3 h-3 fill-ccb-500" />建行直管</span>
    }
    if (l.type === 'partner') {
      return (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 font-medium">白名单✓</span>
          <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 font-medium">契约✓</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-600 font-medium">产权✓</span>
        <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-600 font-medium">人脸✓</span>
      </div>
    )
  }

  const lightingAdvice = (score: number, orientation: string) => {
    if (score >= 90) return `该房源${orientation}，采光充足，居住舒适度高，建议在阳台布置绿植以提升空间层次感。`
    if (score >= 80) return `该房源${orientation}，采光良好，客厅与卧室均有充足自然光，适合大多数家庭居住需求。`
    if (score >= 70) return `该房源${orientation}，采光一般，建议选用浅色系装修风格，搭配辅助光源改善室内亮度。`
    return `该房源${orientation}，采光较弱，建议使用明亮装饰和增加灯具，避免选择深色厚重家具。`
  }

  return (
    <div className="flex flex-col h-full gap-3 p-4">
      <div className="glass-panel rounded-xl p-4 flex flex-wrap items-center gap-4">
        <Filter className="w-4 h-4 text-ccb-500" />
        <div className="flex items-center gap-2">
          <span className="text-sm text-space-500">预算</span>
          <input type="range" min={2000} max={15000} step={500}
            value={searchParams.budgetMin}
            onChange={e => setSearchParams({ budgetMin: +e.target.value })}
            className="w-24 accent-ccb-500" />
          <span className="text-xs text-space-600 font-medium">¥{searchParams.budgetMin.toLocaleString()}</span>
          <span className="text-space-300">—</span>
          <input type="range" min={2000} max={15000} step={500}
            value={searchParams.budgetMax}
            onChange={e => setSearchParams({ budgetMax: +e.target.value })}
            className="w-24 accent-gold-500" />
          <span className="text-xs text-space-600 font-medium">¥{searchParams.budgetMax.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-space-500 mr-1">户型</span>
          {ROOMS_OPTIONS.map(r => (
            <button key={r}
              onClick={() => toggleRoom(r)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                searchParams.rooms.includes(r)
                  ? 'bg-ccb-500 text-white' : 'bg-space-100 text-space-600 hover:bg-space-200'}`}>
              {r}室{r === 4 ? '+' : ''}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-space-500 mr-1">类型</span>
          {TYPE_OPTIONS.map(t => (
            <button key={t.value}
              onClick={() => toggleType(t.value)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                searchParams.listingType.includes(t.value)
                  ? 'bg-ccb-500 text-white' : 'bg-space-100 text-space-600 hover:bg-space-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <select value={searchParams.district}
          onChange={e => setSearchParams({ district: e.target.value })}
          className="px-3 py-1.5 rounded-lg border border-space-200 text-sm bg-white text-space-700">
          {DISTRICTS.map(d => (
            <option key={d} value={d}>{d || '全部区域'}</option>
          ))}
        </select>
      </div>

      {recommended.length > 0 && (
        <div className="glass-panel rounded-xl p-4 border-l-4 border-l-gold-500">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-gold-600" />
            <span className="text-sm font-semibold text-space-800">预算智能推荐</span>
            <span className="text-xs text-space-400">
              在您的预算 ¥{searchParams.budgetMin.toLocaleString()}-¥{searchParams.budgetMax.toLocaleString()} 范围内，共找到 {results.length} 套房源
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {recommended.map(l => (
              <Link key={l.id} to={`/listing/${l.id}`} className="flex gap-3 p-2 rounded-lg hover:bg-ccb-50 transition-colors">
                <img src={l.images[0]} alt="" className="w-16 h-14 rounded object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-gold-100 text-gold-700 text-[10px] font-bold">性价比之选</span>
                    <h4 className="text-xs font-semibold text-space-800 truncate">{l.title}</h4>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-sm font-bold text-red-500">¥{l.price}</span>
                    <span className="text-[10px] text-space-400">/月</span>
                    <span className="text-[10px] text-space-400">· {l.area}㎡ · {l.district}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1 gap-3 min-h-0">
        <div className="w-[65%] glass-panel rounded-xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 p-3 border-b border-space-100">
            {COMMUTE_TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button key={tab.mode}
                  onClick={() => setSearchParams({ commuteMode: tab.mode })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    searchParams.commuteMode === tab.mode
                      ? 'bg-ccb-500 text-white' : 'bg-space-100 text-space-600 hover:bg-space-200'}`}>
                  <Icon className="w-4 h-4" />{tab.label}
                </button>
              )
            })}
            <div className="flex-1 flex items-center gap-2 ml-2">
              <MapPin className="w-4 h-4 text-ccb-500" />
              <input placeholder="输入目的地，智能计算通勤时间..."
                value={searchParams.commuteDestination}
                onChange={e => setSearchParams({ commuteDestination: e.target.value })}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-space-300" />
              {searchParams.commuteDestination && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-ccb-50 text-ccb-600">
                  以{searchParams.commuteDestination}为中心
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 relative bg-gradient-to-br from-space-50 to-ccb-50">
            <svg viewBox="0 0 720 400" className="w-full h-full">
              <defs>
                <radialGradient id="isochrone" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#003DA5" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#003DA5" stopOpacity="0" />
                </radialGradient>
              </defs>
              {isochrone.r.map((r, i) => (
                <g key={i}>
                  <circle cx="360" cy="200" r={r} fill={i === 0 ? 'url(#isochrone)' : 'none'}
                    stroke="#003DA5" strokeWidth={1} strokeOpacity={0.25 - i * 0.06} strokeDasharray={i === isochrone.r.length - 1 ? '4 4' : undefined} />
                  <text x={360 + r - 8} y={198} className="text-[10px] fill-ccb-600 font-medium">{isochrone.mins[i]}分钟圈</text>
                </g>
              ))}
              {METRO_LINES.map((line, i) => (
                <path key={i} d={line.d} fill="none" stroke={line.color}
                  strokeWidth={3} strokeOpacity={0.6} strokeLinecap="round" />
              ))}
              {STATIONS.map((s, i) => (
                <g key={i}>
                  <circle cx={s.x} cy={s.y} r={4} fill="white" stroke="#666" strokeWidth={1.5} />
                </g>
              ))}
              {MARKER_POSITIONS.map((m, i) => {
                const l = results[i]
                if (!l) return null
                const commute = searchParams.commuteMode === 'metro'
                  ? l.commuteInfo.metro[0]?.minutes
                  : searchParams.commuteMode === 'bus'
                  ? l.commuteInfo.bus[0]?.minutes
                  : l.commuteInfo.drive[0]?.minutes
                return (
                  <g key={i} className="cursor-pointer" onClick={() => navigate(`/listing/${l.id}`)}>
                    <circle cx={m.x} cy={m.y} r={9} fill={typeColor(l.type)}
                      stroke="white" strokeWidth={2} className="drop-shadow hover:r-11 transition-all" />
                    <text x={m.x} y={m.y + 3} textAnchor="middle" className="text-[8px] fill-white font-bold">
                      {l.type === 'ccb_direct' ? 'CCB' : l.type === 'partner' ? '合' : '个'}
                    </text>
                    {commute && (
                      <g>
                        <rect x={m.x + 12} y={m.y - 10} width={44} height={18} rx={4} fill="white" fillOpacity="0.95" stroke={typeColor(l.type)} strokeWidth="0.5" />
                        <text x={m.x + 34} y={m.y + 2} textAnchor="middle" className="text-[10px] fill-space-700 font-medium">{commute}分钟</text>
                      </g>
                    )}
                  </g>
                )
              })}
            </svg>
            <div className="absolute bottom-3 left-3 glass-panel rounded-lg px-3 py-2">
              <div className="text-[10px] text-space-400 mb-1">图例</div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#003DA5'}}></span>建行自营</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#10B981'}}></span>合作运营</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{background: '#F59E0B'}}></span>个人核验</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[35%] flex flex-col gap-3 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h2 className="section-title text-lg">搜索结果</h2>
            <span className="text-sm text-space-400">{results.length}套房源</span>
          </div>
          {results.map(l => (
            <Link key={l.id} to={`/listing/${l.id}`}
              className="glass-panel rounded-xl p-3 card-hover flex gap-3">
              <img src={l.images[0]} alt={l.title}
                className="w-24 h-20 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-space-800 truncate">{l.title}</h3>
                  <span className={typeBadge(l.type)}>{l.type === 'ccb_direct' ? '自营' : l.type === 'partner' ? '合作' : '个人'}</span>
                </div>
                <div className="mt-1">{renderVerificationBadges(l)}</div>
                <div className="flex items-baseline gap-1 mt-1.5">
                  <span className="text-lg font-bold text-red-500">¥{l.price.toLocaleString()}</span>
                  <span className="text-xs text-space-400">/月</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-space-500">
                  <span>{l.area}㎡</span>
                  <span>·</span>
                  <span>{l.rooms}室{l.halls}厅</span>
                  <span>·</span>
                  <span>{l.district}</span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-ccb-500 font-medium">{getCommuteLabel(l)}</span>
                  <button onClick={e => { e.preventDefault(); openAi(l.id) }}
                    className="flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700 font-medium">
                    <Sparkles className="w-3 h-3" />AI户型解析
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {aiPanel && listing && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAiPanel(false)} />
          <div className="relative w-[520px] bg-white shadow-2xl overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-space-100">
              <h3 className="font-serif text-lg font-semibold text-space-800">AI户型智能解析</h3>
              <button onClick={() => setAiPanel(false)} className="p-1 rounded-lg hover:bg-space-100">
                <X className="w-5 h-5 text-space-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-space-50 border border-space-100">
                <div className="absolute top-2 left-2 text-[10px] text-space-400 font-medium">北</div>
                <div className="absolute top-1/2 left-1 text-[10px] text-space-400 font-medium -translate-y-1/2">西</div>
                <div className="absolute top-1/2 right-1 text-[10px] text-space-400 font-medium -translate-y-1/2">东</div>
                <div className="absolute bottom-2 right-2 text-[10px] text-space-400 font-medium">南</div>
                <svg viewBox="0 0 300 200" className="w-full pt-4 pb-4 px-4">
                  <rect x="10" y="10" width="120" height="90" rx="4" fill="#E8F0FE" stroke="#003DA5" strokeWidth="1.5" />
                  <text x="70" y="50" textAnchor="middle" className="text-[11px] fill-ccb-500 font-semibold">主卧</text>
                  <text x="70" y="68" textAnchor="middle" className="text-[10px] fill-space-500 font-medium">{listing.aiAnalysis.areaBreakdown[0]?.area}㎡</text>
                  <rect x="140" y="10" width="80" height="90" rx="4" fill="#F9EDCC" stroke="#C9A96E" strokeWidth="1.5" />
                  <text x="180" y="50" textAnchor="middle" className="text-[11px] fill-gold-700 font-semibold">客厅</text>
                  <text x="180" y="68" textAnchor="middle" className="text-[10px] fill-space-500 font-medium">{listing.aiAnalysis.areaBreakdown[2]?.area || 0}㎡</text>
                  <rect x="230" y="10" width="60" height="50" rx="4" fill="#F0F1F5" stroke="#63688F" strokeWidth="1.5" />
                  <text x="260" y="33" textAnchor="middle" className="text-[10px] fill-space-600 font-medium">厨房</text>
                  <text x="260" y="47" textAnchor="middle" className="text-[9px] fill-space-400">{listing.aiAnalysis.areaBreakdown[3]?.area}㎡</text>
                  <rect x="230" y="70" width="60" height="30" rx="4" fill="#F0F1F5" stroke="#63688F" strokeWidth="1.5" />
                  <text x="260" y="89" textAnchor="middle" className="text-[10px] fill-space-600 font-medium">卫生间</text>
                  <rect x="10" y="110" width="90" height="80" rx="4" fill="#E8F0FE" stroke="#003DA5" strokeWidth="1.5" />
                  <text x="55" y="145" textAnchor="middle" className="text-[11px] fill-ccb-500 font-semibold">次卧</text>
                  <text x="55" y="162" textAnchor="middle" className="text-[10px] fill-space-500 font-medium">{listing.aiAnalysis.areaBreakdown[1]?.area || 0}㎡</text>
                  <rect x="110" y="110" width="100" height="80" rx="4" fill="#FDF8ED" stroke="#C9A96E" strokeWidth="1.5" />
                  <text x="160" y="145" textAnchor="middle" className="text-[11px] fill-gold-700 font-semibold">阳台</text>
                  <text x="160" y="162" textAnchor="middle" className="text-[10px] fill-space-500 font-medium">{listing.aiAnalysis.areaBreakdown[5]?.area}㎡</text>
                  <rect x="220" y="110" width="70" height="80" rx="4" fill="#F0F1F5" stroke="#63688F" strokeWidth="1.5" />
                  <text x="255" y="150" textAnchor="middle" className="text-[10px] fill-space-600 font-medium">餐厅</text>
                  {listing.aiAnalysis.lightingMap.flat().map((v, i) => {
                    const col = i % 4
                    const row = Math.floor(i / 4)
                    const x = 10 + col * 72
                    const y = 10 + row * 65
                    const opacity = v / 10 * 0.35
                    return <rect key={i} x={x} y={y} width="72" height="65" fill={v >= 8 ? '#FFD700' : v >= 6 ? '#FFC107' : '#7CB342'} opacity={opacity} rx="2" />
                  })}
                </svg>
                <div className="absolute bottom-4 right-4 text-[10px] space-y-0.5 bg-white/80 rounded px-2 py-1">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{background: 'rgba(255,215,0,0.35)'}}></span>强光</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{background: 'rgba(255,193,7,0.35)'}}></span>正常</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded" style={{background: 'rgba(124,179,66,0.35)'}}></span>偏弱</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gold-50 flex items-center justify-center">
                    <Sun className="w-6 h-6 text-gold-500" />
                  </div>
                  <div>
                    <div className="text-xs text-space-400">采光评分</div>
                    <div className="text-2xl font-bold text-ccb-500">
                      {listing.aiAnalysis.lightingScore}<span className="text-sm text-space-400">/100</span>
                    </div>
                  </div>
                </div>
                <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-ccb-50 flex items-center justify-center">
                    <Compass className="w-6 h-6 text-ccb-500" />
                  </div>
                  <div>
                    <div className="text-xs text-space-400">朝向</div>
                    <div className="text-lg font-semibold text-space-800">{listing.aiAnalysis.orientation}</div>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-xl p-4 bg-gold-50/50 border border-gold-200/50">
                <h4 className="text-sm font-semibold text-space-800 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-gold-600" />AI采光分析建议
                </h4>
                <p className="text-xs text-space-600 leading-relaxed">
                  {lightingAdvice(listing.aiAnalysis.lightingScore, listing.aiAnalysis.orientation)}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-space-700 mb-2">面积明细（合计 {listing.aiAnalysis.areaBreakdown.reduce((s, a) => s + a.area, 0)}㎡）</h4>
                <div className="space-y-2">
                  {listing.aiAnalysis.areaBreakdown.map((a, i) => {
                    const total = listing.aiAnalysis.areaBreakdown.reduce((s, x) => s + x.area, 0)
                    const pct = (a.area / total * 100).toFixed(0)
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-space-500 font-medium">{a.room}</span>
                          <span className="text-space-700 font-semibold">{a.area}㎡ · {pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-space-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-ccb-400 to-ccb-600 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

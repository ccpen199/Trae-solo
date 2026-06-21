import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import type { CommuteMode, ListingType } from '@/types'
import { Search as SearchIcon, Train, Bus, Car, Filter, Sparkles, Sun, Compass, X } from 'lucide-react'

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

  const getCommuteLabel = (l: typeof results[0]) => {
    const mode = searchParams.commuteMode
    if (mode === 'metro' && l.commuteInfo.metro[0])
      return `地铁${l.commuteInfo.metro[0].minutes}分钟`
    if (mode === 'bus' && l.commuteInfo.bus[0])
      return `公交${l.commuteInfo.bus[0].minutes}分钟`
    if (mode === 'drive' && l.commuteInfo.drive[0])
      return `驾车${l.commuteInfo.drive[0].minutes}分钟`
    return ''
  }

  const openAi = (id: string) => { setAiListing(id); setAiPanel(true) }

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
          <span className="text-xs text-space-600">¥{searchParams.budgetMin}</span>
          <span className="text-space-300">—</span>
          <input type="range" min={2000} max={15000} step={500}
            value={searchParams.budgetMax}
            onChange={e => setSearchParams({ budgetMax: +e.target.value })}
            className="w-24 accent-gold-500" />
          <span className="text-xs text-space-600">¥{searchParams.budgetMax}</span>
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
              <SearchIcon className="w-4 h-4 text-space-400" />
              <input placeholder="输入目的地..."
                value={searchParams.commuteDestination}
                onChange={e => setSearchParams({ commuteDestination: e.target.value })}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-space-300" />
            </div>
          </div>
          <div className="flex-1 relative bg-gradient-to-br from-space-50 to-ccb-50">
            <svg viewBox="0 0 720 400" className="w-full h-full">
              <defs>
                <radialGradient id="isochrone" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#003DA5" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#003DA5" stopOpacity="0" />
                </radialGradient>
              </defs>
              {[120, 90, 60].map((r, i) => (
                <circle key={i} cx="360" cy="200" r={r} fill="url(#isochrone)"
                  stroke="#003DA5" strokeWidth={1} strokeOpacity={0.2 - i * 0.05} />
              ))}
              {[30, 20, 10].map((m, i) => (
                <text key={i} x={360 + 60 - i * 30 + 6} y={200 - 2}
                  className="text-[10px] fill-space-400">{m}分钟</text>
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
                return (
                  <g key={i} className="cursor-pointer" onClick={() => navigate(`/listing/${l.id}`)}>
                    <circle cx={m.x} cy={m.y} r={7} fill={typeColor(l.type)}
                      stroke="white" strokeWidth={2} className="drop-shadow" />
                    <circle cx={m.x} cy={m.y} r={3} fill="white" />
                  </g>
                )
              })}
            </svg>
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
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-space-800 truncate">{l.title}</h3>
                  <span className={typeBadge(l.type)}>{l.type === 'ccb_direct' ? '自营' : l.type === 'partner' ? '合作' : '个人'}</span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg font-bold text-ccb-500">¥{l.price}</span>
                  <span className="text-xs text-space-400">/月</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-space-500">
                  <span>{l.area}㎡</span>
                  <span>{l.rooms}室{l.halls}厅</span>
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
          <div className="relative w-[480px] bg-white shadow-2xl overflow-y-auto animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-space-100">
              <h3 className="font-serif text-lg font-semibold text-space-800">AI户型解析</h3>
              <button onClick={() => setAiPanel(false)} className="p-1 rounded-lg hover:bg-space-100">
                <X className="w-5 h-5 text-space-500" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative rounded-xl overflow-hidden bg-space-50 border border-space-100">
                <svg viewBox="0 0 300 200" className="w-full">
                  <rect x="10" y="10" width="120" height="90" rx="4" fill="#E8F0FE" stroke="#003DA5" strokeWidth="1.5" />
                  <text x="70" y="55" textAnchor="middle" className="text-[11px] fill-ccb-500 font-medium">主卧</text>
                  <text x="70" y="72" textAnchor="middle" className="text-[9px] fill-space-400">{listing.aiAnalysis.areaBreakdown[0]?.area}㎡</text>
                  <rect x="140" y="10" width="80" height="90" rx="4" fill="#F9EDCC" stroke="#C9A96E" strokeWidth="1.5" />
                  <text x="180" y="55" textAnchor="middle" className="text-[11px] fill-gold-700 font-medium">客厅</text>
                  <text x="180" y="72" textAnchor="middle" className="text-[9px] fill-space-400">{listing.aiAnalysis.areaBreakdown[2]?.area || 0}㎡</text>
                  <rect x="230" y="10" width="60" height="50" rx="4" fill="#F0F1F5" stroke="#63688F" strokeWidth="1.5" />
                  <text x="260" y="38" textAnchor="middle" className="text-[10px] fill-space-600">厨房</text>
                  <rect x="230" y="70" width="60" height="30" rx="4" fill="#F0F1F5" stroke="#63688F" strokeWidth="1.5" />
                  <text x="260" y="89" textAnchor="middle" className="text-[10px] fill-space-600">卫生间</text>
                  <rect x="10" y="110" width="90" height="80" rx="4" fill="#E8F0FE" stroke="#003DA5" strokeWidth="1.5" />
                  <text x="55" y="150" textAnchor="middle" className="text-[11px] fill-ccb-500 font-medium">次卧</text>
                  <text x="55" y="167" textAnchor="middle" className="text-[9px] fill-space-400">{listing.aiAnalysis.areaBreakdown[1]?.area || 0}㎡</text>
                  <rect x="110" y="110" width="100" height="80" rx="4" fill="#FDF8ED" stroke="#C9A96E" strokeWidth="1.5" />
                  <text x="160" y="150" textAnchor="middle" className="text-[11px] fill-gold-700 font-medium">阳台</text>
                  <rect x="220" y="110" width="70" height="80" rx="4" fill="#F0F1F5" stroke="#63688F" strokeWidth="1.5" />
                  <text x="255" y="155" textAnchor="middle" className="text-[10px] fill-space-600">餐厅</text>
                  {listing.aiAnalysis.lightingMap.flat().map((v, i) => {
                    const col = i % 4
                    const row = Math.floor(i / 4)
                    const x = 10 + col * 72
                    const y = 10 + row * 70
                    const opacity = v / 10 * 0.25
                    return <rect key={i} x={x} y={y} width="72" height="70" fill="#FFD700" opacity={opacity} rx="2" />
                  })}
                </svg>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center">
                    <Sun className="w-5 h-5 text-gold-500" />
                  </div>
                  <div>
                    <div className="text-xs text-space-400">采光评分</div>
                    <div className="text-xl font-bold text-ccb-500">
                      {listing.aiAnalysis.lightingScore}<span className="text-sm text-space-400">/100</span>
                    </div>
                  </div>
                </div>
                <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-ccb-50 flex items-center justify-center">
                    <Compass className="w-5 h-5 text-ccb-500" />
                  </div>
                  <div>
                    <div className="text-xs text-space-400">朝向</div>
                    <div className="text-base font-semibold text-space-800">{listing.aiAnalysis.orientation}</div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-space-700 mb-2">面积明细</h4>
                <div className="space-y-1.5">
                  {listing.aiAnalysis.areaBreakdown.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-space-500">{a.room}</span>
                      <span className="font-medium text-space-700">{a.area}㎡</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

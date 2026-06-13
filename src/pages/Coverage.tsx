import { useState, useCallback, useMemo } from 'react'
import { MapPin, Navigation, Phone, Clock, Search, Loader2, CheckCircle2, XCircle, AlertTriangle, Package, Truck } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { Link } from 'react-router-dom'

type NetPt = { id: string; name: string; address: string; phone: string; businessHours: string; location: { lat: number; lng: number }; serviceRadius: number; status: 'active' | 'inactive'; distance?: number }

const MOCK_COORD = { lat: 31.23, lng: 121.50 }
const MOCK_POINTS: NetPt[] = [
  { id: 'n1', name: '浦东陆家嘴营业部', address: '上海市浦东新区世纪大道1号', phone: '021-50801001', businessHours: '08:00-20:00', location: { lat: 31.235, lng: 121.499 }, serviceRadius: 3, status: 'active' },
  { id: 'n2', name: '黄浦人民广场营业部', address: '上海市黄浦区人民大道200号', phone: '021-58342002', businessHours: '08:00-19:00', location: { lat: 31.230, lng: 121.473 }, serviceRadius: 2.5, status: 'active' },
  { id: 'n3', name: '徐汇漕河泾营业部', address: '上海市徐汇区田林路388号', phone: '021-54903003', businessHours: '09:00-18:00', location: { lat: 31.170, lng: 121.420 }, serviceRadius: 2, status: 'inactive' },
]
const MB = { minLat: 31.10, maxLat: 31.35, minLng: 121.30, maxLng: 121.70 }
const project = (lng: number, lat: number) => ({ x: ((lng - MB.minLng) / (MB.maxLng - MB.minLng)) * 300, y: (1 - (lat - MB.minLat) / (MB.maxLat - MB.minLat)) * 200 })
const r2s = (r: number) => (r / 111 / (MB.maxLng - MB.minLng)) * 300

export default function Coverage() {
  const { networkPoints, fetchCoverage, loading } = useAppStore()
  const [address, setAddress] = useState('')
  const [searched, setSearched] = useState('')
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null)
  const [located, setLocated] = useState(false)
  const raw: NetPt[] = networkPoints.length > 0 ? networkPoints : MOCK_POINTS

  const calcDist = (lat: number, lng: number) => {
    if (!pos) return 0
    const R = 6371, dLat = ((lat - pos.lat) * Math.PI) / 180, dLng = ((lng - pos.lng) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((pos.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const pts = useMemo(() => raw.map(p => ({ ...p, distance: p.distance ?? calcDist(p.location.lat, p.location.lng) })), [raw, pos])
  const analysis = useMemo(() => {
    if (!located) return null
    const active = pts.filter(p => p.status === 'active')
    const cov = active.filter(p => p.distance <= p.serviceRadius).sort((a, b) => a.distance - b.distance)
    const unc = active.filter(p => p.distance > p.serviceRadius).sort((a, b) => a.distance - b.distance)
    const ina = pts.filter(p => p.status !== 'active')
    const all = [...pts].sort((a, b) => a.distance - b.distance)
    return { isCovered: cov.length > 0, coveredBy: cov[0] || null, cov, unc, ina, nearest: all[0] || null }
  }, [pts, located])

  const handleGps = useCallback(() => {
    setSearched('')
    const ok = (lat: number, lng: number) => { setPos({ lat, lng }); setLocated(true); fetchCoverage(lat, lng) }
    if (!navigator.geolocation) return ok(MOCK_COORD.lat, MOCK_COORD.lng)
    navigator.geolocation.getCurrentPosition(p => ok(p.coords.latitude, p.coords.longitude), () => ok(MOCK_COORD.lat, MOCK_COORD.lng))
  }, [fetchCoverage])

  const handleSearch = useCallback(() => {
    if (!address.trim()) return
    setSearched(address.trim()); setLocated(true); setPos(MOCK_COORD)
    fetchCoverage(MOCK_COORD.lat, MOCK_COORD.lng)
  }, [address, fetchCoverage])

  const a = analysis
  return (
    <div className="space-y-5 pb-4">
      <div className="gradient-navy rounded-2xl p-5 text-white relative overflow-hidden animate-slide-up">
        <svg className="absolute top-0 right-0 w-32 h-32 opacity-10" viewBox="0 0 100 100"><circle cx="80" cy="20" r="40" fill="white" /><circle cx="20" cy="80" r="30" fill="white" /></svg>
        <div className="relative z-10"><h1 className="text-xl font-bold mb-1">派件范围查询</h1><p className="text-white/70 text-sm">智能识别附近服务网点</p></div>
      </div>
      <div className="card p-4 space-y-3 animate-slide-up stagger-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-lighter" />
            <input className="input-field pl-10" placeholder="输入地址查询服务范围" value={address} onChange={e => setAddress(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </div>
          <button onClick={handleSearch} className="btn-primary px-4 flex items-center gap-1"><Search className="w-4 h-4" /></button>
        </div>
        <button onClick={handleGps} className="btn-navy w-full flex items-center justify-center gap-2"><Navigation className="w-4 h-4" />GPS自动定位</button>
      </div>
      {located && a && (
        <>
          <div className={`animate-fade-in rounded-2xl p-5 text-white relative overflow-hidden shadow-lg ${a.isCovered ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600' : 'bg-gradient-to-br from-red-500 via-rose-500 to-pink-600'}`}>
            <svg className="absolute top-0 right-0 w-36 h-36 opacity-10" viewBox="0 0 100 100"><circle cx="80" cy="20" r="50" fill="white" /><circle cx="30" cy="90" r="35" fill="white" /></svg>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">{a.isCovered ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}<h2 className="text-xl font-bold">{a.isCovered ? '当前位置可派送' : '当前位置暂不可派送'}</h2></div>
              <p className="text-sm text-white/90 mb-3">{a.isCovered && a.coveredBy ? `您的位置落入【${a.coveredBy.name}】服务范围（距${a.coveredBy.distance.toFixed(1)}km，服务半径${a.coveredBy.serviceRadius}km）` : '您的位置不在任何网点服务范围内'}</p>
              {!a.isCovered && a.unc.slice(0, 2).length > 0 && <div className="space-y-1 mb-3">{a.unc.slice(0, 2).map(p => <p key={p.id} className="text-xs text-white/85 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{p.name}：距离{p.distance.toFixed(1)}km，但服务半径仅{p.serviceRadius}km → 超区{(p.distance - p.serviceRadius).toFixed(1)}km超出</p>)}</div>}
              <div className="flex gap-2 flex-wrap">
                {a.isCovered ? <Link to="/order" className="bg-white text-green-600 font-semibold px-5 py-2 rounded-lg text-sm shadow-md hover:shadow-lg active:scale-95 transition-all inline-flex items-center gap-1.5"><Truck className="w-4 h-4" />立即下单</Link> : (
                  <><button className="bg-white text-red-600 font-semibold px-5 py-2 rounded-lg text-sm shadow-md hover:shadow-lg active:scale-95 transition-all inline-flex items-center gap-1.5"><Phone className="w-4 h-4" />联系客服确认</button><button className="bg-white/20 backdrop-blur text-white font-semibold px-5 py-2 rounded-lg text-sm border border-white/30 hover:bg-white/30 active:scale-95 transition-all inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />查看更大范围网点</button></>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 animate-slide-up stagger-3">
            <div className="card p-3 text-center"><Package className="w-5 h-5 text-green-500 mx-auto mb-1" /><div className="text-lg font-bold text-navy">{a.cov.length}</div><div className="text-[10px] text-text-light leading-tight">覆盖网点</div></div>
            <div className="card p-3 text-center"><XCircle className="w-5 h-5 text-red-500 mx-auto mb-1" /><div className="text-lg font-bold text-navy">{a.unc.length}</div><div className="text-[10px] text-text-light leading-tight">超区网点</div></div>
            <div className="card p-3 text-center"><AlertTriangle className="w-5 h-5 text-gray-500 mx-auto mb-1" /><div className="text-lg font-bold text-navy">{a.ina.length}</div><div className="text-[10px] text-text-light leading-tight">暂停服务</div></div>
            <div className="card p-3 text-center"><Navigation className="w-5 h-5 text-accent mx-auto mb-1" /><div className="text-lg font-bold text-navy">{a.nearest?.distance.toFixed(1)}</div><div className="text-[10px] text-text-light leading-tight">最近距离km</div></div>
          </div>
          <div className="card overflow-hidden animate-slide-up stagger-4">
            <div className="p-3 bg-navy/5 border-b border-gray-100"><p className="text-xs font-medium text-navy flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-accent" />{searched ? `查询地址: ${searched}` : pos ? `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}` : '定位中...'}</p></div>
            <div className="bg-surface/50 p-3">
              <svg className="w-full" viewBox="0 0 300 220" style={{ maxHeight: 240 }}>
                <defs><radialGradient id="locGlow"><stop offset="0%" stopColor="#FF6B35" stopOpacity="0.3" /><stop offset="100%" stopColor="#FF6B35" stopOpacity="0" /></radialGradient></defs>
                <rect width="300" height="200" fill="#E8ECF1" rx="4" />
                {[...Array(6)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * 40} x2="300" y2={i * 40} stroke="#D2D8E0" strokeWidth="0.5" />)}
                {[...Array(8)].map((_, i) => <line key={`v${i}`} x1={i * 43} y1="0" x2={i * 43} y2="200" stroke="#D2D8E0" strokeWidth="0.5" />)}
                {(() => { const tp = a.coveredBy || a.unc[0]; if (!tp || !pos) return null; const f = project(pos.lng, pos.lat), t = project(tp.location.lng, tp.location.lat); const ic = tp.distance <= tp.serviceRadius && tp.status === 'active'; return <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke={ic ? '#38A169' : '#E53E3E'} strokeWidth="2" strokeDasharray={ic ? '0' : '5 4'} opacity="0.7" /> })()}
                {pts.map(pt => { const { x, y } = project(pt.location.lng, pt.location.lat); const r = r2s(pt.serviceRadius); const ic = pt.status === 'active' && pt.distance <= pt.serviceRadius, ii = pt.status !== 'active'; const c = ii ? '#A0AEC0' : ic ? '#38A169' : '#E53E3E'; return <g key={pt.id}><circle cx={x} cy={y} r={r} fill={c} opacity={0.1} /><circle cx={x} cy={y} r={r} fill="none" stroke={c} strokeWidth="1" strokeDasharray="4 3" opacity={0.4} /><circle cx={x} cy={y} r="6" fill={c} /><circle cx={x} cy={y} r="3" fill="white" /></g> })}
                {pos && (() => { const { x, y } = project(pos.lng, pos.lat); return <g><circle cx={x} cy={y} r="20" fill="url(#locGlow)" /><circle cx={x} cy={y} r="5" fill="#FF6B35" stroke="white" strokeWidth="2" className="animate-pulse-slow" /></g> })()}
                <g transform="translate(8, 204)"><rect x="0" y="0" width="284" height="14" rx="3" fill="white" stroke="#E2E8F0" strokeWidth="0.5" /><circle cx="12" cy="7" r="3" fill="#38A169" /><text x="20" y="9.5" fontSize="9" fill="#2D3748">覆盖</text><circle cx="62" cy="7" r="3" fill="#E53E3E" /><text x="70" y="9.5" fontSize="9" fill="#2D3748">超区</text><circle cx="110" cy="7" r="3" fill="#A0AEC0" /><text x="118" y="9.5" fontSize="9" fill="#2D3748">暂停</text><circle cx="170" cy="7" r="3" fill="#FF6B35" /><text x="178" y="9.5" fontSize="9" fill="#2D3748">当前位置</text></g>
              </svg>
            </div>
          </div>
        </>
      )}
      {loading && <div className="text-center py-8 text-text-light flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />正在查询网点...</div>}
      {located && !loading && pts.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <h2 className="section-title text-sm">附近网点<span className="text-xs font-normal text-text-light ml-1">({pts.length}个)</span></h2>
          {pts.map((pt, i) => {
            const ic = pt.status === 'active' && pt.distance <= pt.serviceRadius, ii = pt.status !== 'active', od = pt.distance - pt.serviceRadius
            return (
              <div key={pt.id} className={`card p-4 animate-slide-up stagger-${Math.min(i + 1, 5)}`}>
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1"><div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ii ? 'bg-gray-400' : ic ? 'bg-success animate-pulse-slow' : 'bg-warning'}`} /><h3 className="text-sm font-bold text-navy truncate">{pt.name}</h3></div>
                  {ii ? <span className="badge-danger flex-shrink-0">🔴 暂停服务</span> : ic ? <span className="badge-success flex-shrink-0"><CheckCircle2 className="w-3 h-3 mr-1" />在服务范围内</span> : <span className="badge-warning flex-shrink-0"><AlertTriangle className="w-3 h-3 mr-1" />超区 {od.toFixed(1)}km</span>}
                </div>
                <div className="space-y-1.5 ml-4">
                  <p className="text-xs text-text-light flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 flex-shrink-0" />{pt.address}</p>
                  <p className="text-xs text-text-light flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{pt.phone}</p>
                  <p className="text-xs text-text-light flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 flex-shrink-0" />{pt.businessHours}</p>
                </div>
                <div className="mt-3 ml-4 flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-accent font-medium">服务半径 {pt.serviceRadius}km</span>
                  <span className="text-xs text-navy font-medium">距您 {pt.distance.toFixed(1)}km</span>
                  {ic && <Link to="/order" className="ml-auto text-xs bg-accent text-white px-3 py-1 rounded-md font-medium hover:bg-accent-dark active:scale-95 transition-all inline-flex items-center gap-1"><Truck className="w-3 h-3" />选择此网点下单</Link>}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {!located && !loading && <div className="text-center py-16 text-text-lighter"><MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">点击GPS定位或输入地址查询服务范围</p></div>}
    </div>
  )
}

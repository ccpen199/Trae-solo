import { useState, useCallback } from 'react'
import { MapPin, Navigation, Phone, Clock, Search, Loader2 } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

const MOCK_COORD = { lat: 31.23, lng: 121.50 }

const MOCK_POINTS = [
  { id: 'n1', name: '浦东张江营业部', address: '上海市浦东新区张江路288号', phone: '021-5080XXXX', businessHours: '08:00-20:00', location: { lat: 31.20, lng: 121.59 }, serviceRadius: 3, status: 'active' as const },
  { id: 'n2', name: '浦东金桥营业部', address: '上海市浦东新区金桥路568号', phone: '021-5834XXXX', businessHours: '08:00-19:00', location: { lat: 31.25, lng: 121.55 }, serviceRadius: 2.5, status: 'active' as const },
  { id: 'n3', name: '徐汇漕河泾营业部', address: '上海市徐汇区田林路388号', phone: '021-5490XXXX', businessHours: '09:00-18:00', location: { lat: 31.17, lng: 121.42 }, serviceRadius: 2, status: 'inactive' as const },
]

const MAP_BOUNDS = { minLat: 31.10, maxLat: 31.35, minLng: 121.30, maxLng: 121.70 }

function project(lng: number, lat: number) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 300
  const y = (1 - (lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 200
  return { x, y }
}

function radiusToSvg(radius: number) {
  const lngSpan = MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng
  return (radius / 111 / lngSpan) * 300
}

export default function Coverage() {
  const { networkPoints, fetchCoverage, loading } = useAppStore()
  const [address, setAddress] = useState('')
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null)
  const [located, setLocated] = useState(false)

  const points = networkPoints.length > 0 ? networkPoints : MOCK_POINTS

  const handleGps = useCallback(() => {
    if (!navigator.geolocation) {
      setCurrentPos(MOCK_COORD)
      setLocated(true)
      fetchCoverage(MOCK_COORD.lat, MOCK_COORD.lng)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setCurrentPos({ lat: latitude, lng: longitude })
        setLocated(true)
        fetchCoverage(latitude, longitude)
      },
      () => {
        setCurrentPos(MOCK_COORD)
        setLocated(true)
        fetchCoverage(MOCK_COORD.lat, MOCK_COORD.lng)
      }
    )
  }, [fetchCoverage])

  const handleSearch = useCallback(() => {
    if (!address.trim()) return
    setLocated(true)
    setCurrentPos(MOCK_COORD)
    fetchCoverage(MOCK_COORD.lat, MOCK_COORD.lng)
  }, [address, fetchCoverage])

  const calcDistance = (lat: number, lng: number) => {
    if (!currentPos) return null
    const R = 6371
    const dLat = ((lat - currentPos.lat) * Math.PI) / 180
    const dLng = ((lng - currentPos.lng) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((currentPos.lat * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  return (
    <div className="space-y-5 pb-4">
      <div className="gradient-navy rounded-2xl p-5 text-white relative overflow-hidden animate-slide-up">
        <svg className="absolute top-0 right-0 w-32 h-32 opacity-10" viewBox="0 0 100 100">
          <circle cx="80" cy="20" r="40" fill="white" />
          <circle cx="20" cy="80" r="30" fill="white" />
        </svg>
        <div className="relative z-10">
          <h1 className="text-xl font-bold mb-1">派件范围查询</h1>
          <p className="text-white/70 text-sm">智能识别附近服务网点</p>
        </div>
      </div>

      <div className="card p-4 space-y-3 animate-slide-up stagger-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-lighter" />
            <input
              className="input-field pl-10"
              placeholder="输入地址查询服务范围"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="btn-primary px-4 flex items-center gap-1">
            <Search className="w-4 h-4" />
          </button>
        </div>
        <button onClick={handleGps} className="btn-navy w-full flex items-center justify-center gap-2">
          <Navigation className="w-4 h-4" />
          GPS自动定位
        </button>
      </div>

      {located && (
        <div className="card overflow-hidden animate-fade-in">
          <div className="p-3 bg-navy/5 border-b border-gray-100">
            <p className="text-xs font-medium text-navy flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              {currentPos ? `${currentPos.lat.toFixed(4)}, ${currentPos.lng.toFixed(4)}` : '定位中...'}
            </p>
          </div>
          <div className="bg-surface/50 p-3">
            <svg className="w-full" viewBox="0 0 300 200" style={{ maxHeight: 220 }}>
              <defs>
                <radialGradient id="locGlow">
                  <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="300" height="200" fill="#E8ECF1" rx="4" />
              {[...Array(6)].map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 40} x2="300" y2={i * 40} stroke="#D2D8E0" strokeWidth="0.5" />
              ))}
              {[...Array(8)].map((_, i) => (
                <line key={`v${i}`} x1={i * 43} y1="0" x2={i * 43} y2="200" stroke="#D2D8E0" strokeWidth="0.5" />
              ))}
              {points.map((pt) => {
                const { x, y } = project(pt.location.lng, pt.location.lat)
                const r = radiusToSvg(pt.serviceRadius)
                return (
                  <g key={pt.id}>
                    <circle cx={x} cy={y} r={r} fill={pt.status === 'active' ? '#0F2B46' : '#A0AEC0'} opacity={0.08} />
                    <circle cx={x} cy={y} r={r} fill="none" stroke={pt.status === 'active' ? '#0F2B46' : '#A0AEC0'} strokeWidth="1" strokeDasharray="4 3" opacity={0.3} />
                    <circle cx={x} cy={y} r="6" fill={pt.status === 'active' ? '#0F2B46' : '#A0AEC0'} />
                    <circle cx={x} cy={y} r="3" fill="white" />
                  </g>
                )
              })}
              {currentPos && (() => {
                const { x, y } = project(currentPos.lng, currentPos.lat)
                return (
                  <g>
                    <circle cx={x} cy={y} r="20" fill="url(#locGlow)" />
                    <circle cx={x} cy={y} r="5" fill="#FF6B35" stroke="white" strokeWidth="2" className="animate-pulse-slow" />
                  </g>
                )
              })()}
            </svg>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-text-light flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          正在查询网点...
        </div>
      )}

      {located && !loading && points.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <h2 className="section-title text-sm">
            附近网点
            <span className="text-xs font-normal text-text-light ml-1">({points.length}个)</span>
          </h2>
          {points.map((pt, i) => {
            const dist = calcDistance(pt.location.lat, pt.location.lng)
            return (
              <div key={pt.id} className={`card p-4 animate-slide-up stagger-${Math.min(i + 1, 5)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${pt.status === 'active' ? 'bg-success animate-pulse-slow' : 'bg-gray-400'}`} />
                    <h3 className="text-sm font-bold text-navy">{pt.name}</h3>
                  </div>
                  <span className={pt.status === 'active' ? 'badge-success' : 'badge-danger'}>
                    {pt.status === 'active' ? '营业中' : '暂停服务'}
                  </span>
                </div>
                <div className="space-y-1.5 ml-4">
                  <p className="text-xs text-text-light flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    {pt.address}
                  </p>
                  <p className="text-xs text-text-light flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    {pt.phone}
                  </p>
                  <p className="text-xs text-text-light flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    {pt.businessHours}
                  </p>
                </div>
                <div className="mt-2 ml-4 flex items-center gap-3">
                  <span className="text-xs text-accent font-medium">服务半径 {pt.serviceRadius}km</span>
                  {dist !== null && (
                    <span className="text-xs text-navy font-medium">距您 {dist.toFixed(1)}km</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!located && !loading && (
        <div className="text-center py-16 text-text-lighter">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">点击GPS定位或输入地址查询服务范围</p>
        </div>
      )}
    </div>
  )
}

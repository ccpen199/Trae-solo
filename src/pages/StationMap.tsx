import { useState, useEffect } from 'react'
import { MapContainer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { X, Star, Zap, Filter, ChevronDown, Navigation, Calendar, Battery, TrendingDown } from 'lucide-react'
import { useAppStore } from '@/store'

interface PileStatus {
  id: string
  status: 'available' | 'charging' | 'fault' | 'offline'
}

interface Station {
  id: string
  name: string
  address: string
  operator: string
  lat: number
  lng: number
  rating: number
  piles: PileStatus[]
  price: number
  fastCount: number
  slowCount: number
}

const mockStations: Station[] = [
  { id: 's1', name: '国网北京朝阳站', address: '北京市朝阳区建国路88号', operator: '国家电网', lat: 39.92, lng: 116.46, rating: 4.5, piles: [{ id: 'p1', status: 'available' }, { id: 'p2', status: 'charging' }, { id: 'p3', status: 'available' }, { id: 'p4', status: 'fault' }, { id: 'p5', status: 'offline' }], price: 1.2, fastCount: 3, slowCount: 2 },
  { id: 's2', name: '特来电上海浦东站', address: '上海市浦东新区张杨路500号', operator: '特来电', lat: 31.23, lng: 121.54, rating: 4.2, piles: [{ id: 'p6', status: 'charging' }, { id: 'p7', status: 'available' }, { id: 'p8', status: 'charging' }], price: 1.5, fastCount: 2, slowCount: 1 },
  { id: 's3', name: '星星充电广州天河站', address: '广州市天河区体育西路100号', operator: '星星充电', lat: 23.13, lng: 113.33, rating: 3.8, piles: [{ id: 'p9', status: 'available' }, { id: 'p10', status: 'fault' }, { id: 'p11', status: 'available' }, { id: 'p12', status: 'available' }], price: 1.0, fastCount: 2, slowCount: 2 },
  { id: 's4', name: '国网成都高新站', address: '成都市高新区天府大道200号', operator: '国家电网', lat: 30.58, lng: 104.07, rating: 4.0, piles: [{ id: 'p13', status: 'charging' }, { id: 'p14', status: 'available' }], price: 0.9, fastCount: 1, slowCount: 1 },
  { id: 's5', name: '特来电杭州西湖站', address: '杭州市西湖区龙井路50号', operator: '特来电', lat: 30.26, lng: 120.15, rating: 4.7, piles: [{ id: 'p15', status: 'available' }, { id: 'p16', status: 'available' }, { id: 'p17', status: 'charging' }, { id: 'p18', status: 'available' }, { id: 'p19', status: 'offline' }, { id: 'p20', status: 'available' }], price: 1.3, fastCount: 4, slowCount: 2 },
  { id: 's6', name: '星星充电深圳南山站', address: '深圳市南山区科技园路10号', operator: '星星充电', lat: 22.54, lng: 113.95, rating: 4.3, piles: [{ id: 'p21', status: 'fault' }, { id: 'p22', status: 'available' }], price: 1.4, fastCount: 1, slowCount: 1 },
]

const avgPrice = mockStations.reduce((s, st) => s + st.price, 0) / mockStations.length

const vehicles = [
  { plate: '京A12345', model: '比亚迪汉EV', capacity: 60 },
  { plate: '沪B67890', model: '特斯拉Model 3', capacity: 60 },
]

const statusColors: Record<string, string> = { available: '#00E599', charging: '#4FC3F7', fault: '#FF8C00', offline: '#6B7280' }
const statusLabels: Record<string, string> = { available: '空闲', charging: '充电中', fault: '故障', offline: '离线' }

function createIcon(status: string) {
  const color = statusColors[status] || '#6B7280'
  return L.divIcon({ className: 'custom-marker', html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 8px ${color}80;"></div>`, iconSize: [14, 14], iconAnchor: [7, 7] })
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? 'text-amber-orange fill-amber-orange' : 'text-gray-600'}`} />
      ))}
      <span className="text-xs text-gray-400 ml-1">{rating}</span>
    </div>
  )
}

export default function StationMap() {
  const { selectedStationId, setSelectedStationId } = useAppStore()
  const navigate = useNavigate()
  const [stations, setStations] = useState<Station[]>(mockStations)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filters, setFilters] = useState({ operator: '', type: '', powerRange: '', priceRange: '' })
  const [showReservation, setShowReservation] = useState(false)
  const [reservationForm, setReservationForm] = useState({ pile: '', timeSlot: 'now', vehicle: 0 })
  const [currentSOC, setCurrentSOC] = useState(40)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetch('/api/stations').then(r => r.json()).then(data => { if (Array.isArray(data)) setStations(data) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedStationId) {
      const s = stations.find(s => s.id === selectedStationId)
      if (s) { setSelectedStation(s); setDrawerOpen(true) }
    }
  }, [selectedStationId, stations])

  const handleStationClick = (station: Station) => {
    setSelectedStation(station)
    setDrawerOpen(true)
    setSelectedStationId(station.id)
    setCurrentSOC(40)
    setShowReservation(false)
  }

  const availableCount = (piles: PileStatus[]) => piles.filter(p => p.status === 'available').length
  const availablePiles = selectedStation ? selectedStation.piles.filter(p => p.status === 'available') : []
  const vehicle = vehicles[reservationForm.vehicle]
  const rangeKm = currentSOC / 100 * vehicle.capacity * 6
  const neededKwh = 2.2
  const canReach = rangeKm >= 15
  const savingsPct = ((avgPrice - (selectedStation?.price ?? 0)) / avgPrice * 100)

  const handleNavigate = () => {
    if (!selectedStation) return
    navigate(`/route-plan?station=${encodeURIComponent(selectedStation.name)}&lat=${selectedStation.lat}&lng=${selectedStation.lng}&price=${selectedStation.price}`)
  }

  const handleReserve = () => {
    setToast('预约成功！请于30分钟内到达')
    setShowReservation(false)
    setDrawerOpen(false)
    setSelectedStationId(null)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-6 relative">
      <div className="w-72 glass-card m-3 mr-0 p-4 overflow-y-auto shrink-0 z-10">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-electric-green" />
          <h3 className="text-sm font-semibold text-gray-100">筛选条件</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">运营商</label>
            <div className="relative">
              <select className="input-field w-full appearance-none pr-8" value={filters.operator} onChange={e => setFilters(f => ({ ...f, operator: e.target.value }))}>
                <option value="">全部</option><option value="国家电网">国家电网</option><option value="特来电">特来电</option><option value="星星充电">星星充电</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">充电类型</label>
            <div className="flex gap-2">
              <button onClick={() => setFilters(f => ({ ...f, type: f.type === 'fast' ? '' : 'fast' }))} className={`flex-1 text-xs py-1.5 rounded-lg border ${filters.type === 'fast' ? 'border-electric-green text-electric-green bg-electric-green/10' : 'border-white/10 text-gray-400'}`}>快充</button>
              <button onClick={() => setFilters(f => ({ ...f, type: f.type === 'slow' ? '' : 'slow' }))} className={`flex-1 text-xs py-1.5 rounded-lg border ${filters.type === 'slow' ? 'border-ice-blue text-ice-blue bg-ice-blue/10' : 'border-white/10 text-gray-400'}`}>慢充</button>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">功率范围</label>
            <select className="input-field w-full" value={filters.powerRange} onChange={e => setFilters(f => ({ ...f, powerRange: e.target.value }))}>
              <option value="">不限</option><option value="0-60">0-60kW</option><option value="60-120">60-120kW</option><option value="120+">120kW+</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">价格范围</label>
            <select className="input-field w-full" value={filters.priceRange} onChange={e => setFilters(f => ({ ...f, priceRange: e.target.value }))}>
              <option value="">不限</option><option value="0-1">0-1元/度</option><option value="1-1.5">1-1.5元/度</option><option value="1.5+">1.5元/度+</option>
            </select>
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <h3 className="text-xs text-gray-400">附近站点 ({stations.length})</h3>
          {stations.map(s => (
            <button key={s.id} onClick={() => handleStationClick(s)} className={`w-full text-left p-2 rounded-lg border transition-colors ${selectedStation?.id === s.id ? 'border-electric-green/30 bg-electric-green/5' : 'border-white/5 hover:border-white/10'}`}>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-200 truncate">{s.name}</span>
                {s.price < avgPrice && <span className="shrink-0 text-[9px] px-1 py-px rounded bg-electric-green/20 text-electric-green font-medium">⚡低价</span>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-electric-green">{availableCount(s.piles)}可用</span>
                <span className="text-[10px] text-gray-500">{s.piles.length}桩</span>
                <span className="text-[10px] text-amber-orange ml-auto">¥{s.price}/度</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer center={[35.86, 104.19]} zoom={5} className="w-full h-full" zoomControl={true} attributionControl={false} style={{ backgroundColor: '#0A1628', backgroundImage: 'radial-gradient(circle at 55% 44%, rgba(0,229,153,0.14), transparent 22rem), linear-gradient(rgba(79,195,247,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(79,195,247,0.08) 1px, transparent 1px)', backgroundSize: 'auto, 52px 52px, 52px 52px' }}>
          {stations.map(station => {
            const primaryStatus = station.piles.some(p => p.status === 'available') ? 'available' : station.piles.some(p => p.status === 'charging') ? 'charging' : 'fault'
            return (
              <Marker key={station.id} position={[station.lat, station.lng]} icon={createIcon(primaryStatus)} eventHandlers={{ click: () => handleStationClick(station) }}>
                <Popup><div className="text-sm font-medium">{station.name}</div><div className="text-xs text-gray-400 mt-1">{station.address}</div></Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-electric-green/20 border border-electric-green/40 text-electric-green text-sm backdrop-blur-md">{toast}</div>
      )}

      <div className={`absolute right-0 top-0 h-full w-96 bg-surface border-l border-white/5 transform transition-transform duration-300 z-20 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedStation && (
          <div className="p-5 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">{selectedStation.name}</h2>
              <button onClick={() => { setDrawerOpen(false); setSelectedStationId(null) }} className="p-1 rounded hover:bg-white/5"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3 mb-6">
              <div className="text-sm text-gray-400">{selectedStation.address}</div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-electric-green/10 text-electric-green">{selectedStation.operator}</span>
                <RatingStars rating={selectedStation.rating} />
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>快充 {selectedStation.fastCount}</span><span>慢充 {selectedStation.slowCount}</span>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-200 mb-3">充电桩状态</h3>
              <div className="grid grid-cols-5 gap-2">
                {selectedStation.piles.map(pile => (
                  <div key={pile.id} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: statusColors[pile.status] + '20', border: `2px solid ${statusColors[pile.status]}` }}>
                      <Zap className="w-3 h-3" style={{ color: statusColors[pile.status] }} />
                    </div>
                    <span className="text-[10px] text-gray-400">{pile.id.slice(-2)}</span>
                    <span className="text-[10px]" style={{ color: statusColors[pile.status] }}>{statusLabels[pile.status]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">充电价格</span>
                <span className="data-text text-xl text-electric-green glow-text">¥{selectedStation.price}<span className="text-xs text-gray-400">/度</span></span>
              </div>
            </div>

            <div className="glass-card p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Battery className="w-4 h-4 text-electric-green" />
                <h3 className="text-sm font-medium text-gray-200">电量评估</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">当前电量</span>
                  <span className="text-xs text-electric-green">{currentSOC}%</span>
                </div>
                <input type="range" min={0} max={100} value={currentSOC} onChange={e => setCurrentSOC(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-[#00E599]" />
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>电池容量 {vehicle.capacity}kWh</span>
                  <span>可行驶 <span className="text-electric-green">{rangeKm.toFixed(0)}km</span></span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>到达本站所需电量 ~{neededKwh}kWh</span>
                  {canReach ? <span className="text-electric-green">✓ 电量充足</span> : <span className="text-orange-400">⚠ 电量不足</span>}
                </div>
                {!canReach && (
                  <button onClick={() => navigate('/route-plan')} className="text-xs text-electric-green hover:underline">电量不足，建议规划充电路线</button>
                )}
              </div>
            </div>

            <div className="glass-card p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-electric-green" />
                <h3 className="text-sm font-medium text-gray-200">电价对比</h3>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>本站 ¥{selectedStation.price}/度</span>
                <span>周边均价 ¥{avgPrice.toFixed(1)}/度</span>
              </div>
              {savingsPct > 0 && (
                <div className="mt-1 text-xs text-electric-green">比周边低{savingsPct.toFixed(1)}%</div>
              )}
            </div>

            <div className="space-y-2">
              <button onClick={handleNavigate} className="btn-primary w-full flex items-center justify-center gap-2">
                <Navigation className="w-4 h-4" />导航前往
              </button>
              <button onClick={() => setShowReservation(true)} className="btn-secondary w-full flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4" />预约充电
              </button>
            </div>

            {showReservation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowReservation(false)}>
                <div className="glass-card w-80 p-5" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-100">预约充电</h3>
                    <button onClick={() => setShowReservation(false)} className="p-1 rounded hover:bg-white/5"><X className="w-4 h-4 text-gray-400" /></button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">选择充电桩</label>
                      <select className="input-field w-full" value={reservationForm.pile} onChange={e => setReservationForm(f => ({ ...f, pile: e.target.value }))}>
                        <option value="">请选择</option>
                        {availablePiles.map(p => <option key={p.id} value={p.id}>{p.id} - 空闲</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">时间段</label>
                      <select className="input-field w-full" value={reservationForm.timeSlot} onChange={e => setReservationForm(f => ({ ...f, timeSlot: e.target.value }))}>
                        <option value="now">立即</option><option value="30min">30分钟后</option><option value="1h">1小时后</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">选择车辆</label>
                      <select className="input-field w-full" value={reservationForm.vehicle} onChange={e => setReservationForm(f => ({ ...f, vehicle: Number(e.target.value) }))}>
                        {vehicles.map((v, i) => <option key={i} value={i}>{v.plate} {v.model}</option>)}
                      </select>
                    </div>
                    <div className="glass-card p-3 text-xs text-gray-400">
                      预估费用：<span className="text-electric-green text-sm">¥{((100 - currentSOC) / 100 * vehicle.capacity * selectedStation.price).toFixed(1)}</span>
                      <span className="text-gray-500 ml-1">({(100 - currentSOC)}% × {vehicle.capacity}kWh × ¥{selectedStation.price})</span>
                    </div>
                    <button onClick={handleReserve} className="btn-primary w-full">确认预约</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

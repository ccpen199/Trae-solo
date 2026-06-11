import { useState, useMemo } from 'react'
import { MapContainer, Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Plus, Zap, MapPin, Battery, ChevronDown, Navigation, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface Stop {
  id: string
  name: string
  lat: number
  lng: number
  price: number
  waitTime: number
  distance: number
  availablePiles: number
}

const mockStops: Stop[] = [
  { id: 'start', name: '北京', lat: 39.90, lng: 116.40, price: 0, waitTime: 0, distance: 0, availablePiles: 0 },
  { id: 's1', name: '国网济南服务区站', lat: 36.65, lng: 117.00, price: 1.1, waitTime: 10, distance: 360, availablePiles: 8 },
  { id: 's2', name: '特来电徐州站', lat: 34.26, lng: 117.18, price: 1.3, waitTime: 5, distance: 680, availablePiles: 5 },
  { id: 's3', name: '星星充电南京江宁站', lat: 31.95, lng: 118.78, price: 1.2, waitTime: 15, distance: 1000, availablePiles: 3 },
  { id: 'end', name: '上海', lat: 31.23, lng: 121.47, price: 0, waitTime: 0, distance: 1200, availablePiles: 0 },
]

const routeCoords: [number, number][] = [
  [39.90, 116.40], [39.20, 116.80], [38.30, 116.90], [37.40, 117.00],
  [36.65, 117.00], [35.80, 117.00], [35.00, 117.10], [34.26, 117.18],
  [33.50, 117.50], [32.80, 118.00], [31.95, 118.78], [31.60, 120.00],
  [31.23, 121.47],
]

const efficiencyMap: Record<string, number> = { 'byd-han': 0.14, 'tesla-m3': 0.12, 'nio-et5': 0.15, 'xpeng-p7': 0.13 }

function stopIcon(isCharge: boolean) {
  return L.divIcon({
    className: 'custom-marker',
    html: isCharge
      ? `<div style="width:24px;height:24px;border-radius:50%;background:#0A1628;border:2px solid #00E599;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(0,229,153,0.5);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00E599" stroke-width="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>`
      : `<div style="width:18px;height:18px;border-radius:50%;background:#4FC3F7;border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 8px rgba(79,195,247,0.5);"></div>`,
    iconSize: isCharge ? [24, 24] : [18, 18],
    iconAnchor: isCharge ? [12, 12] : [9, 9],
  })
}

export default function RoutePlan() {
  const [destinations, setDestinations] = useState<string[]>(['上海'])
  const [soc, setSoc] = useState(60)
  const [batteryCapacity, setBatteryCapacity] = useState(75)
  const [vehicleModel, setVehicleModel] = useState('byd-han')
  const [sortBy, setSortBy] = useState<'price' | 'distance' | 'wait'>('price')
  const [planned, setPlanned] = useState(true)
  const [reservingStation, setReservingStation] = useState<string | null>(null)
  const [reservationModal, setReservationModal] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('立即')
  const [navToast, setNavToast] = useState<string | null>(null)
  const [validationError, setValidationError] = useState(false)

  const totalDist = 1200
  const efficiency = efficiencyMap[vehicleModel] ?? 0.14
  const estimatedConsumption = Math.round(totalDist * efficiency)
  const currentRange = Math.round(soc / 100 * batteryCapacity / efficiency)
  const chargeCount = Math.max(0, Math.ceil((totalDist - currentRange) / (batteryCapacity / efficiency * 0.8)))
  const rangePercent = Math.min(100, Math.round(currentRange / totalDist * 100))
  const totalCost = Math.round(chargeCount * batteryCapacity * 0.8 * 1.2 * 100) / 100
  const estimatedTime = Math.round(totalDist / 100 + chargeCount * 0.5)

  const hasEmptyDest = destinations.some(d => d.trim() === '')

  const sortedStops = useMemo(() => {
    const chargeStops = mockStops.filter(s => s.availablePiles > 0)
    const sortFns: Record<string, (a: Stop, b: Stop) => number> = {
      price: (a, b) => a.price - b.price,
      distance: (a, b) => a.distance - b.distance,
      wait: (a, b) => a.waitTime - b.waitTime,
    }
    return [...chargeStops].sort(sortFns[sortBy])
  }, [sortBy])

  const socChartData = useMemo(() => {
    const waypoints = ['出发', ...sortedStops.map(s => s.name.slice(0, 4)), '到达']
    const values: number[] = [soc]
    let remaining = soc
    sortedStops.forEach(() => {
      remaining = Math.max(remaining - 25, 20)
      values.push(Math.min(remaining + 60, 95))
      remaining = Math.min(remaining + 60, 95)
    })
    values.push(Math.max(remaining - 30, 10))
    return waypoints.map((name, i) => ({ name, soc: values[i] }))
  }, [soc, sortedStops])

  const socSegments = useMemo(() => {
    const segLen = totalDist / routeCoords.length
    let remaining = currentRange
    const result: { coords: [number, number][]; color: string }[] = []
    let current: { coords: [number, number][]; color: string } | null = null
    routeCoords.forEach((coord, i) => {
      if (i === 0) return
      remaining -= segLen
      const socAtSeg = (remaining / (batteryCapacity / efficiency)) * 100
      const color = socAtSeg > 30 ? '#00E599' : socAtSeg > 20 ? '#FF8C00' : '#FF4444'
      if (!current || current.color !== color) {
        if (current) result.push(current)
        current = { coords: [routeCoords[i - 1], coord], color }
      } else {
        current.coords.push(coord)
      }
    })
    if (current) result.push(current)
    return result
  }, [currentRange, batteryCapacity, efficiency])

  const addDestination = () => { if (destinations.length < 5) setDestinations([...destinations, '']) }
  const removeDestination = (i: number) => setDestinations(destinations.filter((_, j) => j !== i))
  const updateDestination = (i: number, v: string) => { const u = [...destinations]; u[i] = v; setDestinations(u); if (v.trim()) setValidationError(false) }

  const handlePlan = () => {
    if (hasEmptyDest) {
      setValidationError(true)
      return
    }
    setValidationError(false)
    setPlanned(true)
  }

  const handleNav = (name: string) => {
    setNavToast(name)
    setTimeout(() => setNavToast(null), 2000)
  }

  const handleReserve = (stopId: string) => {
    setReservingStation(stopId)
    setReservationModal(true)
  }

  const confirmReserve = () => {
    setReservationModal(false)
    setReservingStation(null)
    setSelectedTimeSlot('立即')
  }

  const sortLabels: Record<string, string> = { price: '电价', distance: '距离', wait: '等待' }
  const sortArrows: Record<string, string> = { price: '¥↑', distance: 'km↑', wait: 'min↑' }
  const timeSlots = ['立即', '30分钟后', '1小时后']

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-6">
      <div className="w-[360px] shrink-0 glass-card m-3 mr-0 p-4 overflow-y-auto">
        <h2 className="section-title flex items-center gap-2">
          <Navigation className="w-5 h-5 text-electric-green" />
          AI路径规划
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">出发地</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-ice-blue absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value="北京" className="input-field w-full pl-9" readOnly />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">目的地</label>
            <div className="space-y-2">
              {destinations.map((dest, i) => (
                <div key={i} className="flex items-center gap-2">
                  <MapPin className={`w-4 h-4 shrink-0 ${i === destinations.length - 1 ? 'text-amber-orange' : 'text-gray-500'}`} />
                  <input type="text" value={dest} onChange={e => updateDestination(i, e.target.value)} className={`input-field flex-1 ${validationError && dest.trim() === '' ? 'border-red-500 ring-1 ring-red-500/30' : ''}`} placeholder="输入目的地" />
                  {destinations.length > 1 && <button onClick={() => removeDestination(i)} className="text-gray-500 hover:text-red-400 text-sm">×</button>}
                </div>
              ))}
              {validationError && <p className="text-xs text-red-400">请填写所有目的地</p>}
              {destinations.length < 5 && (
                <button onClick={addDestination} className="flex items-center gap-1 text-xs text-electric-green hover:text-electric-green/80">
                  <Plus className="w-3 h-3" /> 添加途经点
                </button>
              )}
            </div>
          </div>

          <div className="glass-card p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <TrendingUp className="w-3.5 h-3.5 text-electric-green" />
              <span className="text-gray-200 font-medium">电量约束计算</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <span className="text-gray-400">总里程</span>
              <span className="data-text text-ice-blue">{totalDist.toLocaleString()}km</span>
              <span className="text-gray-400">预估耗电</span>
              <span className="data-text text-amber-orange">{estimatedConsumption}kWh</span>
              <span className="text-gray-400">当前电量可行驶</span>
              <span className={`data-text ${currentRange >= totalDist ? 'text-electric-green' : 'text-amber-orange'}`}>{currentRange}km</span>
              <span className="text-gray-400">需补电次数</span>
              <span className={`data-text ${chargeCount === 0 ? 'text-electric-green' : 'text-amber-orange'}`}>{chargeCount}次</span>
            </div>
            <div className="mt-2">
              <div className="h-2 bg-deep-blue-lighter rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{
                  width: `${rangePercent}%`,
                  background: rangePercent >= 80 ? '#00E599' : rangePercent >= 50 ? '#FF8C00' : '#FF4444',
                }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>当前续航 {currentRange}km</span>
                <span>总里程 {totalDist}km</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1"><Battery className="w-3 h-3" /> 当前SOC</span>
              <span className="data-text text-electric-green">{soc}%</span>
            </label>
            <input type="range" min={0} max={100} value={soc} onChange={e => setSoc(Number(e.target.value))} className="w-full h-1.5 bg-deep-blue-lighter rounded-lg appearance-none cursor-pointer accent-electric-green" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">电池容量(kWh)</label>
              <input type="number" value={batteryCapacity} onChange={e => setBatteryCapacity(Number(e.target.value))} className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">车辆型号</label>
              <div className="relative">
                <select className="input-field w-full appearance-none pr-8" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)}>
                  <option value="byd-han">比亚迪汉</option>
                  <option value="tesla-m3">特斯拉Model 3</option>
                  <option value="nio-et5">蔚来ET5</option>
                  <option value="xpeng-p7">小鹏P7</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">排序方式</label>
            <div className="flex gap-2">
              {(['price', 'distance', 'wait'] as const).map(key => (
                <button key={key} onClick={() => setSortBy(key)} className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${sortBy === key ? 'border-electric-green text-electric-green bg-electric-green/10' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                  {sortLabels[key]} {sortBy === key && <span className="ml-0.5">{sortArrows[key]}</span>}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handlePlan} disabled={hasEmptyDest} className={`btn-primary w-full flex items-center justify-center gap-2 py-2.5 ${hasEmptyDest ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Navigation className="w-4 h-4" />
            规划路线
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {planned && (
          <div className="flex gap-3 p-3 shrink-0">
            <div className="glass-card p-3 flex-1 flex items-center gap-6">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">路线概要</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <span className="text-gray-400">总距离</span>
                  <span className="data-text text-ice-blue">{totalDist}km</span>
                  <span className="text-gray-400">预计时间</span>
                  <span className="data-text text-amber-orange">{estimatedTime}小时</span>
                  <span className="text-gray-400">充电费用</span>
                  <span className="data-text text-electric-green">¥{totalCost}</span>
                  <span className="text-gray-400">充电次数</span>
                  <span className="data-text text-electric-green">{chargeCount}次</span>
                </div>
              </div>
            </div>
            <div className="glass-card p-3 w-64">
              <div className="text-xs text-gray-400 mb-1">电量变化</div>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={socChartData} margin={{ top: 2, right: 2, left: -15, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 9 }} stroke="none" axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 9 }} stroke="none" axisLine={false} />
                    <Tooltip contentStyle={{ background: '#111D33', border: '1px solid #1E2D45', borderRadius: 6, fontSize: 11 }} />
                    <Bar dataKey="soc" fill="#00E599" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 relative">
          <MapContainer
            center={[35.86, 118.00]}
            zoom={6}
            className="w-full h-full"
            attributionControl={false}
            style={{
              backgroundColor: '#0A1628',
              backgroundImage:
                'radial-gradient(circle at 55% 52%, rgba(0,229,153,0.14), transparent 20rem), linear-gradient(rgba(79,195,247,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(79,195,247,0.08) 1px, transparent 1px)',
              backgroundSize: 'auto, 52px 52px, 52px 52px',
            }}
          >
            {planned && (
              <>
                {socSegments.map((seg, i) => (
                  <Polyline key={i} positions={seg.coords} color={seg.color} weight={3} opacity={0.8} />
                ))}
                {mockStops.filter(s => s.id !== 'start' && s.id !== 'end').map(stop => (
                  <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={stopIcon(true)}>
                    <Popup>
                      <div className="text-sm font-medium">{stop.name}</div>
                      <div className="text-xs text-gray-400 mt-1">¥{stop.price}/度 · 等待{stop.waitTime}分钟</div>
                    </Popup>
                  </Marker>
                ))}
                <Marker position={[mockStops[0].lat, mockStops[0].lng]} icon={stopIcon(false)}>
                  <Popup><div className="text-sm">出发: 北京</div></Popup>
                </Marker>
                <Marker position={[mockStops[mockStops.length - 1].lat, mockStops[mockStops.length - 1].lng]} icon={stopIcon(false)}>
                  <Popup><div className="text-sm">到达: 上海</div></Popup>
                </Marker>
              </>
            )}
          </MapContainer>
          {navToast && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-card px-4 py-2 text-xs text-electric-green animate-slide-up z-[1000]">
              ✓ 已添加到导航路线 — {navToast}
            </div>
          )}
        </div>

        {planned && (
          <div className="h-40 bg-surface border-t border-white/5 flex items-start gap-3 p-3 overflow-x-auto shrink-0">
            {sortedStops.map((stop, i) => (
              <div key={stop.id} className="glass-card p-3 min-w-[210px] shrink-0 relative">
                {i === 0 && (
                  <span className="absolute -top-2 -right-2 bg-electric-green text-deep-blue text-[10px] font-bold px-1.5 py-0.5 rounded-full">推荐</span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-electric-green" />
                  <span className="text-sm font-medium text-gray-100 truncate">{stop.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <span className="text-gray-400">电价</span>
                  <span className="text-electric-green data-text">¥{stop.price}/度</span>
                  <span className="text-gray-400">等待</span>
                  <span className="text-ice-blue">{stop.waitTime}分钟</span>
                  <span className="text-gray-400">里程</span>
                  <span className="text-gray-300">{stop.distance}km</span>
                  <span className="text-gray-400">可用</span>
                  <span className="text-electric-green">{stop.availablePiles}桩</span>
                </div>
                <div className="flex gap-2 mt-2 pt-2 border-t border-white/5">
                  <button onClick={() => handleNav(stop.name)} className="btn-secondary text-xs py-1 px-2 flex-1">导航</button>
                  <button onClick={() => handleReserve(stop.id)} className="btn-primary text-xs py-1 px-2 flex-1">预约</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reservationModal && reservingStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-[340px] p-5 animate-slide-up">
            <h3 className="text-base font-semibold text-gray-100 mb-3">预约充电</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">选择时间</label>
                <div className="flex gap-2">
                  {timeSlots.map(slot => (
                    <button key={slot} onClick={() => setSelectedTimeSlot(slot)} className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${selectedTimeSlot === slot ? 'border-electric-green text-electric-green bg-electric-green/10' : 'border-white/10 text-gray-400 hover:border-white/20'}`}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={confirmReserve} className="btn-primary w-full py-2">确认预约</button>
              <button onClick={() => { setReservationModal(false); setReservingStation(null) }} className="btn-secondary w-full py-2">取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

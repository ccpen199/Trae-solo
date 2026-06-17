import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
  CircleMarker,
  Popup,
} from 'react-leaflet'
import {
  MapPin,
  Users,
  Truck,
  ShoppingBag,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  Layers,
  ChevronDown,
  Building2,
} from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { useQuery } from '@tanstack/react-query'
import {
  getHeatmapData,
  getRegionStats,
  type HeatmapPoint,
  type RegionStats,
} from '../../services/dispatch.api'

const BEIJING_CENTER: [number, number] = [39.9042, 116.4074]

type HeatType = 'worker' | 'driver' | 'demand' | 'overlay'

const CITIES = [
  { id: 'beijing', name: '北京市', center: [39.9042, 116.4074] as [number, number] },
  { id: 'shanghai', name: '上海市', center: [31.2304, 121.4737] as [number, number] },
  { id: 'guangzhou', name: '广州市', center: [23.1291, 113.2644] as [number, number] },
  { id: 'shenzhen', name: '深圳市', center: [22.5431, 114.0579] as [number, number] },
]

const TIME_SLOTS = [
  '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
  '12:00', '14:00', '16:00', '18:00', '20:00', '22:00',
]

const mockWorkerPoints: HeatmapPoint[] = Array.from({ length: 200 }, () => ({
  lat: BEIJING_CENTER[0] + (Math.random() - 0.5) * 0.4,
  lng: BEIJING_CENTER[1] + (Math.random() - 0.5) * 0.5,
  value: Math.random() * 10,
  type: 'worker',
}))

const mockDriverPoints: HeatmapPoint[] = Array.from({ length: 120 }, () => ({
  lat: BEIJING_CENTER[0] + (Math.random() - 0.5) * 0.4,
  lng: BEIJING_CENTER[1] + (Math.random() - 0.5) * 0.5,
  value: Math.random() * 8,
  type: 'driver',
}))

const mockDemandPoints: HeatmapPoint[] = Array.from({ length: 150 }, () => ({
  lat: BEIJING_CENTER[0] + (Math.random() - 0.5) * 0.4,
  lng: BEIJING_CENTER[1] + (Math.random() - 0.5) * 0.5,
  value: Math.random() * 12,
  type: 'order',
}))

const mockRegionStats: RegionStats[] = [
  { region: '朝阳区', workers: 320, drivers: 180, demand: 280, supplyDemandRatio: 1.14 },
  { region: '海淀区', workers: 280, drivers: 150, demand: 310, supplyDemandRatio: 0.9 },
  { region: '东城区', workers: 180, drivers: 95, demand: 150, supplyDemandRatio: 1.2 },
  { region: '西城区', workers: 160, drivers: 85, demand: 175, supplyDemandRatio: 0.91 },
  { region: '丰台区', workers: 220, drivers: 120, demand: 200, supplyDemandRatio: 1.1 },
  { region: '通州区', workers: 150, drivers: 110, demand: 190, supplyDemandRatio: 0.79 },
]

function HeatPoint({ point, type }: { point: HeatmapPoint; type: HeatType }) {
  const getColor = () => {
    if (type === 'worker') return '#06B6D4'
    if (type === 'driver') return '#8B5CF6'
    if (type === 'demand') return '#F97316'
    if (point.type === 'worker') return '#06B6D4'
    if (point.type === 'driver') return '#8B5CF6'
    return '#F97316'
  }

  const color = getColor()
  const radius = 8 + point.value * 2.5

  return (
    <CircleMarker
      center={[point.lat, point.lng]}
      radius={radius}
      fillColor={color}
      color={color}
      weight={0}
      fillOpacity={0.35}
    >
      <Popup className="!bg-slate-800 !border-slate-700">
        <div className="text-white text-sm">
          <p className="font-semibold mb-1">
            {point.type === 'worker' ? '工人聚集点' : point.type === 'driver' ? '司机聚集点' : '订单需求点'}
          </p>
          <p className="text-slate-400">
            数量: {Math.round(point.value * 5)}
          </p>
        </div>
      </Popup>
    </CircleMarker>
  )
}

function MapController({ center, heatType, timeIndex }: {
  center: [number, number]
  heatType: HeatType
  timeIndex: number
}) {
  const map = useMap()
  useMapEvents({})

  useEffect(() => {
    map.setView(center, map.getZoom() || 11, { animate: true })
  }, [center, map])

  return null
}

export default function SupplyHeatmap() {
  const [city, setCity] = useState(CITIES[0])
  const [heatType, setHeatType] = useState<HeatType>('overlay')
  const [timeIndex, setTimeIndex] = useState(6)
  const [isPlaying, setIsPlaying] = useState(false)
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const [hoveredRegion, setHoveredRegion] = useState<RegionStats | null>(null)

  const { data: workerData } = useQuery({
    queryKey: ['heatmap', 'worker', city.id, timeIndex],
    queryFn: () => getHeatmapData({ type: 'worker', time: TIME_SLOTS[timeIndex] }),
    initialData: mockWorkerPoints,
  })

  const { data: driverData } = useQuery({
    queryKey: ['heatmap', 'driver', city.id, timeIndex],
    queryFn: () => getHeatmapData({ type: 'driver', time: TIME_SLOTS[timeIndex] }),
    initialData: mockDriverPoints,
  })

  const { data: demandData } = useQuery({
    queryKey: ['heatmap', 'demand', city.id, timeIndex],
    queryFn: () => getHeatmapData({ type: 'order', time: TIME_SLOTS[timeIndex] }),
    initialData: mockDemandPoints,
  })

  const { data: regionStats } = useQuery({
    queryKey: ['region-stats', city.id],
    queryFn: () => getRegionStats(),
    initialData: mockRegionStats,
  })

  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      setTimeIndex((prev) => (prev + 1) % TIME_SLOTS.length)
    }, 1500)
    return () => clearInterval(timer)
  }, [isPlaying])

  const visiblePoints = useMemo(() => {
    const points: HeatmapPoint[] = []
    if (heatType === 'worker' || heatType === 'overlay') {
      points.push(...workerData)
    }
    if (heatType === 'driver' || heatType === 'overlay') {
      points.push(...driverData)
    }
    if (heatType === 'demand' || heatType === 'overlay') {
      points.push(...demandData)
    }
    return points
  }, [heatType, workerData, driverData, demandData])

  return (
    <div className="h-[calc(100vh-4rem)] min-w-[1440px] relative">
      <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <button
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50 text-white hover:bg-slate-700/90 transition-colors"
            >
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span className="font-medium">{city.name}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {cityDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden shadow-xl"
                >
                  {CITIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCity(c)
                        setCityDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700/50 transition-colors ${
                        c.id === city.id ? 'text-cyan-400 bg-cyan-500/10' : 'text-white'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50">
            {[
              { value: 'worker', label: '工人', icon: Users, color: '#06B6D4' },
              { value: 'driver', label: '司机', icon: Truck, color: '#8B5CF6' },
              { value: 'demand', label: '需求', icon: ShoppingBag, color: '#F97316' },
              { value: 'overlay', label: '叠加', icon: Layers, color: '#10B981' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setHeatType(item.value as HeatType)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  heatType === item.value
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                style={heatType === item.value ? { backgroundColor: `${item.color}30` } : {}}
              >
                <item.icon className="w-4 h-4" style={{ color: heatType === item.value ? item.color : undefined }} />
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50 p-3 w-80"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white">时间轴</span>
            </div>
            <span className="text-sm font-mono text-cyan-400 font-bold">{TIME_SLOTS[timeIndex]}</span>
          </div>
          <div className="relative mb-3">
            <input
              type="range"
              min={0}
              max={TIME_SLOTS.length - 1}
              value={timeIndex}
              onChange={(e) => setTimeIndex(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-cyan-500
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:shadow-cyan-500/50
                [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setTimeIndex((prev) => Math.max(0, prev - 1))}
              className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 transition-colors shadow-lg shadow-cyan-500/30"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setTimeIndex((prev) => Math.min(TIME_SLOTS.length - 1, prev + 1))}
              className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-6 z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4"
        >
          <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            色阶图例
          </p>
          <div className="space-y-2.5">
            {(heatType === 'worker' || heatType === 'overlay') && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[0.2, 0.35, 0.5, 0.65, 0.8].map((o, i) => (
                    <div
                      key={i}
                      className="w-6 h-4 rounded-sm"
                      style={{ backgroundColor: '#06B6D4', opacity: o }}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-300">工人密度</span>
              </div>
            )}
            {(heatType === 'driver' || heatType === 'overlay') && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[0.2, 0.35, 0.5, 0.65, 0.8].map((o, i) => (
                    <div
                      key={i}
                      className="w-6 h-4 rounded-sm"
                      style={{ backgroundColor: '#8B5CF6', opacity: o }}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-300">司机密度</span>
              </div>
            )}
            {(heatType === 'demand' || heatType === 'overlay') && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">
                  {[0.2, 0.35, 0.5, 0.65, 0.8].map((o, i) => (
                    <div
                      key={i}
                      className="w-6 h-4 rounded-sm"
                      style={{ backgroundColor: '#F97316', opacity: o }}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-300">需求密度</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-6 right-6 z-20 w-72">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4"
        >
          <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            区域统计
          </p>
          <div className="space-y-2">
            {regionStats.map((region) => (
              <div
                key={region.region}
                onMouseEnter={() => setHoveredRegion(region)}
                onMouseLeave={() => setHoveredRegion(null)}
                className={`p-2.5 rounded-lg cursor-pointer transition-all ${
                  hoveredRegion?.region === region.region
                    ? 'bg-slate-700/60'
                    : 'bg-slate-900/40 hover:bg-slate-700/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-white">{region.region}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                      region.supplyDemandRatio >= 1
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    供需比 {region.supplyDemandRatio.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">工人</span>
                    <p className="text-cyan-400 font-medium">{region.workers}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">司机</span>
                    <p className="text-purple-400 font-medium">{region.drivers}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">需求</span>
                    <p className="text-orange-400 font-medium">{region.demand}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="absolute inset-0">
        <MapContainer
          center={city.center}
          zoom={11}
          className="w-full h-full dark-map"
          zoomControl={false}
          attributionControl={true}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={city.center} heatType={heatType} timeIndex={timeIndex} />
          {visiblePoints.map((point, index) => (
            <HeatPoint key={`${point.type}-${index}`} point={point} type={heatType} />
          ))}
        </MapContainer>
      </div>
    </div>
  )
}

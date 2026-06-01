import React, { useEffect, useState, useMemo } from 'react'
import {
  Truck,
  Clock,
  RefreshCw,
  MapPin,
  AlertTriangle,
  CheckCircle,
  PauseCircle,
  Loader2,
  Navigation,
  Filter,
  Layers,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { api } from '@/lib/api'

interface Vehicle {
  id: number
  network_id: number
  plate: string
  latitude: number
  longitude: number
  status: 'in_transit' | 'loading' | 'unloading' | 'idle'
  route?: string
  network_name?: string
}

interface HeatmapPoint {
  lat: number
  lng: number
  intensity: number
}

interface VehicleStats {
  total: number
  in_transit: number
  loading: number
  unloading: number
  idle: number
}

interface RealtimeData {
  timestamp: string
  vehicles: VehicleStats
}

interface VehicleData {
  vehicles: Vehicle[]
  heatmapData: HeatmapPoint[]
  stats: VehicleStats
}

const CHINA_MAP_PATH = 'M120,80 L180,60 L240,50 L300,55 L360,70 L420,90 L460,130 L470,180 L450,230 L400,260 L350,280 L300,290 L250,280 L200,260 L160,230 L130,190 L110,140 Z'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in_transit': return '#2A9D8F'
    case 'loading': return '#457B9D'
    case 'unloading': return '#F4A261'
    case 'idle': return '#E63946'
    default: return '#457B9D'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'in_transit': return '在途'
    case 'loading': return '装载中'
    case 'unloading': return '卸货中'
    case 'idle': return '空闲'
    default: return '未知'
  }
}

const CHINA_REGIONS = [
  { name: '华东', cities: ['上海', '杭州', '南京', '合肥', '济南', '青岛'] },
  { name: '华南', cities: ['广州', '深圳', '厦门', '福州', '南宁'] },
  { name: '华北', cities: ['北京', '天津', '石家庄', '太原', '呼和浩特'] },
  { name: '华中', cities: ['武汉', '长沙', '郑州', '南昌'] },
  { name: '西南', cities: ['成都', '重庆', '昆明', '贵阳', '拉萨'] },
  { name: '西北', cities: ['西安', '兰州', '西宁', '银川', '乌鲁木齐'] },
  { name: '东北', cities: ['沈阳', '大连', '长春', '哈尔滨'] },
]

const TwinVehicles: React.FC = () => {
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null)
  const [realtimeData, setRealtimeData] = useState<RealtimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehicleResult, realtimeResult] = await Promise.all([
          api.twin.vehicles(),
          api.twin.realtime(),
        ])
        if (vehicleResult.success && vehicleResult.data) {
          setVehicleData(vehicleResult.data as VehicleData)
        }
        if (realtimeResult.success && realtimeResult.data) {
          setRealtimeData(realtimeResult.data as RealtimeData)
        }
      } catch (error) {
        console.error('Failed to fetch vehicle data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const filteredVehicles = useMemo(() => {
    if (!vehicleData) return []
    return vehicleData.vehicles.filter(v => {
      if (selectedStatus !== 'all' && v.status !== selectedStatus) return false
      if (selectedRegion !== 'all') {
        const region = CHINA_REGIONS.find(r => r.name === selectedRegion)
        if (region && v.network_name) {
          return region.cities.some(city => v.network_name?.includes(city))
        }
      }
      return true
    })
  }, [vehicleData, selectedRegion, selectedStatus])

  const statusDistribution = useMemo(() => {
    const stats = vehicleData?.stats || { total: 0, in_transit: 0, loading: 0, unloading: 0, idle: 0 }
    return [
      { name: '在途', value: stats.in_transit, color: '#2A9D8F' },
      { name: '装载中', value: stats.loading, color: '#457B9D' },
      { name: '卸货中', value: stats.unloading, color: '#F4A261' },
      { name: '空闲', value: stats.idle, color: '#E63946' },
    ]
  }, [vehicleData])

  const routeDistribution = useMemo(() => {
    const routeCounts: Record<string, number> = {}
    vehicleData?.vehicles.forEach(v => {
      if (v.route) {
        routeCounts[v.route] = (routeCounts[v.route] || 0) + 1
      }
    })
    return Object.entries(routeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [vehicleData])

  const abnormalVehicles = useMemo(() => {
    return vehicleData?.vehicles.filter(v => v.status === 'idle') || []
  }, [vehicleData])

  const statCards = [
    {
      label: '车辆总数',
      value: vehicleData?.stats.total || 0,
      icon: Truck,
      color: 'from-sf-blue to-sf-blue/70',
      bgColor: 'bg-sf-blue/10',
      borderColor: 'border-sf-blue/30',
    },
    {
      label: '在途车辆',
      value: vehicleData?.stats.in_transit || 0,
      icon: Navigation,
      color: 'from-sf-green to-sf-green/70',
      bgColor: 'bg-sf-green/10',
      borderColor: 'border-sf-green/30',
    },
    {
      label: '空闲车辆',
      value: vehicleData?.stats.idle || 0,
      icon: PauseCircle,
      color: 'from-sf-yellow to-sf-orange',
      bgColor: 'bg-sf-yellow/10',
      borderColor: 'border-sf-yellow/30',
    },
    {
      label: '异常车辆',
      value: abnormalVehicles.length,
      icon: AlertTriangle,
      color: 'from-sf-red to-sf-red/70',
      bgColor: 'bg-sf-red/10',
      borderColor: 'border-sf-red/30',
      pulse: abnormalVehicles.length > 0,
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-sf-dark/50 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-96 bg-sf-dark/50 rounded-xl animate-pulse" />
          <div className="h-96 bg-sf-dark/50 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 bg-sf-dark/50 rounded-xl animate-pulse" />
          <div className="h-80 bg-sf-dark/50 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-sf-light">车辆在途热力图</h1>
          <p className="text-sf-light/50 text-sm mt-1">实时监控全国车辆分布与运行状态</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-sf-green/10 border border-sf-green/30 rounded-lg">
            <RefreshCw size={14} className="text-sf-green animate-spin" />
            <span className="text-sf-green text-sm">实时追踪</span>
          </div>
          <div className="text-sm text-sf-light/50 flex items-center gap-2">
            <Clock size={14} />
            <span>{realtimeData?.timestamp ? new Date(realtimeData.timestamp).toLocaleTimeString('zh-CN') : new Date().toLocaleTimeString('zh-CN')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`relative overflow-hidden glass rounded-xl p-6 border ${card.borderColor} card-hover`}
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                  <card.icon size={24} className="text-sf-light" />
                </div>
                {card.pulse && (
                  <div className="w-3 h-3 bg-sf-red rounded-full status-pulse" />
                )}
              </div>
              <div className="mt-4">
                <div className="text-3xl font-display text-sf-light">{card.value?.toLocaleString()}</div>
                <div className="text-sf-light/50 text-sm mt-1">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 glass rounded-xl p-6 border border-sf-blue/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display text-sf-light">全国车辆分布热力图</h3>
              <p className="text-sf-light/50 text-sm">渐变色块模拟 · 按区域筛选</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-sf-light/50" />
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="bg-sf-dark/50 border border-sf-blue/30 rounded-lg px-3 py-1.5 text-sm text-sf-light focus:outline-none focus:border-sf-blue"
                >
                  <option value="all">全部区域</option>
                  {CHINA_REGIONS.map(region => (
                    <option key={region.name} value={region.name}>{region.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-sf-light/50" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-sf-dark/50 border border-sf-blue/30 rounded-lg px-3 py-1.5 text-sm text-sf-light focus:outline-none focus:border-sf-blue"
                >
                  <option value="all">全部状态</option>
                  <option value="in_transit">在途</option>
                  <option value="loading">装载中</option>
                  <option value="unloading">卸货中</option>
                  <option value="idle">空闲</option>
                </select>
              </div>
            </div>
          </div>
          <div className="relative h-80 bg-sf-dark/30 rounded-xl overflow-hidden">
            <svg viewBox="0 0 600 350" className="w-full h-full">
              <defs>
                <radialGradient id="heatGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#E63946" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#F4A261" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#457B9D" stopOpacity="0" />
                </radialGradient>
                <filter id="heatGlow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path
                d={CHINA_MAP_PATH}
                fill="#2B2D42"
                stroke="#457B9D"
                strokeWidth="1"
                opacity="0.8"
              />
              {filteredVehicles.map((vehicle) => {
                const x = 60 + (vehicle.longitude + 130) * 2.5
                const y = 40 + (50 - vehicle.latitude) * 3.5
                return (
                  <g key={vehicle.id} filter="url(#heatGlow)">
                    <circle
                      cx={x}
                      cy={y}
                      r={vehicle.status === 'in_transit' ? 12 : 8}
                      fill="url(#heatGradient)"
                      opacity={vehicle.status === 'in_transit' ? 0.6 : 0.3}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={vehicle.status === 'in_transit' ? 5 : 3}
                      fill={getStatusColor(vehicle.status)}
                      className="cursor-pointer"
                    >
                      <title>
                        {vehicle.plate} - {getStatusLabel(vehicle.status)}
                        {vehicle.route ? ` | 路线: ${vehicle.route}` : ''}
                      </title>
                    </circle>
                    {vehicle.status === 'in_transit' && (
                      <circle
                        cx={x}
                        cy={y}
                        r={8}
                        fill="none"
                        stroke={getStatusColor(vehicle.status)}
                        strokeWidth="1"
                        opacity="0.5"
                        className="status-pulse"
                      />
                    )}
                  </g>
                )
              })}
            </svg>
            <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sf-green" />
                <span className="text-sf-light/50">在途</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sf-blue" />
                <span className="text-sf-light/50">装载</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sf-yellow" />
                <span className="text-sf-light/50">卸货</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sf-red" />
                <span className="text-sf-light/50">空闲</span>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 text-xs text-sf-light/50">
              共 {filteredVehicles.length} 辆车
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-sf-green/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display text-sf-light">车辆状态统计</h3>
              <p className="text-sf-light/50 text-sm">实时状态分布</p>
            </div>
            <PieChartIcon size={24} className="text-sf-green" />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A2E',
                    border: '1px solid #457B9D',
                    borderRadius: '8px',
                    color: '#F1FAEE',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {statusDistribution.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-sf-light/70">{item.name}</span>
                <span className="text-sm font-display text-sf-light ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6 border border-sf-blue/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display text-sf-light">车辆运行路线</h3>
              <p className="text-sf-light/50 text-sm">热门路线车辆分布</p>
            </div>
            <Navigation size={20} className="text-sf-blue" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={routeDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2B2D42" />
                <XAxis type="number" stroke="#F1FAEE" strokeOpacity={0.5} fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#F1FAEE" strokeOpacity={0.5} fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A2E',
                    border: '1px solid #457B9D',
                    borderRadius: '8px',
                    color: '#F1FAEE',
                  }}
                />
                <Bar dataKey="value" name="车辆数" radius={[0, 4, 4, 0]}>
                  {routeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#E63946' : '#457B9D'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-sf-red/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display text-sf-light">实时车辆轨迹</h3>
              <p className="text-sf-light/50 text-sm">最近更新的车辆位置</p>
            </div>
            <Loader2 size={20} className="text-sf-red animate-spin" />
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {filteredVehicles.slice(0, 8).map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center gap-3 p-3 bg-sf-dark/30 rounded-lg hover:bg-sf-dark/50 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${getStatusColor(vehicle.status)}20` }}
                >
                  <Truck size={18} style={{ color: getStatusColor(vehicle.status) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-sf-light font-medium">{vehicle.plate}</div>
                  <div className="text-xs text-sf-light/50 truncate">
                    {vehicle.network_name || '未分配网点'}
                    {vehicle.route && ` · ${vehicle.route}`}
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
                    style={{
                      backgroundColor: `${getStatusColor(vehicle.status)}20`,
                      color: getStatusColor(vehicle.status),
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(vehicle.status) }} />
                    {getStatusLabel(vehicle.status)}
                  </span>
                  <div className="text-xs text-sf-light/30 mt-1">
                    {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {abnormalVehicles.length > 0 && (
        <div className="glass rounded-xl p-6 border border-sf-red/30">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-sf-red" />
            <h3 className="text-lg font-display text-sf-light">异常车辆警报</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {abnormalVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center gap-3 p-4 bg-sf-red/5 border border-sf-red/20 rounded-lg"
              >
                <div className="w-10 h-10 bg-sf-red/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={20} className="text-sf-red" />
                </div>
                <div>
                  <div className="text-sm text-sf-light font-medium">{vehicle.plate}</div>
                  <div className="text-xs text-sf-light/50">空闲超时 · 需要调度</div>
                </div>
                <button className="ml-auto px-3 py-1.5 bg-sf-blue rounded-lg text-xs text-white hover:bg-sf-blue/80 transition-colors">
                  调度
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TwinVehicles

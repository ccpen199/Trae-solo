import { useEffect, useState, useMemo } from 'react'
import {
  MapPin,
  TrendingUp,
  Search,
  Package,
  Truck,
  Activity,
  Filter,
  Ruler,
  BarChart3,
  Globe,
  DollarSign,
  Layers,
  Sun,
  CloudRain,
  Users,
  Plus,
  MessageSquare,
  Map,
  List,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatCard from '@/components/StatCard'
import DataTable from '@/components/DataTable'
import Chart from '@/components/Chart'
import RouteMap from '@/components/RouteMap'
import StatusBadge from '@/components/StatusBadge'
import { api } from '@/utils/api'

interface RouteInfo {
  id: string
  from: string
  to: string
  distance: number
  basePrice: number
  currentPrice: number
  trend: number
  volume: number
  avgPrice: number
  cargoType: string
  transportMode: string
  priceHistory: number[]
  volumeHistory: number[]
}

interface ApiRouteInfo {
  id?: string | number
  from?: string
  to?: string
  from_city?: string
  to_city?: string
  distance?: number
  price?: number
  base_price?: number
  current_price?: number
  trend?: number
  volume?: number
  avg_price?: number
  cargo_type?: string
  transport_mode?: string
  price_history?: number[]
  volume_history?: number[]
}

interface TrendData {
  labels: string[]
  prices: number[]
  volumes: number[]
}

const cargoTypes = ['全部', '建材', '生鲜', '冷链', '大件', '电子', '化工']
const transportModes = ['全部', '整车', '零担', '拼车']
const priceTrends = ['全部', '上涨', '下跌', '平稳']

const mapNodes = [
  { x: 0.55, y: 0.35, label: '上海' },
  { x: 0.50, y: 0.40, label: '南京' },
  { x: 0.60, y: 0.50, label: '杭州' },
  { x: 0.58, y: 0.65, label: '广州' },
  { x: 0.57, y: 0.68, label: '深圳' },
  { x: 0.52, y: 0.22, label: '北京' },
  { x: 0.50, y: 0.25, label: '天津' },
  { x: 0.45, y: 0.50, label: '武汉' },
  { x: 0.48, y: 0.60, label: '长沙' },
  { x: 0.36, y: 0.55, label: '成都' },
  { x: 0.38, y: 0.58, label: '重庆' },
  { x: 0.40, y: 0.35, label: '郑州' },
  { x: 0.35, y: 0.40, label: '西安' },
]

const cityIndex: Record<string, number> = {}
mapNodes.forEach((n, i) => {
  cityIndex[n.label] = i
})

const generatePriceHistory = (base: number): number[] => {
  const history: number[] = []
  let price = base
  for (let i = 0; i < 30; i++) {
    price += (Math.random() - 0.5) * 200
    history.push(Math.round(price))
  }
  return history
}

const generateVolumeHistory = (base: number): number[] => {
  const history: number[] = []
  for (let i = 0; i < 12; i++) {
    history.push(Math.round(base * (0.7 + Math.random() * 0.6)))
  }
  return history
}

const defaultRoutes: RouteInfo[] = [
  { id: '1', from: '上海', to: '杭州', distance: 180, basePrice: 2600, currentPrice: 2800, trend: 5.2, volume: 156, avgPrice: 2750, cargoType: '建材', transportMode: '整车', priceHistory: generatePriceHistory(2600), volumeHistory: generateVolumeHistory(150) },
  { id: '2', from: '上海', to: '南京', distance: 300, basePrice: 4300, currentPrice: 4200, trend: -2.1, volume: 132, avgPrice: 4250, cargoType: '电子', transportMode: '零担', priceHistory: generatePriceHistory(4300), volumeHistory: generateVolumeHistory(130) },
  { id: '3', from: '广州', to: '深圳', distance: 140, basePrice: 2100, currentPrice: 2200, trend: 3.8, volume: 189, avgPrice: 2150, cargoType: '生鲜', transportMode: '拼车', priceHistory: generatePriceHistory(2100), volumeHistory: generateVolumeHistory(190) },
  { id: '4', from: '北京', to: '天津', distance: 130, basePrice: 1750, currentPrice: 1800, trend: 1.5, volume: 210, avgPrice: 1780, cargoType: '化工', transportMode: '整车', priceHistory: generatePriceHistory(1750), volumeHistory: generateVolumeHistory(210) },
  { id: '5', from: '武汉', to: '长沙', distance: 360, basePrice: 5500, currentPrice: 5400, trend: -1.2, volume: 98, avgPrice: 5450, cargoType: '大件', transportMode: '整车', priceHistory: generatePriceHistory(5500), volumeHistory: generateVolumeHistory(100) },
  { id: '6', from: '成都', to: '重庆', distance: 340, basePrice: 4600, currentPrice: 4800, trend: 4.6, volume: 87, avgPrice: 4700, cargoType: '冷链', transportMode: '零担', priceHistory: generatePriceHistory(4600), volumeHistory: generateVolumeHistory(90) },
  { id: '7', from: '郑州', to: '武汉', distance: 510, basePrice: 6600, currentPrice: 6800, trend: 2.3, volume: 76, avgPrice: 6700, cargoType: '建材', transportMode: '整车', priceHistory: generatePriceHistory(6600), volumeHistory: generateVolumeHistory(80) },
  { id: '8', from: '西安', to: '郑州', distance: 480, basePrice: 6700, currentPrice: 6500, trend: -3.5, volume: 65, avgPrice: 6600, cargoType: '电子', transportMode: '拼车', priceHistory: generatePriceHistory(6700), volumeHistory: generateVolumeHistory(70) },
  { id: '9', from: '北京', to: '上海', distance: 1200, basePrice: 15000, currentPrice: 15800, trend: 2.8, volume: 234, avgPrice: 15400, cargoType: '建材', transportMode: '整车', priceHistory: generatePriceHistory(15000), volumeHistory: generateVolumeHistory(230) },
  { id: '10', from: '广州', to: '北京', distance: 2100, basePrice: 26000, currentPrice: 25500, trend: -1.9, volume: 178, avgPrice: 25800, cargoType: '生鲜', transportMode: '冷链', priceHistory: generatePriceHistory(26000), volumeHistory: generateVolumeHistory(180) },
  { id: '11', from: '上海', to: '成都', distance: 1960, basePrice: 24000, currentPrice: 24800, trend: 3.1, volume: 145, avgPrice: 24400, cargoType: '大件', transportMode: '整车', priceHistory: generatePriceHistory(24000), volumeHistory: generateVolumeHistory(140) },
  { id: '12', from: '深圳', to: '武汉', distance: 1100, basePrice: 13500, currentPrice: 13800, trend: 0.8, volume: 167, avgPrice: 13600, cargoType: '电子', transportMode: '零担', priceHistory: generatePriceHistory(13500), volumeHistory: generateVolumeHistory(170) },
]

export default function RoutePricing() {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<RouteInfo[]>(defaultRoutes)
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>(null)
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map')
  const [searchText, setSearchText] = useState('')
  const [cargoFilter, setCargoFilter] = useState('全部')
  const [modeFilter, setModeFilter] = useState('全部')
  const [trendFilter, setTrendFilter] = useState('全部')
  const [distanceRange, setDistanceRange] = useState([0, 5000])
  const [trendData, setTrendData] = useState<TrendData | null>(null)

  useEffect(() => {
    api.get<RouteInfo[] | { routes: ApiRouteInfo[] }>('/pricing/routes')
      .then((data) => {
        const rows = Array.isArray(data) ? data : data.routes
        if (!Array.isArray(rows)) return
        setRoutes(rows.map((r, index) => {
          const from = r.from ?? r.from_city ?? ''
          const to = r.to ?? r.to_city ?? ''
          const currentPrice = r.price ?? r.current_price ?? r.base_price ?? 0
          const basePrice = r.base_price ?? currentPrice
          const volume = r.volume ?? 60 + ((index * 17) % 180)
          return {
            id: String(r.id ?? `${from}-${to}-${index}`),
            from,
            to,
            distance: r.distance ?? 120 + ((index * 47) % 620),
            basePrice: Math.round(basePrice > 1000 ? basePrice : basePrice * 10),
            currentPrice: Math.round(currentPrice > 1000 ? currentPrice : currentPrice * 10),
            trend: r.trend ?? Number((((currentPrice - basePrice) / Math.max(basePrice, 1)) * 100).toFixed(1)),
            volume,
            avgPrice: r.avg_price ?? Math.round((basePrice + currentPrice) / 2),
            cargoType: r.cargo_type ?? cargoTypes[1 + (index % (cargoTypes.length - 1))],
            transportMode: r.transport_mode ?? transportModes[1 + (index % (transportModes.length - 1))],
            priceHistory: r.price_history ?? generatePriceHistory(basePrice),
            volumeHistory: r.volume_history ?? generateVolumeHistory(volume),
          }
        }).filter((r) => r.from && r.to))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedRoute) return
    api.get<TrendData>(`/pricing/trend?routeId=${selectedRoute.id}`)
      .then((data) => {
        if (data && data.labels) {
          setTrendData(data)
        }
      })
      .catch(() => {})
  }, [selectedRoute])

  const filtered = useMemo(() => {
    return routes.filter((r) => {
      const matchSearch = !searchText ||
        r.from.includes(searchText) ||
        r.to.includes(searchText)
      const matchCargo = cargoFilter === '全部' || r.cargoType === cargoFilter
      const matchMode = modeFilter === '全部' || r.transportMode === modeFilter
      const matchTrend = trendFilter === '全部' ||
        (trendFilter === '上涨' && r.trend > 1) ||
        (trendFilter === '下跌' && r.trend < -1) ||
        (trendFilter === '平稳' && Math.abs(r.trend) <= 1)
      const matchDistance = r.distance >= distanceRange[0] && r.distance <= distanceRange[1]
      return matchSearch && matchCargo && matchMode && matchTrend && matchDistance
    })
  }, [routes, searchText, cargoFilter, modeFilter, trendFilter, distanceRange])

  const mapRoutes = useMemo(() => {
    return filtered.map((r) => ({
      from: cityIndex[r.from] ?? 0,
      to: cityIndex[r.to] ?? 0,
      price: r.currentPrice,
      active: selectedRoute?.id === r.id,
    }))
  }, [filtered, selectedRoute])

  const trendLabels = trendData?.labels || Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
  const trendValues = selectedRoute
    ? (trendData?.prices || selectedRoute.priceHistory)
    : [2800, 2950, 2680, 2900, 3050, 3100, 3200, 3150, 3050, 2950, 2850, 2780, 2900, 3050, 3200, 3300, 3250, 3150, 3050, 2950, 3000, 3100, 3250, 3400, 3350, 3250, 3150, 3200, 3300, 3450]

  const volumeLabels = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
  const volumeValues = selectedRoute
    ? (trendData?.volumes || selectedRoute.volumeHistory)
    : filtered.slice(0, 12).map((r) => r.volume)

  const columns = [
    {
      key: 'route',
      title: '线路',
      sortable: true,
      render: (row: RouteInfo) => (
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-accent" />
          <span className="font-medium">
            {row.from} → {row.to}
          </span>
        </div>
      ),
    },
    {
      key: 'distance',
      title: '距离(km)',
      sortable: true,
      render: (row: RouteInfo) => (
        <span className="font-mono text-secondary">{row.distance}km</span>
      ),
    },
    {
      key: 'basePrice',
      title: '基准价',
      sortable: true,
      render: (row: RouteInfo) => (
        <span className="font-mono text-secondary">¥{row.basePrice.toLocaleString()}</span>
      ),
    },
    {
      key: 'currentPrice',
      title: '当前价',
      sortable: true,
      render: (row: RouteInfo) => (
        <span className="font-mono font-semibold text-primary">¥{row.currentPrice.toLocaleString()}</span>
      ),
    },
    {
      key: 'trend',
      title: '涨跌%',
      sortable: true,
      render: (row: RouteInfo) => {
        const isUp = row.trend > 0
        const isFlat = Math.abs(row.trend) <= 1
        return (
          <div className="flex items-center gap-1">
            <StatusBadge
              status={isUp ? 'active' : isFlat ? 'info' : 'danger'}
              label={`${isUp ? '↑' : isFlat ? '→' : '↓'} ${Math.abs(row.trend)}%`}
            />
          </div>
        )
      },
    },
    {
      key: 'volume',
      title: '月单量',
      sortable: true,
      render: (row: RouteInfo) => (
        <span className="font-mono text-primary">{row.volume}单</span>
      ),
    },
    {
      key: 'avgPrice',
      title: '月均价趋势',
      sortable: false,
      render: (row: RouteInfo) => (
        <div className="w-24 h-8">
          <MiniChart data={row.priceHistory.slice(-12)} />
        </div>
      ),
    },
    {
      key: 'action',
      title: '操作',
      sortable: false,
      render: (row: RouteInfo) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate('/cargo', { state: { from: row.from, to: row.to } })
            }}
            className="px-2 py-1 text-xs bg-primary text-white rounded hover:bg-primary/90 transition-colors flex items-center gap-1"
          >
            <Plus size={12} />
            发布货源
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate('/bargaining', { state: { routeId: row.id, from: row.from, to: row.to, price: row.currentPrice } })
            }}
            className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90 transition-colors flex items-center gap-1"
          >
            <MessageSquare size={12} />
            议价
          </button>
        </div>
      ),
    },
  ]

  const stats = [
    {
      icon: <Globe size={20} />,
      value: '100,000',
      label: '总线路数',
      sublabel: '覆盖全国主要城市',
      gradient: 'gradient-primary',
    },
    {
      icon: <BarChart3 size={20} />,
      value: '128.5',
      label: '今日运价指数',
      sublabel: '基期=100',
      trend: { value: 1.2, positive: true },
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
    },
    {
      icon: <TrendingUp size={20} />,
      value: '+1.2%',
      label: '较昨日涨跌',
      sublabel: '环比变动',
      trend: { value: 1.2, positive: true },
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    },
    {
      icon: <DollarSign size={20} />,
      value: '¥3,850',
      label: '热门线路均价',
      sublabel: 'TOP20线路平均',
      gradient: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    },
    {
      icon: <Layers size={20} />,
      value: '18.6亿元',
      label: '月交易总量',
      sublabel: '平台撮合交易额',
      gradient: 'bg-gradient-to-br from-rose-500 to-pink-600',
    },
  ]

  const handleRouteMapClick = (r: { from: number; to: number }) => {
    const fromCity = mapNodes[r.from]?.label
    const toCity = mapNodes[r.to]?.label
    const route = filtered.find(
      (route) =>
        (route.from === fromCity && route.to === toCity) ||
        (route.from === toCity && route.to === fromCity)
    )
    if (route) {
      setSelectedRoute(route)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">全国线路运价指数中心</h1>
        <p className="text-sm text-secondary mt-0.5">实时监控10万+条线路运价行情，智能分析市场趋势</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <StatCard
            key={i}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            sublabel={stat.sublabel}
            trend={stat.trend}
            gradient={stat.gradient}
          />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
              <Filter size={14} className="text-accent" />
              筛选条件
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-secondary mb-1.5 block">搜索城市</label>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="出发/到达城市"
                    className="w-full h-9 pl-8 pr-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1.5 block flex items-center gap-1">
                  <Package size={12} />
                  货类筛选
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {cargoTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setCargoFilter(type)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        cargoFilter === type
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-secondary hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1.5 block flex items-center gap-1">
                  <Truck size={12} />
                  运输模式
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {transportModes.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setModeFilter(mode)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        modeFilter === mode
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 text-secondary hover:bg-gray-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1.5 block flex items-center gap-1">
                  <Activity size={12} />
                  运价波动
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {priceTrends.map((trend) => (
                    <button
                      key={trend}
                      onClick={() => setTrendFilter(trend)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        trendFilter === trend
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 text-secondary hover:bg-gray-200'
                      }`}
                    >
                      {trend}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-secondary mb-1.5 block flex items-center gap-1">
                  <Ruler size={12} />
                  距离范围: {distanceRange[0]} - {distanceRange[1]}km
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={distanceRange[1]}
                    onChange={(e) => setDistanceRange([distanceRange[0], Number(e.target.value)])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted">
                    <span>0</span>
                    <span>2500</span>
                    <span>5000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-7 space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === 'map'
                      ? 'bg-white text-primary shadow-sm font-medium'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  <Map size={14} />
                  运价热力图
                </button>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`px-4 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === 'list'
                      ? 'bg-white text-primary shadow-sm font-medium'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  <List size={14} />
                  线路列表
                </button>
              </div>
              <span className="text-xs text-muted">
                共 <span className="text-primary font-medium">{filtered.length}</span> 条线路
              </span>
            </div>

            {activeTab === 'map' && (
              <RouteMap
                nodes={mapNodes}
                routes={mapRoutes}
                height={380}
                title=""
                onRouteClick={handleRouteMapClick}
              />
            )}

            {activeTab === 'list' && (
              <DataTable
                columns={columns}
                data={filtered}
                pageSize={8}
                onRowClick={(row) => setSelectedRoute(row)}
              />
            )}
          </div>
        </div>

        <div className="col-span-3 space-y-4">
          <Chart
            type="line"
            data={{
              labels: trendLabels,
              values: trendValues.map(Math.round),
            }}
            height={180}
            title={selectedRoute ? `${selectedRoute.from}→${selectedRoute.to} 30天运价趋势` : '30天运价趋势'}
          />

          <Chart
            type="bar"
            data={{
              labels: volumeLabels,
              values: volumeValues,
            }}
            height={160}
            title={selectedRoute ? `${selectedRoute.from}→${selectedRoute.to} 月单量` : '月单量统计'}
          />

          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-primary">运价影响因子</h3>

            <div className="space-y-2">
              <div className="flex items-start gap-3 p-2.5 bg-amber-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Sun size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-800">季节因子</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    当前季节影响度：<span className="font-semibold">+5.2%</span>
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    节假日及农产品上市期需求增加，运价上行
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <CloudRain size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-800">天气因子</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    近期天气影响：<span className="font-semibold">-1.8%</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    南方部分地区降雨，部分线路运输效率下降
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 bg-emerald-50 rounded-lg">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Users size={16} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-800">供需因子</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    供需比：<span className="font-semibold">1:1.3</span>
                  </p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    运力供应充足，货主议价能力较强
                  </p>
                </div>
              </div>
            </div>

            {selectedRoute && (
              <div className="pt-3 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-xs text-muted">基准价</p>
                    <p className="text-sm font-bold text-primary font-mono">¥{selectedRoute.basePrice.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-xs text-muted">当前价</p>
                    <p className="text-sm font-bold text-accent font-mono">¥{selectedRoute.currentPrice.toLocaleString()}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    navigate('/cargo', {
                      state: { from: selectedRoute.from, to: selectedRoute.to, price: selectedRoute.currentPrice },
                    })
                  }
                  className="w-full btn-primary text-sm flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  快速发布货源
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const width = 96
  const height = 32
  const step = width / (data.length - 1)

  const points = data.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  })

  const isUp = data[data.length - 1] >= data[0]

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={`mini-${isUp ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isUp ? '#10B981' : '#EF4444'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={isUp ? '#10B981' : '#EF4444'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points.join(' ')} ${width},${height}`}
        fill={`url(#mini-${isUp ? 'up' : 'down'})`}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={isUp ? '#10B981' : '#EF4444'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

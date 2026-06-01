import React, { useEffect, useState } from 'react'
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Package,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { api } from '@/lib/api'

interface NetworkPoint {
  id: number
  name: string
  city: string
  latitude: number
  longitude: number
  throughput: number
  capacity: number
  status: 'normal' | 'busy' | 'overloaded'
  utilization: number
  loadLevel: 'normal' | 'warning' | 'critical'
}

interface NetworkStats {
  total_networks: number
  total_throughput: number
  total_capacity: number
  overloaded: number
  busy: number
}

interface HistoryItem {
  date: string
  throughput: number
  delivered: number
  exceptions: number
}

interface NetworkData {
  networks: NetworkPoint[]
  stats: NetworkStats
}

const CHINA_MAP_PATH = 'M120,80 L180,60 L240,50 L300,55 L360,70 L420,90 L460,130 L470,180 L450,230 L400,260 L350,280 L300,290 L250,280 L200,260 L160,230 L130,190 L110,140 Z'

const getStatusColor = (status: string) => {
  switch (status) {
    case 'normal': return '#2A9D8F'
    case 'busy': return '#F4A261'
    case 'overloaded': return '#E63946'
    case 'warning': return '#F4A261'
    case 'critical': return '#E63946'
    default: return '#457B9D'
  }
}

const getHeatColor = (utilization: number) => {
  if (utilization >= 90) return '#E63946'
  if (utilization >= 70) return '#F4A261'
  if (utilization >= 50) return '#457B9D'
  return '#2A9D8F'
}

const TwinNetwork: React.FC = () => {
  const [networkData, setNetworkData] = useState<NetworkData | null>(null)
  const [historyData, setHistoryData] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegion, setSelectedRegion] = useState<string>('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [networkResult, historyResult] = await Promise.all([
          api.twin.networks(),
          api.twin.networksHistory(7),
        ])
        if (networkResult.success && networkResult.data) {
          setNetworkData(networkResult.data as NetworkData)
        }
        if (historyResult.success && historyResult.data) {
          setHistoryData(historyResult.data as HistoryItem[])
        }
      } catch (error) {
        console.error('Failed to fetch network data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredNetworks = networkData?.networks.filter(n => {
    if (selectedRegion === 'all') return true
    if (selectedRegion === 'high') return n.loadLevel === 'critical'
    if (selectedRegion === 'medium') return n.loadLevel === 'warning'
    return n.loadLevel === 'normal'
  }) || []

  const top10Networks = [...(networkData?.networks || [])]
    .sort((a, b) => b.throughput - a.throughput)
    .slice(0, 10)

  const todayThroughput = historyData.length > 0 ? historyData[historyData.length - 1]?.throughput || 0 : 0
  const yesterdayThroughput = historyData.length > 1 ? historyData[historyData.length - 2]?.throughput || 0 : 0
  const throughputChange = yesterdayThroughput > 0
    ? ((todayThroughput - yesterdayThroughput) / yesterdayThroughput * 100).toFixed(1)
    : '0'

  const statCards = [
    {
      label: '网点总数',
      value: networkData?.stats.total_networks || 0,
      icon: MapPin,
      color: 'from-sf-blue to-sf-blue/70',
      bgColor: 'bg-sf-blue/10',
      borderColor: 'border-sf-blue/30',
    },
    {
      label: '今日吞吐量',
      value: todayThroughput.toLocaleString(),
      subValue: `昨日: ${yesterdayThroughput.toLocaleString()}`,
      icon: Package,
      color: 'from-sf-red to-sf-red/70',
      bgColor: 'bg-sf-red/10',
      borderColor: 'border-sf-red/30',
      trend: Number(throughputChange) >= 0 ? 'up' : 'down',
      trendValue: `${throughputChange}%`,
    },
    {
      label: '繁忙网点',
      value: networkData?.stats.busy || 0,
      icon: Activity,
      color: 'from-sf-yellow to-sf-orange',
      bgColor: 'bg-sf-yellow/10',
      borderColor: 'border-sf-yellow/30',
    },
    {
      label: '过载网点',
      value: networkData?.stats.overloaded || 0,
      icon: AlertTriangle,
      color: 'from-sf-red to-sf-red/70',
      bgColor: 'bg-sf-red/10',
      borderColor: 'border-sf-red/30',
      pulse: true,
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
          <h1 className="text-2xl font-display text-sf-light">全国网点吞吐量</h1>
          <p className="text-sf-light/50 text-sm mt-1">实时监控全国物流网点运营状态与吞吐量分布</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-sf-green/10 border border-sf-green/30 rounded-lg">
            <RefreshCw size={14} className="text-sf-green animate-spin" />
            <span className="text-sf-green text-sm">实时同步</span>
          </div>
          <div className="text-sm text-sf-light/50 flex items-center gap-2">
            <Clock size={14} />
            <span>更新于 {new Date().toLocaleTimeString('zh-CN')}</span>
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
                {card.trend && (
                  <div className={`flex items-center gap-1 text-sm ${card.trend === 'up' ? 'text-sf-green' : 'text-sf-red'}`}>
                    {card.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{card.trendValue}</span>
                  </div>
                )}
                {card.pulse && (
                  <div className="w-3 h-3 bg-sf-red rounded-full status-pulse" />
                )}
              </div>
              <div className="mt-4">
                <div className="text-3xl font-display text-sf-light">{card.value?.toLocaleString()}</div>
                <div className="text-sf-light/50 text-sm mt-1">{card.label}</div>
                {card.subValue && (
                  <div className="text-sf-light/30 text-xs mt-1">{card.subValue}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 glass rounded-xl p-6 border border-sf-blue/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display text-sf-light">全国网点分布</h3>
              <p className="text-sf-light/50 text-sm">SVG简化版中国地图 · 网点热力分布</p>
            </div>
            <div className="flex items-center gap-2">
              {['all', 'high', 'medium', 'low'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedRegion(level)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedRegion === level
                      ? 'bg-sf-blue text-white'
                      : 'bg-sf-dark/50 text-sf-light/50 hover:text-sf-light'
                  }`}
                >
                  {level === 'all' ? '全部' : level === 'high' ? '高负荷' : level === 'medium' ? '中负荷' : '正常'}
                </button>
              ))}
            </div>
          </div>
          <div className="relative h-80 bg-sf-dark/30 rounded-xl overflow-hidden">
            <svg viewBox="0 0 600 350" className="w-full h-full">
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
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
              {filteredNetworks.map((network) => {
                const x = 60 + (network.longitude + 130) * 2.5
                const y = 40 + (50 - network.latitude) * 3.5
                const radius = Math.max(4, Math.min(12, network.throughput / 5000))
                return (
                  <g key={network.id} filter="url(#glow)">
                    <circle
                      cx={x}
                      cy={y}
                      r={radius * 2}
                      fill={getHeatColor(network.utilization)}
                      opacity="0.2"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={getHeatColor(network.utilization)}
                      className="cursor-pointer"
                    >
                      <title>
                        {network.name} - 吞吐量: {network.throughput.toLocaleString()}
                      </title>
                    </circle>
                  </g>
                )
              })}
            </svg>
            <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sf-green" />
                <span className="text-sf-light/50">正常</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sf-yellow" />
                <span className="text-sf-light/50">繁忙</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sf-red" />
                <span className="text-sf-light/50">过载</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-sf-yellow/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display text-sf-light">TOP10 网点排行</h3>
              <p className="text-sf-light/50 text-sm">按吞吐量排序</p>
            </div>
            <CheckCircle size={20} className="text-sf-yellow" />
          </div>
          <div className="space-y-3">
            {top10Networks.map((network, index) => (
              <div
                key={network.id}
                className="flex items-center gap-3 p-3 bg-sf-dark/30 rounded-lg hover:bg-sf-dark/50 transition-colors"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-display ${
                  index < 3 ? 'bg-gradient-to-br from-sf-yellow to-sf-orange text-white' : 'bg-sf-dark text-sf-light/50'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-sf-light truncate">{network.name}</div>
                  <div className="text-xs text-sf-light/50">{network.city}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-display text-sf-light">
                    {network.throughput.toLocaleString()}
                  </div>
                  <div className="text-xs" style={{ color: getStatusColor(network.loadLevel) }}>
                    {network.utilization}% 负载
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6 border border-sf-blue/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display text-sf-light">吞吐趋势</h3>
              <p className="text-sf-light/50 text-sm">近7天吞吐量走势</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-sf-red rounded-full" />
                <span className="text-sf-light/70">吞吐量</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-sf-green rounded-full" />
                <span className="text-sf-light/70">已送达</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B2D42" />
                <XAxis dataKey="date" stroke="#F1FAEE" strokeOpacity={0.5} fontSize={12} />
                <YAxis stroke="#F1FAEE" strokeOpacity={0.5} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A2E',
                    border: '1px solid #457B9D',
                    borderRadius: '8px',
                    color: '#F1FAEE',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="throughput"
                  stroke="#E63946"
                  strokeWidth={2}
                  dot={{ fill: '#E63946', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  stroke="#2A9D8F"
                  strokeWidth={2}
                  dot={{ fill: '#2A9D8F', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-sf-green/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display text-sf-light">今日/昨日对比</h3>
              <p className="text-sf-light/50 text-sm">各区域吞吐量对比</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-sf-blue rounded-full" />
                <span className="text-sf-light/70">昨日</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-sf-red rounded-full" />
                <span className="text-sf-light/70">今日</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10Networks.slice(0, 7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2B2D42" />
                <XAxis dataKey="name" stroke="#F1FAEE" strokeOpacity={0.5} fontSize={11} />
                <YAxis stroke="#F1FAEE" strokeOpacity={0.5} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A2E',
                    border: '1px solid #457B9D',
                    borderRadius: '8px',
                    color: '#F1FAEE',
                  }}
                />
                <Bar dataKey="capacity" name="昨日" fill="#457B9D" radius={[4, 4, 0, 0]} />
                <Bar dataKey="throughput" name="今日" fill="#E63946" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-6 border border-sf-dark/50">
        <h3 className="text-lg font-display text-sf-light mb-4">实时吞吐数据</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sf-light/50 text-sm">
                <th className="pb-3 font-medium">网点名称</th>
                <th className="pb-3 font-medium">所在城市</th>
                <th className="pb-3 font-medium">吞吐量</th>
                <th className="pb-3 font-medium">容量</th>
                <th className="pb-3 font-medium">利用率</th>
                <th className="pb-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {networkData?.networks.map((network) => (
                <tr key={network.id} className="border-t border-sf-dark/50 text-sm">
                  <td className="py-3 text-sf-light">{network.name}</td>
                  <td className="py-3 text-sf-light/70">{network.city}</td>
                  <td className="py-3 text-sf-light">{network.throughput.toLocaleString()}</td>
                  <td className="py-3 text-sf-light/70">{network.capacity.toLocaleString()}</td>
                  <td className="py-3">
                    <div className="w-32 bg-sf-dark/50 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${network.utilization}%`,
                          backgroundColor: getHeatColor(network.utilization),
                        }}
                      />
                    </div>
                    <span className="text-xs text-sf-light/50 ml-2">{network.utilization}%</span>
                  </td>
                  <td className="py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: `${getStatusColor(network.loadLevel)}20`,
                        color: getStatusColor(network.loadLevel),
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStatusColor(network.loadLevel) }} />
                      {network.loadLevel === 'critical' ? '过载' : network.loadLevel === 'warning' ? '繁忙' : '正常'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TwinNetwork

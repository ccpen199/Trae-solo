import React, { useEffect, useState, useMemo } from 'react'
import {
  CloudRain,
  Sun,
  Cloud,
  Wind,
  CloudLightning,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  MapPin,
  Thermometer,
  AlertOctagon,
  TrendingUp,
  Calendar,
  PieChart as PieChartIcon,
  Radar,
} from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { api } from '@/lib/api'

interface WeatherForecast {
  city: string
  weather: string
  temperature: string
  risk_level: number
  affected_routes: string[]
}

interface WeatherSummary {
  high_risk_count: number
  medium_risk_count: number
  low_risk_count: number
  normal_count: number
  affected_routes: string[]
}

interface WeatherData {
  forecast: WeatherForecast[]
  summary: WeatherSummary
}

const CHINA_MAP_PATH = 'M120,80 L180,60 L240,50 L300,55 L360,70 L420,90 L460,130 L470,180 L450,230 L400,260 L350,280 L300,290 L250,280 L200,260 L160,230 L130,190 L110,140 Z'

const getRiskColor = (level: number) => {
  switch (level) {
    case 3: return '#E63946'
    case 2: return '#F4A261'
    case 1: return '#457B9D'
    case 0: return '#2A9D8F'
    default: return '#457B9D'
  }
}

const getRiskLabel = (level: number) => {
  switch (level) {
    case 3: return '高风险'
    case 2: return '中风险'
    case 1: return '低风险'
    case 0: return '正常'
    default: return '未知'
  }
}

const getWeatherIcon = (weather: string) => {
  if (weather.includes('雨') || weather.includes('雷')) return CloudLightning
  if (weather.includes('雾') || weather.includes('沙尘')) return Wind
  if (weather.includes('云') || weather.includes('阴')) return Cloud
  return Sun
}

const getWeatherColor = (weather: string) => {
  if (weather.includes('雨') || weather.includes('雷')) return '#E63946'
  if (weather.includes('雾') || weather.includes('沙尘')) return '#F4A261'
  if (weather.includes('云') || weather.includes('阴')) return '#457B9D'
  return '#2A9D8F'
}

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  '北京': { lat: 39.9, lng: 116.4 },
  '上海': { lat: 31.2, lng: 121.5 },
  '广州': { lat: 23.1, lng: 113.3 },
  '深圳': { lat: 22.5, lng: 114.1 },
  '杭州': { lat: 30.3, lng: 120.2 },
  '成都': { lat: 30.7, lng: 104.1 },
  '武汉': { lat: 30.6, lng: 114.3 },
  '西安': { lat: 34.3, lng: 108.9 },
}

const TwinWeather: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<number | 'all'>('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.twin.weather()
        if (result.success && result.data) {
          setWeatherData(result.data as WeatherData)
        }
      } catch (error) {
        console.error('Failed to fetch weather data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredForecast = useMemo(() => {
    if (!weatherData) return []
    if (selectedRiskLevel === 'all') return weatherData.forecast
    return weatherData.forecast.filter(f => f.risk_level === selectedRiskLevel)
  }, [weatherData, selectedRiskLevel])

  const riskDistribution = useMemo(() => {
    const summary = weatherData?.summary || {
      high_risk_count: 0,
      medium_risk_count: 0,
      low_risk_count: 0,
      normal_count: 0,
    }
    return [
      { name: '高风险', value: summary.high_risk_count, color: '#E63946' },
      { name: '中风险', value: summary.medium_risk_count, color: '#F4A261' },
      { name: '低风险', value: summary.low_risk_count, color: '#457B9D' },
      { name: '正常', value: summary.normal_count, color: '#2A9D8F' },
    ]
  }, [weatherData])

  const radarData = useMemo(() => {
    return weatherData?.forecast.map(f => ({
      city: f.city,
      延误风险: f.risk_level * 33 + Math.random() * 10,
      天气影响: f.risk_level >= 2 ? 80 : 40,
      线路影响: f.affected_routes.length * 25,
      历史延误: f.risk_level * 25 + 20,
    })) || []
  }, [weatherData])

  const affectedRouteStats = useMemo(() => {
    const routeCount: Record<string, number> = {}
    weatherData?.forecast.forEach(f => {
      f.affected_routes.forEach(route => {
        routeCount[route] = (routeCount[route] || 0) + 1
      })
    })
    return Object.entries(routeCount)
      .map(([name, count]) => ({ name, count, risk: count * 33 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [weatherData])

  const sevenDayForecast = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      days.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        day: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()],
        risk_level: Math.floor(Math.random() * 4),
        affected_routes: Math.floor(Math.random() * 5),
        delay_probability: Math.floor(Math.random() * 60) + 20,
      })
    }
    return days
  }, [])

  const highRiskCities = useMemo(() => {
    return weatherData?.forecast.filter(f => f.risk_level >= 2) || []
  }, [weatherData])

  const statCards = [
    {
      label: '高风险城市',
      value: weatherData?.summary.high_risk_count || 0,
      icon: AlertOctagon,
      color: 'from-sf-red to-sf-red/70',
      bgColor: 'bg-sf-red/10',
      borderColor: 'border-sf-red/30',
      pulse: (weatherData?.summary.high_risk_count || 0) > 0,
    },
    {
      label: '受影响线路',
      value: weatherData?.summary.affected_routes.length || 0,
      icon: MapPin,
      color: 'from-sf-yellow to-sf-orange',
      bgColor: 'bg-sf-yellow/10',
      borderColor: 'border-sf-yellow/30',
    },
    {
      label: '中风险城市',
      value: weatherData?.summary.medium_risk_count || 0,
      icon: AlertTriangle,
      color: 'from-sf-yellow to-sf-orange',
      bgColor: 'bg-sf-yellow/10',
      borderColor: 'border-sf-yellow/30',
    },
    {
      label: '正常城市',
      value: weatherData?.summary.normal_count || 0,
      icon: CheckCircle,
      color: 'from-sf-green to-sf-green/70',
      bgColor: 'bg-sf-green/10',
      borderColor: 'border-sf-green/30',
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
          <h1 className="text-2xl font-display text-sf-light">天气延误风险预测</h1>
          <p className="text-sf-light/50 text-sm mt-1">全国天气状况与物流延误风险实时监控</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-sf-green/10 border border-sf-green/30 rounded-lg">
            <RefreshCw size={14} className="text-sf-green animate-spin" />
            <span className="text-sf-green text-sm">气象同步中</span>
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

      {highRiskCities.length > 0 && (
        <div className="glass rounded-xl p-6 border border-sf-red/30">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-sf-red" />
            <h3 className="text-lg font-display text-sf-light">天气预警卡片</h3>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {highRiskCities.map((city, index) => {
              const WeatherIcon = getWeatherIcon(city.weather)
              return (
                <div
                  key={index}
                  className="relative overflow-hidden p-4 rounded-xl border"
                  style={{
                    backgroundColor: `${getRiskColor(city.risk_level)}10`,
                    borderColor: `${getRiskColor(city.risk_level)}40`,
                  }}
                >
                  <div
                    className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
                    style={{ backgroundColor: getRiskColor(city.risk_level) }}
                  />
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-lg font-display text-sf-light">{city.city}</div>
                        <div className="text-sm text-sf-light/50 mt-0.5">{city.weather}</div>
                      </div>
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${getWeatherColor(city.weather)}20` }}
                      >
                        <WeatherIcon size={20} style={{ color: getWeatherColor(city.weather) }} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Thermometer size={14} className="text-sf-light/50" />
                      <span className="text-sm text-sf-light">{city.temperature}</span>
                    </div>
                    <div className="mt-2">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
                        style={{
                          backgroundColor: `${getRiskColor(city.risk_level)}20`,
                          color: getRiskColor(city.risk_level),
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getRiskColor(city.risk_level) }} />
                        {getRiskLabel(city.risk_level)}
                      </span>
                    </div>
                    {city.affected_routes.length > 0 && (
                      <div className="mt-2 text-xs text-sf-light/50">
                        影响线路: {city.affected_routes.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 glass rounded-xl p-6 border border-sf-blue/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display text-sf-light">全国天气状况</h3>
              <p className="text-sf-light/50 text-sm">主要城市天气与风险分布</p>
            </div>
            <div className="flex items-center gap-2">
              {['all', 3, 2, 1, 0].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedRiskLevel(level as number | 'all')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedRiskLevel === level
                      ? 'bg-sf-blue text-white'
                      : 'bg-sf-dark/50 text-sf-light/50 hover:text-sf-light'
                  }`}
                >
                  {level === 'all' ? '全部' : getRiskLabel(level as number)}
                </button>
              ))}
            </div>
          </div>
          <div className="relative h-80 bg-sf-dark/30 rounded-xl overflow-hidden">
            <svg viewBox="0 0 600 350" className="w-full h-full">
              <defs>
                <filter id="weatherGlow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
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
              {filteredForecast.map((item) => {
                const coord = cityCoordinates[item.city] || { lat: 35, lng: 110 }
                const x = 60 + (coord.lng + 130) * 2.5
                const y = 40 + (50 - coord.lat) * 3.5
                const WeatherIcon = getWeatherIcon(item.weather)
                const iconColor = getWeatherColor(item.weather)
                return (
                  <g key={item.city} filter="url(#weatherGlow)">
                    <circle
                      cx={x}
                      cy={y}
                      r={item.risk_level * 4 + 12}
                      fill={getRiskColor(item.risk_level)}
                      opacity="0.15"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={item.risk_level * 2 + 8}
                      fill={getRiskColor(item.risk_level)}
                      opacity="0.25"
                    />
                    <foreignObject x={x - 14} y={y - 14} width={28} height={28}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${iconColor}30` }}>
                        <WeatherIcon size={16} style={{ color: iconColor }} />
                      </div>
                    </foreignObject>
                    <text
                      x={x}
                      y={y + 28}
                      textAnchor="middle"
                      fill="#F1FAEE"
                      fontSize="11"
                      opacity="0.8"
                    >
                      {item.city}
                    </text>
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
                <div className="w-3 h-3 rounded-full bg-sf-blue" />
                <span className="text-sf-light/50">低风险</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sf-yellow" />
                <span className="text-sf-light/50">中风险</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-sf-red" />
                <span className="text-sf-light/50">高风险</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-xl p-6 border border-sf-yellow/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-display text-sf-light">风险等级分布</h3>
                <p className="text-sf-light/50 text-sm">城市风险占比</p>
              </div>
              <PieChartIcon size={20} className="text-sf-yellow" />
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
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
            <div className="space-y-2 mt-2">
              {riskDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-sf-light/70">{item.name}</span>
                  <span className="text-sm font-display text-sf-light ml-auto">{item.value} 城</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-6 border border-sf-blue/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-display text-sf-light">风险分布雷达图</h3>
                <p className="text-sf-light/50 text-sm">多维度风险评估</p>
              </div>
              <Radar size={20} className="text-sf-blue" />
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData.slice(0, 6)}>
                  <PolarGrid stroke="#2B2D42" />
                  <PolarAngleAxis dataKey="city" stroke="#F1FAEE" strokeOpacity={0.5} fontSize={10} />
                  <PolarRadiusAxis stroke="#F1FAEE" strokeOpacity={0.3} fontSize={10} />
                  <RechartsRadar name="延误风险" dataKey="延误风险" stroke="#E63946" fill="#E63946" fillOpacity={0.3} />
                  <RechartsRadar name="天气影响" dataKey="天气影响" stroke="#F4A261" fill="#F4A261" fillOpacity={0.2} />
                  <RechartsRadar name="线路影响" dataKey="线路影响" stroke="#457B9D" fill="#457B9D" fillOpacity={0.2} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1A1A2E',
                      border: '1px solid #457B9D',
                      borderRadius: '8px',
                      color: '#F1FAEE',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6 border border-sf-green/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display text-sf-light">受影响线路统计</h3>
              <p className="text-sf-light/50 text-sm">按受影响次数排序</p>
            </div>
            <MapPin size={20} className="text-sf-green" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={affectedRouteStats} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#2B2D42" />
                <XAxis type="number" stroke="#F1FAEE" strokeOpacity={0.5} fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#F1FAEE" strokeOpacity={0.5} fontSize={11} width={90} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A2E',
                    border: '1px solid #457B9D',
                    borderRadius: '8px',
                    color: '#F1FAEE',
                  }}
                />
                <Bar dataKey="count" name="受影响次数" radius={[0, 4, 4, 0]}>
                  {affectedRouteStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.risk >= 66 ? '#E63946' : entry.risk >= 33 ? '#F4A261' : '#457B9D'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border border-sf-red/30">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-display text-sf-light">未来7天预测</h3>
              <p className="text-sf-light/50 text-sm">延误概率趋势</p>
            </div>
            <Calendar size={20} className="text-sf-red" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sevenDayForecast}>
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
                <Legend />
                <Line
                  type="monotone"
                  dataKey="delay_probability"
                  name="延误概率(%)"
                  stroke="#E63946"
                  strokeWidth={2}
                  dot={{ fill: '#E63946', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="affected_routes"
                  name="受影响线路"
                  stroke="#457B9D"
                  strokeWidth={2}
                  dot={{ fill: '#457B9D', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-6 border border-sf-dark/50">
        <h3 className="text-lg font-display text-sf-light mb-4">历史延误统计</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sf-light/50 text-sm">
                <th className="pb-3 font-medium">城市</th>
                <th className="pb-3 font-medium">天气</th>
                <th className="pb-3 font-medium">温度</th>
                <th className="pb-3 font-medium">风险等级</th>
                <th className="pb-3 font-medium">延误概率</th>
                <th className="pb-3 font-medium">受影响线路</th>
              </tr>
            </thead>
            <tbody>
              {weatherData?.forecast.map((item, index) => (
                <tr key={index} className="border-t border-sf-dark/50 text-sm">
                  <td className="py-3 text-sf-light">{item.city}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {React.createElement(getWeatherIcon(item.weather), {
                        size: 16,
                        style: { color: getWeatherColor(item.weather) },
                      })}
                      <span className="text-sf-light/70">{item.weather}</span>
                    </div>
                  </td>
                  <td className="py-3 text-sf-light/70">{item.temperature}</td>
                  <td className="py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                      style={{
                        backgroundColor: `${getRiskColor(item.risk_level)}20`,
                        color: getRiskColor(item.risk_level),
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getRiskColor(item.risk_level) }} />
                      {getRiskLabel(item.risk_level)}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="w-24 bg-sf-dark/50 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${item.risk_level * 25 + 20}%`,
                          backgroundColor: getRiskColor(item.risk_level),
                        }}
                      />
                    </div>
                    <span className="text-xs text-sf-light/50 ml-2">{item.risk_level * 25 + 20}%</span>
                  </td>
                  <td className="py-3 text-sf-light/70">
                    {item.affected_routes.length > 0 ? item.affected_routes.join(', ') : '-'}
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

export default TwinWeather

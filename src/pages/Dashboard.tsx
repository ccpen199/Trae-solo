import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { TrendingUp, MapPin } from 'lucide-react'

interface ActivityItem {
  module: string
  views: number
  interactions: number
}

interface HeatmapItem {
  name: string
  value: number
}

interface ChartDay {
  day: string
  news: number
  circles: number
  shop: number
  match: number
  events: number
}

const MODULE_COLORS: Record<string, string> = {
  news: '#C4533A',
  circles: '#2D5A7B',
  shop: '#E8B44D',
  match: '#C4533A',
  events: '#5A8F5A',
}

const MODULE_LABELS: Record<string, string> = {
  news: '资讯',
  circles: '圈子',
  shop: '商城',
  match: '婚恋',
  events: '活动',
}

export default function Dashboard() {
  const [chartData, setChartData] = useState<ChartDay[]>([])
  const [heatmapData, setHeatmapData] = useState<HeatmapItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/activity')
        .then((res) => res.json())
        .then((data) => data.data || [])
        .catch(() => [
          { module: 'news', views: 1250, interactions: 320 },
          { module: 'circles', views: 890, interactions: 210 },
          { module: 'shop', views: 1560, interactions: 450 },
          { module: 'match', views: 720, interactions: 180 },
          { module: 'events', views: 540, interactions: 130 },
        ]),
      fetch('/api/dashboard/heatmap')
        .then((res) => res.json())
        .then((data) => data.data || [])
        .catch(() => [
          { name: '蒙自市', value: 92 },
          { name: '个旧市', value: 68 },
          { name: '开远市', value: 55 },
          { name: '建水县', value: 75 },
          { name: '石屏县', value: 42 },
          { name: '弥勒市', value: 63 },
          { name: '泸西县', value: 38 },
          { name: '元阳县', value: 48 },
          { name: '红河县', value: 25 },
          { name: '金平县', value: 30 },
          { name: '绿春县', value: 22 },
          { name: '屏边县', value: 28 },
          { name: '河口县', value: 35 },
        ]),
    ]).then(([activityData, heatmap]) => {
      const baseValues: Record<string, number> = {}
      activityData.forEach((item: ActivityItem) => {
        baseValues[item.module] = item.interactions
      })
      const days: ChartDay[] = []
      const today = new Date()
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const month = d.getMonth() + 1
        const day = d.getDate()
        const factor = 0.7 + Math.random() * 0.6
        days.push({
          day: `${month}/${day}`,
          news: Math.round((baseValues.news || 300) * factor),
          circles: Math.round((baseValues.circles || 200) * factor),
          shop: Math.round((baseValues.shop || 400) * factor),
          match: Math.round((baseValues.match || 180) * factor),
          events: Math.round((baseValues.events || 130) * factor),
        })
      }
      setChartData(days)
      setHeatmapData(heatmap)
      setLoading(false)
    })
  }, [])

  const getHeatmapBgClass = (value: number) => {
    if (value < 30) return 'bg-honghe-red/10'
    if (value < 60) return 'bg-honghe-red/30'
    if (value < 80) return 'bg-honghe-red/50'
    return 'bg-honghe-red/70'
  }

  const getHeatmapTextClass = (value: number) => {
    if (value >= 60) return 'text-white'
    return 'text-warm-800'
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="section-title mb-6">数据看板</h1>

      {loading ? (
        <div className="space-y-6">
          <div className="card-static p-6 animate-pulse">
            <div className="h-6 bg-warm-100 rounded w-1/3 mb-4" />
            <div className="h-72 bg-warm-100 rounded" />
          </div>
          <div className="card-static p-6 animate-pulse">
            <div className="h-6 bg-warm-100 rounded w-1/3 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-24 bg-warm-100 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="card-static p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-honghe-red" />
              <h2 className="font-medium text-warm-800">近7天模块互动趋势</h2>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE5DB" />
                  <XAxis dataKey="day" stroke="#9A7B5E" fontSize={12} />
                  <YAxis stroke="#9A7B5E" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #EDE5DB',
                      borderRadius: '8px',
                      color: '#3D3532',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="news" name={MODULE_LABELS.news} stroke={MODULE_COLORS.news} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="circles" name={MODULE_LABELS.circles} stroke={MODULE_COLORS.circles} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="shop" name={MODULE_LABELS.shop} stroke={MODULE_COLORS.shop} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="match" name={MODULE_LABELS.match} stroke="#D4725E" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="events" name={MODULE_LABELS.events} stroke={MODULE_COLORS.events} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-static p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-honghe-red" />
              <h2 className="font-medium text-warm-800">地域热力分布</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {heatmapData.map((item) => (
                <div
                  key={item.name}
                  className={`card-static p-4 ${getHeatmapBgClass(item.value)} transition-all`}
                >
                  <div className={`font-medium mb-1 ${getHeatmapTextClass(item.value)}`}>
                    {item.name}
                  </div>
                  <div className={`text-2xl font-bold ${getHeatmapTextClass(item.value)}`}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

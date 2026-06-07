import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import Chart from '@/components/Chart'
import StatCard from '@/components/StatCard'
import { api } from '@/utils/api'

interface ForecastData {
  labels: string[]
  volumes: number[]
  predicted: number[]
}

interface ApiForecastData {
  labels?: string[]
  volumes?: number[]
  predicted?: number[]
  forecasts?: { date: string; volume: number; upper?: number; lower?: number }[]
}

const defaultForecast: ForecastData = {
  labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  volumes: [12500, 11800, 14200, 15800, 16200, 17500, 0, 0, 0, 0, 0, 0],
  predicted: [12500, 11800, 14200, 15800, 16200, 17500, 19200, 18800, 20500, 22000, 23800, 25600],
}

const routeForecasts = [
  { route: '上海→杭州', current: 3200, predicted: 3800, change: 18.8 },
  { route: '广州→深圳', current: 2800, predicted: 3100, change: 10.7 },
  { route: '北京→天津', current: 2400, predicted: 2200, change: -8.3 },
  { route: '武汉→长沙', current: 1800, predicted: 2500, change: 38.9 },
  { route: '成都→重庆', current: 2100, predicted: 2300, change: 9.5 },
  { route: '郑州→武汉', current: 1500, predicted: 1800, change: 20.0 },
]

const cargoTypeForecast = {
  labels: ['建材', '生鲜', '冷链', '大件', '电子', '化工'],
  values: [3200, 2800, 1900, 1500, 1200, 800],
}

export default function Forecast() {
  const [forecast, setForecast] = useState<ForecastData>(defaultForecast)

  useEffect(() => {
    api.get<ApiForecastData>('/admin/forecast')
      .then((data) => {
        if (Array.isArray(data.labels) && Array.isArray(data.volumes) && Array.isArray(data.predicted)) {
          setForecast({ labels: data.labels, volumes: data.volumes, predicted: data.predicted })
          return
        }
        if (Array.isArray(data.forecasts)) {
          const labels = data.forecasts.slice(0, 12).map((item) => item.date.slice(5))
          const predicted = data.forecasts.slice(0, 12).map((item) => item.volume)
          setForecast({
            labels,
            volumes: predicted.map((value, index) => (index < 6 ? value : 0)),
            predicted,
          })
        }
      })
      .catch(() => {})
  }, [])

  const totalPredicted = forecast.predicted.filter((_, i) => i >= 6).reduce((s, v) => s + v, 0)
  const avgGrowth = routeForecasts.reduce((s, r) => s + r.change, 0) / routeForecasts.length
  const upRoutes = routeForecasts.filter((r) => r.change > 0).length

  const actualLine = {
    labels: forecast.labels,
    values: forecast.volumes,
  }

  const predictedLine = {
    labels: forecast.labels,
    values: forecast.predicted,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">预测看板</h1>
        <p className="text-sm text-secondary mt-0.5">基于 AI 的货运量趋势预测</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<BarChart3 size={20} />}
          value={totalPredicted.toLocaleString()}
          label="下半年预测总量"
          trend={{ value: 15.2, positive: true }}
          gradient="gradient-primary"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          value={`${avgGrowth.toFixed(1)}%`}
          label="平均增长率"
          trend={{ value: avgGrowth, positive: avgGrowth > 0 }}
          gradient="gradient-accent"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          value={upRoutes}
          label="增长线路"
          gradient="gradient-mint"
        />
        <StatCard
          icon={<TrendingDown size={20} />}
          value={routeForecasts.length - upRoutes}
          label="下降线路"
          gradient="gradient-coral"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Chart
          type="line"
          data={{
            labels: forecast.labels,
            values: forecast.predicted,
          }}
          height={280}
          title="货运量趋势预测 (吨)"
        />
        <Chart
          type="bar"
          data={cargoTypeForecast}
          height={280}
          title="货物类型预测分布"
        />
      </div>

      <div className="card">
        <h3 className="text-sm font-semibold text-primary mb-4">线路预测排行</h3>
        <div className="grid grid-cols-3 gap-4">
          {routeForecasts.map((rf) => (
            <div key={rf.route} className="p-4 rounded-lg border border-border hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-primary">{rf.route}</span>
                <span
                  className={`flex items-center gap-1 text-xs font-medium ${
                    rf.change > 0 ? 'text-mint' : 'text-coral'
                  }`}
                >
                  {rf.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {rf.change > 0 ? '+' : ''}{rf.change}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-secondary">当前</p>
                  <p className="text-sm font-mono font-semibold text-primary">{rf.current.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-secondary">预测</p>
                  <p className="text-sm font-mono font-semibold text-accent">{rf.predicted.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${rf.change > 0 ? 'bg-mint' : 'bg-coral'}`}
                  style={{ width: `${Math.min((rf.predicted / 5000) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNearbyNews, updateLocation } from '../api/client'
import { useApp } from '../context/AppContext'
import { formatDistance, formatTime, getCredibilityLabel } from '../hooks'

const radiusOptions = [
  { value: 0.5, label: '500m' },
  { value: 1, label: '1km' },
  { value: 3, label: '3km' },
  { value: 5, label: '5km' },
  { value: 10, label: '10km' },
]

interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  credibility_score: number
  distance: number
  created_at: string
  category: string
}

export default function NearbyNews() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [radius, setRadius] = useState(5)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const navigate = useNavigate()
  const { location, requestLocation, showToast } = useApp()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const loc = location?.status === 'granted' ? location : { lat: 39.9042, lng: 116.4074 }
      const res = await getNearbyNews(loc.lat, loc.lng, radius, page, 20)
      const items = res.data?.items ?? res.data?.data ?? res.data ?? []
      setNews(items)
      setTotal(res.data?.total ?? items.length)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [radius, page, location])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRequestLocation = async () => {
    const result = await requestLocation()
    if (result) {
      try {
        await updateLocation({ latitude: result.lat, longitude: result.lng, accuracy: result.accuracy })
        showToast(`位置已同步！精度 ${Math.round(result.accuracy || 0)}m`, 'success')
      } catch {
        showToast('位置保存失败', 'error')
      }
      loadData()
    }
  }

  const maxDistance = news.length > 0 ? Math.max(...news.map((n) => n.distance), 1) : 1

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">附近热点</h2>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                location?.status === 'granted'
                  ? 'bg-green-500'
                  : location?.status === 'pending'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-gray-400'
              }`}
            ></span>
            {location?.status === 'granted'
              ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}${location.accuracy ? ` (±${Math.round(location.accuracy)}m)` : ''}`
              : location?.status === 'pending'
              ? '定位中...'
              : '未定位'}
            {location?.status === 'denied' && (
              <button onClick={handleRequestLocation} className="text-primary hover:underline ml-2">
                授权定位
              </button>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRequestLocation}
            className="btn-secondary text-sm flex items-center gap-1.5"
          >
            📍 刷新位置
          </button>
          <button onClick={loadData} className="btn-primary text-sm flex items-center gap-1.5">
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            刷新资讯
          </button>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-700">距离范围</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {radiusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setRadius(opt.value)
                setPage(1)
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                radius === opt.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4 mb-6 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">📊 统计</span>
          <span className="text-primary font-semibold">
            {total}条资讯 在{radius >= 1 ? `${radius}km` : `${radius * 1000}m`}内
          </span>
        </div>
      </div>

      <div className="relative mb-6 bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl p-8 overflow-hidden min-h-[200px]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border-2 border-dashed border-primary/20 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs text-primary font-bold">你</span>
              </div>
            </div>
          </div>
          {!loading &&
            news.slice(0, 8).map((item, i) => {
              const angle = (i / Math.min(news.length, 8)) * 2 * Math.PI
              const dist = Math.min(item.distance / maxDistance, 1)
              const x = 50 + dist * 40 * Math.cos(angle)
              const y = 50 + dist * 40 * Math.sin(angle)
              return (
                <div
                  key={item.id}
                  className="absolute w-3 h-3 rounded-full bg-primary/60 cursor-pointer hover:bg-primary hover:scale-150 transition-all"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  title={`${item.title} - ${formatDistance(item.distance)}`}
                  onClick={() => navigate(`/news/${item.id}`)}
                />
              )
            })}
        </div>
        <div className="absolute bottom-3 right-3 text-xs text-gray-400">示意图（非精确地图）</div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : news.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {news.map((item) => {
            const cred = getCredibilityLabel(item.credibility_score)
            const isHot =
              item.credibility_score >= 0.8 &&
              new Date(item.created_at).getTime() > Date.now() - 3600000
            return (
              <div
                key={item.id}
                onClick={() => navigate(`/news/${item.id}`)}
                className="card p-4 cursor-pointer hover:border-primary/30 group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  {isHot && <span className="badge-hot shrink-0">突发</span>}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.summary}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <span>{item.source}</span>
                    <span className={`badge ${cred.color}`}>{cred.text}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary font-medium">{formatDistance(item.distance)}</span>
                    <span>{formatTime(item.created_at)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>
            {radius >= 1 ? `${radius}km` : `${radius * 1000}m`}范围内暂无资讯
          </p>
        </div>
      )}
    </div>
  )
}

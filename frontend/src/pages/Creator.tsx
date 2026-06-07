import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCreators } from '../api/client'
import { formatNumber, getLevelStars } from '../hooks'

export default function Creator() {
  const [creators, setCreators] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    const params: any = {}
    if (levelFilter !== 'all') params.min_level = Number(levelFilter)
    if (verifiedOnly) params.verified = true
    getCreators(params)
      .then((res) => setCreators(res.data?.items ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [levelFilter, verifiedOnly])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">创作者</h2>
        <button onClick={() => navigate('/creators/apply')} className="btn-primary text-sm">
          ✨ 申请成为创作者
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-wrap gap-2">
            {['all', '1', '3', '5', '7', '9'].map((val) => (
              <button
                key={val}
                onClick={() => setLevelFilter(val)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  levelFilter === val ? 'bg-primary text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {val === 'all' ? '全部等级' : `Lv.${val}+`}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 sm:ml-auto cursor-pointer">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-600">仅认证创作者</span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : creators.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/creators/${item.id}`)}
              className="card p-5 cursor-pointer hover:border-primary/30 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-lg font-bold text-primary">
                  {(item.name || 'C')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">
                      {item.name}
                    </h3>
                    {item.verified && (
                      <span className="badge-verified text-[10px]">✓ 认证</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-yellow-500 text-xs">{getLevelStars(item.level ?? 1)}</span>
                    <span className="text-xs text-gray-400 ml-1">Lv.{item.level ?? 1}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(item.follower_count ?? 0)}</p>
                  <p className="text-[10px] text-gray-400">粉丝</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(item.view_count ?? 0)}</p>
                  <p className="text-[10px] text-gray-400">浏览</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">{((item.originality_coefficient ?? 0) * 100).toFixed(0)}%</p>
                  <p className="text-[10px] text-gray-400">原创度</p>
                </div>
              </div>

              {item.bio && (
                <p className="text-xs text-gray-500 line-clamp-2">{item.bio}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">✨</p>
          <p>暂无创作者</p>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, Award, TrendingUp, Loader2, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import api from '../utils/api'

dayjs.locale('zh-cn')

const creatorLevels: Record<number, { id: number; name: string; color: string; tipRate: number; adRate: number; minScore: number; maxScore?: number; perks: string[] }> = {
  0: { id: 0, name: '新手创作者', color: 'bg-gray-100 text-gray-600', tipRate: 0.7, adRate: 0.3, minScore: 0, maxScore: 99, perks: ['基础打赏功能'] },
  1: { id: 1, name: '活跃创作者', color: 'bg-green-100 text-green-600', tipRate: 0.5, adRate: 0.5, minScore: 100, maxScore: 499, perks: ['基础打赏功能', '广告分成'] },
  2: { id: 2, name: '优质创作者', color: 'bg-blue-100 text-blue-600', tipRate: 0.65, adRate: 0.65, minScore: 500, maxScore: 1999, perks: ['基础打赏功能', '广告分成', '优质标识'] },
  3: { id: 3, name: '精品创作者', color: 'bg-purple-100 text-purple-600', tipRate: 0.75, adRate: 0.75, minScore: 2000, maxScore: 9999, perks: ['基础打赏功能', '广告分成', '优质标识', '优先推荐'] },
  4: { id: 4, name: '顶级创作者', color: 'bg-amber-100 text-amber-600', tipRate: 0.85, adRate: 0.85, minScore: 10000, perks: ['基础打赏功能', '广告分成', '优质标识', '优先推荐', '专属客服'] },
}

export default function EarningsPage() {
  const [stats, setStats] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/earnings/my').catch(() => ({ data: { code: -1, data: {} } })),
      api.get('/api/earnings/records', { params: { pageSize: 20 } }).catch(() => ({ data: { code: -1, data: { list: [] } } })),
    ]).then(([statsRes, recordsRes]) => {
      if (statsRes.data.code === 0) {
        setStats(statsRes.data.data)
      }
      if (recordsRes.data.code === 0) {
        setRecords(recordsRes.data.data.list || recordsRes.data.data || [])
      }
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    )
  }

  const level = creatorLevels[stats?.creator_level || 0] || creatorLevels[0]
  const nextLevel = creatorLevels[(stats?.creator_level || 0) + 1]
  const progress = nextLevel
    ? Math.min(100, ((stats?.creator_score || 0) - level.minScore) / (nextLevel.minScore - level.minScore) * 100)
    : 100

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">创作收益</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <DollarSign className="w-4 h-4" />总收益
          </div>
          <div className="text-2xl font-bold text-gray-900">¥{(stats?.total_earnings || 0).toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />打赏收益
          </div>
          <div className="text-2xl font-bold text-gray-900">¥{(stats?.tip_earnings || 0).toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Award className="w-4 h-4" />广告收益
          </div>
          <div className="text-2xl font-bold text-gray-900">¥{(stats?.ad_earnings || 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">创作者等级</h3>
          <Link to="/profile" className="text-sm text-primary-600 hover:underline">
            <span className="flex items-center gap-1">查看详情 <ChevronRight className="w-4 h-4" /></span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${level.color.split(' ')[0]}`}>
            <Award className={`w-6 h-6 ${level.color.split(' ')[1]}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-semibold ${level.color.split(' ')[1]}`}>{level.name}</span>
              <span className="text-xs text-gray-400">Lv.{level.id}</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              打赏分成 {Math.round(level.tipRate * 100)}% · 广告分成 {Math.round(level.adRate * 100)}%
            </div>
            {nextLevel && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-gray-400">
                  {stats?.creator_score || 0}/{nextLevel.minScore}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">等级权益</h3>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {level.perks.map(perk => (
            <div key={perk} className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {perk}
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">收益记录</h3>
        </div>
        {records.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">暂无收益记录</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {records.map((record: any) => (
              <div key={record.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-900">
                    {record.earning_type === 'tip' ? '收到打赏' : '广告收益'}
                    {record.content_title && (
                      <span className="text-gray-400"> 「{record.content_title}」</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">{dayjs(record.created_at).format('YYYY-MM-DD HH:mm')}</div>
                </div>
                <div className="text-sm font-medium text-green-600">+¥{(record.amount || record.revenue || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

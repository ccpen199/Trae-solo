import { useState, useEffect } from 'react'
import { api } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { Star, TrendingUp, Users, Award, Loader2 } from 'lucide-react'

interface CreditData {
  credit_score: number
  avg_rating: number
  fulfillment_rate: number
  review_count: number
}

interface Review {
  id: number
  from_user: string
  to_user: string
  rating: number
  comment: string
  created_at: string
}

export default function CreditPage() {
  const { user } = useAuthStore()
  const [credit, setCredit] = useState<CreditData | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user?.id) return
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        const [creditRes, historyRes] = await Promise.all([
          api.get<Record<string, unknown>>(`/api/credit/${user.id}`),
          api.get<Record<string, unknown>>(`/api/credit/${user.id}/history`),
        ]) as [Record<string, unknown>, Record<string, unknown>]
        const cd = (creditRes.data ?? creditRes) as CreditData | null
        setCredit(cd && typeof cd === 'object' && 'credit_score' in cd ? cd : null)
        const hd = historyRes.data ?? historyRes
        setReviews(Array.isArray(hd) ? (hd as Review[]) : [])
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '获取信用数据失败'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user?.id])

  const score = credit?.credit_score ?? 0
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const arcLength = (270 / 360) * circumference

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        加载中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1B2A4A]">信用评价</h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-8 shadow-sm lg:col-span-1">
          <div className="relative flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="12"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(135 100 100)"
              />
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#E8722A"
                strokeWidth="12"
                strokeDasharray={`${(score / 1000) * arcLength} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(135 100 100)"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-bold text-[#1B2A4A]">{score}</span>
              <span className="text-sm text-gray-400">信用分</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <div className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8722A]/10">
              <Award className="h-6 w-6 text-[#E8722A]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">信用分</p>
              <p className="text-2xl font-bold text-[#1B2A4A]">{credit?.credit_score ?? '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B2A4A]/10">
              <Star className="h-6 w-6 text-[#1B2A4A]" />
            </div>
            <div>
              <p className="text-sm text-gray-500">平均评分</p>
              <p className="text-2xl font-bold text-[#1B2A4A]">{credit?.avg_rating?.toFixed(1) ?? '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">履约率</p>
              <p className="text-2xl font-bold text-[#1B2A4A]">
                {credit?.fulfillment_rate != null ? `${credit.fulfillment_rate}%` : '-'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
              <Users className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">评价数</p>
              <p className="text-2xl font-bold text-[#1B2A4A]">{credit?.review_count ?? '-'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-[#1B2A4A]">评价历史</h3>
        {reviews.length === 0 ? (
          <div className="py-12 text-center text-gray-400">暂无评价记录</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="flex items-start gap-4 rounded-lg border border-gray-100 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B2A4A]/10 text-sm font-medium text-[#1B2A4A]">
                  {r.from_user.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1B2A4A]">{r.from_user}</span>
                    <span className="text-xs text-gray-400">{r.created_at}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < r.rating ? 'fill-[#E8722A] text-[#E8722A]' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-gray-600">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

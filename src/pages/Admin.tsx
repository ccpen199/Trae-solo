import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Briefcase, Users, UserCheck, Clock, CheckCircle, XCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { fetchApi } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Stats {
  totalCases: number
  approvedCases: number
  pendingCases: number
  totalDesigners: number
  totalUsers: number
  totalFavorites: number
  totalAppointments: number
  totalViews: number
  [key: string]: number
}

interface PendingCase {
  id: string
  title: string
  designerName: string
  createdAt: string
  watermarkVerified: boolean
}

interface PendingResponse {
  list: PendingCase[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

interface TrendsData {
  cases: { date: string; count: number }[]
  appointments: { date: string; count: number }[]
  favorites: { date: string; count: number }[]
}

const STATS_CARDS = [
  { key: 'totalCases', label: '总案例数', icon: Briefcase, color: 'text-sand-400' },
  { key: 'totalDesigners', label: '设计师数', icon: UserCheck, color: 'text-sage-400' },
  { key: 'totalUsers', label: '用户数', icon: Users, color: 'text-sand-500' },
  { key: 'pendingCases', label: '待审核', icon: Clock, color: 'text-sand-600' },
] as const

export default function Admin() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [pending, setPending] = useState<PendingCase[]>([])
  const [trends, setTrends] = useState<TrendsData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = () => {
    fetchApi<Stats>('/api/admin/stats')
      .then(setStats)
      .catch(() => setStats(null))
  }

  const loadPending = () => {
    fetchApi<PendingResponse>('/api/admin/cases/pending?limit=10')
      .then((data) => setPending(data.list || []))
      .catch(() => setPending([]))
  }

  const loadTrends = () => {
    fetchApi<TrendsData>('/api/admin/trends/weekly')
      .then(setTrends)
      .catch(() => setTrends(null))
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadStats(), loadPending(), loadTrends()]).finally(() => setLoading(false))
  }, [])

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await fetchApi(`/api/admin/cases/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      setPending((prev) => prev.filter((c) => c.id !== id))
      if (stats) {
        setStats({
          ...stats,
          pendingCases: Math.max(0, stats.pendingCases - 1),
        })
      }
    } catch { }
  }

  const chartData = trends
    ? trends.cases.map((c) => {
        const appt = trends.appointments.find((a) => a.date === c.date)
        const fav = trends.favorites.find((f) => f.date === c.date)
        return { date: c.date.slice(5), 案例: c.count, 预约: appt?.count || 0, 收藏: fav?.count || 0 }
      })
    : []

  return (
    <div className="min-h-screen bg-sand-100">
      <Navbar />

      <header className="border-b border-sand-200 bg-white/60">
        <div className="mx-auto max-w-8xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-sand-900">管理后台</h1>
        </div>
      </header>

      <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-sand-200" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STATS_CARDS.map((card) => (
                <div key={card.key} className="rounded-2xl border border-sand-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold tracking-wider text-sand-900/60 uppercase">{card.label}</p>
                    <card.icon size={20} className={card.color} />
                  </div>
                  <p className="mt-2 font-display text-3xl font-bold text-sand-900">
                    {stats ? (stats as Record<string, number>)[card.key] ?? 0 : 0}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-sand-200 bg-white">
              <div className="border-b border-sand-200 px-6 py-4">
                <h2 className="font-display text-lg font-semibold text-sand-900">待审核案例</h2>
              </div>
              {pending.length === 0 ? (
                <div className="py-12 text-center text-sand-900/40">
                  <p className="font-display text-lg">暂无待审核案例</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-sand-100 bg-sand-50">
                        <th className="px-6 py-3 text-left font-medium text-sand-900/60">案例标题</th>
                        <th className="px-6 py-3 text-left font-medium text-sand-900/60">设计师</th>
                        <th className="px-6 py-3 text-left font-medium text-sand-900/60">提交日期</th>
                        <th className="px-6 py-3 text-left font-medium text-sand-900/60">水印</th>
                        <th className="px-6 py-3 text-right font-medium text-sand-900/60">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((c) => (
                        <tr key={c.id} className="border-b border-sand-100 last:border-0">
                          <td className="px-6 py-3 font-medium text-sand-900">{c.title}</td>
                          <td className="px-6 py-3 text-sand-900/60">{c.designerName || '—'}</td>
                          <td className="px-6 py-3 text-sand-900/60">{c.createdAt?.slice(0, 10) || '—'}</td>
                          <td className="px-6 py-3">
                            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', c.watermarkVerified ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500')}>
                              {c.watermarkVerified ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {c.watermarkVerified ? '已验证' : '未验证'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleReview(c.id, 'approved')} className="rounded-lg bg-sage-400/20 px-3 py-1 text-xs font-medium text-sage-600 transition-colors hover:bg-sage-400/30">通过</button>
                              <button onClick={() => handleReview(c.id, 'rejected')} className="rounded-lg bg-red-50 px-3 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-100">拒绝</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-8 rounded-2xl border border-sand-200 bg-white p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-sand-900">周趋势</h2>
              {chartData.length === 0 ? (
                <div className="py-12 text-center text-sand-900/40">
                  <p>暂无趋势数据</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" stroke="#C4A882" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#C4A882" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="案例" stroke="#C4A882" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="预约" stroke="#8B9E7E" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="收藏" stroke="#D4B896" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}

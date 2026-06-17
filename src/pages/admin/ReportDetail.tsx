import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts'
import { getReportOverview, getReportTopCategories, getReportDailyTrend, getReportMerchantRanking } from '@/utils/api'

function CircleProgress({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 36
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="flex flex-col items-center">
      <svg width="96" height="96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#F2F3F5" strokeWidth="6" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: '-70px' }}>
        <span className="text-lg font-bold" style={{ color }}>{value.toFixed(1)}%</span>
      </div>
      <p className="text-sm text-gray-500 mt-2">{label}</p>
    </div>
  )
}

export default function ReportDetail() {
  const [overview, setOverview] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [trend, setTrend] = useState<any[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getReportOverview(),
      getReportTopCategories(10),
      getReportDailyTrend(30),
      getReportMerchantRanking(20),
    ]).then(([ov, cat, tr, rk]) => {
      setOverview(ov)
      setCategories(cat)
      setTrend(tr)
      setRanking(rk)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="font-serif-title text-lg font-semibold text-gray-700 mb-6">消费数据报告</h3>
        <div className="flex justify-around">
          <CircleProgress value={overview?.verificationRate ?? 0} label="核销率" color="#165DFF" />
          <CircleProgress value={overview?.repurchaseRate ?? 0} label="复购率" color="#00B42A" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-4">品类TOP10</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categories} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} width={60} />
            <Tooltip />
            <Legend />
            <Bar dataKey="order_count" fill="#165DFF" name="订单数" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-4">每日趋势</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="order_count" stroke="#165DFF" fill="#165DFF" fillOpacity={0.1} name="订单" />
            <Area type="monotone" dataKey="verified_count" stroke="#00B42A" fill="#00B42A" fillOpacity={0.1} name="核销" />
            <Area type="monotone" dataKey="revenue" stroke="#FF7D00" fill="#FF7D00" fillOpacity={0.1} name="营收" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">商户排名 TOP20</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="text-left px-4 py-3 font-medium w-12">排名</th>
                <th className="text-left px-4 py-3 font-medium">商户名</th>
                <th className="text-left px-4 py-3 font-medium">分类</th>
                <th className="text-left px-4 py-3 font-medium">街道</th>
                <th className="text-left px-4 py-3 font-medium">评分</th>
                <th className="text-left px-4 py-3 font-medium">订单数</th>
                <th className="text-right px-4 py-3 font-medium">营收</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ranking.map((item: any, idx: number) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{item.category}</td>
                  <td className="px-4 py-3">{item.street}</td>
                  <td className="px-4 py-3">{item.rating}</td>
                  <td className="px-4 py-3">{item.order_count}</td>
                  <td className="px-4 py-3 text-right font-medium">¥{Number(item.revenue || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

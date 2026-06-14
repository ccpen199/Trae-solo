import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts'

interface OpinionItem {
  id: number
  keyword: string
  heat_value: number
  region: string
  source: string | null
  sentiment: string
}

interface HeatmapItem {
  region: string
  total_heat: number
}

interface TrendItem {
  date: string
  total_heat: number
}

const sentimentMap: Record<string, { label: string; cls: string }> = {
  positive: { label: '正面', cls: 'bg-green-100 text-green-700' },
  neutral: { label: '中性', cls: 'bg-slate-100 text-slate-600' },
  negative: { label: '负面', cls: 'bg-red-100 text-red-700' },
}

export default function OpinionPage() {
  const [opinions, setOpinions] = useState<OpinionItem[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([])
  const [trends, setTrends] = useState<TrendItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [opinionRes, heatmapRes, trendRes] = await Promise.all([
        api<OpinionItem[]>('/opinion'),
        api<HeatmapItem[]>('/opinion/heatmap'),
        api<TrendItem[]>('/opinion/trends'),
      ])
      if (opinionRes.success) setOpinions(opinionRes.data)
      if (heatmapRes.success) setHeatmap(heatmapRes.data)
      if (trendRes.success) setTrends(trendRes.data)
    } catch { void 0 } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">区域舆情热力图</h2>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-base font-semibold text-slate-700 mb-4">热度排行</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={heatmap} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="region" type="category" tick={{ fontSize: 12 }} width={80} />
            <Tooltip />
            <Bar dataKey="total_heat" fill="#f97316" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-base font-semibold text-slate-700 mb-4">趋势变化</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="total_heat" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="text-base font-semibold text-slate-700 px-4 pt-4 pb-2">舆情数据</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="text-left py-3 px-4">关键词</th>
              <th className="text-right py-3 px-4">热度值</th>
              <th className="text-left py-3 px-4">区域</th>
              <th className="text-left py-3 px-4">来源</th>
              <th className="text-left py-3 px-4">情感倾向</th>
            </tr>
          </thead>
          <tbody>
            {opinions.map((item) => (
              <tr key={item.id} className="border-t hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-800 font-medium">{item.keyword}</td>
                <td className="py-3 px-4 text-right font-medium text-orange-600">{item.heat_value}</td>
                <td className="py-3 px-4 text-slate-600">{item.region}</td>
                <td className="py-3 px-4 text-slate-500">{item.source || '-'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sentimentMap[item.sentiment]?.cls || ''}`}>
                    {sentimentMap[item.sentiment]?.label || item.sentiment}
                  </span>
                </td>
              </tr>
            ))}
            {opinions.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-slate-400">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

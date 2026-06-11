import { Star, ThumbsUp, ThumbsDown, Minus, AlertTriangle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import PageHeader from '@/components/PageHeader'
import { reviews } from '@/data/mockData'

const sentimentConfig = {
  positive: { label: '正面', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: ThumbsUp },
  neutral: { label: '中性', bg: 'bg-gray-100', text: 'text-gray-600', icon: Minus },
  negative: { label: '负面', bg: 'bg-red-50', text: 'text-red-700', icon: ThumbsDown },
}

export default function Reviews() {
  const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
  const positiveCount = reviews.filter(r => r.sentiment === 'positive').length
  const neutralCount = reviews.filter(r => r.sentiment === 'neutral').length
  const negativeCount = reviews.filter(r => r.sentiment === 'negative').length
  const negativeReviews = reviews.filter(r => r.sentiment === 'negative')

  const chartData = [
    { name: '正面', count: positiveCount, color: '#10b981' },
    { name: '中性', count: neutralCount, color: '#9ca3af' },
    { name: '负面', count: negativeCount, color: '#ef4444' },
  ]

  return (
    <div className="p-6 animate-fade-in-up">
      <PageHeader title="评价汇总" subtitle="门店评价分析与情感监测" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">综合评分</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-900">{avgRating}</span>
            <Star size={20} className="text-amber-400 fill-amber-400" />
          </div>
          <div className="flex gap-0.5 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} className={i < Math.round(Number(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-2">评价总数</p>
          <span className="text-3xl font-bold text-gray-900">{reviews.length}</span>
          <p className="text-xs text-gray-400 mt-2">近30天</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <ThumbsUp size={16} className="text-emerald-500" />
            <span className="text-sm text-gray-500">情感分布</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-600">正面</span>
              <span className="font-semibold text-gray-900">{positiveCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">中性</span>
              <span className="font-semibold text-gray-900">{neutralCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600">负面</span>
              <span className="font-semibold text-gray-900">{negativeCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-sm text-gray-500">负面评价预警</span>
          </div>
          <div className="text-3xl font-bold text-red-600">{negativeCount}</div>
          <p className="text-xs text-red-400 mt-2">需要及时处理</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">情感分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {negativeReviews.length > 0 && (
          <div className="lg:col-span-2 bg-red-50/50 rounded-xl p-5 border border-red-100">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-red-500" />
              <h3 className="font-semibold text-red-700">负面评价预警</h3>
            </div>
            <div className="space-y-3">
              {negativeReviews.map(r => (
                <div key={r.id} className="bg-white rounded-lg p-4 border border-red-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{r.customerName}</span>
                      <span className="px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-600">负面</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{r.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{r.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">全部评价</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {reviews.map(review => {
            const cfg = sentimentConfig[review.sentiment]
            const SentimentIcon = cfg.icon
            return (
              <div key={review.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{review.customerName}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                      <SentimentIcon size={12} />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{review.content}</p>
                <p className="text-xs text-gray-400 mt-1.5">{review.date}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

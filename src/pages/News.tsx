import { useState } from 'react'
import { Clock, Tag } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useStore } from '@/store'

const categoryTabs = [
  { key: 'industry', label: '行业资讯' },
  { key: 'policy', label: '政策解读' },
  { key: 'report', label: '报告' },
]

const categoryColors: Record<string, string> = {
  industry: 'bg-teal-50 text-teal-700',
  policy: 'bg-amber-50 text-amber-700',
  report: 'bg-navy-50 text-navy-700',
}

const categoryLabels: Record<string, string> = {
  industry: '行业资讯',
  policy: '政策解读',
  report: '报告',
}

export default function News() {
  const newsArticles = useStore((s) => s.newsArticles)
  const quarterlyReport = useStore((s) => s.quarterlyReport)
  const [activeCategory, setActiveCategory] = useState('industry')

  const filteredNews = newsArticles.filter((n) => n.category === activeCategory)

  return (
    <div className="animate-fade-in">
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="flex gap-2 mb-4">
              {categoryTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveCategory(t.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === t.key ? 'bg-navy-700 text-white' : 'bg-navy-50 text-navy-500 hover:bg-navy-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {filteredNews.map((article) => (
                <div key={article.id} className="flex gap-4 p-3 rounded-lg hover:bg-surface/50 card-hover cursor-pointer">
                  <div className="w-32 h-20 bg-navy-50 rounded-md flex items-center justify-center shrink-0">
                    <span className="text-xs text-navy-300">图片</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${categoryColors[article.category]}`}>
                        {categoryLabels[article.category]}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-navy-300">
                        <Clock size={10} />{article.publishDate}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-navy-700 mb-1 truncate">{article.title}</h3>
                    <p className="text-xs text-navy-400 line-clamp-2">{article.summary}</p>
                    <div className="flex gap-2 mt-1.5">
                      {article.tags.map((t) => (
                        <span key={t} className="inline-flex items-center gap-0.5 text-[10px] text-navy-400">
                          <Tag size={8} />{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {filteredNews.length === 0 && (
                <p className="text-center text-sm text-navy-300 py-8">暂无相关资讯</p>
              )}
            </div>
          </div>
        </div>
        <div className="w-96 shrink-0 space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h3 className="font-serif text-base font-semibold text-navy-700 mb-3">
              {quarterlyReport.year}年{quarterlyReport.quarter}季度报告
            </h3>
            <div className="mb-4">
              <p className="text-xs text-navy-400 mb-1">供需平衡指数</p>
              <p className={`text-2xl font-bold font-serif ${quarterlyReport.supplyDemandBalance >= 1 ? 'text-teal-600' : 'text-amber-600'}`}>
                {quarterlyReport.supplyDemandBalance.toFixed(2)}
              </p>
              <p className="text-xs text-navy-300">
                {quarterlyReport.supplyDemandBalance >= 1 ? '供略大于求' : '供需偏紧'}
              </p>
            </div>
            <div>
              <p className="text-xs text-navy-400 mb-2">产能趋势</p>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={quarterlyReport.capacityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8EBF0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#59708F' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#59708F' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="supply" name="供给" stroke="#2E8B8B" fill="#2E8B8B" fillOpacity={0.1} />
                  <Area type="monotone" dataKey="demand" name="需求" stroke="#D4A853" fill="#D4A853" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h4 className="text-xs font-medium text-navy-500 mb-3">价格指数</h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-navy-50">
                  <th className="text-left py-1.5 text-navy-400 font-medium">品类</th>
                  <th className="text-right py-1.5 text-navy-400 font-medium">当前价</th>
                  <th className="text-right py-1.5 text-navy-400 font-medium">涨跌</th>
                </tr>
              </thead>
              <tbody>
                {quarterlyReport.priceIndex.map((p) => (
                  <tr key={p.category} className="border-b border-navy-50 last:border-0">
                    <td className="py-2 text-navy-700">{p.category}</td>
                    <td className="py-2 text-right text-navy-600">¥{p.current}</td>
                    <td className={`py-2 text-right font-medium ${p.change > 0 ? 'text-red-500' : p.change < 0 ? 'text-teal-500' : 'text-navy-400'}`}>
                      {p.change > 0 ? '+' : ''}{p.change}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <h4 className="text-xs font-medium text-navy-500 mb-3">Top区域</h4>
            <div className="space-y-2">
              {quarterlyReport.topRegions.map((r, i) => (
                <div key={r} className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i < 3 ? 'bg-amber-50 text-amber-600' : 'bg-navy-50 text-navy-400'
                  }`}>{i + 1}</span>
                  <span className="text-sm text-navy-700">{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

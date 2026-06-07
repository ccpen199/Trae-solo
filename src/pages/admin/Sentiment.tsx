import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { api } from '@/lib/api'
import AdminLayout from './AdminLayout'

interface Keyword {
  id: number
  keyword: string
  count: number
  category: string
  date: string
}

interface HotKeyword {
  keyword: string
  total_count: number
}

export default function Sentiment() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [hotKeywords, setHotKeywords] = useState<HotKeyword[]>([])
  const [dateFilter, setDateFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const fetchKeywords = async (date = dateFilter, category = categoryFilter) => {
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (date) params.set('date', date)
      if (category) params.set('category', category)
      const data = await api.get<Keyword[]>(`/sentiment/keywords?${params}`)
      setKeywords(data)
    } catch {}
  }

  const fetchHot = async () => {
    try {
      const data = await api.get<HotKeyword[]>('/sentiment/hot')
      setHotKeywords(data)
    } catch {}
  }

  useEffect(() => { fetchKeywords(); fetchHot() }, [])

  const maxCount = Math.max(...hotKeywords.map(k => k.total_count), 1)

  const handleFilter = () => fetchKeywords()

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">舆情监测</h1>

      <div className="flex items-center gap-3 mb-6">
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <input
          placeholder="分类筛选"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm w-40"
        />
        <button
          onClick={handleFilter}
          className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
        >
          <Search className="w-4 h-4" /> 筛选
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold text-gray-700">关键词列表</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-2">关键词</th>
                <th className="text-right px-4 py-2">频次</th>
                <th className="text-left px-4 py-2">分类</th>
                <th className="text-left px-4 py-2">日期</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {keywords.map((kw, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800">{kw.keyword}</td>
                  <td className="px-4 py-2 text-right text-gray-600">{kw.count}</td>
                  <td className="px-4 py-2 text-gray-600">{kw.category || '-'}</td>
                  <td className="px-4 py-2 text-gray-600">{kw.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {keywords.length === 0 && <p className="text-center text-gray-400 py-6">暂无数据</p>}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4">热词云</h2>
          <div className="flex flex-wrap gap-2">
            {hotKeywords.map(kw => {
              const ratio = kw.total_count / maxCount
              const size = 0.75 + ratio * 0.75
              const hue = ratio * 40 + 200
              return (
                <span
                  key={kw.keyword}
                  className="inline-block px-3 py-1.5 rounded-full font-medium"
                  style={{
                    fontSize: `${size}rem`,
                    backgroundColor: `hsl(${hue}, 70%, 92%)`,
                    color: `hsl(${hue}, 70%, 35%)`,
                  }}
                >
                  {kw.keyword}
                </span>
              )
            })}
            {hotKeywords.length === 0 && <p className="text-gray-400 text-sm">暂无数据</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

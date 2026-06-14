import { useState, useEffect, useCallback } from 'react'
import { api, apiPost } from '@/lib/api'
import { Plus, X, Star, CheckCircle } from 'lucide-react'

interface PoiItem {
  id: number
  name: string
  category: string
  address: string | null
  rating: number
  review_count: number
  business_verified: number
}

const categoryOptions = ['景点', '公园', '商场', '餐饮', '酒店', '其他']
const categoryColors: Record<string, string> = {
  景点: 'bg-blue-100 text-blue-700',
  公园: 'bg-green-100 text-green-700',
  商场: 'bg-purple-100 text-purple-700',
  餐饮: 'bg-orange-100 text-orange-700',
  酒店: 'bg-pink-100 text-pink-700',
  其他: 'bg-slate-100 text-slate-600',
}

export default function PoiPage() {
  const [list, setList] = useState<PoiItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterVerified, setFilterVerified] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('其他')
  const [formAddress, setFormAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchPois = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (filterCategory) params.set('category', filterCategory)
      if (filterVerified) params.set('verified', filterVerified)
      const res = await api<{ list: PoiItem[]; total: number }>(`/poi?${params}`)
      if (res.success) {
        setList(res.data.list)
        setTotal(res.data.total)
      }
    } catch { void 0 } finally {
      setLoading(false)
    }
  }, [page, pageSize, filterCategory, filterVerified])

  useEffect(() => { fetchPois() }, [fetchPois])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) return
    setSubmitting(true)
    try {
      const res = await apiPost('/poi', {
        name: formName,
        category: formCategory,
        address: formAddress || undefined,
      })
      if (res.success) {
        setShowForm(false)
        setFormName('')
        setFormCategory('其他')
        setFormAddress('')
        fetchPois()
      }
    } catch { void 0 } finally {
      setSubmitting(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading && list.length === 0) {
    return <div className="flex items-center justify-center h-64 text-slate-500">加载中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">本地生活POI图谱</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={16} />
          新增POI
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-3 flex items-center gap-3">
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">全部分类</option>
          {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterVerified}
          onChange={(e) => { setFilterVerified(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">全部认证状态</option>
          <option value="1">已认证</option>
          <option value="0">未认证</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  {item.name}
                  {item.business_verified === 1 && (
                    <CheckCircle size={16} className="text-green-500" />
                  )}
                </h3>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${categoryColors[item.category] || 'bg-slate-100 text-slate-600'}`}>
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star size={16} className="text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium text-slate-700">{item.rating || '-'}</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-2">{item.address || '暂无地址'}</p>
            <p className="text-xs text-slate-400">{item.review_count} 条评价</p>
          </div>
        ))}
        {list.length === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-400">暂无数据</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <span className="text-sm text-slate-500">共 {total} 条</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-slate-100">上一页</button>
            <span className="text-sm text-slate-600">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-slate-100">下一页</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">新增POI</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">名称 <span className="text-red-500">*</span></label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入名称" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">分类</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">地址</label>
                <input type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入地址" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-100">取消</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? '提交中...' : '提交'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

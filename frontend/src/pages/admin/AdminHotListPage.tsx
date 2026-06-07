import { useState, useEffect } from 'react'
import { TrendingUp, Star, Trash2, Loader2 } from 'lucide-react'
import api from '../../utils/api'

export default function AdminHotListPage() {
  const [hotItems, setHotItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    api.get('/api/admin/hot-list').then(res => {
      if (res.data.code === 0) {
        setHotItems(res.data.data.list || res.data.data || [])
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleRemove = async (id: number) => {
    try {
      await api.delete(`/api/admin/hot-list/${id}`)
      setHotItems(prev => prev.filter(item => item.id !== id))
      showToast('已从热榜移除', 'success')
    } catch { showToast('操作失败', 'error') }
  }

  const handlePin = async (id: number, pinned: boolean) => {
    try {
      await api.put(`/api/admin/hot-list/${id}`, { is_pinned: !pinned })
      setHotItems(prev => prev.map(item => item.id === id ? { ...item, is_pinned: !pinned } : item))
      showToast(pinned ? '已取消置顶' : '已置顶', 'success')
    } catch { showToast('操作失败', 'error') }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div>
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>
          {toast.message}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">热榜管理</h1>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
      ) : hotItems.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">暂无热榜内容</div>
      ) : (
        <div className="space-y-3">
          {hotItems.map((item, index) => (
            <div key={item.id} className="card p-4 flex items-center gap-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                index < 3 ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />{item.view_count || 0} 浏览</span>
                  <span>{item.author_nickname}</span>
                  {item.is_pinned && <span className="text-primary-600">已置顶</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePin(item.id, item.is_pinned)}
                  className={`p-2 rounded-lg transition-colors ${item.is_pinned ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50'}`}
                >
                  <Star className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

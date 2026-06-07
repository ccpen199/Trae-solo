import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, Plus, Loader2 } from 'lucide-react'
import api from '../utils/api'

interface Collection {
  id: number
  name: string
  description?: string
  content_count?: number
  contents_count?: number
  is_public: boolean
  created_at: string
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    api.get('/api/collections').then(res => {
      if (res.data.code === 0) {
        setCollections(res.data.data.list || res.data.data || [])
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      const res = await api.post('/api/collections', {
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        is_public: isPublic,
      })
      if (res.data.code === 0) {
        setCollections(prev => [...prev, res.data.data])
        setNewName('')
        setNewDesc('')
        setShowCreate(false)
        showToast('收藏夹创建成功', 'success')
      } else {
        showToast(res.data.message || '创建失败', 'error')
      }
    } catch {
      showToast('创建失败', 'error')
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">我的收藏夹</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary gap-1">
          <Plus className="w-4 h-4" />新建收藏夹
        </button>
      </div>

      {showCreate && (
        <div className="card p-4 mb-6">
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="收藏夹名称"
              className="input-field"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="收藏夹描述（可选）"
              className="input-field resize-none"
              rows={2}
            />
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              公开
            </label>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="btn-primary">创建</button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg mb-1">暂无收藏夹</p>
          <p className="text-sm">创建一个收藏夹来整理你喜欢的内容</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collections.map(collection => (
            <Link key={collection.id} to={`/collection/${collection.id}`} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{collection.name}</h3>
                {!collection.is_public && (
                  <span className="badge bg-gray-100 text-gray-500">私密</span>
                )}
              </div>
              {collection.description && (
                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{collection.description}</p>
              )}
              <div className="text-xs text-gray-400">{collection.content_count || collection.contents_count || 0} 篇内容</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

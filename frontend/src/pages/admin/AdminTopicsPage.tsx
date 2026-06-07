import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import api from '../../utils/api'

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', sort_order: 0 })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    api.get('/api/admin/topics', { params: { limit: 100 } }).then(res => {
      if (res.data.code === 0) {
        setTopics(res.data.data.list || res.data.data || [])
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.slug.trim()) return
    try {
      const res = await api.post('/api/admin/topics', form)
      if (res.data.code === 0) {
        setTopics(prev => [...prev, res.data.data])
        setShowForm(false)
        setForm({ name: '', slug: '', description: '', sort_order: 0 })
        showToast('话题创建成功', 'success')
      } else {
        showToast(res.data.message || '创建失败', 'error')
      }
    } catch { showToast('创建失败', 'error') }
  }

  const handleUpdate = async () => {
    if (!editing) return
    try {
      const res = await api.put(`/api/admin/topics/${editing.id}`, form)
      if (res.data.code === 0) {
        setTopics(prev => prev.map(t => t.id === editing.id ? res.data.data : t))
        setEditing(null)
        setForm({ name: '', slug: '', description: '', sort_order: 0 })
        showToast('话题更新成功', 'success')
      } else {
        showToast(res.data.message || '更新失败', 'error')
      }
    } catch { showToast('更新失败', 'error') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此话题吗？')) return
    try {
      await api.delete(`/api/admin/topics/${id}`)
      setTopics(prev => prev.filter(t => t.id !== id))
      showToast('已删除', 'success')
    } catch { showToast('删除失败', 'error') }
  }

  const startEdit = (topic: any) => {
    setEditing(topic)
    setForm({
      name: topic.name,
      slug: topic.slug,
      description: topic.description || '',
      sort_order: topic.sort_order || 0,
    })
    setShowForm(false)
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

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">话题管理</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', slug: '', description: '', sort_order: 0 }) }} className="btn-primary gap-1">
          <Plus className="w-4 h-4" />新建话题
        </button>
      </div>

      {(showForm || editing) && (
        <div className="card p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">{editing ? '编辑话题' : '新建话题'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field resize-none" rows={2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="input-field" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={editing ? handleUpdate : handleCreate} className="btn-primary">{editing ? '更新' : '创建'}</button>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="btn-secondary">取消</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">名称</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Slug</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">描述</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">内容数</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">排序</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topics.map(topic => (
                <tr key={topic.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-primary-600">#{topic.name}</td>
                  <td className="px-4 py-3 text-gray-500">{topic.slug}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{topic.description}</td>
                  <td className="px-4 py-3 text-gray-500">{topic.posts_count || 0}</td>
                  <td className="px-4 py-3 text-gray-500">{topic.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(topic)} className="p-1 text-gray-400 hover:text-primary-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(topic.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {topics.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">暂无话题</div>
          )}
        </div>
      )}
    </div>
  )
}

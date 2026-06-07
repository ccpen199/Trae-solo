import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import api from '../../utils/api'

export default function AdminSensitivePage() {
  const [words, setWords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newWord, setNewWord] = useState('')
  const [newCategory, setNewCategory] = useState('politics')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    api.get('/api/admin/sensitive-words').then(res => {
      if (res.data.code === 0) {
        setWords(res.data.data.list || res.data.data || [])
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    if (!newWord.trim()) return
    try {
      const res = await api.post('/api/admin/sensitive-words', { word: newWord.trim(), category: newCategory })
      if (res.data.code === 0) {
        setWords(prev => [...prev, res.data.data])
        setNewWord('')
        showToast('已添加', 'success')
      } else {
        showToast(res.data.message || '添加失败', 'error')
      }
    } catch { showToast('添加失败', 'error') }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/admin/sensitive-words/${id}`)
      setWords(prev => prev.filter(w => w.id !== id))
      showToast('已删除', 'success')
    } catch { showToast('删除失败', 'error') }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const categoryLabels: Record<string, string> = {
    politics: '政治', porn: '色情', violence: '暴力', abuse: '辱骂', spam: '广告', other: '其他',
  }

  return (
    <div>
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>
          {toast.message}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">敏感词管理</h1>

      <div className="card p-4 mb-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="输入敏感词..."
            className="input-field flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="input-field w-auto">
            <option value="politics">政治</option>
            <option value="porn">色情</option>
            <option value="violence">暴力</option>
            <option value="abuse">辱骂</option>
            <option value="spam">广告</option>
            <option value="other">其他</option>
          </select>
          <button onClick={handleAdd} className="btn-primary gap-1">
            <Plus className="w-4 h-4" />添加
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">敏感词</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">分类</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">创建时间</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {words.map(word => (
                <tr key={word.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{word.word}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-orange-50 text-orange-600">
                      {categoryLabels[word.category] || word.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{word.created_at}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(word.id)} className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {words.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">暂无敏感词</div>
          )}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { api, apiPost } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import { Plus, X, Video, Radio, Music, Subtitles } from 'lucide-react'

interface MediaItem {
  id: number
  title: string
  type: string
  status: string
  duration: number | null
  cover_url: string | null
  ai_subtitle_status: string | null
}

const typeMap: Record<string, { label: string; icon: typeof Video; cls: string }> = {
  video: { label: '视频', icon: Video, cls: 'bg-blue-100 text-blue-700' },
  live: { label: '直播', icon: Radio, cls: 'bg-red-100 text-red-700' },
  audio: { label: '音频', icon: Music, cls: 'bg-green-100 text-green-700' },
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  published: 'bg-green-100 text-green-700',
  archived: 'bg-slate-200 text-slate-500',
}

export default function MediaPage() {
  const { user } = useAuth()
  const [list, setList] = useState<MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState('video')
  const [formUrl, setFormUrl] = useState('')
  const [formDuration, setFormDuration] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [subtitleLoading, setSubtitleLoading] = useState<number | null>(null)

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (filterType) params.set('type', filterType)
      if (filterStatus) params.set('status', filterStatus)
      const res = await api<{ list: MediaItem[]; total: number }>(`/media?${params}`)
      if (res.success) {
        setList(res.data.list)
        setTotal(res.data.total)
      }
    } catch { void 0 } finally {
      setLoading(false)
    }
  }, [page, pageSize, filterType, filterStatus])

  useEffect(() => { fetchMedia() }, [fetchMedia])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formTitle.trim()) return
    setSubmitting(true)
    try {
      const res = await apiPost('/media', {
        user_id: user.id,
        title: formTitle,
        type: formType,
        url: formUrl || undefined,
        duration: formDuration ? Number(formDuration) : undefined,
      })
      if (res.success) {
        setShowForm(false)
        setFormTitle('')
        setFormType('video')
        setFormUrl('')
        setFormDuration('')
        fetchMedia()
      }
    } catch { void 0 } finally {
      setSubmitting(false)
    }
  }

  const handleSubtitle = async (id: number) => {
    setSubtitleLoading(id)
    try {
      await apiPost(`/media/${id}/subtitle`, {})
      fetchMedia()
    } catch { void 0 } finally {
      setSubtitleLoading(null)
    }
  }

  const formatDuration = (s: number | null) => {
    if (!s) return '-'
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (loading && list.length === 0) {
    return <div className="flex items-center justify-center h-64 text-slate-500">加载中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">视听内容创作工具链</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={16} />
          新建
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-3 flex items-center gap-3">
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">全部类型</option>
          <option value="video">视频</option>
          <option value="live">直播</option>
          <option value="audio">音频</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((item) => {
          const typeInfo = typeMap[item.type] || { label: item.type, icon: Music, cls: 'bg-slate-100 text-slate-600' }
          return (
            <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-40 bg-slate-200 flex items-center justify-center">
                <typeInfo.icon size={40} className="text-slate-400" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.cls}`}>{typeInfo.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status] || 'bg-slate-100 text-slate-600'}`}>{item.status}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mb-1 truncate">{item.title}</h3>
                <p className="text-xs text-slate-500 mb-3">时长: {formatDuration(item.duration)}</p>
                <button
                  onClick={() => handleSubtitle(item.id)}
                  disabled={subtitleLoading === item.id || item.ai_subtitle_status === 'processing' || item.ai_subtitle_status === 'done'}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  <Subtitles size={14} />
                  {subtitleLoading === item.id || item.ai_subtitle_status === 'processing' ? '生成中...' : item.ai_subtitle_status === 'done' ? '已生成' : 'AI字幕'}
                </button>
              </div>
            </div>
          )
        })}
        {list.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-400">暂无数据</div>
        )}
      </div>

      {Math.ceil(total / pageSize) > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <span className="text-sm text-slate-500">共 {total} 条</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-slate-100">上一页</button>
            <span className="text-sm text-slate-600">{page} / {Math.ceil(total / pageSize)}</span>
            <button onClick={() => setPage((p) => Math.min(Math.ceil(total / pageSize), p + 1))} disabled={page >= Math.ceil(total / pageSize)} className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-slate-100">下一页</button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">新建视听内容</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">标题 <span className="text-red-500">*</span></label>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入标题" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">类型</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="video">视频</option>
                  <option value="live">直播</option>
                  <option value="audio">音频</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">URL</label>
                <input type="text" value={formUrl} onChange={(e) => setFormUrl(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入URL" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">时长（秒）</label>
                <input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="请输入时长" />
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

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Plus, Calendar, Eye, Trash2, Edit3 } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import useEventStore from '@/stores/eventStore'

export default function OrganizerEvents() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const { events, fetchEvents } = useEventStore()
  const [openCreate, setOpenCreate] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    category: 'concert',
    description: '',
    venue: '',
  })

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    alert('演出已创建（演示）')
    setOpenCreate(false)
    fetchEvents()
  }

  const categoryLabels: Record<string, string> = {
    concert: '演唱会',
    drama: '话剧',
    talkshow: '脱口秀',
    other: '其他',
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <Link to="/login" className="wine-gradient-btn">请先登录</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark pb-16">
      <nav className="sticky top-0 z-50 glass-card border-b border-carbon-700/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="text-white hover:text-gold-400 transition">
            <ChevronLeft size={24} />
          </button>
          <Link to="/organizer" className="font-display text-xl text-gold-500 tracking-wider">
            TICKET VAULT
          </Link>
          <div className="flex-1" />
          <button
            onClick={() => setOpenCreate(true)}
            className="gold-gradient-btn text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            新建演出
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <h1 className="font-display text-3xl text-gold-400 mb-8">演出管理</h1>

        <div className="space-y-4">
          {events.map((event: any) => (
            <div key={event.id} className="glass-card p-6 flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-wine-700 to-wine-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar size={32} className="text-gold-500/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-white truncate">{event.title}</h3>
                  <span className="px-2 py-0.5 rounded text-xs bg-wine-800/30 text-wine-300 flex-shrink-0">
                    {categoryLabels[event.category] || event.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      event.status === 'published'
                        ? 'bg-green-500/20 text-green-400'
                        : event.status === 'draft'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-carbon-600 text-carbon-400'
                    }`}
                  >
                    {event.status === 'published' ? '已发布' : event.status === 'draft' ? '草稿' : event.status}
                  </span>
                </div>
                <div className="text-sm text-carbon-400 mb-1">场馆: {event.venue}</div>
                <div className="text-xs text-carbon-500 line-clamp-1">{event.description}</div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="p-2 rounded-lg hover:bg-carbon-700/50 text-carbon-400 hover:text-white transition">
                  <Eye size={18} />
                </button>
                <Link
                  to={`/organizer/showtimes/${event.id}`}
                  className="p-2 rounded-lg hover:bg-gold-500/20 text-gold-500 transition"
                  title="场次配置"
                >
                  <Calendar size={18} />
                </Link>
                <button className="p-2 rounded-lg hover:bg-carbon-700/50 text-carbon-400 hover:text-white transition">
                  <Edit3 size={18} />
                </button>
                <button className="p-2 rounded-lg hover:bg-wine-800/50 text-wine-400 transition">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="glass-card p-12 text-center">
            <Calendar size={48} className="mx-auto text-carbon-600 mb-4" />
            <p className="text-carbon-500 mb-6">暂无演出，点击右上角创建</p>
          </div>
        )}
      </div>

      {openCreate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-md">
            <h3 className="font-display text-2xl text-gold-400 mb-6">新建演出</h3>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm text-carbon-300 mb-2">演出名称</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-carbon-300 mb-2">类型</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none"
                  >
                    <option value="concert">演唱会</option>
                    <option value="drama">话剧</option>
                    <option value="talkshow">脱口秀</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-carbon-300 mb-2">场馆</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-carbon-300 mb-2">简介</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white placeholder-carbon-500 focus:border-gold-500 outline-none resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setOpenCreate(false)}
                  className="flex-1 py-3 rounded-lg border border-carbon-600 text-carbon-400 hover:text-white transition"
                >
                  取消
                </button>
                <button type="submit" className="flex-1 wine-gradient-btn">
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

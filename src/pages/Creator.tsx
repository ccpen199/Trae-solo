import { useEffect, useState } from 'react'
import { Plus, Eye, Heart, MessageCircle, FileText, ImageIcon, X } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { CreatorContent } from '@/types'
import { api } from '@/utils/api'

type TabKey = 'content' | 'stats'

type ContentForm = {
  type: 'article' | 'gallery'
  title: string
  content: string
  images: string[]
}

type ContentStats = {
  total_reads: number
  total_likes: number
  total_comments: number
  content_count: number
  read_trend: { date: string; reads: number }[]
  like_comment_by_content: { title: string; likes: number; comments: number }[]
}

const defaultForm: ContentForm = {
  type: 'article',
  title: '',
  content: '',
  images: ['', '', ''],
}

export default function Creator() {
  const [tab, setTab] = useState<TabKey>('content')
  const [contents, setContents] = useState<CreatorContent[]>([])
  const [stats, setStats] = useState<ContentStats | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ContentForm>(defaultForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (tab === 'content') {
      api.getContents().then(res => setContents(res.data || [])).catch(() => {})
    } else {
      api.getContentStats().then(res => setStats(res.data)).catch(() => {})
    }
  }, [tab])

  const handlePublish = async () => {
    if (!form.title.trim()) return
    setSubmitting(true)
    try {
      await api.publishContent({
        type: form.type,
        title: form.title,
        content: form.content,
        images: form.images.filter(Boolean).join(','),
      })
      setShowModal(false)
      setForm(defaultForm)
      const res = await api.getContents()
      setContents(res.data || [])
    } finally {
      setSubmitting(false)
    }
  }

  const updateImage = (index: number, value: string) => {
    const next = [...form.images]
    next[index] = value
    setForm(prev => ({ ...prev, images: next }))
  }

  return (
    <main className="min-h-screen bg-cream text-charcoal">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold text-brand">Leju Creator 后台</h1>

        <div className="mt-6 flex gap-1 rounded-xl bg-white p-1 shadow-sm w-fit">
          {(['content', 'stats'] as TabKey[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-all ${
                tab === t
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-charcoal/60 hover:text-charcoal'
              }`}
            >
              {t === 'content' ? '内容管理' : '数据统计'}
            </button>
          ))}
        </div>

        {tab === 'content' && (
          <div className="mt-8">
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gold-dark"
              >
                <Plus className="h-4 w-4" />
                发布新内容
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {contents.map(item => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-charcoal line-clamp-2">{item.title}</h3>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      item.type === 'article'
                        ? 'bg-brand-50 text-brand'
                        : 'bg-gold-100 text-gold-dark'
                    }`}>
                      {item.type === 'article' ? '图文' : '图集'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-charcoal/50">
                    {item.createdAt?.slice(0, 10)}
                  </p>
                  <div className="mt-4 flex gap-4 text-sm text-charcoal/60">
                    <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{item.views}</span>
                    <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{item.likes}</span>
                  </div>
                </article>
              ))}
            </div>

            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-brand">发布新内容</h2>
                    <button onClick={() => setShowModal(false)} className="text-charcoal/40 hover:text-charcoal">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="text-sm font-medium text-charcoal/70">内容类型</label>
                      <div className="mt-2 flex gap-2">
                        {(['article', 'gallery'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setForm(prev => ({ ...prev, type: t }))}
                            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                              form.type === t
                                ? 'bg-brand text-white'
                                : 'bg-cream text-charcoal/60 hover:bg-brand-50'
                            }`}
                          >
                            {t === 'article' ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                            {t === 'article' ? '图文' : '图集'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-charcoal/70">标题</label>
                      <input
                        value={form.title}
                        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-brand-100 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        placeholder="输入标题"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-charcoal/70">内容</label>
                      <textarea
                        value={form.content}
                        onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                        rows={4}
                        className="mt-1 w-full rounded-lg border border-brand-100 px-4 py-2.5 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none"
                        placeholder="输入内容"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-charcoal/70">图片链接（最多3张）</label>
                      <div className="mt-2 space-y-2">
                        {form.images.map((img, i) => (
                          <input
                            key={i}
                            value={img}
                            onChange={e => updateImage(i, e.target.value)}
                            className="w-full rounded-lg border border-brand-100 px-4 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                            placeholder={`图片 ${i + 1} URL`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="rounded-lg px-5 py-2.5 text-sm font-medium text-charcoal/60 hover:text-charcoal"
                    >
                      取消
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={submitting || !form.title.trim()}
                      className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
                    >
                      {submitting ? '发布中...' : '发布'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'stats' && stats && (
          <div className="mt-8 space-y-8">
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: '总阅读', value: stats.total_reads, icon: Eye },
                { label: '总点赞', value: stats.total_likes, icon: Heart },
                { label: '总评论', value: stats.total_comments, icon: MessageCircle },
                { label: '内容数', value: stats.content_count, icon: FileText },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-charcoal/50">{s.label}</span>
                    <s.icon className="h-5 w-5 text-brand-200" />
                  </div>
                  <p className="mt-3 text-3xl font-black text-gold">{s.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-brand">近7日阅读趋势</h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.read_trend}>
                    <defs>
                      <linearGradient id="readGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A3C34" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1A3C34" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8F0EC" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#A3C3B3" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#A3C3B3" />
                    <Tooltip />
                    <Area type="monotone" dataKey="reads" stroke="#1A3C34" fill="url(#readGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-brand">内容点赞/评论对比</h3>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.like_comment_by_content}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8F0EC" />
                    <XAxis dataKey="title" tick={{ fontSize: 11 }} stroke="#A3C3B3" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#A3C3B3" />
                    <Tooltip />
                    <Bar dataKey="likes" fill="#C9A96E" radius={[4, 4, 0, 0]} name="点赞" />
                    <Bar dataKey="comments" fill="#A3C3B3" radius={[4, 4, 0, 0]} name="评论" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

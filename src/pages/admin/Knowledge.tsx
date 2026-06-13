import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Edit3, Trash2, X, Send, MessageSquare, BookOpen, ChevronRight } from 'lucide-react'

interface KnowledgeItem {
  id: string
  question: string
  answer: string
  category: string
  keywords: string[]
  hit_count: number
  enabled: boolean
  created_at: string
}

interface Ticket {
  id: string
  user_id: string
  subject: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  messages: { role: string; content: string; time: string }[]
  created_at: string
  updated_at: string
}

interface CategoryCount {
  category: string
  count: number
}

const statusMap: Record<string, { label: string; cls: string }> = {
  open: { label: '待处理', cls: 'badge-danger' },
  in_progress: { label: '处理中', cls: 'badge-warning' },
  resolved: { label: '已解决', cls: 'badge-success' },
  closed: { label: '已关闭', cls: 'badge-info' },
}

const emptyForm = { question: '', answer: '', category: '', keywords: '', enabled: true }

export default function Knowledge() {
  const [tab, setTab] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [categories, setCategories] = useState<CategoryCount[]>([])
  const [list, setList] = useState<KnowledgeItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketTotal, setTicketTotal] = useState(0)
  const [ticketPage, setTicketPage] = useState(1)
  const [ticketStatus, setTicketStatus] = useState('')
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')

  const fetchKnowledge = useCallback(async () => {
    const params = new URLSearchParams({ keyword, category: catFilter, page: String(page), pageSize: '20' })
    const res = await fetch(`/api/knowledge?${params}`)
    const json = await res.json()
    if (json.success) { setList(json.data.list); setTotal(json.data.total) }
  }, [keyword, catFilter, page])

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/knowledge/categories')
    const json = await res.json()
    if (json.success) setCategories(json.data)
  }, [])

  const fetchTickets = useCallback(async () => {
    const params = new URLSearchParams({ status: ticketStatus || 'open', page: String(ticketPage), pageSize: '10' })
    const res = await fetch(`/api/tickets?${params}`)
    const json = await res.json()
    if (json.success) { setTickets(json.data.list); setTicketTotal(json.data.total) }
  }, [ticketStatus, ticketPage])

  useEffect(() => { if (tab === 0) { fetchKnowledge(); fetchCategories() } }, [tab, fetchKnowledge, fetchCategories])
  useEffect(() => { if (tab === 1) fetchTickets() }, [tab, fetchTickets])

  const openAdd = () => { setEditId(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (item: KnowledgeItem) => {
    setEditId(item.id)
    setForm({ question: item.question, answer: item.answer, category: item.category, keywords: item.keywords.join(','), enabled: item.enabled })
    setShowModal(true)
  }

  const saveKnowledge = async () => {
    const body = { ...form, keywords: form.keywords.split(',').map((s) => s.trim()).filter(Boolean) }
    const url = editId ? `/api/knowledge/${editId}` : '/api/knowledge'
    const method = editId ? 'PUT' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setShowModal(false)
    fetchKnowledge()
    fetchCategories()
  }

  const deleteKnowledge = async (id: string) => {
    await fetch(`/api/knowledge/${id}`, { method: 'DELETE' })
    fetchKnowledge()
    fetchCategories()
  }

  const toggleEnabled = async (item: KnowledgeItem) => {
    await fetch(`/api/knowledge/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, keywords: item.keywords, enabled: !item.enabled }) })
    fetchKnowledge()
  }

  const updateTicketStatus = async (id: string, status: string) => {
    await fetch(`/api/tickets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    fetchTickets()
    if (activeTicket?.id === id) setActiveTicket((t) => t ? { ...t, status: status as Ticket['status'] } : t)
  }

  const sendReply = async () => {
    if (!reply.trim() || !activeTicket) return
    await fetch(`/api/tickets/${activeTicket.id}/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'agent', content: reply }) })
    setReply('')
    fetchTickets()
    setActiveTicket((t) => t ? { ...t, messages: [...t.messages, { role: 'agent', content: reply, time: new Date().toISOString() }] } : t)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['知识库管理', '工单列表'].map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === i ? 'bg-navy text-white' : 'bg-surface text-text-light hover:bg-gray-100'}`}>
            {i === 0 ? <BookOpen className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-lighter" />
              <input className="input-field pl-9" placeholder="搜索问题..." value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }} />
            </div>
            <select className="input-field w-36" value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1) }}>
              <option value="">全部分类</option>
              {categories.map((c) => <option key={c.category} value={c.category}>{c.category} ({c.count})</option>)}
            </select>
            <button onClick={openAdd} className="btn-primary flex items-center gap-1 whitespace-nowrap"><Plus className="w-4 h-4" />新增</button>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-surface text-text-light text-xs">
                <th className="text-left p-3">问题</th><th className="text-left p-3">分类</th><th className="text-center p-3">命中</th><th className="text-center p-3">状态</th><th className="text-center p-3">操作</th>
              </tr></thead>
              <tbody>
                {list.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 hover:bg-surface/50 transition-colors">
                    <td className="p-3 max-w-[200px] truncate">{item.question}</td>
                    <td className="p-3"><span className="badge badge-info">{item.category}</span></td>
                    <td className="p-3 text-center text-text-light">{item.hit_count}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => toggleEnabled(item)} className={`relative w-10 h-5 rounded-full transition-colors ${item.enabled ? 'bg-success' : 'bg-gray-300'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${item.enabled ? 'left-5' : 'left-0.5'}`} />
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(item)} className="text-text-light hover:text-accent transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => deleteKnowledge(item.id)} className="text-text-light hover:text-danger transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > 20 && (
              <div className="flex items-center justify-between p-3 text-xs text-text-light border-t">
                <span>共 {total} 条</span>
                <div className="flex gap-1">
                  <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2 py-1 rounded bg-surface disabled:opacity-40">上一页</button>
                  <button disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} className="px-2 py-1 rounded bg-surface disabled:opacity-40">下一页</button>
                </div>
              </div>
            )}
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 w-full max-w-lg animate-slide-up space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-navy">{editId ? '编辑' : '新增'}知识</h3>
                  <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-text-lighter" /></button>
                </div>
                <textarea className="input-field min-h-[60px] resize-none" placeholder="问题" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} />
                <textarea className="input-field min-h-[80px] resize-none" placeholder="答案" value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} />
                <input className="input-field" placeholder="分类" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
                <input className="input-field" placeholder="关键词（逗号分隔）" value={form.keywords} onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))} />
                <label className="flex items-center gap-2 text-sm text-text-light">
                  <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} className="rounded" />
                  启用
                </label>
                <div className="flex gap-3">
                  <button onClick={() => setShowModal(false)} className="btn-outline flex-1">取消</button>
                  <button onClick={saveKnowledge} className="btn-primary flex-1">保存</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          <div className="flex gap-2">
            {[{ key: '', label: '全部' }, { key: 'open', label: '待处理' }, { key: 'in_progress', label: '处理中' }, { key: 'resolved', label: '已解决' }, { key: 'closed', label: '已关闭' }].map((s) => (
              <button key={s.key} onClick={() => { setTicketStatus(s.key); setTicketPage(1) }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ticketStatus === s.key ? 'bg-navy text-white' : 'bg-surface text-text-light'}`}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} className="card card-hover p-4 cursor-pointer flex items-center gap-3" onClick={() => { setActiveTicket(t); setReply('') }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-navy truncate">{t.subject}</span>
                    <span className={statusMap[t.status]?.cls || 'badge'}>{statusMap[t.status]?.label}</span>
                  </div>
                  <p className="text-xs text-text-lighter truncate">{t.messages?.at(-1)?.content || '暂无消息'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-text-lighter">{t.user_id}</p>
                  <p className="text-xs text-text-lighter">{new Date(t.updated_at).toLocaleDateString()}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-lighter flex-shrink-0" />
              </div>
            ))}
          </div>

          {ticketTotal > 10 && (
            <div className="flex items-center justify-between text-xs text-text-light">
              <span>共 {ticketTotal} 条</span>
              <div className="flex gap-1">
                <button disabled={ticketPage <= 1} onClick={() => setTicketPage((p) => p - 1)} className="px-2 py-1 rounded bg-surface disabled:opacity-40">上一页</button>
                <button disabled={ticketPage * 10 >= ticketTotal} onClick={() => setTicketPage((p) => p + 1)} className="px-2 py-1 rounded bg-surface disabled:opacity-40">下一页</button>
              </div>
            </div>
          )}

          {activeTicket && (
            <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
              <div className="bg-white w-full max-w-md h-full flex flex-col animate-slide-left">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-bold text-navy text-sm">{activeTicket.subject}</h3>
                  <button onClick={() => setActiveTicket(null)}><X className="w-5 h-5 text-text-lighter" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeTicket.messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'agent' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        msg.role === 'user' ? 'bg-blue-50 text-blue-900' :
                        msg.role === 'agent' ? 'bg-green-50 text-green-900' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.role === 'user' ? 'text-blue-300' :
                          msg.role === 'agent' ? 'text-green-300' :
                          'text-gray-400'
                        }`}>{new Date(msg.time).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t p-4 space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {activeTicket.status === 'open' && <button onClick={() => updateTicketStatus(activeTicket.id, 'in_progress')} className="btn-outline text-xs py-1 px-3">标记处理中</button>}
                    {(activeTicket.status === 'open' || activeTicket.status === 'in_progress') && <button onClick={() => updateTicketStatus(activeTicket.id, 'resolved')} className="btn-outline text-xs py-1 px-3">标记已解决</button>}
                    {activeTicket.status !== 'closed' && <button onClick={() => updateTicketStatus(activeTicket.id, 'closed')} className="btn-outline text-xs py-1 px-3">关闭工单</button>}
                  </div>
                  <div className="flex gap-2">
                    <textarea className="input-field flex-1 min-h-[40px] resize-none text-sm" placeholder="输入回复..." value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }} />
                    <button onClick={sendReply} className="btn-primary px-3"><Send className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

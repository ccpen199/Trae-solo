import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { getTickets, getTicket, replyTicket, createTicket, updateTicketStatus } from '@/lib/api'
import { MessageSquare, Plus, X, Send, Paperclip, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

export default function Tickets() {
  const { user, currentTaxpayer } = useAppStore()
  const [tickets, setTickets] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('general')
  const [replyContent, setReplyContent] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const res = await getTickets()
    if (res.success && res.data) setTickets(res.data as any[])
  }

  async function handleCreate() {
    const fd = new FormData()
    fd.append('title', newTitle)
    fd.append('category', newCategory)
    if (currentTaxpayer) fd.append('taxpayer_id', String(currentTaxpayer.id))
    const res = await createTicket(fd)
    if (res.success) { setShowCreate(false); setNewTitle(''); loadData() }
  }

  async function handleSelectTicket(id: number) {
    const res = await getTicket(id)
    if (res.success && res.data) setSelectedTicket(res.data)
  }

  async function handleReply() {
    if (!selectedTicket || !replyContent) return
    const fd = new FormData()
    fd.append('content', replyContent)
    const res = await replyTicket(selectedTicket.id, fd)
    if (res.success) { setReplyContent(''); handleSelectTicket(selectedTicket.id) }
  }

  async function handleClose() {
    if (!selectedTicket) return
    const res = await updateTicketStatus(selectedTicket.id, 'closed')
    if (res.success) { handleSelectTicket(selectedTicket.id); loadData() }
  }

  const statusLabels: Record<string, { text: string; color: string }> = {
    open: { text: '待处理', color: 'bg-amber-100 text-amber-700' },
    processing: { text: '处理中', color: 'bg-blue-100 text-blue-700' },
    replied: { text: '已回复', color: 'bg-green-100 text-green-700' },
    closed: { text: '已关闭', color: 'bg-gray-100 text-gray-600' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">征纳互动</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm hover:bg-[#2a4f7f]">
          <Plus size={16} /> 提交工单
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {tickets.map(t => (
            <div
              key={t.id}
              onClick={() => handleSelectTicket(t.id)}
              className={`bg-white rounded-xl border p-4 cursor-pointer transition-colors ${
                selectedTicket?.id === t.id ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium text-sm text-gray-900 line-clamp-1">{t.title}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${statusLabels[t.status]?.color}`}>
                  {statusLabels[t.status]?.text}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{t.category || '通用'}</span>
                <span>·</span>
                <span>{t.taxpayer_name || '-'}</span>
              </div>
            </div>
          ))}
          {tickets.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
              <p>暂无工单</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white rounded-xl border border-gray-100">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedTicket.title}</h2>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span>{selectedTicket.taxpayer_name}</span>
                      <span>·</span>
                      <span>{selectedTicket.created_at}</span>
                    </div>
                  </div>
                  {user?.role === 'admin' && selectedTicket.status !== 'closed' && (
                    <button onClick={handleClose} className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 border border-gray-200 rounded">关闭工单</button>
                  )}
                </div>
              </div>
              <div className="p-5 max-h-96 overflow-y-auto space-y-4">
                {selectedTicket.replies?.map((r: any) => (
                  <div key={r.id} className={`flex gap-3 ${r.role === 'admin' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${
                      r.role === 'admin' ? 'bg-[#1E3A5F]' : 'bg-emerald-500'
                    }`}>
                      {r.real_name?.[0] || '?'}
                    </div>
                    <div className={`max-w-[70%] rounded-xl px-4 py-3 ${
                      r.role === 'admin' ? 'bg-blue-50 text-gray-800' : 'bg-gray-50 text-gray-800'
                    }`}>
                      <div className="text-xs text-gray-400 mb-1">{r.real_name} · {r.role === 'admin' ? '管理员' : '用户'}</div>
                      <div className="text-sm">{r.content}</div>
                      {r.attachments?.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {r.attachments.map((a: any, i: number) => (
                            <span key={i} className="text-xs bg-white px-2 py-1 rounded border border-gray-200 flex items-center gap-1">
                              <Paperclip size={10} /> {a.filename}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={e => setReplyContent(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReply()}
                    placeholder="输入回复内容..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={handleReply} className="px-4 py-2 text-sm text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f] flex items-center gap-1">
                    <Send size={14} /> 发送
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-12 text-center text-gray-400">
              <MessageSquare size={40} className="mx-auto mb-3 opacity-50" />
              <p>选择左侧工单查看详情</p>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">提交工单</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="请输入工单标题" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="general">通用咨询</option>
                  <option value="declaration">申报问题</option>
                  <option value="invoice">发票问题</option>
                  <option value="payment">缴款问题</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">附件</label>
                <input type="file" className="text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
                <button onClick={handleCreate} className="px-4 py-2 text-sm text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f]">提交</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

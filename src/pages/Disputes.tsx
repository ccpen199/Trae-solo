import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Plus,
  MessageSquare,
  User,
  Clock,
  AlertCircle,
  X,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Send,
  FileText,
  AlertTriangle,
  ShieldAlert,
  CircleDot,
  Building2,
} from 'lucide-react'
import { disputeApi, type DisputeTicket, type TicketMessage } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import Layout from '@/components/Layout'

const statusLabels: Record<string, { label: string; className: string }> = {
  open: { label: '待处理', className: 'bg-red-100 text-red-700' },
  processing: { label: '处理中', className: 'bg-orange-100 text-orange-700' },
  mediating: { label: '调解中', className: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', className: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', className: 'bg-gray-100 text-gray-700' },
}

const priorityLabels: Record<string, { label: string; className: string }> = {
  low: { label: '低', className: 'bg-gray-100 text-gray-700' },
  normal: { label: '普通', className: 'bg-blue-100 text-blue-700' },
  high: { label: '高', className: 'bg-orange-100 text-orange-700' },
  urgent: { label: '紧急', className: 'bg-red-100 text-red-700' },
}

const categoryLabels: Record<string, string> = {
  contract: '合同纠纷',
  payment: '费用纠纷',
  service: '服务纠纷',
  quality: '质量纠纷',
  other: '其他纠纷',
}

function StatusBadge({ status }: { status: string }) {
  const config = statusLabels[status] || statusLabels.open
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full', config.className)}>
      {config.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const config = priorityLabels[priority] || priorityLabels.normal
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full', config.className)}>
      {config.label}
    </span>
  )
}

function PriorityIcon({ priority }: { priority: string }) {
  switch (priority) {
    case 'urgent':
      return <ShieldAlert size={16} className="text-red-500" />
    case 'high':
      return <AlertTriangle size={16} className="text-orange-500" />
    case 'normal':
      return <AlertCircle size={16} className="text-blue-500" />
    default:
      return <CircleDot size={16} className="text-gray-500" />
  }
}

interface CreateTicketForm {
  title: string
  description: string
  category: string
  priority: string
  franchisee_id: string
}

function CreateTicketModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateTicketForm>({
    title: '',
    description: '',
    category: 'other',
    priority: 'normal',
    franchisee_id: '',
  })

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await disputeApi.create({
        ...formData,
        franchisee_id: parseInt(formData.franchisee_id) || 1,
        complainant_id: user.id,
        respondent_id: 2,
      })
      if (res.success) {
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Failed to create ticket:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">提交纠纷工单</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">工单标题</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请简要描述问题"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">纠纷类型</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">优先级</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(priorityLabels).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">问题描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请详细描述您遇到的问题..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.title || !formData.description}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            提交工单
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailModal({
  ticket,
  onClose,
}: {
  ticket: DisputeTicket
  onClose: () => void
}) {
  const user = useAuthStore((state) => state.user)
  const [detail, setDetail] = useState<DisputeTicket | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true)
      try {
        const res = await disputeApi.get(ticket.id)
        if (res.success) {
          setDetail(res.data)
        }
      } catch (error) {
        console.error('Failed to fetch ticket detail:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [ticket.id])

  const sendMessage = async () => {
    if (!user || !message.trim()) return
    setSending(true)
    try {
      const res = await disputeApi.addMessage(ticket.id, {
        sender_id: user.id,
        content: message,
      })
      if (res.success) {
        setMessage('')
        const detailRes = await disputeApi.get(ticket.id)
        if (detailRes.success) {
          setDetail(detailRes.data)
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const isComplainant = user?.id === ticket.complainant_id
  const isRespondent = user?.id === ticket.respondent_id
  const isMediator = user?.id === ticket.mediator_id
  const canSendMessage = isComplainant || isRespondent || isMediator || user?.role === 'admin'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{ticket.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span className="text-sm text-gray-500">{categoryLabels[ticket.category] || ticket.category}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : detail ? (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">投诉人</p>
                  <p className="font-medium text-gray-900">{detail.complainant_name || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">被投诉人</p>
                  <p className="font-medium text-gray-900">{detail.respondent_name || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">调解员</p>
                  <p className="font-medium text-gray-900">{detail.mediator_name || '未指派'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">相关项目</p>
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-gray-400" />
                    <p className="font-medium text-gray-900">{detail.project_name || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-2">问题描述</p>
                <p className="text-gray-700">{detail.description}</p>
              </div>

              {detail.resolution && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Check size={18} className="text-green-600" />
                    <p className="text-sm font-medium text-green-900">处理结果</p>
                  </div>
                  <p className="text-gray-700">{detail.resolution}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare size={18} />
                  沟通记录
                </h3>
                <div className="space-y-4">
                  {detail.messages && detail.messages.length > 0 ? (
                    detail.messages.map((msg: TicketMessage) => (
                      <div key={msg.id} className="flex gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm">
                              {msg.sender_name || '未知'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(msg.created_at).toLocaleString('zh-CN')}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm bg-gray-50 rounded-lg p-3">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      暂无沟通记录
                    </div>
                  )}
                </div>
              </div>

              {canSendMessage && (
                <div className="flex gap-3 mt-4">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="输入消息..."
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !message.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    发送
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Disputes() {
  const user = useAuthStore((state) => state.user)
  const [tickets, setTickets] = useState<DisputeTicket[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedTicket, setSelectedTicket] = useState<DisputeTicket | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchTickets = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (keyword) params.keyword = keyword
      if (selectedStatus) params.status = selectedStatus
      if (user.role === 'entrepreneur') {
        params.complainantId = user.id
      } else if (user.role === 'brand') {
        params.respondentId = user.id
      }
      const res = await disputeApi.list(params)
      if (res.success && res.data) {
        setTickets(res.data.list)
        setTotal(res.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, keyword, selectedStatus, user])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const totalPages = Math.ceil(total / pageSize)

  const handleSuccess = () => {
    fetchTickets()
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">请先登录</h3>
            <p className="text-gray-500">登录后可查看您的纠纷工单</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜索工单标题..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(1)
                }}
                className="w-80 pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部状态</option>
              {Object.entries(statusLabels).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
          </div>
          {(user.role === 'entrepreneur' || user.role === 'brand') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={18} />
              提交工单
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    工单信息
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    优先级
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    对方
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500">
                    调解员
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-blue-600" />
                      </div>
                    </td>
                  </tr>
                ) : tickets.length > 0 ? (
                  tickets.map((ticket) => {
                    const otherParty = user.id === ticket.complainant_id
                      ? ticket.respondent_name
                      : ticket.complainant_name
                    return (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              <PriorityIcon priority={ticket.priority} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{ticket.title}</p>
                              <p className="text-sm text-gray-500">{ticket.project_name || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {categoryLabels[ticket.category] || ticket.category}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="px-6 py-4">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {otherParty || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {ticket.mediator_name || (
                            <span className="text-gray-400">未指派</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock size={14} />
                            {new Date(ticket.created_at).toLocaleDateString('zh-CN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            <Eye size={14} />
                            查看详情
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-center">
                        <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">暂无纠纷工单</p>
                        {(user.role === 'entrepreneur' || user.role === 'brand') && (
                          <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <Plus size={16} />
                            提交第一份工单
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                共 <span className="font-medium">{total}</span> 条记录
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= page - 1 && pageNum <= page + 1)) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                          page === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        {pageNum}
                      </button>
                    )
                  }
                  if (pageNum === page - 2 || pageNum === page + 2) {
                    return <span key={pageNum} className="px-2 text-gray-400">...</span>
                  }
                  return null
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {selectedTicket && (
        <DetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </Layout>
  )
}

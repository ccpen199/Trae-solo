import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, User, Loader2, MessageCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/store'

interface Conversation {
  id: string
  name: string
  lastMessage: string
  updatedAt: string
  talent_title?: string
  talent_dept?: string
  job_title?: string
  application_status?: string
  institution_name?: string
  institution_type?: string
}

interface Message {
  id: string
  from: 'me' | 'other'
  content: string
  time: string
}

const applicationStatusMap: Record<string, { label: string; color: string }> = {
  applied: { label: '已投递', color: 'bg-stone-100 text-stone-700' },
  read: { label: '已读', color: 'bg-green-100 text-green-700' },
  invited: { label: '邀约', color: 'bg-amber-100 text-amber-700' },
  interview: { label: '面试', color: 'bg-blue-100 text-blue-700' },
  offered: { label: '录用', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
}

function formatTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

export default function Messages() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState(id || '')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const getConvName = (conv: any): string => {
    if (user?.role === 'talent') return conv.institution_name || conv.institution_user_name || '机构用户'
    return conv.talent_name || conv.talent_user_name || '人才用户'
  }

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?.id) {
        setLoadingConvs(false)
        return
      }
      setLoadingConvs(true)
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>('/messages/conversations')
        if (res.success && res.data) {
          const mapped = res.data.map((conv) => ({
            id: String(conv.id),
            name: getConvName(conv),
            lastMessage: conv.last_message || '',
            updatedAt: conv.updated_at || '',
            talent_title: conv.talent_title,
            talent_dept: conv.talent_dept,
            job_title: conv.job_title,
            application_status: conv.application_status,
            institution_name: conv.institution_name,
            institution_type: conv.institution_type,
          }))
          setConversations(mapped)
          if (!activeConv && mapped.length > 0) {
            setActiveConv(mapped[0].id)
          }
        }
      } catch {
      } finally {
        setLoadingConvs(false)
      }
    }
    fetchConversations()
  }, [user?.id, user?.role])

  useEffect(() => {
    if (!activeConv || !user?.id) return
    const fetchMessages = async () => {
      setLoadingMsgs(true)
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>('/messages/conversations/' + activeConv + '/messages')
        if (res.success && res.data) {
          setMessages(
            res.data.map((msg) => ({
              id: String(msg.id),
              from: String(msg.sender_id) === String(user?.id) ? 'me' : 'other',
              content: msg.content,
              time: msg.created_at || '',
            }))
          )
        }
      } catch {
      } finally {
        setLoadingMsgs(false)
      }
    }
    fetchMessages()
  }, [activeConv, user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim() || !activeConv || sending || !user?.id) return
    const content = inputValue.trim()
    setInputValue('')
    setSending(true)
    try {
      const res = await apiFetch<{ success: boolean }>('/messages/send', {
        method: 'POST',
        body: JSON.stringify({ conversation_id: activeConv, content }),
      })
      if (res.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            from: 'me',
            content,
            time: new Date().toISOString(),
          },
        ])
      }
    } catch {
      setInputValue(content)
    } finally {
      setSending(false)
    }
  }

  const activeConvObj = conversations.find((c) => c.id === activeConv)
  const activeConvName = activeConvObj?.name || ''

  if (!user?.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-2xl font-bold mb-6">消息</h1>
        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 16rem)' }}>
          <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center max-w-md shadow-sm">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <MessageCircle className="w-8 h-8 text-teal-700" />
            </div>
            <h2 className="text-xl font-bold text-stone-800 mb-2">登录后开始沟通</h2>
            <p className="text-sm text-stone-500 mb-6 leading-relaxed">
              完成人才/机构注册认证后，即可与对方在线沟通，实时跟进投递进度
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/register?role=talent')}
                className="px-5 py-2.5 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors"
              >
                人才注册
              </button>
              <button
                onClick={() => navigate('/register?role=institution')}
                className="px-5 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
              >
                机构入驻
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-bold mb-6">消息</h1>
      <div className="bg-white rounded-lg border border-stone-200 flex" style={{ height: 'calc(100vh - 12rem)' }}>
        <div className="w-72 border-r border-stone-200 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-stone-400" />
              </div>
              <p className="font-medium text-stone-700 mb-1">暂无对话</p>
              <p className="text-xs text-stone-500 mb-4 max-w-xs">
                {user?.role === 'talent'
                  ? '投递职位后，HR 会主动联系你，也可以在职位详情页发起沟通'
                  : '收到简历投递后，可直接与候选人发起对话'}
              </p>
              {user?.role === 'talent' ? (
                <button
                  onClick={() => navigate('/jobs')}
                  className="px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-medium hover:bg-teal-800 transition-colors"
                >
                  去投简历
                </button>
              ) : (
                <button
                  onClick={() => navigate('/job/post')}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors"
                >
                  发布职位
                </button>
              )}
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv.id)}
                className={`w-full flex items-start gap-3 p-4 text-left transition-colors border-b border-stone-100 last:border-b-0 ${
                  activeConv === conv.id ? 'bg-teal-50' : 'hover:bg-stone-50'
                }`}
              >
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-teal-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-stone-800 truncate">{conv.name}</span>
                    <span className="text-[10px] text-stone-400 shrink-0 whitespace-nowrap">
                      {formatTime(conv.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {conv.job_title ? (
                      <>
                        <span className="text-[11px] text-stone-500 truncate flex-1">
                          {conv.job_title}
                        </span>
                        {user?.role === 'talent' && conv.application_status && applicationStatusMap[conv.application_status] && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${applicationStatusMap[conv.application_status].color}`}>
                            {applicationStatusMap[conv.application_status].label}
                          </span>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-stone-400 truncate flex-1">{conv.lastMessage || '暂无消息'}</p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {activeConvObj ? (
            <>
              <div className="p-4 border-b border-stone-200">
                <h3 className="font-semibold text-stone-800">{activeConvName}</h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {activeConvObj.job_title && (
                    <span className="text-xs text-stone-500">
                      关联职位：<span className="text-stone-700">{activeConvObj.job_title}</span>
                    </span>
                  )}
                  {user?.role === 'talent' ? (
                    <>
                      {activeConvObj.application_status && applicationStatusMap[activeConvObj.application_status] && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${applicationStatusMap[activeConvObj.application_status].color}`}>
                          {applicationStatusMap[activeConvObj.application_status].label}
                        </span>
                      )}
                      <button
                        onClick={() => navigate('/applications')}
                        className="text-xs text-teal-600 hover:text-teal-700 underline underline-offset-2"
                      >
                        查看投递详情
                      </button>
                    </>
                  ) : (
                    <>
                      {activeConvObj.talent_title && (
                        <span className="text-xs text-stone-500">
                          {activeConvObj.talent_dept ? `${activeConvObj.talent_dept} · ` : ''}{activeConvObj.talent_title}
                        </span>
                      )}
                      {activeConvObj.application_status && applicationStatusMap[activeConvObj.application_status] && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${applicationStatusMap[activeConvObj.application_status].color}`}>
                          {applicationStatusMap[activeConvObj.application_status].label}
                        </span>
                      )}
                      <button
                        onClick={() => navigate('/resume/preview')}
                        className="text-xs text-teal-600 hover:text-teal-700 underline underline-offset-2"
                      >
                        查看简历
                      </button>
                      <button
                        onClick={() => navigate('/applications')}
                        className="text-xs text-teal-600 hover:text-teal-700 underline underline-offset-2"
                      >
                        查看投递
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                        msg.from === 'me'
                          ? 'bg-teal-700 text-white rounded-br-md'
                          : 'bg-stone-100 text-stone-800 rounded-bl-md'
                      }`}>
                        <p>{msg.content}</p>
                        <div className={`text-xs mt-1 ${msg.from === 'me' ? 'text-teal-200' : 'text-stone-400'}`}>
                          {msg.time ? msg.time.split(' ')[1] || msg.time.split('T')[1]?.substring(0, 5) || '' : ''}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-stone-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="输入消息..."
                    className="flex-1 h-10 px-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || sending}
                    className="h-10 w-10 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 flex items-center justify-center transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-stone-400">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm">选择一个会话开始沟通</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

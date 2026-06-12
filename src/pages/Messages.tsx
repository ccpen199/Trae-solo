import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Send, User, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/store'

interface Conversation {
  id: string
  name: string
  lastMessage: string
  updatedAt: string
}

interface Message {
  id: string
  from: 'me' | 'other'
  content: string
  time: string
}

export default function Messages() {
  const { id } = useParams()
  const { user } = useAuthStore()
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
      setLoadingConvs(true)
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>('/messages/conversations')
        if (res.success && res.data) {
          const mapped = res.data.map((conv) => ({
            id: String(conv.id),
            name: getConvName(conv),
            lastMessage: conv.last_message || '',
            updatedAt: conv.updated_at || '',
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
  }, [])

  useEffect(() => {
    if (!activeConv) return
    const fetchMessages = async () => {
      setLoadingMsgs(true)
      try {
        const res = await apiFetch<{ success: boolean; data: any[] }>(`/messages/conversations/${activeConv}`)
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
    if (!inputValue.trim() || !activeConv || sending) return
    const content = inputValue.trim()
    setInputValue('')
    setSending(true)
    try {
      const res = await apiFetch<{ success: boolean }>(`/messages/conversations/${activeConv}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
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

  const activeConvName = conversations.find((c) => c.id === activeConv)?.name || ''

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-heading text-2xl font-bold mb-6">消息</h1>
      <div className="bg-white rounded-lg border border-stone-200 flex" style={{ height: 'calc(100vh - 12rem)' }}>
        <div className="w-72 border-r border-stone-200 overflow-y-auto">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv.id)}
                className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${
                  activeConv === conv.id ? 'bg-teal-50' : 'hover:bg-stone-50'
                }`}
              >
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-teal-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-stone-800 truncate">{conv.name}</span>
                  </div>
                  <p className="text-xs text-stone-500 truncate mt-0.5">{conv.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-stone-200">
            <h3 className="font-medium text-stone-800">{activeConvName}</h3>
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
        </div>
      </div>
    </div>
  )
}

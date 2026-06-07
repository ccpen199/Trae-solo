import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Input, Button, Avatar, Typography, Space, Spin, Empty } from 'antd'
import { SendOutlined, UserOutlined } from '@ant-design/icons'
import request from '../utils/request'
import { getUser } from '../utils/auth'

const { Text } = Typography

export default function ChatPage() {
  const { id } = useParams()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [sessionInfo, setSessionInfo] = useState(null)
  const messagesEndRef = useRef(null)
  const currentUser = getUser()

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const res = await request.get(`/messages/${id}`)
      const data = res.data || res
      setMessages(data.messages || data.list || data.items || data || [])
      if (data.session || data.counterpart) {
        setSessionInfo(data.session || data.counterpart)
      }
    } catch (e) {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!inputValue.trim()) return
    setSending(true)
    try {
      await request.post(`/messages/${id}`, { content: inputValue.trim() })
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          content: inputValue.trim(),
          sender_id: currentUser?.id,
          created_at: new Date().toISOString()
        }
      ])
      setInputValue('')
    } catch (e) {
      // handled by interceptor
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card
      title={sessionInfo?.username || `对话 #${id}`}
      style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}
      bodyStyle={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}
    >
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {loading ? (
          <Spin style={{ display: 'block', margin: '40px auto' }} />
        ) : messages.length === 0 ? (
          <Empty description="暂无消息，开始对话吧" />
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUser?.id
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isMine ? 'flex-end' : 'flex-start',
                  marginBottom: 12
                }}
              >
                {!isMine && (
                  <Avatar icon={<UserOutlined />} size="small" style={{ marginRight: 8, marginTop: 4 }} />
                )}
                <div
                  style={{
                    maxWidth: '60%',
                    padding: '8px 12px',
                    borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isMine ? '#1677ff' : '#f0f0f0',
                    color: isMine ? '#fff' : '#000'
                  }}
                >
                  <div>{msg.content}</div>
                  <Text
                    type="secondary"
                    style={{ fontSize: 11, color: isMine ? 'rgba(255,255,255,0.7)' : undefined }}
                  >
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('zh-CN') : ''}
                  </Text>
                </div>
                {isMine && (
                  <Avatar icon={<UserOutlined />} size="small" style={{ marginLeft: 8, marginTop: 4, background: '#1677ff' }} />
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: 12, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
        <Input.TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={sending}
          onClick={handleSend}
          style={{ alignSelf: 'flex-end' }}
        >
          发送
        </Button>
      </div>
    </Card>
  )
}

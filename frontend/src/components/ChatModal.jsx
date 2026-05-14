import { useState, useEffect, useRef } from 'react'
import { Modal, Input, Button, List, Typography, Spin, Empty } from 'antd'
import { SendOutlined, LoadingOutlined } from '@ant-design/icons'
import request from '../utils/request'
import useUserStore from '../store/user'

const { Text, Title } = Typography

const ChatModal = ({ visible, onClose, toUserId, toUserName, applianceId }) => {
  const { user } = useUserStore()
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messageEndRef = useRef(null)

  const loadMessages = async () => {
    if (!toUserId) return
    
    setLoading(true)
    try {
      const res = await request.get(`/chat/history/${toUserId}`, {
        params: { appliance_id: applianceId }
      })
      setMessages(res.data || [])
    } catch (err) {
      console.error('Load messages error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (visible && toUserId) {
      loadMessages()
    }
  }, [visible, toUserId, applianceId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!inputValue.trim() || !toUserId) return

    setSending(true)
    try {
      await request.post('/chat/send', {
        to_user_id: toUserId,
        appliance_id: applianceId,
        content: inputValue.trim()
      })
      
      setInputValue('')
      loadMessages()
    } catch (err) {
      console.error('Send message error:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>与 {toUserName} 聊天</Title>
          <Text type="secondary">{applianceId ? '关于此商品' : ''}</Text>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      <div style={{ height: 500, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin tip="加载中..." />
            </div>
          ) : messages.length === 0 ? (
            <Empty description="暂无消息" />
          ) : (
            <List
              dataSource={messages}
              renderItem={(item) => (
                <List.Item style={{ padding: '8px 16px' }}>
                  <div style={{
                    textAlign: item.from_user_id === user?.id ? 'right' : 'left',
                    marginBottom: 8
                  }}>
                    <Text style={{ fontSize: 12, opacity: 0.6 }}>
                      {item.from_user_id === user?.id ? '我' : item.from_user_nickname || item.from_user_phone}
                    </Text>
                    <div style={{
                      display: 'inline-block',
                      maxWidth: '70%',
                      padding: '8px 12px',
                      borderRadius: 16,
                      backgroundColor: item.from_user_id === user?.id ? '#1890ff' : '#f0f0f0',
                      color: item.from_user_id === user?.id ? '#fff' : '#333',
                      marginTop: 4
                    }}>
                      {item.content}
                    </div>
                    <Text style={{ fontSize: 11, opacity: 0.5, display: 'block', marginTop: 2 }}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          )}
          <div ref={messageEndRef} />
        </div>
        
        <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
          <Input.TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
            autoSize={{ minRows: 2, maxRows: 4 }}
            disabled={!toUserId}
          />
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <Button
              type="primary"
              icon={sending ? <LoadingOutlined /> : <SendOutlined />}
              onClick={handleSend}
              loading={sending}
              disabled={!inputValue.trim() || !toUserId}
            >
              发送
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ChatModal

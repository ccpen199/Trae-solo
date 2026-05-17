import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Row, Col, Card, Avatar, Input, Button, List, Spin, Empty, message, Tag } from 'antd'
import { FaHeart, FaGift, FaShare } from 'react-icons/fa'
import { liveAPI } from '@/api'
import { useUserStore } from '@/store'

const { TextArea } = Input

function LiveRoom() {
  const { id } = useParams()
  const { user } = useUserStore()
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([
    { type: 'chat', user: { nickname: '系统消息' }, content: '欢迎来到直播间，文明发言，理性互动！', timestamp: new Date().toISOString() },
    { type: 'chat', user: { nickname: '听众小王' }, content: '主播声音好好听！', timestamp: new Date().toISOString() },
    { type: 'chat', user: { nickname: '二次元爱好者' }, content: '前排打卡~', timestamp: new Date().toISOString() },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadRoom()
    connectWebSocket()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadRoom = async () => {
    try {
      setLoading(true)
      const data = await liveAPI.getRoom(id)
      setRoom(data)
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const connectWebSocket = () => {
    const wsUrl = `ws://localhost:47801/ws/live?roomId=${id}${user ? `&userId=${user.id}` : ''}`
    wsRef.current = new WebSocket(wsUrl)
    
    wsRef.current.onopen = () => {
      console.log('WebSocket连接成功')
    }
    
    wsRef.current.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type === 'chat' || msg.type === 'gift') {
          setMessages(prev => [...prev, msg])
        }
      } catch (e) {
        console.error('消息解析失败:', e)
      }
    }
    
    wsRef.current.onerror = (error) => {
      console.log('WebSocket连接失败，使用模拟模式:', error)
    }
    
    wsRef.current.onclose = () => {
      console.log('WebSocket连接已关闭')
    }
  }

  const sendMessage = () => {
    if (!inputMessage.trim() || !user) {
      message.warning(user ? '请输入消息' : '请先登录')
      return
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat',
        content: inputMessage
      }))
    }
    setMessages(prev => [...prev, {
      type: 'chat',
      user: user,
      content: inputMessage,
      timestamp: new Date().toISOString()
    }])
    setInputMessage('')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    )
  }

  if (!room) {
    return <Empty description="直播间不存在" />
  }

  return (
    <div>
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card style={{ borderRadius: 12, marginBottom: 16 }}>
            <div style={{
              width: '100%',
              height: 400,
              background: `linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)`,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Avatar src={room.anchor?.avatar} size={128} />
              <h2 style={{ color: 'white', marginTop: 16 }}>{room.anchor?.nickname}</h2>
              <Tag color="red" style={{ marginBottom: 8 }}>🔴 直播中</Tag>
              <p>观众人数：{room.viewer_count}</p>
            </div>
          </Card>

          <Card title={room.title} style={{ borderRadius: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Avatar src={room.anchor?.avatar} size={48} />
              <div>
                <div style={{ fontWeight: 600 }}>{room.anchor?.nickname}</div>
                <div style={{ color: '#999', fontSize: 12 }}>{room.viewer_count}人观看</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <Button icon={<FaHeart />}>关注</Button>
                <Button icon={<FaGift />}>礼物</Button>
                <Button icon={<FaShare />}>分享</Button>
              </div>
            </div>
            <p style={{ color: '#666' }}>{room.description}</p>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="聊天互动" style={{ borderRadius: 12, height: 600, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
              <List
                dataSource={messages}
                renderItem={msg => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <div>
                      <span style={{ color: '#ff6b9d', fontWeight: 500 }}>{msg.user?.nickname || '匿名'}：</span>
                      <span>{msg.content}</span>
                    </div>
                  </List.Item>
                )}
              />
              <div ref={messagesEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input
                placeholder="输入聊天内容..."
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onPressEnter={sendMessage}
              />
              <Button type="primary" onClick={sendMessage}>发送</Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default LiveRoom

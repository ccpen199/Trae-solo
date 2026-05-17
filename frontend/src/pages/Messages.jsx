import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, Button, Spin, Tag, Card, Empty, message } from 'antd'
import { MessageOutlined, CheckOutlined } from '@ant-design/icons'
import useStore from '../store'
import { userApi } from '../api'
import { PageEmpty } from '../components/PageState'

const Messages = () => {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const { isLoggedIn } = useStore()

  useEffect(() => {
    if (isLoggedIn) {
      fetchMessages()
    } else {
      setLoading(false)
    }
  }, [isLoggedIn])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const data = await userApi.getMessages({ pageSize: 50 })
      setMessages(data?.list || [])
    } catch (error) {
      console.error('获取消息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await userApi.markMessageRead(id)
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: 1 } : m))
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }

  if (!isLoggedIn) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <PageEmpty description="登录后查看您的消息" />
        <Button type="primary" onClick={() => navigate('/login')} style={{ marginTop: 16 }}>
          立即登录
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '60vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div className="page-content" style={{ paddingBottom: 100 }}>
      <div className="flex-between" style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 'bold', margin: 0 }}>
          <MessageOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          消息中心 ({messages.length})
        </h3>
      </div>

      <List
        dataSource={messages}
        locale={{ emptyText: <PageEmpty description="暂无消息" /> }}
        renderItem={item => (
          <Card
            size="small"
            style={{ 
              marginBottom: 12,
              background: item.is_read ? '#fff' : '#f6ffed'
            }}
            actions={[
              !item.is_read && (
                <Button 
                  type="text" 
                  icon={<CheckOutlined />}
                  onClick={() => handleMarkRead(item.id)}
                >
                  标记已读
                </Button>
              )
            ]}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 500 }}>{item.title}</span>
                {!item.is_read && <Tag color="red">未读</Tag>}
              </div>
              <p style={{ color: '#666', marginBottom: 8 }}>{item.content}</p>
              <div style={{ color: '#999', fontSize: 12 }}>
                {new Date(item.created_at).toLocaleString()}
              </div>
            </div>
          </Card>
        )}
      />
    </div>
  )
}

export default Messages

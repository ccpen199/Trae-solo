import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, List, Avatar, Badge, Typography, Empty, Spin } from 'antd'
import { MessageOutlined, UserOutlined } from '@ant-design/icons'
import request from '../utils/request'

const { Text } = Typography

export default function MessageListPage() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const res = await request.get('/messages/sessions')
      const data = res.data || res
      setSessions(data.list || data.sessions || data.items || data || [])
    } catch (e) {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  return (
    <Card title="消息中心">
      {loading ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : sessions.length === 0 ? (
        <Empty description="暂无消息" />
      ) : (
        <List
          dataSource={sessions}
          renderItem={(session) => (
            <List.Item
              style={{ cursor: 'pointer', padding: '12px 16px' }}
              onClick={() => navigate(`/messages/${session.id || session.user_id}`)}
            >
              <List.Item.Meta
                avatar={
                  <Badge count={session.unread_count || 0} offset={[-4, 4]}>
                    <Avatar icon={<UserOutlined />} src={session.avatar} />
                  </Badge>
                }
                title={session.username || session.name || `用户${session.id || session.user_id}`}
                description={
                  <Text type="secondary" ellipsis style={{ maxWidth: 400 }}>
                    {session.last_message || '暂无消息'}
                  </Text>
                }
              />
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {session.last_time ? new Date(session.last_time).toLocaleString('zh-CN') : ''}
                </Text>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}

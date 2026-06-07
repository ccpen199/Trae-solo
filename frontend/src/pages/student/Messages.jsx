import React, { useEffect, useState } from 'react'
import { List, Button, Tag, Empty, message } from 'antd'
import { BellOutlined, WarningOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import StudentLayout from '../../components/StudentLayout.jsx'
import { messageAPI } from '../../utils/api.js'

function StudentMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    setLoading(true)
    try {
      const response = await messageAPI.getMessages({ pageSize: 50 })
      setMessages(response.data.messages)
    } catch (error) {
      message.error('加载消息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id) => {
    try {
      await messageAPI.markAsRead(id)
      setMessages(messages.map(m => m.id === id ? { ...m, is_read: 1 } : m))
    } catch (error) {
      message.error('标记失败')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await messageAPI.markAllAsRead()
      setMessages(messages.map(m => ({ ...m, is_read: 1 })))
      message.success('已全部标记为已读')
    } catch (error) {
      message.error('操作失败')
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'balance_warning':
        return <WarningOutlined style={{ color: '#faad14' }} />
      case 'system':
        return <BellOutlined style={{ color: '#1890ff' }} />
      default:
        return <BellOutlined />
    }
  }

  const getTypeTag = (type) => {
    switch (type) {
      case 'balance_warning':
        return <Tag color="warning">余额提醒</Tag>
      case 'system':
        return <Tag color="blue">系统通知</Tag>
      default:
        return <Tag>消息</Tag>
    }
  }

  return (
    <StudentLayout>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0 }}>消息中心</h2>
          <Button onClick={handleMarkAllAsRead}>全部已读</Button>
        </div>

        <List
          loading={loading}
          dataSource={messages}
          locale={{ emptyText: <Empty description="暂无消息" /> }}
          renderItem={item => (
            <List.Item
              style={{ 
                background: item.is_read ? '#fff' : '#f0f7ff',
                padding: 16,
                borderRadius: 8,
                marginBottom: 8,
              }}
              actions={[
                !item.is_read && (
                  <Button type="link" icon={<CheckOutlined />} onClick={() => handleMarkAsRead(item.id)}>
                    标记已读
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                avatar={getTypeIcon(item.type)}
                title={
                  <span>
                    {getTypeTag(item.type)}
                    {item.title}
                  </span>
                }
                description={
                  <>
                    <div>{item.content}</div>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </StudentLayout>
  )
}

export default StudentMessages

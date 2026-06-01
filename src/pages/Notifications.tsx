import { useState, useEffect } from 'react'
import { Card, Button, Table, Tag, Space, message, Badge, Select, Empty, Modal } from 'antd'
import { BellOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const { Option } = Select

export default function Notifications() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [status, setStatus] = useState<string>('all')
  const [type, setType] = useState<string>('all')
  const [unreadCount, setUnreadCount] = useState(0)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [currentNotification, setCurrentNotification] = useState<any>(null)

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const params: any = { user_id: user?.id }
      if (status !== 'all') params.is_read = status === 'read' ? 1 : 0
      if (type !== 'all') params.type = type
      
      const res: any = await api.notifications.list(params)
      setNotifications(res.data || res || [])
    } catch (error) {
      console.error('获取通知失败', error)
      message.error('获取通知失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    if (user?.id) {
      try {
        const res: any = await api.notifications.getUnreadCount(user.id)
        setUnreadCount(res.count || 0)
      } catch (error) {
        console.error('获取未读数量失败', error)
      }
    }
  }

  useEffect(() => {
    if (user) {
      fetchNotifications()
      fetchUnreadCount()
    }
  }, [user, status, type])

  const handleMarkRead = async (id: number) => {
    try {
      await api.notifications.markRead(id)
      message.success('已标记为已读')
      fetchNotifications()
      fetchUnreadCount()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleMarkAllRead = async () => {
    if (user?.id) {
      try {
        await api.notifications.markAllRead(user.id)
        message.success('全部已读')
        fetchNotifications()
        fetchUnreadCount()
      } catch (error) {
        message.error('操作失败')
      }
    }
  }

  const handlePreview = async (record: any) => {
    setCurrentNotification(record)
    setPreviewVisible(true)
    if (!record.is_read) {
      handleMarkRead(record.id)
    }
  }

  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      adjustment: { color: 'blue', text: '调课通知' },
      cancel: { color: 'red', text: '停课通知' },
      makeup: { color: 'orange', text: '补课通知' },
      classroom: { color: 'purple', text: '教室变更' },
      system: { color: 'default', text: '系统通知' },
    }
    const info = typeMap[type] || { color: 'default', text: type }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (t: string) => getTypeTag(t),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <span style={{ fontWeight: record.is_read ? 'normal' : 'bold' }}>
          {!record.is_read && <Badge status="processing" style={{ marginRight: 8 }} />}
          {text}
        </span>
      ),
    },
    {
      title: '内容摘要',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text: string) => text?.slice(0, 50) + (text?.length > 50 ? '...' : ''),
    },
    {
      title: '发送时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'is_read',
      key: 'is_read',
      width: 100,
      render: (read: number) => (
        read ? <Tag color="success">已读</Tag> : <Tag color="warning">未读</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>
            查看
          </Button>
          {!record.is_read && (
            <Button type="link" icon={<CheckCircleOutlined />} onClick={() => handleMarkRead(record.id)}>
              标读
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title={
          <span>
            <BellOutlined style={{ marginRight: 8 }} />
            通知中心
            {unreadCount > 0 && (
              <Badge count={unreadCount} style={{ marginLeft: 12 }} />
            )}
          </span>
        }
        extra={
          <Space>
            <Select value={status} onChange={setStatus} style={{ width: 120 }}>
              <Option value="all">全部状态</Option>
              <Option value="unread">未读</Option>
              <Option value="read">已读</Option>
            </Select>
            <Select value={type} onChange={setType} style={{ width: 120 }}>
              <Option value="all">全部类型</Option>
              <Option value="adjustment">调课</Option>
              <Option value="cancel">停课</Option>
              <Option value="makeup">补课</Option>
              <Option value="classroom">教室变更</Option>
              <Option value="system">系统</Option>
            </Select>
            <Button type="primary" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
              全部已读
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={notifications}
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: <Empty description="暂无通知" />,
          }}
        />
      </Card>

      <Modal
        title="通知详情"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {currentNotification && (
          <div>
            <div style={{ marginBottom: 16 }}>
              {getTypeTag(currentNotification.type)}
              <span style={{ marginLeft: 8 }}>{currentNotification.title}</span>
            </div>
            <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
              {currentNotification.content}
            </div>
            <div style={{ color: '#999', fontSize: 12 }}>
              发送时间：{currentNotification.created_at}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

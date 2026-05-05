import React, { useEffect, useState } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  message,
  Popconfirm,
  Spin,
  Empty,
  Switch
} from 'antd'
import {
  PlusOutlined,
  BellOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons'
import { notificationApi, applicationApi } from '@/utils/api'

interface Webhook {
  id: string
  eventTypes: string[]
  endpointUrl: string
  isActive: boolean
  application?: {
    id: string
    name: string
    appKey: string
  }
  lastTriggeredAt?: string
  createdAt: string
}

interface Event {
  id: string
  eventType: string
  payload: string
  status: string
  sentAt?: string
  retryCount: number
  createdAt: string
}

interface Application {
  id: string
  name: string
  appKey: string
}

const Notifications: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [webhookModalVisible, setWebhookModalVisible] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [form] = Form.useForm()
  const [eventPagination, setEventPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const eventTypeOptions = [
    { label: '订单创建', value: 'ORDER_CREATED' },
    { label: '订单支付', value: 'ORDER_PAID' },
    { label: '订单发货', value: 'ORDER_SHIPPED' },
    { label: '订单完成', value: 'ORDER_COMPLETED' },
    { label: '订单取消', value: 'ORDER_CANCELLED' },
    { label: '商品更新', value: 'PRODUCT_UPDATED' },
    { label: '商品创建', value: 'PRODUCT_CREATED' },
    { label: '续费提醒', value: 'RENEWAL_DUE' },
    { label: '订阅暂停', value: 'SUBSCRIPTION_PAUSED' },
    { label: '订阅恢复', value: 'SUBSCRIPTION_RESUMED' }
  ]

  const statusColorMap: Record<string, string> = {
    PENDING: 'default',
    SENT: 'success',
    FAILED: 'error'
  }

  const statusNameMap: Record<string, string> = {
    PENDING: '待发送',
    SENT: '已发送',
    FAILED: '发送失败'
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [webhooksRes, appsRes, eventsRes] = await Promise.all([
        notificationApi.getWebhooks(),
        applicationApi.getList({ pageSize: 100 }),
        notificationApi.getEvents({
          page: eventPagination.current,
          pageSize: eventPagination.pageSize
        })
      ])

      if ((webhooksRes as any).success) {
        setWebhooks((webhooksRes as any).data.webhooks || [])
      }
      if ((appsRes as any).success) {
        setApplications((appsRes as any).data.applications || [])
      }
      if ((eventsRes as any).success) {
        setEvents((eventsRes as any).data.notifications || [])
        setEventPagination(prev => ({
          ...prev,
          total: (eventsRes as any).data.pagination?.total || 0
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [eventPagination.current, eventPagination.pageSize])

  const handleCreateOrUpdate = async (values: any) => {
    try {
      if (editingWebhook) {
        const res: any = await notificationApi.updateWebhook(editingWebhook.id, values)
        if (res.success) {
          message.success('Webhook更新成功')
        }
      } else {
        const res: any = await notificationApi.createWebhook(values)
        if (res.success) {
          message.success('Webhook创建成功')
        }
      }
      setWebhookModalVisible(false)
      setEditingWebhook(null)
      form.resetFields()
      fetchData()
    } catch {
      // 错误已在API层处理
    }
  }

  const handleToggleStatus = async (webhook: Webhook) => {
    try {
      const res: any = await notificationApi.updateWebhook(webhook.id, {
        isActive: !webhook.isActive
      })
      if (res.success) {
        message.success(webhook.isActive ? 'Webhook已禁用' : 'Webhook已启用')
        fetchData()
      }
    } catch {
      // 错误已在API层处理
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res: any = await notificationApi.deleteWebhook(id)
      if (res.success) {
        message.success('Webhook已删除')
        fetchData()
      }
    } catch {
      // 错误已在API层处理
    }
  }

  const webhookColumns = [
    {
      title: '应用',
      dataIndex: 'application',
      key: 'application',
      render: (app: Webhook['application']) => (
        app ? (
          <Space>
            <span>{app.name}</span>
            <Tag color="default" style={{ fontSize: 10 }}>
              {app.appKey}
            </Tag>
          </Space>
        ) : '-'
      )
    },
    {
      title: '订阅事件',
      dataIndex: 'eventTypes',
      key: 'eventTypes',
      render: (types: string[]) => (
        <div className="scopes-tags">
          {types.map(type => {
            const option = eventTypeOptions.find(o => o.value === type)
            return (
              <Tag key={type} color="blue">
                {option?.label || type}
              </Tag>
            )
          })}
        </div>
      )
    },
    {
      title: '回调地址',
      dataIndex: 'endpointUrl',
      key: 'endpointUrl',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'default'}>
          {active ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '最后触发',
      dataIndex: 'lastTriggeredAt',
      key: 'lastTriggeredAt',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Webhook) => (
        <Space>
          <Switch
            checked={record.isActive}
            onChange={() => handleToggleStatus(record)}
            size="small"
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingWebhook(record)
              form.setFieldsValue({
                applicationId: record.application?.id,
                eventTypes: record.eventTypes,
                endpointUrl: record.endpointUrl,
                isActive: record.isActive
              })
              setWebhookModalVisible(true)
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此Webhook吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const eventColumns = [
    {
      title: '事件类型',
      dataIndex: 'eventType',
      key: 'eventType',
      render: (type: string) => {
        const option = eventTypeOptions.find(o => o.value === type)
        return <Tag color="purple">{option?.label || type}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColorMap[status] || 'default'}>
          {statusNameMap[status] || status}
        </Tag>
      )
    },
    {
      title: '重试次数',
      dataIndex: 'retryCount',
      key: 'retryCount'
    },
    {
      title: '发送时间',
      dataIndex: 'sentAt',
      key: 'sentAt',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleString()
    }
  ]

  const appOptions = applications.map(a => ({
    label: `${a.name} (${a.appKey})`,
    value: a.id
  }))

  return (
    <div>
      <div className="page-header">
        <h1>消息通知</h1>
        <p>管理Webhook订阅，接收订单、商品等业务事件推送</p>
      </div>

      {loading ? (
        <div className="loading-center">
          <Spin />
        </div>
      ) : (
        <>
          <Card
            title={
              <Space>
                <BellOutlined />
                <span>Webhook订阅</span>
              </Space>
            }
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingWebhook(null)
                  form.resetFields()
                  setWebhookModalVisible(true)
                }}
              >
                新建订阅
              </Button>
            }
          >
            {webhooks.length > 0 ? (
              <Table
                columns={webhookColumns}
                dataSource={webhooks}
                rowKey="id"
                pagination={false}
              />
            ) : (
              <Empty
                description={
                  <span>
                    暂无Webhook订阅，点击
                    <Button
                      type="link"
                      onClick={() => {
                        setEditingWebhook(null)
                        form.resetFields()
                        setWebhookModalVisible(true)
                      }}
                    >
                      新建订阅
                    </Button>
                    开始接收事件通知
                  </span>
                }
              />
            )}
          </Card>

          <Card
            title={
              <Space>
                <BellOutlined />
                <span>通知记录</span>
              </Space>
            }
            style={{ marginTop: 24 }}
          >
            <Table
              columns={eventColumns}
              dataSource={events}
              rowKey="id"
              pagination={{
                ...eventPagination,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => setEventPagination(prev => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize || 10
                }))
              }}
            />
          </Card>
        </>
      )}

      <Modal
        title={editingWebhook ? '编辑Webhook' : '新建Webhook'}
        open={webhookModalVisible}
        onCancel={() => {
          setWebhookModalVisible(false)
          setEditingWebhook(null)
          form.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOrUpdate}
        >
          <Form.Item
            name="applicationId"
            label="目标应用"
            rules={[{ required: true, message: '请选择应用' }]}
          >
            <Select
              placeholder="请选择要订阅事件的应用"
              options={appOptions}
              showSearch
              disabled={!!editingWebhook}
            />
          </Form.Item>

          <Form.Item
            name="eventTypes"
            label="订阅事件"
            rules={[{ required: true, message: '请至少选择一个事件类型' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择要订阅的事件类型"
              options={eventTypeOptions}
              showSearch
              maxTagCount={3}
            />
          </Form.Item>

          <Form.Item
            name="endpointUrl"
            label="回调地址"
            help="接收事件推送的HTTP(S)地址"
            rules={[
              { required: true, message: '请输入回调地址' },
              { type: 'url', message: '请输入有效的URL' }
            ]}
          >
            <Input placeholder="https://example.com/webhook/notify" />
          </Form.Item>

          {editingWebhook && (
            <Form.Item
              name="isActive"
              label="启用状态"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          )}

          <Form.Item>
            <Space className="modal-footer">
              <Button onClick={() => {
                setWebhookModalVisible(false)
                setEditingWebhook(null)
                form.resetFields()
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingWebhook ? '保存' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Notifications

import React, { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Tag,
  Modal,
  Form,
  Input as AntInput,
  Table,
  Space,
  message,
  Spin,
  Empty,
  Popconfirm
} from 'antd'
import {
  CopyOutlined,
  EyeOutlined,
  PlusOutlined,
  KeyOutlined
} from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import { applicationApi, permissionApi } from '@/utils/api'

interface Application {
  id: string
  name: string
  appKey: string
  appSecret: string
  type: string
  description?: string
  status: string
  isSandbox: boolean
  approvedScopes: string[]
  createdAt: string
}

interface Scope {
  name: string
  description: string
}

const Applications: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [scopes, setScopes] = useState<Scope[]>([])
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const statusColorMap: Record<string, string> = {
    DRAFT: 'default',
    PENDING_REVIEW: 'warning',
    ACTIVE: 'success',
    SUSPENDED: 'error',
    BANNED: 'error'
  }

  const statusNameMap: Record<string, string> = {
    DRAFT: '草稿',
    PENDING_REVIEW: '审核中',
    ACTIVE: '已上线',
    SUSPENDED: '已暂停',
    BANNED: '已禁用'
  }

  const typeNameMap: Record<string, string> = {
    WEB_APP: '网页应用',
    NATIVE_APP: '原生应用',
    SERVICE_PROVIDER: '服务提供商',
    THIRD_PARTY_SYSTEM: '第三方系统'
  }

  const typeOptions = [
    { label: '网页应用', value: 'WEB_APP' },
    { label: '原生应用', value: 'NATIVE_APP' },
    { label: '服务提供商', value: 'SERVICE_PROVIDER' },
    { label: '第三方系统', value: 'THIRD_PARTY_SYSTEM' }
  ]

  const statusOptions = [
    { label: '全部状态', value: undefined },
    { label: '草稿', value: 'DRAFT' },
    { label: '审核中', value: 'PENDING_REVIEW' },
    { label: '已上线', value: 'ACTIVE' },
    { label: '已暂停', value: 'SUSPENDED' }
  ]

  const fetchApplications = async (page = 1) => {
    setLoading(true)
    try {
      const res: any = await applicationApi.getList({
        page,
        pageSize: pagination.pageSize,
        status: statusFilter
      })
      if (res.success) {
        const apps = res.data.applications || []
        const filteredApps = searchText
          ? apps.filter((app: Application) =>
              app.name.toLowerCase().includes(searchText.toLowerCase()) ||
              app.appKey.toLowerCase().includes(searchText.toLowerCase())
            )
          : apps
        setApplications(filteredApps)
        setPagination(prev => ({
          ...prev,
          current: page,
          total: res.data.pagination?.total || 0
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchScopes = async () => {
    try {
      const res: any = await permissionApi.getScopes()
      if (res.success) {
        setScopes(res.data.scopes || [])
      }
    } catch {
      // 忽略
    }
  }

  useEffect(() => {
    fetchApplications()
    fetchScopes()
    if (searchParams.get('create') === 'true') {
      setCreateModalVisible(true)
    }
  }, [statusFilter])

  const handleCreate = async (values: any) => {
    try {
      const res: any = await applicationApi.create(values)
      if (res.success) {
        message.success('应用创建成功')
        setCreateModalVisible(false)
        form.resetFields()
        fetchApplications()
      }
    } catch {
      // 错误已在API层处理
    }
  }

  const handleSubmit = async (id: string) => {
    try {
      const res: any = await applicationApi.submit(id)
      if (res.success) {
        message.success('应用已提交审核')
        fetchApplications()
      }
    } catch {
      // 错误已在API层处理
    }
  }

  const handleRotateKey = async (id: string) => {
    try {
      const res: any = await applicationApi.rotateKey(id)
      if (res.success) {
        message.success('密钥已轮换，请及时更新配置')
        if (selectedApp?.id === id) {
          setSelectedApp({
            ...selectedApp,
            appKey: res.data.appKey,
            appSecret: res.data.appSecret
          })
        }
        fetchApplications()
      }
    } catch {
      // 错误已在API层处理
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  }

  const columns = [
    {
      title: '应用名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Application) => (
        <a onClick={() => { setSelectedApp(record); setDetailModalVisible(true); }}>
          {text}
        </a>
      )
    },
    {
      title: 'App Key',
      dataIndex: 'appKey',
      key: 'appKey',
      render: (text: string) => (
        <Space>
          <span className="app-key-display" style={{ fontSize: 12, padding: '4px 8px' }}>
            {text}
          </span>
          <Button
            type="text"
            icon={<CopyOutlined />}
            size="small"
            onClick={() => handleCopy(text)}
          />
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => typeNameMap[type] || type
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
      title: '沙箱',
      dataIndex: 'isSandbox',
      key: 'isSandbox',
      render: (isSandbox: boolean) => (
        <Tag color={isSandbox ? 'blue' : 'default'}>
          {isSandbox ? '沙箱' : '生产'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => new Date(time).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Application) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => { setSelectedApp(record); setDetailModalVisible(true); }}
          >
            详情
          </Button>
          {record.status === 'DRAFT' && (
            <Button
              type="link"
              onClick={() => handleSubmit(record.id)}
            >
              提交审核
            </Button>
          )}
          <Popconfirm
            title="确定要轮换密钥吗？"
            description="轮换后原密钥将失效，请及时更新应用配置"
            onConfirm={() => handleRotateKey(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" icon={<KeyOutlined />}>
              轮换密钥
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>应用管理</h1>
        <p>管理您的应用，查看App Key和Secret，配置权限范围</p>
      </div>

      <Card>
        <div className="action-bar">
          <div className="search-bar">
            <Input.Search
              placeholder="搜索应用名称或App Key"
              allowClear
              style={{ width: 300 }}
              onSearch={(value) => {
                setSearchText(value)
                fetchApplications()
              }}
            />
            <Select
              style={{ width: 150 }}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={statusOptions}
            />
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            创建应用
          </Button>
        </div>

        {loading ? (
          <div className="loading-center">
            <Spin />
          </div>
        ) : applications.length > 0 ? (
          <Table
            columns={columns}
            dataSource={applications}
            rowKey="id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`
            }}
          />
        ) : (
          <Empty
            description={
              <span>
                暂无应用，点击
                <Button
                  type="link"
                  onClick={() => setCreateModalVisible(true)}
                >
                  创建应用
                </Button>
                开始
              </span>
            }
          />
        )}
      </Card>

      <Modal
        title="创建应用"
        open={createModalVisible}
        onCancel={() => { setCreateModalVisible(false); form.resetFields(); }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="name"
            label="应用名称"
            rules={[{ required: true, message: '请输入应用名称' }]}
          >
            <AntInput placeholder="请输入应用名称" />
          </Form.Item>

          <Form.Item
            name="type"
            label="应用类型"
            rules={[{ required: true, message: '请选择应用类型' }]}
          >
            <Select placeholder="请选择应用类型" options={typeOptions} />
          </Form.Item>

          <Form.Item
            name="description"
            label="应用描述"
          >
            <AntInput.TextArea
              rows={4}
              placeholder="请简要描述应用的用途和功能"
            />
          </Form.Item>

          <Form.Item
            name="callbackUrl"
            label="回调地址"
            help="OAuth授权回调地址"
          >
            <AntInput placeholder="https://example.com/callback" />
          </Form.Item>

          <Form.Item
            name="notifyUrl"
            label="通知地址"
            help="接收消息通知的Webhook地址"
          >
            <AntInput placeholder="https://example.com/notify" />
          </Form.Item>

          <Form.Item>
            <Space className="modal-footer">
              <Button onClick={() => { setCreateModalVisible(false); form.resetFields(); }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="应用详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedApp && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <strong>应用名称：</strong>{selectedApp.name}
                </Col>
                <Col span={12}>
                  <strong>类型：</strong>{typeNameMap[selectedApp.type]}
                </Col>
                <Col span={12}>
                  <strong>状态：</strong>
                  <Tag color={statusColorMap[selectedApp.status]}>
                    {statusNameMap[selectedApp.status]}
                  </Tag>
                </Col>
                <Col span={12}>
                  <strong>环境：</strong>
                  <Tag color={selectedApp.isSandbox ? 'blue' : 'default'}>
                    {selectedApp.isSandbox ? '沙箱' : '生产'}
                  </Tag>
                </Col>
              </Row>
            </Card>

            <Card title="凭证信息" size="small" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>App Key</div>
                <Space>
                  <span className="app-key-display" style={{ flex: 1 }}>
                    {selectedApp.appKey}
                  </span>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(selectedApp.appKey)}
                  >
                    复制
                  </Button>
                </Space>
              </div>
              <div>
                <div style={{ marginBottom: 4, fontWeight: 500 }}>App Secret</div>
                <Space>
                  <span className="app-key-display" style={{ flex: 1 }}>
                    {selectedApp.appSecret}
                  </span>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy(selectedApp.appSecret)}
                  >
                    复制
                  </Button>
                </Space>
              </div>
            </Card>

            <Card title="已授权权限" size="small">
              <div className="scopes-tags">
                {selectedApp.approvedScopes.map((scope) => {
                  const scopeInfo = scopes.find(s => s.name === scope)
                  return (
                    <Tag key={scope} color="blue">
                      {scopeInfo?.description || scope}
                    </Tag>
                  )
                })}
              </div>
            </Card>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                {selectedApp.status === 'DRAFT' && (
                  <Button
                    type="primary"
                    onClick={() => {
                      handleSubmit(selectedApp.id)
                      setDetailModalVisible(false)
                    }}
                  >
                    提交审核
                  </Button>
                )}
                <Popconfirm
                  title="确定要轮换密钥吗？"
                  description="轮换后原密钥将失效"
                  onConfirm={() => {
                    handleRotateKey(selectedApp.id)
                  }}
                >
                  <Button icon={<KeyOutlined />}>
                    轮换密钥
                  </Button>
                </Popconfirm>
                <Button onClick={() => setDetailModalVisible(false)}>
                  关闭
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Applications

import React, { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Tag,
  Table,
  Space,
  Button,
  Modal,
  Form,
  Select,
  Input,
  Divider,
  message,
  Spin,
  Descriptions
} from 'antd'
import {
  UserOutlined,
  KeyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import { permissionApi, applicationApi } from '@/utils/api'

interface Scope {
  name: string
  description: string
}

interface Role {
  type: string
  name: string
  defaultScopes: string[]
}

interface Application {
  id: string
  name: string
  appKey: string
  approvedScopes: string[]
}

const Permissions: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [scopes, setScopes] = useState<Scope[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [verifyModalVisible, setVerifyModalVisible] = useState(false)
  const [grantModalVisible, setGrantModalVisible] = useState(false)
  const [verifyResult, setVerifyResult] = useState<any>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [form] = Form.useForm()
  const [grantForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [scopesRes, rolesRes, appsRes] = await Promise.all([
        permissionApi.getScopes(),
        permissionApi.getRoles(),
        applicationApi.getList({ pageSize: 100 })
      ])

      if ((scopesRes as any).success) {
        setScopes((scopesRes as any).data.scopes || [])
      }
      if ((rolesRes as any).success) {
        setRoles((rolesRes as any).data.roles || [])
      }
      if ((appsRes as any).success) {
        setApplications((appsRes as any).data.applications || [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleVerify = async (values: any) => {
    setVerifyLoading(true)
    setVerifyResult(null)
    try {
      const res: any = await permissionApi.verify(values)
      if (res.success) {
        setVerifyResult(res.data)
        message.success(res.data.allowed ? '权限校验通过' : '权限校验不通过')
      }
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleGrant = async (values: any) => {
    try {
      const res: any = await permissionApi.grant(values)
      if (res.success) {
        message.success('权限授权成功')
        setGrantModalVisible(false)
        grantForm.resetFields()
      }
    } catch {
      // 错误已在API层处理
    }
  }

  const scopeColumns = [
    {
      title: '权限标识',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Tag color="blue">{name}</Tag>
      )
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description'
    }
  ]

  const roleOptions = roles.map(r => ({
    label: r.name,
    value: r.type
  }))

  const appOptions = applications.map(a => ({
    label: `${a.name} (${a.appKey})`,
    value: a.id
  }))

  const methodOptions = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' }
  ]

  const endpointOptions = [
    { label: '/api/v1/users (用户信息)', value: '/users' },
    { label: '/api/v1/orders (订单)', value: '/orders' },
    { label: '/api/v1/products (商品)', value: '/products' },
    { label: '/api/v1/trades (交易)', value: '/trades' },
    { label: '/api/v1/logistics (物流)', value: '/logistics' },
    { label: '/api/v1/finance (财务)', value: '/finance' },
    { label: '/api/v1/messages (消息)', value: '/messages' }
  ]

  return (
    <div>
      <div className="page-header">
        <h1>权限管理</h1>
        <p>管理API权限范围、角色权限矩阵和用户授权</p>
      </div>

      {loading ? (
        <div className="loading-center">
          <Spin />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card>
              <Space>
                <Button
                  type="primary"
                  icon={<KeyOutlined />}
                  onClick={() => setVerifyModalVisible(true)}
                >
                  权限校验测试
                </Button>
                <Button
                  icon={<UserOutlined />}
                  onClick={() => setGrantModalVisible(true)}
                >
                  用户授权
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="API权限范围">
              <Table
                columns={scopeColumns}
                dataSource={scopes}
                rowKey="name"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="角色权限矩阵">
              {roles.map(role => (
                <div key={role.type} style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                    <Tag color="purple" style={{ marginRight: 8 }}>
                      {role.type}
                    </Tag>
                    {role.name}
                  </div>
                  <div className="scopes-tags">
                    {role.defaultScopes.map(scope => {
                      const scopeInfo = scopes.find(s => s.name === scope)
                      return (
                        <Tag key={scope} color="blue">
                          {scopeInfo?.description || scope}
                        </Tag>
                      )
                    })}
                  </div>
                  {role !== roles[roles.length - 1] && <Divider style={{ margin: '16px 0' }} />}
                </div>
              ))}
            </Card>
          </Col>
        </Row>
      )}

      <Modal
        title="权限校验测试"
        open={verifyModalVisible}
        onCancel={() => {
          setVerifyModalVisible(false)
          setVerifyResult(null)
          form.resetFields()
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleVerify}
        >
          <Form.Item
            name="applicationId"
            label="目标应用（可选）"
            help="选择应用将使用该应用的实际权限范围进行校验，留空则使用默认权限"
          >
            <Select
              placeholder="选择要测试的应用"
              options={appOptions}
              allowClear
              showSearch
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="endpoint"
                label="API端点"
                rules={[{ required: true, message: '请选择API端点' }]}
              >
                <Select
                  placeholder="请选择API端点"
                  options={endpointOptions}
                  showSearch
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="method"
                label="HTTP方法"
                rules={[{ required: true, message: '请选择HTTP方法' }]}
              >
                <Select
                  placeholder="请选择HTTP方法"
                  options={methodOptions}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="userId"
            label="用户ID（可选）"
          >
            <Input placeholder="用于校验终端用户角色权限" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={verifyLoading}>
              执行校验
            </Button>
          </Form.Item>
        </Form>

        {verifyResult && (
          <Card size="small" title="校验结果">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="校验结果">
                {verifyResult.allowed ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    允许访问
                  </Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="error">
                    拒绝访问
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="应用权限范围">
                <div className="scopes-tags">
                  {verifyResult.appScopes?.map((s: string) => (
                    <Tag key={s} color="blue">{s}</Tag>
                  ))}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="用户权限范围">
                <div className="scopes-tags">
                  {verifyResult.userScopes?.map((s: string) => (
                    <Tag key={s} color="green">{s}</Tag>
                  ))}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="需要的权限">
                <div className="scopes-tags">
                  {verifyResult.requiredScopes?.map((s: string) => (
                    <Tag key={s} color="orange">{s}</Tag>
                  ))}
                </div>
              </Descriptions.Item>
              {verifyResult.missingScopes?.length > 0 && (
                <Descriptions.Item label="缺少的权限">
                  <div className="scopes-tags">
                    {verifyResult.missingScopes.map((s: string) => (
                      <Tag key={s} color="red">{s}</Tag>
                    ))}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        )}
      </Modal>

      <Modal
        title="用户授权"
        open={grantModalVisible}
        onCancel={() => {
          setGrantModalVisible(false)
          grantForm.resetFields()
        }}
        footer={null}
        width={600}
      >
        <Form
          form={grantForm}
          layout="vertical"
          onFinish={handleGrant}
        >
          <Form.Item
            name="userId"
            label="用户ID"
            rules={[{ required: true, message: '请输入用户ID' }]}
          >
            <Input placeholder="请输入用户唯一标识" />
          </Form.Item>

          <Form.Item
            name="applicationId"
            label="目标应用"
            rules={[{ required: true, message: '请选择应用' }]}
          >
            <Select
              placeholder="请选择要授权的应用"
              options={appOptions}
              showSearch
            />
          </Form.Item>

          <Form.Item
            name="roleType"
            label="用户角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              placeholder="请选择用户角色"
              options={roleOptions}
            />
          </Form.Item>

          <Form.Item
            name="grantedScopes"
            label="授权权限（可选）"
            help="留空则使用角色默认权限范围"
          >
            <Select
              mode="multiple"
              placeholder="选择要授权的权限范围"
              options={scopes.map(s => ({
                label: s.description,
                value: s.name
              }))}
              showSearch
              maxTagCount={3}
            />
          </Form.Item>

          <Form.Item>
            <Space className="modal-footer">
              <Button onClick={() => {
                setGrantModalVisible(false)
                grantForm.resetFields()
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确认授权
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Permissions

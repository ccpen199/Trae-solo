import React, { useState } from 'react'
import { Form, Input, Button, Card, Tabs, message, Checkbox, Alert, Tag, Space, Divider, Typography, Row, Col } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, SafetyOutlined, DashboardOutlined, ShopOutlined, TeamOutlined, BarChartOutlined, UserSwitchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const { Title, Text, Paragraph } = Typography

const demoAccounts = [
  {
    role: 'platform',
    roleName: '平台管理员',
    roleDesc: '全局数据管控、系统配置、商家管理',
    username: 'platform',
    password: '123456',
    icon: <BarChartOutlined />,
    color: 'magenta'
  },
  {
    role: 'ops',
    roleName: '运营管理员',
    roleDesc: '活动运营、数据分析、客服支持',
    username: 'ops',
    password: '123456',
    icon: <UserSwitchOutlined />,
    color: 'geekblue'
  },
  {
    role: 'admin',
    roleName: '系统管理员',
    roleDesc: '用户管理、内容审核、权限分配',
    username: 'admin',
    password: '123456',
    icon: <SafetyOutlined />,
    color: 'red'
  },
  {
    role: 'station_master',
    roleName: '驿站站长',
    roleDesc: '驿站管理、包裹代收、快递员对接',
    username: 'stationmaster',
    password: '123456',
    icon: <ShopOutlined />,
    color: 'green'
  },
  {
    role: 'user',
    roleName: '普通用户',
    roleDesc: '查件、取件、寄件、社区互动',
    username: 'zhangsan',
    password: '123456',
    icon: <UserOutlined />,
    color: 'blue'
  }
]

const roleTagMap = {
  platform: { label: '平台管理员', color: 'magenta' },
  ops: { label: '运营管理员', color: 'geekblue' },
  admin: { label: '系统管理员', color: 'red' },
  station_master: { label: '驿站站长', color: 'green' },
  user: { label: '普通用户', color: 'blue' }
}

function Login() {
  const [activeTab, setActiveTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState(null)
  const [selectedRole, setSelectedRole] = useState(null)
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const handleQuickLogin = (account) => {
    setSelectedRole(account.role)
    setLoginError(null)
    handleLogin({ username: account.username, password: account.password })
  }

  const handleLogin = async (values) => {
    setLoading(true)
    setLoginError(null)
    try {
      const result = await login(values.username, values.password)
      if (result.success) {
        message.success(`登录成功！欢迎，${result.user.username} (${roleTagMap[result.user.role]?.label || '用户'})`)
        const role = result.user.role
        if (role === 'station_master') {
          navigate('/community/stations')
        } else if (role === 'platform' || role === 'ops') {
          navigate('/admin/stats')
        } else if (role === 'admin') {
          navigate('/admin/parcels')
        } else {
          navigate('/dashboard')
        }
      } else {
        const errorMsg = result.message || '登录失败，请检查账号密码'
        setLoginError(errorMsg)
        message.error(errorMsg)
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '网络连接失败，请检查后端服务是否启动'
      setLoginError(errorMsg)
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (values) => {
    setLoading(true)
    setLoginError(null)
    try {
      const result = await register(values)
      if (result.success) {
        message.success('注册成功！请使用新账号登录')
        setActiveTab('login')
      } else {
        const errorMsg = result.message || '注册失败'
        setLoginError(errorMsg)
        message.error(errorMsg)
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || '注册失败，请稍后重试'
      setLoginError(errorMsg)
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const loginForm = (
    <Form
      name="login"
      onFinish={handleLogin}
      autoComplete="off"
      size="large"
      initialValues={selectedRole ? {
        username: demoAccounts.find(a => a.role === selectedRole)?.username,
        password: '123456'
      } : { remember: true }}
    >
      {loginError && (
        <Alert
          message="登录失败"
          description={loginError}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setLoginError(null)}
        />
      )}

      <Form.Item
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="用户名 / 手机号"
          autoComplete="username"
          onChange={() => setLoginError(null)}
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
          autoComplete="current-password"
          onChange={() => setLoginError(null)}
        />
      </Form.Item>

      <Form.Item>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>记住我</Checkbox>
          </Form.Item>
          <a href="#" onClick={(e) => { e.preventDefault(); message.info('请联系管理员重置密码') }}>忘记密码？</a>
        </div>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          登录
        </Button>
      </Form.Item>

      <Divider orientation="left" plain>
        <Text type="secondary" style={{ fontSize: 12 }}>演示账号（点击快速登录）</Text>
      </Divider>

      <div className="demo-accounts">
        <Row gutter={[8, 8]}>
          {demoAccounts.map(account => (
            <Col span={24} key={account.role}>
              <Card
                size="small"
                hoverable
                onClick={() => handleQuickLogin(account)}
                className={`account-card ${selectedRole === account.role ? 'selected' : ''}`}
                style={{
                  borderLeft: `4px solid var(--ant-${account.color}-6)`,
                  cursor: 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    fontSize: 20,
                    color: `var(--ant-${account.color}-6)`,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    {account.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Text strong>{account.roleName}</Text>
                      <Tag color={account.color} style={{ margin: 0 }}>{account.username}</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{account.roleDesc}</Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>密码: 123456</Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </Form>
  )

  const registerForm = (
    <Form
      name="register"
      onFinish={handleRegister}
      autoComplete="off"
      size="large"
    >
      {loginError && (
        <Alert
          message="注册失败"
          description={loginError}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setLoginError(null)}
        />
      )}

      <Form.Item
        name="username"
        rules={[{ required: true, message: '请输入用户名' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="设置用户名" />
      </Form.Item>

      <Form.Item
        name="phone"
        rules={[
          { required: true, message: '请输入手机号' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
        ]}
      >
        <Input prefix={<PhoneOutlined />} placeholder="手机号" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6位' }
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="设置密码（至少6位）" />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: '请确认密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve()
              }
              return Promise.reject(new Error('两次输入的密码不一致'))
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="再次输入密码" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          注册账号
        </Button>
      </Form.Item>

      <Alert
        message="注册说明"
        description="注册成功后默认为普通用户角色。如需驿站站长、管理员等角色，请联系平台管理员进行权限升级。"
        type="info"
        showIcon
      />
    </Form>
  )

  const tabItems = [
    { key: 'login', label: '账号登录', children: loginForm },
    { key: 'register', label: '新用户注册', children: registerForm },
  ]

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-bg-gradient"></div>
      </div>
      <div className="login-content">
        <Row gutter={48} align="middle" style={{ height: '100%' }}>
          <Col xs={0} md={12} className="login-hero">
            <div className="login-hero-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  color: 'white'
                }}>
                  <DashboardOutlined />
                </div>
                <div>
                  <Title level={1} style={{ color: 'white', margin: 0, fontSize: 36 }}>
                    ExpressTrace
                  </Title>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>
                    包裹全生命周期协同管理平台
                  </Text>
                </div>
              </div>

              <div className="feature-list">
                <div className="feature-item">
                  <div className="feature-icon">📦</div>
                  <div>
                    <Text strong style={{ color: 'white', fontSize: 15 }}>智能查件</Text>
                    <Paragraph style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                      聚合140+快递公司，多单号批量查询，异常件智能预警
                    </Paragraph>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🔐</div>
                  <div>
                    <Text strong style={{ color: 'white', fontSize: 15 }}>安全取件</Text>
                    <Paragraph style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                      动态取件码，生物特征授权，超时自动转驿站
                    </Paragraph>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🚚</div>
                  <div>
                    <Text strong style={{ color: 'white', fontSize: 15 }}>便捷寄件</Text>
                    <Paragraph style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                      阶梯报价引擎，智能调度，大件寄送专属服务
                    </Paragraph>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🔗</div>
                  <div>
                    <Text strong style={{ color: 'white', fontSize: 15 }}>可信溯源</Text>
                    <Paragraph style={{ color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                      区块链级哈希链，每节点可查，权益争议可举证
                    </Paragraph>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 32 }}>
                <Space size={[16, 8]} wrap>
                  <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>
                    <TeamOutlined /> 社区服务
                  </Tag>
                  <Tag color="green" style={{ fontSize: 13, padding: '4px 12px' }}>
                    🌱 绿色回收
                  </Tag>
                  <Tag color="orange" style={{ fontSize: 13, padding: '4px 12px' }}>
                    🤝 邻里互助
                  </Tag>
                  <Tag color="purple" style={{ fontSize: 13, padding: '4px 12px' }}>
                    🏪 驿站入驻
                  </Tag>
                </Space>
              </div>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <Card className="login-card">
              <div className="login-title">
                <h1>ExpressTrace</h1>
                <p>快递溯源追踪系统</p>
              </div>
              <Tabs
                activeKey={activeTab}
                onChange={(key) => { setActiveTab(key); setLoginError(null); }}
                items={tabItems}
                centered
                size="large"
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default Login

import React, { useState } from 'react'
import {
  Form, Input, Button, Card, message, Tabs, Tag, Row, Col,
  Descriptions, Space, Avatar, Select, Divider
} from 'antd'

import {
  UserOutlined, LockOutlined, SafetyOutlined,
  ShopOutlined, CarOutlined, DashboardOutlined
} from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'

const { Option } = Select
const { TabPane } = Tabs

const roleDemoAccounts = [
  {
    role: 'admin',
    name: '系统管理员',
    icon: <DashboardOutlined />,
    color: 'red',
    phone: '13800138000',
    password: '123456',
    description: '数据看板、商户审核、用户管理、风控规则配置'
  },
  {
    role: 'user',
    name: '普通用户',
    icon: <UserOutlined />,
    color: 'default',
    phone: '13800138001',
    password: '123456',
    description: '浏览商户、下单购物、优惠券、个人中心'
  },
  {
    role: 'merchant',
    name: '商户',
    icon: <ShopOutlined />,
    color: 'blue',
    phone: '13800138002',
    password: '123456',
    description: '商品管理、订单处理、经营数据'
  },
  {
    role: 'rider',
    name: '骑手',
    icon: <CarOutlined />,
    color: 'cyan',
    phone: '13800138003',
    password: '123456',
    description: '订单配送、轨迹同步、收入统计'
  }
]

const Login = ({ onLogin }) => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('password')
  const [selectedRole, setSelectedRole] = useState(null)

  const getDashboardRoute = (role) => {
    switch (role) {
      case 'admin': return '/admin/dashboard'
      case 'merchant': return '/merchant/dashboard'
      case 'rider': return '/rider/dashboard'
      default: return '/profile'
    }
  }

  const handleSubmit = async (values) => {
    try {
      const res = await api.post('/auth/login', values)
      const role = values.role || selectedRole || res.data.user.role
      const user = {
        ...res.data.user,
        role
      }
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(user))
      onLogin?.(user)
      message.success(`登录成功，欢迎${
        user.role === 'admin' ? '管理员' :
        user.role === 'merchant' ? '商家' :
        user.role === 'rider' ? '骑手' : '回来'
      }！`)
      
      const redirectRoute = getDashboardRoute(user.role)
      navigate(redirectRoute)
    } catch (error) {
      message.error(error.response?.data?.error || '登录失败')
    }
  }

  const handleQuickLogin = (roleInfo) => {
    setSelectedRole(roleInfo.role)
    const values = {
      phone: roleInfo.phone,
      password: roleInfo.password,
      role: roleInfo.role
    }
    form.setFieldsValue(values)
    handleSubmit(values)
  }

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }}>
      <Row gutter={[32, 16]} style={{ maxWidth: 900, width: '100%' }}>
        <Col span={14}>
          <Card
            title={
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <h2 style={{ margin: 0 }}>欢迎登录</h2>
                <p style={{ margin: '8px 0 0 0', color: '#999', fontSize: '14px' }}>
                  本地生活服务聚合平台
                </p>
              </div>
            }
            style={{ borderRadius: '12px' }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              centered
              style={{ marginBottom: '16px' }}
            >
              <TabPane tab="账号密码登录" key="password">
                <Form
                  form={form}
                  onFinish={handleSubmit}
                  autoComplete="off"
                >
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="手机号" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="role"
                    label="登录身份（可选，会覆盖默认角色）"
                  >
                    <Select placeholder="选择登录身份（可选）">
                      <Option value="user">普通用户</Option>
                      <Option value="merchant">商户</Option>
                      <Option value="rider">骑手</Option>
                      <Option value="admin">管理员</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" size="large" block>
                      <SafetyOutlined /> 安全登录
                    </Button>
                  </Form.Item>

                  <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    还没有账号？<Link to="/register">立即注册</Link>
                  </div>
                </Form>
              </TabPane>

              <TabPane tab="快捷登录" key="quick">
                <p style={{ color: '#666', marginBottom: '16px', textAlign: 'center' }}>
                  选择角色快速登录体验不同工作台
                </p>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {roleDemoAccounts.map(role => (
                    <Card
                      key={role.role}
                      hoverable
                      onClick={() => handleQuickLogin(role)}
                      style={{ cursor: 'pointer', border: selectedRole === role.role ? '2px solid #1890ff' : '1px solid #f0f0f0' }}
                    >
                      <Row align="middle">
                        <Col span={4} style={{ textAlign: 'center' }}>
                          <Avatar size={48} style={{ backgroundColor: role.color === 'default' ? '#1890ff' : '' }} icon={role.icon} />
                        </Col>
                        <Col span={14}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <strong>{role.name}</strong>
                            <Tag color={role.color}>{role.role}</Tag>
                          </div>
                          <div style={{ color: '#999', fontSize: '12px' }}>{role.description}</div>
                          <div style={{ color: '#1890ff', fontSize: '12px', marginTop: '4px' }}>
                            账号: {role.phone}
                          </div>
                        </Col>
                        <Col span={6} style={{ textAlign: 'right' }}>
                          <Button type="primary" size="small">
                            登录
                          </Button>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </Space>
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        <Col span={10}>
          <Card
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              height: '100%',
              color: '#fff'
            }}
            bodyStyle={{ padding: '32px', height: '100%' }}
          >
            <h2 style={{ color: '#fff', marginBottom: '24px' }}>
              🎯 角色工作台说明
            </h2>
            <Descriptions column={1} size="small" style={{ color: '#fff' }}>
              {roleDemoAccounts.map(role => (
                <Descriptions.Item
                  key={role.role}
                  label={
                    <Tag color={role.color === 'default' ? 'blue' : role.color}>
                      {role.icon} {role.name}
                    </Tag>
                  }
                  labelStyle={{ color: '#fff', width: '100%', marginBottom: '4px' }}
                  contentStyle={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  {role.description}
                </Descriptions.Item>
              ))}
            </Descriptions>
            
            <Divider style={{ borderColor: 'rgba(255,255,255,0.2)', margin: '24px 0' }} />
            
            <div style={{ color: 'rgba(255,255,255,0.85)' }}>
              <h4 style={{ color: '#fff', marginBottom: '12px' }}>🔒 安全提示</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '13px' }}>
                <li>所有密码已加密存储</li>
                <li>支持多角色权限隔离</li>
                <li>操作日志全程留痕可复查</li>
                <li>风控规则实时检测异常</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Login

import { useState } from 'react'
import { Form, Input, Button, Tabs, Typography, message, Card } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  TeamOutlined,
  BankOutlined,
} from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import authApi from '../api/auth'
import type { RegisterWorkerParams, RegisterEnterpriseParams } from '../types'
import type { TabsProps } from 'antd'

const { Title, Text } = Typography

type RegisterTab = 'worker' | 'enterprise'

function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [workerForm] = Form.useForm<RegisterWorkerParams>()
  const [enterpriseForm] = Form.useForm<RegisterEnterpriseParams>()
  const [activeTab, setActiveTab] = useState<RegisterTab>('worker')

  const handleWorkerRegister = async (values: RegisterWorkerParams) => {
    setLoading(true)
    try {
      const res = await authApi.registerWorker(values)
      if (res.code === 0) {
        message.success('注册成功，请登录')
        navigate('/login')
      } else {
        message.error(res.message || '注册失败')
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEnterpriseRegister = async (values: RegisterEnterpriseParams) => {
    setLoading(true)
    try {
      const res = await authApi.registerEnterprise(values)
      if (res.code === 0) {
        message.success('注册成功，请登录')
        navigate('/login')
      } else {
        message.error(res.message || '注册失败')
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const tabItems: TabsProps['items'] = [
    {
      key: 'worker',
      label: (
        <span>
          <TeamOutlined /> 工人注册
        </span>
      ),
    },
    {
      key: 'enterprise',
      label: (
        <span>
          <BankOutlined /> 企业注册
        </span>
      ),
    },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        styles={{ body: { padding: '32px 28px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 12px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              color: '#fff',
            }}
          >
            匠
          </div>
          <Title level={3} style={{ margin: 0, color: '#1f1f1f' }}>
            匠信工易 - 注册
          </Title>
          <Text type="secondary">可信用工 · 匠级保障</Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as RegisterTab)}
          items={tabItems}
          centered
          style={{ marginBottom: 20 }}
        />

        {activeTab === 'worker' && (
          <Form
            form={workerForm}
            layout="vertical"
            onFinish={handleWorkerRegister}
            size="large"
          >
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入手机号" maxLength={11} />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认密码"
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
              <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
            </Form.Item>

            <Form.Item
              name="real_name"
              label="真实姓名"
              rules={[{ required: true, message: '请输入真实姓名' }]}
            >
              <Input prefix={<SafetyCertificateOutlined />} placeholder="请输入真实姓名" />
            </Form.Item>

            <Form.Item
              name="id_card_number"
              label="身份证号"
              rules={[
                { required: true, message: '请输入身份证号' },
                {
                  pattern: /(^\d{15}$)|(^\d{17}(\d|X|x)$)/,
                  message: '请输入正确的身份证号',
                },
              ]}
            >
              <Input prefix={<IdcardOutlined />} placeholder="请输入身份证号" maxLength={18} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44 }}>
                注册
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                已有账号？<Link to="/login">立即登录</Link>
              </Text>
            </div>
          </Form>
        )}

        {activeTab === 'enterprise' && (
          <Form
            form={enterpriseForm}
            layout="vertical"
            onFinish={handleEnterpriseRegister}
            size="large"
          >
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入手机号" maxLength={11} />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认密码"
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
              <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
            </Form.Item>

            <Form.Item
              name="company_name"
              label="公司名称"
              rules={[{ required: true, message: '请输入公司名称' }]}
            >
              <Input prefix={<BankOutlined />} placeholder="请输入公司名称" />
            </Form.Item>

            <Form.Item
              name="legal_person"
              label="法人姓名"
              rules={[{ required: true, message: '请输入法人姓名' }]}
            >
              <Input prefix={<SafetyCertificateOutlined />} placeholder="请输入法人姓名" />
            </Form.Item>

            <Form.Item style={{ marginBottom: 12 }}>
              <Button type="primary" htmlType="submit" block loading={loading} style={{ height: 44 }}>
                注册
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                已有账号？<Link to="/login">立即登录</Link>
              </Text>
            </div>
          </Form>
        )}
      </Card>
    </div>
  )
}

export default Register

import React, { useState } from 'react'
import {
  Form,
  Input,
  Button,
  Tabs,
  QRCode,
  Typography,
  Checkbox,
  message,
  Space,
  Divider,
  Select
} from 'antd'
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  WechatOutlined,
  AlipayCircleOutlined,
  QuestionCircleOutlined,
  PhoneOutlined,
  SafetyOutlined,
  QrcodeOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/user'
import './style.css'

const { Title, Text, Paragraph } = Typography

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { setToken, setUserInfo } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [qrType, setQrType] = useState<'wechat' | 'alipay'>('wechat')
  const [form] = Form.useForm()

  const roleConfigs: Record<string, {
    username: string; password: string; name: string; department: string;
    roles: string[]; permissions: string[]; id: string; email: string; phone: string;
  }> = {
    admin: {
      username: 'admin', password: 'admin123', name: '自治区管理员', department: '数字政务运营中心',
      roles: ['超级管理员', '平台管理员'], id: 'admin-001', email: 'admin@nx.gov.cn', phone: '138****8888',
      permissions: ['dashboard:view', 'service:manage', 'ticket:manage', 'certificate:manage', 'audit:view', 'system:manage']
    },
    dept_admin: {
      username: 'dept_admin', password: 'dept123', name: '部门管理员', department: '人力资源社会保障厅',
      roles: ['委办局管理员'], id: 'dept-admin-001', email: 'dept@nx.gov.cn', phone: '139****6666',
      permissions: ['dashboard:view', 'service:manage', 'ticket:manage', 'certificate:view']
    },
    clerk: {
      username: 'clerk', password: 'clerk123', name: '窗口办事员', department: '政务服务大厅',
      roles: ['窗口办事员'], id: 'clerk-001', email: 'clerk@nx.gov.cn', phone: '137****5555',
      permissions: ['dashboard:view', 'ticket:manage', 'certificate:view']
    },
    auditor: {
      username: 'auditor', password: 'auditor123', name: '审计专员', department: '审计监督处',
      roles: ['审计员'], id: 'auditor-001', email: 'auditor@nx.gov.cn', phone: '136****4444',
      permissions: ['dashboard:view', 'audit:view', 'audit:export', 'log:view']
    }
  }

  const getMockLoginTrail = (method: string) => {
    const ips = ['192.168.1.100', '10.0.5.23', '172.16.8.45', '192.168.10.88']
    const ua = navigator.userAgent
    let device = '未知设备'
    if (ua.includes('Windows')) device = 'Windows PC'
    else if (ua.includes('Mac')) device = 'Mac'
    else if (ua.includes('Linux')) device = 'Linux PC'
    else if (ua.includes('Android')) device = 'Android'
    else if (ua.includes('iPhone') || ua.includes('iPad')) device = 'iOS'
    return {
      loginMethod: method,
      loginIp: ips[Math.floor(Math.random() * ips.length)],
      loginDevice: device,
      loginTime: new Date().toLocaleString('zh-CN')
    }
  }

  const handleAccountLogin = async (values: { username: string; password: string; remember: boolean; role: string }) => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const config = roleConfigs[values.role]
      if (!config || values.username !== config.username || values.password !== config.password) {
        message.error('账号密码或角色不匹配')
        setLoading(false)
        return
      }
      const trail = getMockLoginTrail('账号密码')
      setToken('nx-gov-token-' + Date.now(), 'nx-gov-refresh-token-' + Date.now())
      setUserInfo({
        id: config.id,
        username: values.username,
        name: config.name,
        avatar: '',
        email: config.email,
        phone: config.phone,
        department: config.department,
        roles: config.roles,
        permissions: config.permissions,
        ...trail
      })
      message.success('登录成功，欢迎回来！')
      navigate('/dashboard')
    } catch (error) {
      message.error('登录失败，请检查账号密码')
    } finally {
      setLoading(false)
    }
  }

  const handleGovLogin = () => {
    setLoading(true)
    message.info('正在跳转到宁夏政务服务网...')
    setTimeout(() => {
      const trail = getMockLoginTrail('宁夏政务SSO')
      setToken('nx-gov-sso-token-' + Date.now(), 'nx-gov-sso-refresh-token-' + Date.now())
      setUserInfo({
        id: 'gov-001',
        username: 'nx_gov_user',
        name: '政务用户',
        avatar: '',
        email: 'user@nx.gov.cn',
        phone: '139****9999',
        department: '自治区人民政府',
        roles: ['政务用户'],
        permissions: ['dashboard:view', 'service:view', 'ticket:create'],
        ...trail
      })
      message.success('宁夏政务登录成功！')
      navigate('/dashboard')
      setLoading(false)
    }, 1500)
  }

  const handleQrScan = () => {
    message.loading({ content: '请使用手机扫码登录...', duration: 2 })
    setTimeout(() => {
      const methodName = qrType === 'wechat' ? '微信扫码' : '支付宝扫码'
      const trail = getMockLoginTrail(methodName)
      setToken('qr-login-token-' + Date.now(), 'qr-login-refresh-token-' + Date.now())
      setUserInfo({
        id: 'qr-001',
        username: 'qr_user',
        name: qrType === 'wechat' ? '微信用户' : '支付宝用户',
        avatar: '',
        department: '公众用户',
        roles: ['普通用户'],
        permissions: ['dashboard:view', 'service:view'],
        ...trail
      })
      message.success('扫码登录成功！')
      navigate('/dashboard')
    }, 2500)
  }

  const loginTabs = [
    {
      key: 'account',
      label: (
        <span>
          <UserOutlined /> 账号密码登录
        </span>
      ),
      children: (
        <Form
          form={form}
          layout="vertical"
          initialValues={{ username: 'admin', password: 'admin123', role: 'admin', remember: true }}
          onFinish={handleAccountLogin}
          className="login-form"
        >
          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select prefix={<TeamOutlined />} size="large" placeholder="请选择登录角色">
              <Select.Option value="admin">超级管理员</Select.Option>
              <Select.Option value="dept_admin">委办局管理员</Select.Option>
              <Select.Option value="clerk">窗口办事员</Select.Option>
              <Select.Option value="auditor">审计员</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="账号"
            name="username"
            rules={[{ required: true, message: '请输入账号' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入账号/手机号" size="large" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              size="large"
            />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Checkbox>记住登录状态</Checkbox>
              <a href="#" style={{ color: '#0958d9' }}>忘记密码？</a>
            </div>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              登 录
            </Button>
          </Form.Item>
        </Form>
      )
    },
    {
      key: 'gov',
      label: (
        <span>
          <SafetyCertificateOutlined /> 宁夏政务登录
        </span>
      ),
      children: (
        <div className="gov-login">
          <div className="gov-login-icon">
            <SafetyOutlined />
          </div>
          <Title level={4} className="gov-login-title">
            宁夏政务服务网统一身份认证
          </Title>
          <Paragraph type="secondary" className="gov-login-desc">
            使用宁夏政务服务网账号安全登录，一次认证，全网通行
          </Paragraph>
          <div className="gov-login-features">
            <Space direction="vertical" size="middle">
              <div className="feature-item">
                <SafetyCertificateOutlined style={{ color: '#0958d9' }} />
                <span>安全可信的政务级身份认证</span>
              </div>
              <div className="feature-item">
                <SafetyOutlined style={{ color: '#52c41a' }} />
                <span>多因素认证保障账号安全</span>
              </div>
            </Space>
          </div>
          <Button
            type="primary"
            block
            size="large"
            icon={<SafetyCertificateOutlined />}
            loading={loading}
            onClick={handleGovLogin}
            className="gov-login-btn"
          >
            前往宁夏政务服务网登录
          </Button>
          <Text type="secondary" className="gov-login-tip">
            跳转至宁夏政务服务网完成认证后自动返回
          </Text>
        </div>
      )
    },
    {
      key: 'qr',
      label: (
        <span>
          <QrcodeOutlined /> 扫码登录
        </span>
      ),
      children: (
        <div className="qr-login">
          <div className="qr-type-switch">
            <Button
              type={qrType === 'wechat' ? 'primary' : 'default'}
              icon={<WechatOutlined />}
              onClick={() => setQrType('wechat')}
              className={qrType === 'wechat' ? 'qr-type-btn active' : 'qr-type-btn'}
            >
              微信扫码
            </Button>
            <Button
              type={qrType === 'alipay' ? 'primary' : 'default'}
              icon={<AlipayCircleOutlined />}
              onClick={() => setQrType('alipay')}
              className={qrType === 'alipay' ? 'qr-type-btn active' : 'qr-type-btn'}
            >
              支付宝扫码
            </Button>
          </div>
          <div className="qr-code-wrapper">
            <div className="qr-code-container">
              <QRCode
                value={
                  qrType === 'wechat'
                    ? 'https://wx.gxj.gov.cn/login?qr=nx_gov_wechat_' + Date.now()
                    : 'https://zfb.gxj.gov.cn/login?qr=nx_gov_alipay_' + Date.now()
                }
                size={200}
                level="H"
                onRefresh={handleQrScan}
              />
            </div>
            <Text type="secondary" className="qr-tip">
              请使用{qrType === 'wechat' ? '微信' : '支付宝'}扫描二维码登录
            </Text>
          </div>
          <div className="qr-features">
            <Space size="large">
              <div className="qr-feature-item">
                <WechatOutlined style={{ color: '#07c160' }} />
                <span>安全便捷</span>
              </div>
              <div className="qr-feature-item">
                <AlipayCircleOutlined style={{ color: '#1677ff' }} />
                <span>快速登录</span>
              </div>
            </Space>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="login-page-wrapper">
      <div className="login-container">
        <div className="login-left">
          <div className="login-left-content">
            <div className="logo-section">
              <div className="gov-logo">
                <SafetyOutlined />
              </div>
              <div className="logo-text">
                <Title level={2} className="main-title">
                  宁夏自治区
                </Title>
                <Title level={3} className="sub-title">
                  一网通办 · 数字政务平台
                </Title>
              </div>
            </div>

            <div className="slogan-section">
              <Title level={4} className="slogan-title">
                让数据多跑路 让群众少跑腿
              </Title>
              <Paragraph className="slogan-desc">
                宁夏政务服务一体化平台，整合全区政务服务资源，
                <br />
                为企业和群众提供一站式、全天候的政务服务。
              </Paragraph>
            </div>

            <div className="features-section">
              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <SafetyCertificateOutlined />
                </div>
                <div className="feature-content">
                  <Text strong>政务级安全</Text>
                  <Text type="secondary">国家等级保护三级认证</Text>
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <SafetyOutlined />
                </div>
                <div className="feature-content">
                  <Text strong>一站式服务</Text>
                  <Text type="secondary">全区政务事项一网通办</Text>
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <PhoneOutlined />
                </div>
                <div className="feature-content">
                  <Text strong>7×24小时</Text>
                  <Text type="secondary">全天候在线政务服务</Text>
                </div>
              </div>
            </div>

            <div className="stats-section">
              <div className="stat-item">
                <div className="stat-number">32</div>
                <div className="stat-label">电子证照种类</div>
              </div>
              <Divider type="vertical" className="stat-divider" />
              <div className="stat-item">
                <div className="stat-number">1,280</div>
                <div className="stat-label">政务服务事项</div>
              </div>
              <Divider type="vertical" className="stat-divider" />
              <div className="stat-item">
                <div className="stat-number">98.6%</div>
                <div className="stat-label">群众满意度</div>
              </div>
            </div>
          </div>

          <div className="login-footer">
            <Space size="large" wrap>
              <a href="#" className="footer-link">
                <QuestionCircleOutlined /> 使用帮助
              </a>
              <a href="#" className="footer-link">
                <PhoneOutlined /> 政务服务热线 12345
              </a>
              <span className="footer-copyright">
                © 2024 宁夏回族自治区人民政府 版权所有
              </span>
            </Space>
          </div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <Title level={3} className="card-title">
              欢迎登录
            </Title>
            <Text type="secondary" className="card-subtitle">
              宁夏数字政务管理后台
            </Text>
            <Tabs items={loginTabs} defaultActiveKey="account" centered />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

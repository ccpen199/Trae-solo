import { useState } from 'react'
import { Tabs, Form, Input, Button, Card, message, Row, Col, Divider, Alert, Tag, Space } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  QrcodeOutlined,
  ScanOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

const authSourceInfo = {
  local: { label: '账号密码', color: 'blue' },
  ca: { label: '省CA证书', color: 'purple' },
  alipay: { label: '支付宝', color: 'cyan' },
  minzhengtong: { label: '闽政通小程序', color: 'green' },
}

function saveAndJump(user) {
  if (!user || !user.id) {
    message.error('登录返回数据异常，缺少用户标识')
    return false
  }
  try {
    localStorage.setItem('user', JSON.stringify(user))
  } catch (e) {
    message.error('浏览器本地存储不可用：' + e.message)
    return false
  }
  const check = localStorage.getItem('user')
  if (!check) {
    message.error('会话写入失败，请检查浏览器隐私设置')
    return false
  }
  const sourceInfo = authSourceInfo[user.auth_source] || authSourceInfo.local
  const roleMap = { admin: '系统管理员', staff: '工作人员', citizen: '普通群众' }
  const roleLabel = roleMap[user.role] || user.role
  message.success(`${user.real_name} 通过${sourceInfo.label}认证成功 | 角色：${roleLabel}`, 2)
  window.location.replace('/')
  return true
}

async function postLogin(url, body) {
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await resp.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('服务器返回格式异常: ' + text.substring(0, 100))
  }
  if (resp.ok && data.success && data.data) {
    return { ok: true, user: data.data }
  }
  const errMsg = data.message || data.error || `请求失败(HTTP ${resp.status})`
  throw new Error(errMsg)
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [form] = Form.useForm()

  const doLogin = async (url, body) => {
    setLoading(true)
    setLoginError('')
    try {
      const result = await postLogin(url, body)
      saveAndJump(result.user)
    } catch (err) {
      setLoginError(err.message)
      message.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (values) => {
    doLogin('/api/auth/login', { ...values, auth_source: 'local' })
  }

  const handleCA = () => {
    doLogin('/api/auth/ca-login', { type: 'ca' })
  }

  const handleQrLogin = (channel) => {
    doLogin('/api/auth/qr-login', { channel })
  }

  const tabItems = [
    {
      key: 'account',
      label: (
        <Space>
          <UserOutlined />
          账号密码
          <Tag color="blue" style={{ marginLeft: 4 }}>工作人员/管理员</Tag>
        </Space>
      ),
      children: (
        <div>
          {loginError && (
            <Alert
              message={loginError}
              type="error"
              showIcon
              icon={<ExclamationCircleOutlined />}
              closable
              onClose={() => setLoginError('')}
              style={{ marginBottom: 16 }}
            />
          )}
          <Form
            form={form}
            onFinish={handleLogin}
            initialValues={{ username: 'admin', password: '123456' }}
            size="large"
            style={{ marginTop: loginError ? 0 : 8 }}
          >
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="请输入用户名（admin / platform / ops）" autoComplete="username" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码（统一 123456）" autoComplete="current-password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44 }}>
                <CheckCircleOutlined style={{ marginRight: 8 }} />
                登 录
              </Button>
            </Form.Item>
          </Form>
          <div style={{ marginTop: 12, fontSize: 12, color: '#666', textAlign: 'center' }}>
            演示账号：admin / platform / ops，密码统一 123456
          </div>
        </div>
      ),
    },
    {
      key: 'ca',
      label: (
        <Space>
          <SafetyCertificateOutlined />
          CA证书
          <Tag color="purple" style={{ marginLeft: 4 }}>政府工作人员</Tag>
        </Space>
      ),
      children: (
        <div>
          {loginError && (
            <Alert
              message={loginError}
              type="error"
              showIcon
              closable
              onClose={() => setLoginError('')}
              style={{ marginBottom: 16 }}
            />
          )}
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <SafetyCertificateOutlined style={{ fontSize: 64, color: '#722ed1', marginBottom: 16 }} />
            <div style={{ color: '#333', fontSize: 15, fontWeight: 500, marginBottom: 8 }}>福建省CA数字证书认证</div>
            <div style={{ color: '#666', marginBottom: 16, fontSize: 13 }}>
              请插入福建省CA数字证书UKey进行身份验证
            </div>
            <Tag color="purple" style={{ marginBottom: 16 }}>仅限政府工作人员使用</Tag>
            <div style={{ marginBottom: 16, fontSize: 12, color: '#999' }}>预置测试账号：王五 / CA认证</div>
            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={handleCA}
              icon={<SafetyCertificateOutlined />}
              style={{ width: 240, height: 44 }}
            >
              验证CA证书登录
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'qr',
      label: (
        <Space>
          <ScanOutlined />
          扫码登录
          <Tag color="green" style={{ marginLeft: 4 }}>企业/个人群众</Tag>
        </Space>
      ),
      children: (
        <div>
          {loginError && (
            <Alert
              message={loginError}
              type="error"
              showIcon
              closable
              onClose={() => setLoginError('')}
              style={{ marginBottom: 16 }}
            />
          )}
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: 140, height: 140, margin: '0 auto 12px',
              border: '2px dashed #d9d9d9', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#fafafa',
            }}>
              <QrcodeOutlined style={{ fontSize: 60, color: '#1890ff' }} />
            </div>
            <div style={{ color: '#333', fontSize: 14, marginBottom: 4, fontWeight: 500 }}>扫码快速登录</div>
            <div style={{ color: '#999', marginBottom: 12, fontSize: 13 }}>
              请使用支付宝或闽政通APP扫描二维码
            </div>
            <Tag color="green" style={{ marginBottom: 12 }}>面向企业和个人群众</Tag>
            <Divider style={{ margin: '8px 0' }}>或选择快捷登录渠道</Divider>
            <Row gutter={12}>
              <Col span={12}>
                <Button block icon={<ScanOutlined />} loading={loading} onClick={() => handleQrLogin('支付宝')} style={{ height: 40 }}>
                  支付宝认证
                </Button>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  <Tag color="cyan" style={{ margin: 0, padding: '0 4px' }}>赵六</Tag>
                  <span style={{ color: '#999', marginLeft: 4 }}>企业用户</span>
                </div>
              </Col>
              <Col span={12}>
                <Button block icon={<ScanOutlined />} loading={loading} onClick={() => handleQrLogin('闽政通')} style={{ height: 40 }}>
                  闽政通认证
                </Button>
                <div style={{ fontSize: 11, marginTop: 4 }}>
                  <Tag color="green" style={{ margin: 0, padding: '0 4px' }}>陈七</Tag>
                  <span style={{ color: '#999', marginLeft: 4 }}>居民用户</span>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #0d2b45 0%, #1a3a5c 40%, #2a5a8c 100%)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8%' }}>
        <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 700, marginBottom: 8, letterSpacing: 4 }}>福建省政务服务</h1>
        <h2 style={{ color: 'rgba(255,255,255,0.85)', fontSize: 24, fontWeight: 400, marginBottom: 48 }}>统一中台管理系统</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, maxWidth: 500 }}>
          {[
            { title: '统一认证', desc: '多渠道身份认证，安全可靠' },
            { title: '事项管理', desc: '全省政务服务事项统一管理' },
            { title: '支付网关', desc: '非税缴费、社保医保一体化支付' },
            { title: '业务协同', desc: '跨部门数据共享与审批协同' },
            { title: '智能客服', desc: 'AI驱动的智能问答与工单系统' },
            { title: '监测分析', desc: '实时监测与营商环境评估' },
          ].map((f) => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '16px 20px', backdropFilter: 'blur(4px)' }}>
              <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{f.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 40px' }}>
        <Card style={{ width: '100%', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }} styles={{ body: { padding: '32px 32px 16px' } }}>
          <h3 style={{ textAlign: 'center', fontSize: 20, marginBottom: 20, color: '#1a3a5c' }}>系统登录</h3>
          <Tabs items={tabItems} centered onChange={() => setLoginError('')} />
        </Card>
      </div>
    </div>
  )
}

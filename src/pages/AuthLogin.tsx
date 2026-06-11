import { useState } from 'react'
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Table,
  Tag,
  Statistic,
  Row,
  Col,
  Alert,
  Steps,
  message,
} from 'antd'
import {
  IdcardOutlined,
  CreditCardOutlined,
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  PhoneOutlined,
  ScanOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  AuditOutlined,
  VerifiedOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useAppStore } from '../store/appStore'

const { Title, Text } = Typography

interface LoginRecord {
  key: string
  time: string
  user: string
  method: string
  result: 'success' | 'failure'
  ip: string
}

const mockLoginRecords: LoginRecord[] = [
  { key: '1', time: '2026-06-09 10:52:18', user: '张伟', method: '身份证登录', result: 'success', ip: '10.0.1.105' },
  { key: '2', time: '2026-06-09 10:48:33', user: '李明', method: '电子社保卡', result: 'success', ip: '10.0.2.88' },
  { key: '3', time: '2026-06-09 10:45:07', user: '王芳', method: '账号密码', result: 'success', ip: '10.0.3.42' },
  { key: '4', time: '2026-06-09 10:40:55', user: '赵强', method: '身份证登录', result: 'failure', ip: '10.0.4.201' },
  { key: '5', time: '2026-06-09 10:35:22', user: '陈丽', method: '电子社保卡', result: 'success', ip: '10.0.5.67' },
  { key: '6', time: '2026-06-09 10:30:11', user: '周磊', method: '账号密码', result: 'failure', ip: '10.0.6.150' },
]

const loginRecordColumns = [
  { title: '时间', dataIndex: 'time', key: 'time', width: 170 },
  { title: '用户', dataIndex: 'user', key: 'user', width: 80 },
  {
    title: '认证方式',
    dataIndex: 'method',
    key: 'method',
    width: 120,
    render: (method: string) => {
      const colorMap: Record<string, string> = {
        '身份证登录': 'blue',
        '电子社保卡': 'green',
        '账号密码': 'orange',
      }
      return <Tag color={colorMap[method] || 'default'}>{method}</Tag>
    },
  },
  {
    title: '结果',
    dataIndex: 'result',
    key: 'result',
    width: 80,
    render: (result: 'success' | 'failure') =>
      result === 'success' ? (
        <Tag icon={<CheckCircleOutlined />} color="success">成功</Tag>
      ) : (
        <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>
      ),
  },
  { title: 'IP地址', dataIndex: 'ip', key: 'ip', width: 130 },
]

function IdCardLoginForm() {
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [messageApi, contextHolder] = message.useMessage()
  const addAuditEntry = useAppStore((s) => s.addAuditEntry)

  const handleSubmit = (values: { idNumber: string; name: string }) => {
    setCurrentStep(1)
    setTimeout(() => {
      setCurrentStep(2)
      addAuditEntry({
        operator: values.name,
        module: '统一身份认证',
        action: '身份证登录',
        detail: `通过身份证号 ${values.idNumber.slice(0, 6)}********${values.idNumber.slice(-4)} 登录系统`,
        result: 'success',
        ip: '10.0.1.105',
      })
      messageApi.success('身份验证通过，登录成功')
    }, 1500)
  }

  return (
    <>
      {contextHolder}
      <Steps
        current={currentStep}
        size="small"
        style={{ marginBottom: 24 }}
        items={[
          { title: '信息填写', icon: <IdcardOutlined /> },
          { title: '人脸识别', icon: <ScanOutlined /> },
          { title: '认证完成', icon: <CheckCircleOutlined /> },
        ]}
      />
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="idNumber"
          label="身份证号码"
          rules={[
            { required: true, message: '请输入身份证号码' },
            { pattern: /^\d{17}[\dXx]$/, message: '请输入有效的18位身份证号码' },
          ]}
        >
          <Input prefix={<IdcardOutlined />} placeholder="请输入18位身份证号码" maxLength={18} />
        </Form.Item>
        <Form.Item
          name="name"
          label="姓名"
          rules={[{ required: true, message: '请输入姓名' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="请输入与身份证一致的姓名" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" icon={<SafetyCertificateOutlined />}>
            {currentStep === 0 ? '开始身份验证' : '验证中...'}
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}

function SocialCardLoginForm() {
  const [form] = Form.useForm()
  const [smsCountdown, setSmsCountdown] = useState(0)
  const [messageApi, contextHolder] = message.useMessage()
  const addAuditEntry = useAppStore((s) => s.addAuditEntry)

  const sendSmsCode = () => {
    const phone = form.getFieldValue('phone')
    if (!phone) {
      messageApi.warning('请先输入手机号码')
      return
    }
    setSmsCountdown(60)
    messageApi.success('验证码已发送')
    const timer = setInterval(() => {
      setSmsCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSubmit = (values: { cardNumber: string; password: string; smsCode: string; phone: string }) => {
    addAuditEntry({
      operator: values.phone,
      module: '统一身份认证',
      action: '电子社保卡登录',
      detail: `通过电子社保卡 ${values.cardNumber.slice(-4)} 登录系统`,
      result: 'success',
      ip: '10.0.2.88',
    })
    messageApi.success('电子社保卡认证成功')
  }

  return (
    <>
      {contextHolder}
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="cardNumber"
          label="社保卡号"
          rules={[
            { required: true, message: '请输入社保卡号' },
            { pattern: /^\d{9,20}$/, message: '请输入有效的社保卡号' },
          ]}
        >
          <Input prefix={<CreditCardOutlined />} placeholder="请输入电子社保卡号" maxLength={20} />
        </Form.Item>
        <Form.Item
          name="phone"
          label="手机号码"
          rules={[
            { required: true, message: '请输入手机号码' },
            { pattern: /^1\d{10}$/, message: '请输入有效的手机号码' },
          ]}
        >
          <Input prefix={<PhoneOutlined />} placeholder="请输入注册手机号" maxLength={11} />
        </Form.Item>
        <Form.Item
          name="password"
          label="查询密码"
          rules={[{ required: true, message: '请输入查询密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请输入社保卡查询密码" />
        </Form.Item>
        <Form.Item
          name="smsCode"
          label="短信验证码"
          rules={[{ required: true, message: '请输入短信验证码' }]}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Input placeholder="请输入6位验证码" maxLength={6} />
            <Button onClick={sendSmsCode} disabled={smsCountdown > 0}>
              {smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码'}
            </Button>
          </Space.Compact>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" icon={<CreditCardOutlined />}>
            电子社保卡登录
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}

function AccountLoginForm() {
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()
  const addAuditEntry = useAppStore((s) => s.addAuditEntry)

  const handleSubmit = (values: { username: string; password: string; captcha: string }) => {
    addAuditEntry({
      operator: values.username,
      module: '统一身份认证',
      action: '账号密码登录',
      detail: `通过平台账号 ${values.username} 登录系统`,
      result: 'success',
      ip: '10.0.3.42',
    })
    messageApi.success('登录成功')
  }

  return (
    <>
      {contextHolder}
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="请输入国家政务服务平台账号" />
        </Form.Item>
        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
        </Form.Item>
        <Form.Item
          name="captcha"
          label="验证码"
          rules={[{ required: true, message: '请输入验证码' }]}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Input placeholder="请输入验证码" maxLength={4} />
            <Button
              style={{
                width: 120,
                height: 40,
                background: 'linear-gradient(135deg, #667eea, #c41d7f)',
                color: '#fff',
                fontWeight: 600,
                letterSpacing: 4,
                fontSize: 18,
              }}
            >
              A7x2
            </Button>
          </Space.Compact>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" icon={<UserOutlined />}>
            登录
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}

export default function AuthLogin() {
  const tabItems = [
    {
      key: 'idcard',
      label: (
        <span>
          <IdcardOutlined /> 身份证登录
        </span>
      ),
      children: <IdCardLoginForm />,
    },
    {
      key: 'social',
      label: (
        <span>
          <CreditCardOutlined /> 电子社保卡登录
        </span>
      ),
      children: <SocialCardLoginForm />,
    },
    {
      key: 'account',
      label: (
        <span>
          <UserOutlined /> 账号密码登录
        </span>
      ),
      children: <AccountLoginForm />,
    },
  ]

  return (
    <div style={{ padding: 24, minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          <SafetyCertificateOutlined style={{ marginRight: 8, color: '#c41d7f' }} />
          统一身份认证
        </Title>
        <Text type="secondary">国家级政务服务平台 · 三证合一统一认证入口</Text>
      </div>

      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Card
            bordered={false}
            style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <SafetyCertificateOutlined style={{ fontSize: 48, color: '#c41d7f', marginBottom: 12 }} />
              <Title level={4} style={{ margin: 0 }}>统一身份认证</Title>
              <Text type="secondary">国家政务服务平台</Text>
            </div>

            <Space style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}>
              <Tag color="green" icon={<VerifiedOutlined />}>等保三级</Tag>
              <Tag color="purple" icon={<LockOutlined />}>国密SM2</Tag>
              <Tag color="geekblue" icon={<LockOutlined />}>国密SM3</Tag>
              <Tag color="volcano" icon={<LockOutlined />}>国密SM4</Tag>
            </Space>

            <Alert
              message="安全提示"
              description="本系统采用国密算法加密传输，所有认证数据均通过等保三级安全评估。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Tabs items={tabItems} centered />
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <Statistic
                    title="在线用户数"
                    value={12847}
                    prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <Statistic
                    title="今日认证次数"
                    value={58392}
                    prefix={<AuditOutlined style={{ color: '#52c41a' }} />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <Statistic
                    title="认证成功率"
                    value={99.7}
                    suffix="%"
                    prefix={<CheckCircleOutlined style={{ color: '#c41d7f' }} />}
                    valueStyle={{ color: '#c41d7f' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <Statistic
                    title="异常登录拦截"
                    value={127}
                    prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>

            <Card
              title="最近登录记录"
              bordered={false}
              style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              extra={<Tag color="green">实时监控</Tag>}
            >
              <Table
                dataSource={mockLoginRecords}
                columns={loginRecordColumns}
                pagination={false}
                size="small"
                bordered
              />
            </Card>

            <Card
              bordered={false}
              style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Space direction="vertical" size={8}>
                    <Text strong>安全认证等级</Text>
                    <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
                      <VerifiedOutlined /> 等保三级
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      依据 GB/T 22239-2019 标准
                    </Text>
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={8}>
                    <Text strong>加密算法</Text>
                    <Space wrap>
                      <Tag color="purple" style={{ fontSize: 12 }}>SM2 非对称加密</Tag>
                      <Tag color="geekblue" style={{ fontSize: 12 }}>SM3 哈希算法</Tag>
                      <Tag color="volcano" style={{ fontSize: 12 }}>SM4 对称加密</Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      符合 GM/T 0002-2012 等国密标准
                    </Text>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  )
}

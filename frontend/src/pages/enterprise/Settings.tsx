import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Space,
  Button,
  Modal,
  Typography,
  Form,
  Input,
  Upload,
  Descriptions,
  message,
  Avatar,
  Tabs,
  Switch,
  Select,
  Tag,
  List,
  Divider,
  Alert,
  InputNumber,
  Cascader,
} from 'antd'
import {
  SettingOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  BankOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
  UploadOutlined,
  BellOutlined,
  WechatOutlined,
  MessageOutlined,
  DollarOutlined,
  FileTextOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InboxOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ContactsOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Dragger } = Upload

interface Admin {
  id: number
  name: string
  role: '超级管理员' | '财务' | '人事' | '运营'
  phone: string
  email: string
  avatar: string
  status: 1 | 0
  created_at: string
  last_login: string
}

const roleOptions = [
  { label: '超级管理员', value: '超级管理员', color: '#f5222d' },
  { label: '财务', value: '财务', color: '#1890ff' },
  { label: '人事', value: '人事', color: '#52c41a' },
  { label: '运营', value: '运营', color: '#722ed1' },
]

function Settings() {
  const [profileForm] = Form.useForm()
  const [verifyForm] = Form.useForm()
  const [adminForm] = Form.useForm()
  const [savingProfile, setSavingProfile] = useState(false)
  const [submittingVerify, setSubmittingVerify] = useState(false)
  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [editAdmin, setEditAdmin] = useState<Admin | null>(null)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)

  const [enterprise, setEnterprise] = useState({
    company_name: '深圳星辰建筑工程有限公司',
    unified_social_code: '91440300MA5D8XXX91',
    legal_person: '张三',
    legal_idcard: '440***********1234',
    contact_phone: '13800138000',
    contact_email: 'admin@example.com',
    established_at: '2018-06-15',
    registered_capital: 5000000,
    business_scope: '建筑工程施工总承包、市政公用工程、装修装饰工程',
    address: '广东省深圳市南山区科技园科技大厦A座1801室',
    business_license_url: '',
    avatar_url: '',
    verified: 1,
    verify_level: '基础认证',
    verify_at: '2026-06-01',
  })

  const [notifications, setNotifications] = useState({
    application: true,
    wage_release: true,
    contract_expire: true,
    guarantee_warning: true,
    credit_change: true,
    system_announcement: true,
    sms_notify: false,
    wechat_notify: true,
    email_notify: true,
  })

  const [admins, setAdmins] = useState<Admin[]>([
    {
      id: 1,
      name: '张三',
      role: '超级管理员',
      phone: '13800138000',
      email: 'zhangsan@example.com',
      avatar: '',
      status: 1,
      created_at: '2026-01-15',
      last_login: '2026-06-20 09:30',
    },
    {
      id: 2,
      name: '李四',
      role: '财务',
      phone: '13900139000',
      email: 'lisi@example.com',
      avatar: '',
      status: 1,
      created_at: '2026-02-20',
      last_login: '2026-06-19 17:45',
    },
    {
      id: 3,
      name: '王五',
      role: '人事',
      phone: '13700137000',
      email: 'wangwu@example.com',
      avatar: '',
      status: 1,
      created_at: '2026-03-10',
      last_login: '2026-06-20 08:15',
    },
    {
      id: 4,
      name: '赵六',
      role: '运营',
      phone: '13600136000',
      email: 'zhaoliu@example.com',
      avatar: '',
      status: 0,
      created_at: '2026-04-05',
      last_login: '2026-06-15 14:20',
    },
  ])

  const handleSaveProfile = async () => {
    try {
      await profileForm.validateFields()
      setSavingProfile(true)
      setTimeout(() => {
        message.success('企业资料已更新')
        setSavingProfile(false)
      }, 1000)
    } catch {}
  }

  const handleSubmitVerify = async () => {
    try {
      await verifyForm.validateFields()
      setSubmittingVerify(true)
      setTimeout(() => {
        message.success('认证资料已提交，预计24小时内完成审核')
        setSubmittingVerify(false)
        setVerifyModalOpen(false)
      }, 1200)
    } catch {}
  }

  const handleAdminSubmit = async () => {
    try {
      await adminForm.validateFields()
      setSubmittingVerify(true)
      setTimeout(() => {
        message.success(editAdmin ? '管理员信息已更新' : '管理员添加成功')
        setSubmittingVerify(false)
        setAdminModalOpen(false)
      }, 800)
    } catch {}
  }

  const toggleAdminStatus = (admin: Admin) => {
    setAdmins(admins.map(a =>
      a.id === admin.id ? { ...a, status: a.status === 1 ? 0 : 1 } : a
    ))
    message.success(`已${admin.status === 1 ? '禁用' : '启用'}管理员 ${admin.name}`)
  }

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] })
  }

  const regionOptions = [
    {
      value: 'guangdong',
      label: '广东省',
      children: [
        {
          value: 'shenzhen',
          label: '深圳市',
          children: [
            { value: 'nanshan', label: '南山区' },
            { value: 'futian', label: '福田区' },
            { value: 'baoan', label: '宝安区' },
            { value: 'longhua', label: '龙华区' },
          ],
        },
        {
          value: 'guangzhou',
          label: '广州市',
          children: [
            { value: 'tianhe', label: '天河区' },
            { value: 'yuexiu', label: '越秀区' },
          ],
        },
      ],
    },
  ]

  const verifyLevelInfo = enterprise.verified === 2
    ? { color: '#52c41a', text: '高级认证', icon: <SafetyCertificateOutlined /> }
    : enterprise.verified === 1
    ? { color: '#1890ff', text: '基础认证', icon: <CheckCircleOutlined /> }
    : { color: '#faad14', text: '未认证', icon: <ClockCircleOutlined /> }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          <Space>
            <SettingOutlined style={{ color: '#1890ff' }} />
            企业设置
          </Space>
        </Title>
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: 16, marginBottom: 16 }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          defaultActiveKey="profile"
          size="large"
          items={[
            {
              key: 'profile',
              label: <Space><UserOutlined />企业资料</Space>,
              children: (
                <div style={{ padding: 24 }}>
                  <Row gutter={[24, 16]}>
                    <Col xs={24} md={8}>
                      <Card
                        bordered={false}
                        style={{ background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)', borderRadius: 16, textAlign: 'center' }}
                      >
                        <div style={{ marginBottom: 16 }}>
                          <Avatar
                            size={96}
                            icon={<BankOutlined />}
                            style={{
                              background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                              fontSize: 40,
                              boxShadow: '0 6px 20px rgba(24,144,255,0.3)',
                            }}
                          />
                        </div>
                        <Title level={4} style={{ margin: '0 0 6px' }}>
                          {enterprise.company_name}
                        </Title>
                        <Tag
                          color={verifyLevelInfo.color}
                          icon={verifyLevelInfo.icon}
                          style={{ fontSize: 13, padding: '2px 12px', marginBottom: 12 }}
                        >
                          {verifyLevelInfo.text}
                        </Tag>
                        <Divider style={{ margin: '12px 0' }} />
                        <Descriptions
                          column={1}
                          size="small"
                          items={[
                            { label: '统一社会信用代码', children: <Text code>{enterprise.unified_social_code}</Text> },
                            { label: '法人代表', children: enterprise.legal_person },
                            { label: '成立日期', children: enterprise.established_at },
                            { label: '注册资本', children: `¥${(enterprise.registered_capital / 10000).toFixed(0)} 万元` },
                          ]}
                        />
                        <Button
                          type="primary"
                          block
                          icon={<EditOutlined />}
                          style={{ marginTop: 16, background: 'linear-gradient(135deg, #1890ff, #096dd9)', border: 'none' }}
                          onClick={() => {
                            profileForm.setFieldsValue(enterprise)
                          }}
                        >
                          编辑资料
                        </Button>
                      </Card>
                    </Col>

                    <Col xs={24} md={16}>
                      <Form
                        form={profileForm}
                        layout="vertical"
                        initialValues={enterprise}
                      >
                        <Divider orientation="left" orientationMargin={0}>
                          <Text strong>基本信息</Text>
                        </Divider>
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name="company_name"
                              label={<Text strong style={{ fontSize: 13 }}>企业全称</Text>}
                              rules={[{ required: true, message: '请输入企业全称' }]}
                            >
                              <Input disabled prefix={<BankOutlined />} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name="unified_social_code"
                              label={<Text strong style={{ fontSize: 13 }}>统一社会信用代码</Text>}
                              rules={[{ required: true, message: '请输入' }]}
                            >
                              <Input disabled prefix={<IdcardOutlined />} />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="legal_person"
                              label={<Text strong style={{ fontSize: 13 }}>法人代表</Text>}
                              rules={[{ required: true }]}
                            >
                              <Input disabled prefix={<UserOutlined />} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="legal_idcard"
                              label={<Text strong style={{ fontSize: 13 }}>法人身份证</Text>}
                            >
                              <Input disabled prefix={<LockOutlined />} value={enterprise.legal_idcard} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="established_at"
                              label={<Text strong style={{ fontSize: 13 }}>成立日期</Text>}
                            >
                              <Input disabled />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Divider orientation="left" orientationMargin={0}>
                          <Text strong>联系方式</Text>
                        </Divider>
                        <Row gutter={16}>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="contact_phone"
                              label={<Text strong style={{ fontSize: 13 }}>联系电话</Text>}
                              rules={[{ required: true }]}
                            >
                              <Input prefix={<PhoneOutlined />} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="contact_email"
                              label={<Text strong style={{ fontSize: 13 }}>联系邮箱</Text>}
                              rules={[{ type: 'email' }]}
                            >
                              <Input prefix={<MailOutlined />} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item
                              name="region"
                              label={<Text strong style={{ fontSize: 13 }}>所在地区</Text>}
                            >
                              <Cascader options={regionOptions} placeholder="请选择地区" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item
                          name="address"
                          label={<Text strong style={{ fontSize: 13 }}>详细地址</Text>}
                        >
                          <Input prefix={<EnvironmentOutlined />} placeholder="请输入详细地址" />
                        </Form.Item>

                        <Divider orientation="left" orientationMargin={0}>
                          <Text strong>企业信息</Text>
                        </Divider>
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name="registered_capital"
                              label={<Text strong style={{ fontSize: 13 }}>注册资本（元）</Text>}
                            >
                              <InputNumber style={{ width: '100%' }} disabled />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Form.Item
                          name="business_scope"
                          label={<Text strong style={{ fontSize: 13 }}>经营范围</Text>}
                        >
                          <Input.TextArea rows={3} />
                        </Form.Item>
                        <Form.Item
                          name="business_license"
                          label={<Text strong style={{ fontSize: 13 }}>营业执照</Text>}
                        >
                          <Dragger multiple={false} maxCount={1} beforeUpload={() => false}>
                            <p className="ant-upload-drag-icon">
                              <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                            <p className="ant-upload-hint">支持 .jpg/.png/.pdf 格式，单个文件不超过 10MB</p>
                          </Dragger>
                        </Form.Item>

                        <div style={{ textAlign: 'right', marginTop: 8 }}>
                          <Space>
                            <Button>重置</Button>
                            <Button
                              type="primary"
                              loading={savingProfile}
                              onClick={handleSaveProfile}
                              style={{ background: 'linear-gradient(135deg, #1890ff, #096dd9)', border: 'none' }}
                            >
                              保存修改
                            </Button>
                          </Space>
                        </div>
                      </Form>
                    </Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'verify',
              label: <Space><SafetyCertificateOutlined />企业认证</Space>,
              children: (
                <div style={{ padding: 24 }}>
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                    message={
                      <Space>
                        <SafetyCertificateOutlined />
                        当前认证状态：
                        <Tag color={verifyLevelInfo.color} style={{ fontSize: 13 }}>
                          {verifyLevelInfo.icon} {verifyLevelInfo.text}
                        </Tag>
                        {enterprise.verified === 1 && (
                          <Text type="secondary">完成高级认证可享受更多平台权益，提升信用评分上限</Text>
                        )}
                      </Space>
                    }
                  />

                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} md={8}>
                      <Card
                        bordered={false}
                        style={{
                          borderRadius: 14,
                          background: enterprise.verified >= 1 ? '#f6ffed' : '#fff',
                          border: enterprise.verified >= 1 ? '2px solid #52c41a' : '2px solid #f0f0f0',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <Text strong style={{ fontSize: 15 }}>基础认证</Text>
                          {enterprise.verified >= 1 && (
                            <Tag color="success" icon={<CheckCircleOutlined />}>已通过</Tag>
                          )}
                        </div>
                        <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
                          提交营业执照、法人身份信息，通过平台基础审核
                        </Text>
                        <Divider style={{ margin: '10px 0' }} />
                        <List
                          size="small"
                          dataSource={['营业执照正本', '法人身份证正面', '法人身份证反面']}
                          renderItem={(item) => (
                            <List.Item style={{ padding: '2px 0', border: 'none', fontSize: 12 }}>
                              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 6 }} />
                              {item}
                            </List.Item>
                          )}
                        />
                        <div style={{ marginTop: 10, fontSize: 12, color: '#999' }}>
                          通过时间：{enterprise.verify_at}
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} md={8}>
                      <Card
                        bordered={false}
                        style={{
                          borderRadius: 14,
                          background: enterprise.verified >= 2 ? '#f6ffed' : '#fff7e6',
                          border: enterprise.verified >= 2 ? '2px solid #52c41a' : '2px solid #faad14',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <Text strong style={{ fontSize: 15 }}>高级认证</Text>
                          {enterprise.verified >= 2 ? (
                            <Tag color="success" icon={<CheckCircleOutlined />}>已通过</Tag>
                          ) : (
                            <Tag color="warning" icon={<ClockCircleOutlined />}>未完成</Tag>
                          )}
                        </div>
                        <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
                          补充企业资质、对公账户验证、实人认证，享受高级权益
                        </Text>
                        <Divider style={{ margin: '10px 0' }} />
                        <List
                          size="small"
                          dataSource={[
                            { name: '税务登记证', done: false },
                            { name: '开户许可证', done: true },
                            { name: '建筑资质证书', done: false },
                            { name: '对公账户验证', done: true },
                            { name: '法人实人认证', done: false },
                          ]}
                          renderItem={(item) => (
                            <List.Item style={{ padding: '2px 0', border: 'none', fontSize: 12 }}>
                              {item.done
                                ? <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 6 }} />
                                : <ClockCircleOutlined style={{ color: '#faad14', marginRight: 6 }} />
                              }
                              {item.name}
                            </List.Item>
                          )}
                        />
                        <Button
                          type="primary"
                          block
                          size="small"
                          icon={<SafetyCertificateOutlined />}
                          style={{
                            marginTop: 12,
                            background: enterprise.verified >= 2 ? '#d9d9d9' : 'linear-gradient(135deg, #fa8c16, #d46b08)',
                            border: 'none',
                          }}
                          disabled={enterprise.verified >= 2}
                          onClick={() => setVerifyModalOpen(true)}
                        >
                          {enterprise.verified >= 2 ? '已完成认证' : '立即升级高级认证'}
                        </Button>
                      </Card>
                    </Col>

                    <Col xs={24} md={8}>
                      <Card
                        bordered={false}
                        style={{
                          borderRadius: 14,
                          background: 'linear-gradient(135deg, #f9f0ff 0%, #fff0f6 100%)',
                          border: '2px dashed #d3adf7',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                          <Text strong style={{ fontSize: 15 }}>
                            <SafetyCertificateOutlined style={{ color: '#722ed1' }} /> 权益对比
                          </Text>
                        </div>
                        <Descriptions
                          column={1}
                          size="small"
                          items={[
                            { label: '信用分上限', children: '80 → 100' },
                            { label: '保证金抵扣', children: '0% → 20%' },
                            { label: '工人推荐权重', children: '基础 → 优先' },
                            { label: '专属客户经理', children: '无 → 1对1服务' },
                            { label: '金融服务利率', children: '基准利率 → 下调15%' },
                          ]}
                        />
                        <div style={{ marginTop: 10, fontSize: 11, color: '#999', textAlign: 'center' }}>
                          完成高级认证即可解锁以上全部权益
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Card
                    bordered={false}
                    style={{ borderRadius: 14 }}
                    title={
                      <Space>
                        <FileTextOutlined />
                        认证记录
                      </Space>
                    }
                  >
                    <List
                      itemLayout="horizontal"
                      dataSource={[
                        {
                          time: '2026-06-01 10:30',
                          type: '基础认证',
                          status: '已通过',
                          operator: '平台审核员 王审核',
                          remark: '资料齐全，审核通过',
                        },
                        {
                          time: '2026-05-28 14:15',
                          type: '基础认证资料提交',
                          status: '已提交',
                          operator: '张三（法人）',
                          remark: '上传营业执照及法人身份信息',
                        },
                      ]}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 10,
                                  background: '#f0f5ff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#1890ff',
                                }}
                              >
                                <SafetyCertificateOutlined />
                              </div>
                            }
                            title={
                              <Space>
                                <Text strong>{item.type}</Text>
                                <Tag color="success" style={{ fontSize: 11 }}>{item.status}</Tag>
                              </Space>
                            }
                            description={
                              <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
                                <Text type="secondary">时间：{item.time}</Text>
                                <Text type="secondary">操作人：{item.operator}</Text>
                                <Text type="secondary">备注：{item.remark}</Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Card>
                </div>
              ),
            },
            {
              key: 'admins',
              label: <Space><TeamOutlined />管理员账号</Space>,
              children: (
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Space>
                      <Tag color="blue">共 {admins.length} 个账号</Tag>
                      <Tag color="green">已启用 {admins.filter(a => a.status === 1).length}</Tag>
                      <Tag color="default">已禁用 {admins.filter(a => a.status === 0).length}</Tag>
                    </Space>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditAdmin(null)
                        adminForm.resetFields()
                        setAdminModalOpen(true)
                      }}
                      style={{ background: 'linear-gradient(135deg, #1890ff, #096dd9)', border: 'none' }}
                    >
                      添加管理员
                    </Button>
                  </div>

                  <Row gutter={[16, 16]}>
                    {admins.map((admin) => {
                      const role = roleOptions.find(r => r.value === admin.role)
                      return (
                        <Col xs={24} md={12} key={admin.id}>
                          <Card
                            bordered={false}
                            style={{ borderRadius: 14, border: admin.status ? 'none' : '1px dashed #d9d9d9' }}
                            actions={[
                              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => {
                                setEditAdmin(admin)
                                adminForm.setFieldsValue(admin)
                                setAdminModalOpen(true)
                              }}>
                                编辑
                              </Button>,
                              <Button
                                type="link"
                                size="small"
                                danger={admin.status === 1}
                                onClick={() => toggleAdminStatus(admin)}
                              >
                                {admin.status === 1 ? '禁用' : '启用'}
                              </Button>,
                            ]}
                          >
                            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                              <Avatar
                                size={56}
                                icon={<ContactsOutlined />}
                                style={{
                                  background: admin.status
                                    ? `linear-gradient(135deg, ${role?.color || '#1890ff'}, ${role?.color || '#096dd9'}cc)`
                                    : '#d9d9d9',
                                  fontSize: 24,
                                }}
                              />
                              <div style={{ flex: 1, opacity: admin.status ? 1 : 0.5 }}>
                                <Space align="center">
                                  <Text strong style={{ fontSize: 16 }}>{admin.name}</Text>
                                  <Tag
                                    color={role?.color}
                                    style={{ fontSize: 11, margin: 0 }}
                                  >
                                    {admin.role}
                                  </Tag>
                                  {admin.status === 0 && (
                                    <Tag color="default" style={{ fontSize: 11, margin: 0 }}>已禁用</Tag>
                                  )}
                                </Space>
                                <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                                  <Space size={12}>
                                    <span><PhoneOutlined style={{ marginRight: 4 }} />{admin.phone}</span>
                                    <span><MailOutlined style={{ marginRight: 4 }} />{admin.email}</span>
                                  </Space>
                                </div>
                                <div style={{ marginTop: 4, fontSize: 11, color: '#999' }}>
                                  创建：{admin.created_at} · 最近登录：{admin.last_login}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Col>
                      )
                    })}
                  </Row>
                </div>
              ),
            },
            {
              key: 'notify',
              label: <Space><BellOutlined />通知设置</Space>,
              children: (
                <div style={{ padding: 24 }}>
                  <Row gutter={[24, 16]}>
                    <Col xs={24} lg={16}>
                      <Card
                        bordered={false}
                        style={{ borderRadius: 14 }}
                        title={
                          <Space>
                            <BellOutlined style={{ color: '#1890ff' }} />
                            消息通知
                          </Space>
                        }
                      >
                        <List
                          dataSource={[
                            {
                              key: 'application',
                              icon: <UserOutlined />,
                              name: '新用工申请',
                              desc: '工人提交您发布的用工需求时通知',
                            },
                            {
                              key: 'wage_release',
                              icon: <DollarOutlined />,
                              name: '工资发放提醒',
                              desc: '工资保证金释放、发放成功/失败通知',
                            },
                            {
                              key: 'contract_expire',
                              icon: <FileTextOutlined />,
                              name: '合同到期提醒',
                              desc: '劳动合同到期前7天、3天、1天提醒',
                            },
                            {
                              key: 'guarantee_warning',
                              icon: <SafetyCertificateOutlined />,
                              name: '保证金预警',
                              desc: '保证金余额不足、锁定状态变化通知',
                            },
                            {
                              key: 'credit_change',
                              icon: <StarOutlined />,
                              name: '信用分变动',
                              desc: '信用评分升降、等级变化通知',
                            },
                            {
                              key: 'system_announcement',
                              icon: <MessageOutlined />,
                              name: '系统公告',
                              desc: '平台重要通知、政策法规更新',
                            },
                          ]}
                          renderItem={(item: any) => (
                            <List.Item
                              style={{ padding: '14px 0' }}
                              actions={[
                                <Switch
                                  key="sw"
                                  checked={notifications[item.key as keyof typeof notifications]}
                                  onChange={() => toggleNotification(item.key)}
                                />,
                              ]}
                            >
                              <List.Item.Meta
                                avatar={
                                  <div
                                    style={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 10,
                                      background: '#f0f5ff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#1890ff',
                                      fontSize: 18,
                                    }}
                                  >
                                    {item.icon}
                                  </div>
                                }
                                title={<Text strong>{item.name}</Text>}
                                description={<Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>}
                              />
                            </List.Item>
                          )}
                        />
                      </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                      <Card
                        bordered={false}
                        style={{ borderRadius: 14, marginBottom: 16 }}
                        title={
                          <Space>
                            <MessageOutlined style={{ color: '#1890ff' }} />
                            通知渠道
                          </Space>
                        }
                      >
                        <List
                          dataSource={[
                            {
                              key: 'sms_notify',
                              icon: <PhoneOutlined />,
                              name: '短信通知',
                              desc: '重要消息通过手机短信发送',
                              extra: '138****8000',
                            },
                            {
                              key: 'wechat_notify',
                              icon: <WechatOutlined />,
                              name: '微信公众号',
                              desc: '关注公众号后推送消息',
                              extra: '已绑定',
                            },
                            {
                              key: 'email_notify',
                              icon: <MailOutlined />,
                              name: '邮件通知',
                              desc: '发送至企业联系邮箱',
                              extra: 'admin@***.com',
                            },
                          ]}
                          renderItem={(item: any) => (
                            <List.Item
                              actions={[
                                <Switch
                                  key="sw"
                                  checked={notifications[item.key as keyof typeof notifications]}
                                  onChange={() => toggleNotification(item.key)}
                                />,
                              ]}
                            >
                              <List.Item.Meta
                                avatar={
                                  <div
                                    style={{
                                      width: 40,
                                      height: 40,
                                      borderRadius: 10,
                                      background: '#f0f5ff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#1890ff',
                                      fontSize: 18,
                                    }}
                                  >
                                    {item.icon}
                                  </div>
                                }
                                title={
                                  <Space>
                                    <Text strong>{item.name}</Text>
                                    <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>{item.extra}</Tag>
                                  </Space>
                                }
                                description={<Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>}
                              />
                            </List.Item>
                          )}
                        />
                      </Card>

                      <Alert
                        type="info"
                        showIcon
                        message="温馨提示"
                        description={
                          <div style={{ fontSize: 12, lineHeight: 1.8 }}>
                            建议至少开启「短信通知」+「微信通知」，确保不会错过重要消息，
                            尤其是工资发放、合同到期、保证金预警等涉及资金风险的内容。
                          </div>
                        }
                        style={{ borderRadius: 14 }}
                      />
                    </Col>
                  </Row>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#fa8c16' }} />
            高级企业认证资料提交
          </Space>
        }
        open={verifyModalOpen}
        onCancel={() => setVerifyModalOpen(false)}
        width={680}
        footer={[
          <Button key="cancel" onClick={() => setVerifyModalOpen(false)}>取消</Button>,
          <Button
            key="submit"
            type="primary"
            loading={submittingVerify}
            onClick={handleSubmitVerify}
            style={{ background: 'linear-gradient(135deg, #fa8c16, #d46b08)', border: 'none' }}
          >
            提交认证资料
          </Button>,
        ]}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 20 }}
          message="高级认证审核周期为1-3个工作日，请确保上传资料清晰完整"
        />

        <Form
          form={verifyForm}
          layout="vertical"
        >
          <Divider orientation="left" orientationMargin={0}>税务与开户信息</Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="tax_reg_no" label="税务登记号" rules={[{ required: true }]}>
                <Input placeholder="请输入税务登记号" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="bank_name" label="开户银行" rules={[{ required: true }]}>
                <Input placeholder="例如：中国建设银行深圳南山支行" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="bank_account" label="对公银行账号" rules={[{ required: true }]}>
                <Input placeholder="请输入对公银行账号" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="bank_account_name" label="账户名称" rules={[{ required: true }]}>
                <Input placeholder="企业对公账户名称" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" orientationMargin={0}>企业资质文件</Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="tax_cert" label="税务登记证" rules={[{ required: true }]}>
                <Dragger multiple={false} maxCount={1} beforeUpload={() => false}>
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p className="ant-upload-text">点击上传</p>
                  <p className="ant-upload-hint" style={{ fontSize: 11 }}>.jpg/.png/.pdf，≤10MB</p>
                </Dragger>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="bank_cert" label="开户许可证" rules={[{ required: true }]}>
                <Dragger multiple={false} maxCount={1} beforeUpload={() => false}>
                  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                  <p className="ant-upload-text">点击上传</p>
                  <p className="ant-upload-hint" style={{ fontSize: 11 }}>.jpg/.png/.pdf，≤10MB</p>
                </Dragger>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="qualification_cert" label="建筑资质证书（如有）">
            <Dragger multiple maxCount={5} beforeUpload={() => false}>
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">点击或拖拽上传多个文件</p>
              <p className="ant-upload-hint" style={{ fontSize: 11 }}>.jpg/.png/.pdf，单个≤10MB</p>
            </Dragger>
          </Form.Item>

          <Divider orientation="left" orientationMargin={0}>法人实人认证</Divider>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={
              <div style={{ fontSize: 12 }}>
                请法人本人持身份证原件，正对手机摄像头进行人脸识别验证。
                <a style={{ marginLeft: 8 }}>进入人脸识别 →</a>
              </div>
            }
          />

          <Form.Item name="verify_remark" label="备注说明">
            <Input.TextArea rows={2} placeholder="其他需要说明的信息（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <TeamOutlined style={{ color: '#1890ff' }} />
            {editAdmin ? '编辑管理员' : '添加管理员'}
          </Space>
        }
        open={adminModalOpen}
        onCancel={() => setAdminModalOpen(false)}
        width={560}
        footer={[
          <Button key="cancel" onClick={() => setAdminModalOpen(false)}>取消</Button>,
          <Button
            key="submit"
            type="primary"
            loading={submittingVerify}
            onClick={handleAdminSubmit}
            style={{ background: 'linear-gradient(135deg, #1890ff, #096dd9)', border: 'none' }}
          >
            {editAdmin ? '保存修改' : '确认添加'}
          </Button>,
        ]}
      >
        <Form form={adminForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="管理员姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true }]}
              >
                <Select placeholder="请选择角色">
                  {roleOptions.map(role => (
                    <Select.Option key={role.value} value={role.value}>
                      <Tag color={role.color} style={{ fontSize: 12 }}>{role.label}</Tag>
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[{ required: true, pattern: /^1[3-9]\d{9}$/, message: '请输入有效手机号' }]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="请输入手机号码" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[{ type: 'email', message: '请输入有效邮箱' }]}
              >
                <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          {!editAdmin && (
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="password"
                  label="初始密码"
                  rules={[
                    { required: true, message: '请设置初始密码' },
                    { min: 6, message: '密码至少6位' },
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="请设置初始密码" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="password2"
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
              </Col>
            </Row>
          )}
          <Form.Item name="status" label="账号状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Settings

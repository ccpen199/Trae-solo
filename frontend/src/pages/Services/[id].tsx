import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Descriptions,
  Tabs,
  Form,
  Input,
  Button,
  Select,
  Checkbox,
  Upload,
  Modal,
  Result,
  Alert,
  Tag,
  Space,
  List,
  Spin,
  message,
  Badge,
  App
} from 'antd'
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  UploadOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  SendOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useUserStore } from '@/store/userStore'
import StatusTimeline from '@/components/StatusTimeline'
import { Service, ServiceApplication, Certificate } from '@/types'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

const mockService: Service = {
  id: '1',
  name: '居住证办理',
  category: '户籍证件',
  description: '常州市居住证申领、换领、补领服务。公民离开常住户口所在地，到常州居住半年以上，符合有合法稳定就业、合法稳定住所、连续就读条件之一的，可以申领居住证。',
  icon: '居',
  department: '公安局',
  handler: '人口管理支队',
  processingTime: '15个工作日',
  fee: '免费',
  materials: ['身份证原件及复印件', '近期免冠照片', '居住证明（房屋租赁合同/房产证）', '就业证明或就读证明'],
  process: [
    '1. 在线预约或到窗口提交申请材料',
    '2. 工作人员审核材料，材料齐全的当场受理',
    '3. 后台审核（10个工作日）',
    '4. 制证（5个工作日）',
    '5. 通知申请人领取或邮寄送达'
  ],
  faq: [
    { question: '办理居住证需要什么条件？', answer: '在常州居住满半年以上，有合法稳定就业、住所或连续就读。' },
    { question: '多久可以拿到居住证？', answer: '自受理之日起15个工作日内完成制证。' },
    { question: '居住证有效期是多久？', answer: '居住证有效期为1年，每年需签注一次。' }
  ],
  online: true,
  status: 'online',
  accessType: 'API',
  heat: 1256,
  createdAt: dayjs().subtract(30, 'day').toISOString()
}

const mockUserCertificates: Certificate[] = [
  {
    id: 'cert1',
    userId: 'user1',
    name: '居民身份证',
    type: '身份证件',
    code: '320402********1234',
    issuer: '常州市公安局',
    issueDate: '2020-01-01',
    expireDate: '2040-01-01',
    status: 'valid',
    createdAt: dayjs().subtract(30, 'day').toISOString()
  },
  {
    id: 'cert2',
    userId: 'user1',
    name: '不动产权证',
    type: '产权证明',
    code: '苏（2023）常州市不动产权第001234号',
    issuer: '常州市自然资源和规划局',
    issueDate: '2023-06-01',
    status: 'valid',
    createdAt: dayjs().subtract(30, 'day').toISOString()
  }
]

const ServiceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notification } = App.useApp()
  const { isLoggedIn, userInfo, certificates, addApplication, setCertificates } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [service, setService] = useState<Service | null>(null)
  const [form] = Form.useForm()
  const [showForm, setShowForm] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [applicationResult, setApplicationResult] = useState<ServiceApplication | null>(null)
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([])
  const [autoLinkedCerts, setAutoLinkedCerts] = useState<Certificate[]>([])

  useEffect(() => {
    loadService()
    loadUserCertificates()
  }, [id])

  const loadService = () => {
    setLoading(true)
    setTimeout(() => {
      setService({ ...mockService, id: id || '1' })
      setLoading(false)
    }, 500)
  }

  const loadUserCertificates = () => {
    if (isLoggedIn && certificates.length === 0) {
      setCertificates(mockUserCertificates)
    }
  }

  useEffect(() => {
    if (service && isLoggedIn && certificates.length > 0) {
      const linked = certificates.filter((cert) =>
        service.materials.some((m) => m.includes(cert.name) || m.includes('身份') || m.includes('证明'))
      )
      setAutoLinkedCerts(linked)
      setSelectedCertificates(linked.map((c) => c.id))
    }
  }, [service, isLoggedIn, certificates])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      setTimeout(() => {
        const applicationNo = `CZ${dayjs().format('YYYYMMDDHHmmss')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
        const submitTime = dayjs().toISOString()
        const estimatedTime = dayjs().add(15, 'day').toISOString()

        const newApplication: ServiceApplication = {
          id: `app${Date.now()}`,
          serviceId: service!.id,
          serviceName: service!.name,
          userId: userInfo!.id,
          userName: userInfo!.name,
          applicationNo,
          status: 'pending',
          statusText: '待受理',
          formData: values,
          materials: service!.materials.map((m) => ({ name: m, type: 'required' })),
          certificates: selectedCertificates.map((id) => {
            const cert = certificates.find((c) => c.id === id)
            return { id, name: cert?.name || '' }
          }),
          progress: [
            { status: '提交申请', time: submitTime, description: '申请已成功提交', completed: true },
            { status: '材料审核', time: submitTime, description: '正在审核提交的材料', completed: false },
            { status: '后台办理', time: '', description: '工作人员正在办理', completed: false },
            { status: '制证完成', time: '', description: '证件制作完成', completed: false },
            { status: '办结送达', time: '', description: '证件已送达或可领取', completed: false }
          ],
          submitTime,
          estimatedTime,
          createdAt: submitTime
        }

        addApplication(newApplication)
        setApplicationResult(newApplication)
        setShowResult(true)
        setShowForm(false)
        setLoading(false)

        notification.success({
          message: '申请提交成功',
          description: `办件单号：${applicationNo}，预计15个工作日内完成`,
          placement: 'topRight'
        })
      }, 1500)
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  const handleLinkCertificate = (certId: string, checked: boolean) => {
    if (checked) {
      setSelectedCertificates([...selectedCertificates, certId])
    } else {
      setSelectedCertificates(selectedCertificates.filter((id) => id !== certId))
    }
  }

  const tabItems = [
    {
      key: 'intro',
      label: '服务介绍',
      children: (
        <div style={{ padding: 16 }}>
          <p style={{ lineHeight: 1.8, color: '#595959' }}>{service?.description}</p>

          <Descriptions title="基本信息" bordered column={2} style={{ marginTop: 24 }}>
            <Descriptions.Item label="服务名称">{service?.name}</Descriptions.Item>
            <Descriptions.Item label="服务类别">{service?.category}</Descriptions.Item>
            <Descriptions.Item label="办理部门">{service?.department}</Descriptions.Item>
            <Descriptions.Item label="办理窗口">{service?.handler}</Descriptions.Item>
            <Descriptions.Item label="办理时限">{service?.processingTime}</Descriptions.Item>
            <Descriptions.Item label="办理费用">{service?.fee}</Descriptions.Item>
            <Descriptions.Item label="服务热度" span={2}>
              <Space>
                <span style={{ color: '#fa8c16' }}>{service?.heat}</span>
                <Tag color="green">{service?.online ? '支持在线办理' : '仅线下办理'}</Tag>
                <Tag color="blue">接入方式：{service?.accessType}</Tag>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </div>
      )
    },
    {
      key: 'process',
      label: '办理流程',
      children: (
        <div style={{ padding: 16 }}>
          <List
            header={<h4 style={{ margin: 0 }}>办理步骤</h4>}
            bordered
            dataSource={service?.process}
            renderItem={(item, index) => (
              <List.Item>
                <Badge color="blue" count={index + 1} style={{ marginRight: 16 }} />
                {item}
              </List.Item>
            )}
          />
        </div>
      )
    },
    {
      key: 'materials',
      label: '所需材料',
      children: (
        <div style={{ padding: 16 }}>
          <List
            header={<h4 style={{ margin: 0 }}>材料清单</h4>}
            bordered
            dataSource={service?.materials}
            renderItem={(item) => (
              <List.Item>
                <FileTextOutlined style={{ color: '#1890ff', marginRight: 12 }} />
                <span>{item}</span>
                <Tag color="red" style={{ marginLeft: 'auto' }}>
                  必需
                </Tag>
              </List.Item>
            )}
          />
        </div>
      )
    },
    {
      key: 'faq',
      label: '常见问题',
      children: (
        <div style={{ padding: 16 }}>
          <List
            header={<h4 style={{ margin: 0 }}>常见问题</h4>}
            itemLayout="vertical"
            dataSource={service?.faq}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <span>
                      <Badge color="blue" /> {item.question}
                    </span>
                  }
                  description={item.answer}
                />
              </List.Item>
            )}
          />
        </div>
      )
    }
  ]

  if (loading && !service) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!service) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <Card className="card-shadow">
            <p>服务不存在</p>
            <Button onClick={() => navigate('/services')}>返回列表</Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/services')} style={{ marginBottom: 16 }}>
          返回服务列表
        </Button>

        {showResult && applicationResult ? (
          <Card className="card-shadow">
            <Result
              status="success"
              title="申请提交成功"
              subTitle="您的办件申请已成功提交，请耐心等待审核。"
              extra={[
                <Button type="primary" key="track" onClick={() => navigate('/user/applications')}>
                  <LinkOutlined /> 查看办件进度
                </Button>,
                <Button key="home" onClick={() => navigate('/')}>
                  返回首页
                </Button>
              ]}
            />
            <Card title="受理结果" style={{ marginTop: 24 }}>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="办件单号">
                  <span style={{ fontFamily: 'monospace', color: '#1890ff', fontWeight: 600 }}>
                    {applicationResult.applicationNo}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="服务名称">{applicationResult.serviceName}</Descriptions.Item>
                <Descriptions.Item label="提交时间">
                  {dayjs(applicationResult.submitTime).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="预计完成时间">
                  {dayjs(applicationResult.estimatedTime).format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color="blue">{applicationResult.statusText}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="关联证照">
                  {applicationResult.certificates.length > 0
                    ? applicationResult.certificates.map((c) => c.name).join('、')
                    : '无'}
                </Descriptions.Item>
              </Descriptions>

              <Card type="inner" title="办件进度" style={{ marginTop: 16 }}>
                <StatusTimeline progress={applicationResult.progress} status={applicationResult.status} />
              </Card>

              <Alert
                message="温馨提示"
                description="办件状态变更后，将在个人中心和消息中心通知您，请保持关注。您也可以随时在“我的办件”中查看进度。"
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Card>
          </Card>
        ) : showForm ? (
          <Card className="card-shadow" title={`在线办理 - ${service.name}`}>
            {autoLinkedCerts.length > 0 && (
              <Alert
                message="电子证照自动关联提示"
                description={
                  <div>
                    <p style={{ marginBottom: 8 }}>
                      系统检测到您已持有以下电子证照，可自动关联到本次申请，无需重复提交：
                    </p>
                    <Space wrap>
                      {autoLinkedCerts.map((cert) => (
                        <Tag key={cert.id} color="green" icon={<SafetyCertificateOutlined />}>
                          {cert.name} - 已自动关联
                        </Tag>
                      ))}
                    </Space>
                  </div>
                }
                type="success"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                name: userInfo?.name,
                idCard: userInfo?.idCard,
                phone: userInfo?.phone
              }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="姓名"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input placeholder="请输入真实姓名" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="idCard"
                    label="身份证号"
                    rules={[
                      { required: true, message: '请输入身份证号' },
                      { pattern: /^\d{17}[\dXx]$/, message: '请输入正确的身份证号' }
                    ]}
                  >
                    <Input placeholder="请输入18位身份证号" maxLength={18} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="手机号"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                    ]}
                  >
                    <Input placeholder="请输入11位手机号" maxLength={11} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="address"
                    label="居住地址"
                    rules={[{ required: true, message: '请输入居住地址' }]}
                  >
                    <Input placeholder="请输入详细居住地址" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="purpose"
                    label="办理事由"
                    rules={[{ required: true, message: '请选择办理事由' }]}
                  >
                    <Select placeholder="请选择办理事由">
                      <Option value="work">合法稳定就业</Option>
                      <Option value="live">合法稳定住所</Option>
                      <Option value="study">连续就读</Option>
                      <Option value="other">其他事由</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="delivery"
                    label="取件方式"
                    rules={[{ required: true, message: '请选择取件方式' }]}
                  >
                    <Select placeholder="请选择取件方式">
                      <Option value="pickup">窗口自取</Option>
                      <Option value="mail">邮寄送达（到付）</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {certificates.length > 0 && (
                <Card size="small" title="关联我的电子证照" style={{ marginBottom: 24 }}>
                  <Checkbox.Group value={selectedCertificates}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {certificates.map((cert) => (
                        <div key={cert.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Checkbox
                            value={cert.id}
                            checked={selectedCertificates.includes(cert.id)}
                            onChange={(e) => handleLinkCertificate(cert.id, e.target.checked)}
                          >
                            <Space>
                              <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                              <span>{cert.name}</span>
                              <span style={{ color: '#8c8c8c', fontSize: 12 }}>{cert.code}</span>
                              {autoLinkedCerts.some((c) => c.id === cert.id) && (
                                <Tag color="green" size="small">自动关联</Tag>
                              )}
                            </Space>
                          </Checkbox>
                        </div>
                      ))}
                    </Space>
                  </Checkbox.Group>
                </Card>
              )}

              <Form.Item label="上传材料">
                <Upload
                  multiple
                  beforeUpload={() => false}
                  onChange={({ fileList }) => {
                    message.info(`已选择 ${fileList.length} 个文件`)
                  }}
                >
                  <Button icon={<UploadOutlined />}>上传证明材料（可选）</Button>
                </Upload>
              </Form.Item>

              <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[{ validator: (_, value) => (value ? Promise.resolve() : Promise.reject(new Error('请同意服务协议'))) }]}
              >
                <Checkbox>
                  我已阅读并同意《常州市政务服务平台用户协议》和《个人信息保护声明》，承诺所提交信息真实有效。
                </Checkbox>
              </Form.Item>

              <Form.Item style={{ marginTop: 32 }}>
                <Space>
                  <Button type="primary" size="large" htmlType="submit" icon={<SendOutlined />} loading={loading}>
                    提交申请
                  </Button>
                  <Button size="large" onClick={() => setShowForm(false)}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        ) : (
          <>
            <Card className="card-shadow" style={{ marginBottom: 16 }}>
              <Row gutter={24} align="middle">
                <Col span={4}>
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: 16,
                      background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 48,
                      fontWeight: 600
                    }}
                  >
                    {service.icon}
                  </div>
                </Col>
                <Col span={16}>
                  <h1 style={{ fontSize: 28, margin: '0 0 12px' }}>{service.name}</h1>
                  <p style={{ color: '#595959', marginBottom: 16, fontSize: 15 }}>{service.description}</p>
                  <Space wrap>
                    <Tag color="blue">{service.department}</Tag>
                    <Tag color="green">{service.processingTime}</Tag>
                    <Tag color={service.fee === '免费' ? 'green' : 'orange'}>{service.fee}</Tag>
                    {service.online ? (
                      <Tag color="success" icon={<CheckCircleOutlined />}>可在线办理</Tag>
                    ) : (
                      <Tag color="default">仅线下办理</Tag>
                    )}
                  </Space>
                </Col>
                <Col span={4} style={{ textAlign: 'right' }}>
                  {service.online ? (
                    <Button
                      type="primary"
                      size="large"
                      icon={<SendOutlined />}
                      onClick={() => {
                        if (!isLoggedIn) {
                          message.warning('请先登录')
                          navigate('/login')
                          return
                        }
                        setShowForm(true)
                      }}
                      style={{ minWidth: 140 }}
                    >
                      在线办理
                    </Button>
                  ) : (
                    <Button type="primary" size="large" disabled style={{ minWidth: 140 }}>
                      仅线下办理
                    </Button>
                  )}
                  <Button
                    style={{ marginTop: 12, minWidth: 140 }}
                    icon={<ReloadOutlined />}
                    onClick={loadService}
                  >
                    刷新
                  </Button>
                </Col>
              </Row>
            </Card>

            <Card className="card-shadow" style={{ marginBottom: 16 }}>
              <Tabs items={tabItems} defaultActiveKey="intro" />
            </Card>
          </>
        )}
      </div>

      <Modal
        title="确认提交"
        open={false}
        onOk={handleSubmit}
        onCancel={() => {}}
        okText="确认提交"
        cancelText="取消"
      >
        <p>确认提交本办件申请吗？提交后将进入审核流程。</p>
      </Modal>
    </div>
  )
}

export default ServiceDetail

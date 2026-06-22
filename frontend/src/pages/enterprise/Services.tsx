import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Space,
  Button,
  Modal,
  Typography,
  Table,
  Tag,
  Form,
  Input,
  Select,
  Upload,
  Descriptions,
  message,
  Avatar,
  List,
  Badge,
  Steps,
  Divider,
  Statistic,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  AppstoreOutlined,
  FileDoneOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  HistoryOutlined,
  PlusOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  InboxOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  BankOutlined,
  ScheduleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Dragger } = Upload

interface ServiceCard {
  key: string
  title: string
  desc: string
  price: string
  priceNote: string
  color: string
  gradient: string
  icon: JSX.Element
  tags: string[]
  buttonText: string
  features: string[]
}

interface ServiceRecord {
  id: string
  service_type: string
  service_name: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  created_at: string
  updated_at: string
  remark: string
}

const serviceCards: ServiceCard[] = [
  {
    key: 'invoice',
    title: '发票代开',
    desc: '快速办理增值税普通/专用发票，支持电子发票即时下载，1-3个工作日完成',
    price: '¥200',
    priceNote: '/ 单次起',
    color: '#1890ff',
    gradient: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    icon: <FileDoneOutlined />,
    tags: ['电子发票', '增值税专票', '极速办理'],
    buttonText: '立即申请',
    features: [
      '增值税普通发票：200元/次',
      '增值税专用发票：500元/次',
      '支持电子发票邮件发送',
      '办理周期：1-3个工作日',
    ],
  },
  {
    key: 'verify',
    title: '企业认证加急',
    desc: '高级企业认证绿色通道，专人审核，24小时内出结果，享AAA级初始信用',
    price: '¥1,500',
    priceNote: '/ 单次',
    color: '#722ed1',
    gradient: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
    icon: <SafetyCertificateOutlined />,
    tags: ['快速审核', 'AAA初始信用', '专人服务'],
    buttonText: '立即办理',
    features: [
      '高级认证全套办理',
      '24小时内审核完毕',
      '专属客户经理对接',
      '初始信用分直接 +30',
    ],
  },
  {
    key: 'check',
    title: '工人背调',
    desc: '专业第三方背景调查，涵盖身份核实、从业经历、技能认证、前科查询等',
    price: '¥300',
    priceNote: '/ 人起',
    color: '#fa8c16',
    gradient: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
    icon: <SearchOutlined />,
    tags: ['身份核验', '履历核实', '犯罪记录'],
    buttonText: '发起背调',
    features: [
      '基础版（身份核验）：300元/人',
      '标准版（+技能认证）：500元/人',
      '高级版（+犯罪记录）：800元/人',
      '电子版报告3个工作日内交付',
    ],
  },
  {
    key: 'law',
    title: '法律咨询',
    desc: '资深劳动法律师团队，提供用工合同审核、劳动争议处理、合规咨询服务',
    price: '¥500',
    priceNote: '/ 小时起',
    color: '#13c2c2',
    gradient: 'linear-gradient(135deg, #13c2c2 0%, #08979c 100%)',
    icon: <TeamOutlined />,
    tags: ['劳动法专家', '合规审查', '争议处理'],
    buttonText: '预约咨询',
    features: [
      '在线文字咨询：500元/小时',
      '电话语音咨询：800元/小时',
      '合同文件审核：2000元/份',
      '线下预约律师：3000元/小时',
    ],
  },
]

const statusMap: Record<string, { text: string; color: string; icon: JSX.Element }> = {
  pending: { text: '待处理', color: 'default', icon: <ClockCircleOutlined /> },
  processing: { text: '处理中', color: 'processing', icon: <ScheduleOutlined spin /> },
  completed: { text: '已完成', color: 'success', icon: <CheckCircleOutlined /> },
  rejected: { text: '已驳回', color: 'error', icon: <CloseCircleOutlined /> },
}

function Services() {
  const [activeTab, setActiveTab] = useState<'market' | 'records'>('market')
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [currentService, setCurrentService] = useState<ServiceCard | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<ServiceRecord | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  const records: ServiceRecord[] = [
    {
      id: 'SV20260615001',
      service_type: 'invoice',
      service_name: '增值税普通发票代开',
      amount: 200,
      status: 'completed',
      created_at: '2026-06-15 10:30',
      updated_at: '2026-06-16 14:20',
      remark: '发票已开具并发送至邮箱 invoice@example.com',
    },
    {
      id: 'SV20260610002',
      service_type: 'check',
      service_name: '工人背景调查-标准版',
      amount: 2500,
      status: 'completed',
      created_at: '2026-06-10 09:15',
      updated_at: '2026-06-12 18:00',
      remark: '5名工人背景调查完成，报告已下载',
    },
    {
      id: 'SV20260618003',
      service_type: 'verify',
      service_name: '企业高级认证加急',
      amount: 1500,
      status: 'processing',
      created_at: '2026-06-18 15:45',
      updated_at: '2026-06-19 09:00',
      remark: '资质审核中，预计今日完成',
    },
    {
      id: 'SV20260605004',
      service_type: 'law',
      service_name: '劳动合同审核',
      amount: 4000,
      status: 'completed',
      created_at: '2026-06-05 14:20',
      updated_at: '2026-06-07 11:30',
      remark: '两份合同审核完成，已出具修改建议',
    },
    {
      id: 'SV20260620005',
      service_type: 'invoice',
      service_name: '增值税专用发票代开',
      amount: 1500,
      status: 'pending',
      created_at: '2026-06-20 16:10',
      updated_at: '2026-06-20 16:10',
      remark: '等待支付完成后处理',
    },
  ]

  const handleApply = (service: ServiceCard) => {
    setCurrentService(service)
    form.resetFields()
    setApplyModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      await form.validateFields()
      setSubmitting(true)
      setTimeout(() => {
        message.success(`${currentService?.title}申请已提交，客服将在30分钟内联系您`)
        setSubmitting(false)
        setApplyModalOpen(false)
      }, 1200)
    } catch {
    }
  }

  const viewRecordDetail = (record: ServiceRecord) => {
    setCurrentRecord(record)
    setDetailModalOpen(true)
  }

  const recordColumns: ColumnsType<ServiceRecord> = [
    {
      title: '服务单号',
      dataIndex: 'id',
      key: 'id',
      width: 160,
      render: (v) => <Text code style={{ color: '#1890ff' }}>{v}</Text>,
    },
    {
      title: '服务类型',
      dataIndex: 'service_type',
      key: 'service_type',
      width: 110,
      render: (v) => {
        const svc = serviceCards.find(s => s.key === v)
        return (
          <Tag color={svc?.color || 'default'} icon={svc?.icon} style={{ fontSize: 12 }}>
            {svc?.title || v}
          </Tag>
        )
      },
    },
    {
      title: '服务名称',
      dataIndex: 'service_name',
      key: 'service_name',
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: '费用',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (v) => <Statistic value={v} precision={2} prefix="¥" valueStyle={{ fontSize: 14 }} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v) => {
        const s = statusMap[v]
        return <Tag color={s.color} icon={s.icon} style={{ fontSize: 12 }}>{s.text}</Tag>
      },
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v) => <Text type="secondary" style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => viewRecordDetail(record)}>详情</Button>
          {record.status === 'completed' && (
            <Button type="link" size="small">下载</Button>
          )}
        </Space>
      ),
    },
  ]

  const stepMap: Record<string, { steps: number; title: string }[]> = {
    invoice: [
      { steps: 0, title: '提交申请' },
      { steps: 1, title: '支付费用' },
      { steps: 2, title: '资料审核' },
      { steps: 3, title: '开具发票' },
      { steps: 4, title: '发送完成' },
    ],
    verify: [
      { steps: 0, title: '提交申请' },
      { steps: 1, title: '支付费用' },
      { steps: 2, title: '资料上传' },
      { steps: 3, title: '专人审核' },
      { steps: 4, title: '认证通过' },
    ],
    check: [
      { steps: 0, title: '提交申请' },
      { steps: 1, title: '支付费用' },
      { steps: 2, title: '信息采集' },
      { steps: 3, title: '背景调查' },
      { steps: 4, title: '报告出具' },
    ],
    law: [
      { steps: 0, title: '提交申请' },
      { steps: 1, title: '支付费用' },
      { steps: 2, title: '匹配律师' },
      { steps: 3, title: '咨询服务' },
      { steps: 4, title: '服务完成' },
    ],
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>
          <Space>
            <AppstoreOutlined style={{ color: '#1890ff' }} />
            延伸服务
          </Space>
        </Title>
        <Space>
          <Button.Group>
            <Button
              type={activeTab === 'market' ? 'primary' : 'default'}
              icon={<AppstoreOutlined />}
              onClick={() => setActiveTab('market')}
            >
              服务市场
            </Button>
            <Button
              type={activeTab === 'records' ? 'primary' : 'default'}
              icon={<HistoryOutlined />}
              onClick={() => setActiveTab('records')}
            >
              我的记录
              <Badge count={records.filter(r => r.status === 'processing' || r.status === 'pending').length} offset={[2, 0]} style={{ marginLeft: 4 }} />
            </Button>
          </Button.Group>
        </Space>
      </div>

      {activeTab === 'market' && (
        <div>
          <Row gutter={[16, 16]}>
            {serviceCards.map((service) => (
              <Col xs={24} sm={12} xl={6} key={service.key}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 16,
                    height: '100%',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                  hoverable
                  styles={{ body: { padding: 20 } }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: service.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 26,
                      color: '#fff',
                      marginBottom: 14,
                      boxShadow: `0 6px 16px ${service.color}40`,
                    }}
                  >
                    {service.icon}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <Text strong style={{ fontSize: 18 }}>{service.title}</Text>
                    <div>
                      <Text strong style={{ color: service.color, fontSize: 20, fontWeight: 800 }}>{service.price}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>{service.priceNote}</Text>
                    </div>
                  </div>

                  <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12, minHeight: 60 }}>
                    {service.desc}
                  </Paragraph>

                  <Space size={[4, 4]} wrap style={{ marginBottom: 16 }}>
                    {service.tags.map(tag => (
                      <Tag key={tag} color={`${service.color}30`} style={{ color: service.color, border: 'none', fontSize: 11 }}>
                        {tag}
                      </Tag>
                    ))}
                  </Space>

                  <Divider style={{ margin: '8px 0 14px' }} />

                  <List
                    size="small"
                    dataSource={service.features}
                    renderItem={(item) => (
                      <List.Item style={{ padding: '4px 0', border: 'none', fontSize: 12, color: '#666' }}>
                        <CheckCircleOutlined style={{ color: service.color, marginRight: 6, fontSize: 11 }} />
                        {item}
                      </List.Item>
                    )}
                  />

                  <Button
                    type="primary"
                    block
                    icon={<PlusOutlined />}
                    style={{
                      marginTop: 16,
                      background: service.gradient,
                      border: 'none',
                      height: 42,
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                    onClick={() => handleApply(service)}
                  >
                    {service.buttonText}
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>

          <Card
            bordered={false}
            style={{ borderRadius: 16, marginTop: 20 }}
            title={
              <Space>
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
                服务说明
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Space direction="vertical" size={8}>
                  <Text strong style={{ fontSize: 15 }}>
                    <BankOutlined style={{ color: '#1890ff', marginRight: 6 }} />
                    关于费用
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.8 }}>
                    所有服务费用均通过平台第三方担保支付，服务完成并确认后才会结算给服务商。如有异议可申请平台介入调解。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space direction="vertical" size={8}>
                  <Text strong style={{ fontSize: 15 }}>
                    <ClockCircleOutlined style={{ color: '#1890ff', marginRight: 6 }} />
                    服务时效
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.8 }}>
                    标准服务按公示时效处理。如需加急，可在申请时选择「加急」选项，费用上浮50%，时效缩短至50%。
                  </Text>
                </Space>
              </Col>
              <Col xs={24} md={8}>
                <Space direction="vertical" size={8}>
                  <Text strong style={{ fontSize: 15 }}>
                    <PhoneOutlined style={{ color: '#1890ff', marginRight: 6 }} />
                    联系我们
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.8 }}>
                    如有疑问，可拨打企业服务专线：400-888-8888 转 2（工作时间：周一至周日 8:00-22:00）
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>
        </div>
      )}

      {activeTab === 'records' && (
        <Card bordered={false} style={{ borderRadius: 16 }}>
          <Table
            columns={recordColumns}
            dataSource={records}
            rowKey="id"
            pagination={{ pageSize: 8, showSizeChanger: false }}
          />
        </Card>
      )}

      <Modal
        title={
          <Space>
            {currentService?.icon}
            {currentService?.title} - 服务申请
          </Space>
        }
        open={applyModalOpen}
        onCancel={() => setApplyModalOpen(false)}
        width={680}
        footer={[
          <Button key="cancel" onClick={() => setApplyModalOpen(false)}>取消</Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleSubmit}
            style={{ background: currentService?.gradient || '#1890ff', border: 'none' }}
          >
            提交申请
          </Button>,
        ]}
      >
        {currentService && (
          <div>
            <Card
              size="small"
              bordered={false}
              style={{ background: `${currentService.color}10`, borderRadius: 12, marginBottom: 20 }}
            >
              <Row align="middle">
                <Col flex="auto">
                  <Text strong style={{ fontSize: 14 }}>{currentService.title}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{currentService.desc}</Text>
                </Col>
                <Col>
                  <Text strong style={{ color: currentService.color, fontSize: 24, fontWeight: 800 }}>
                    {currentService.price}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}> {currentService.priceNote}</Text>
                </Col>
              </Row>
            </Card>

            <Form
              form={form}
              layout="vertical"
              initialValues={{ urgent: 0 }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="contact_name"
                    label="联系人"
                    rules={[{ required: true, message: '请输入联系人' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="请输入联系人姓名" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="contact_phone"
                    label="联系电话"
                    rules={[{ required: true, message: '请输入联系电话' }]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="请输入手机号码" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="contact_email"
                    label="邮箱"
                    rules={[{ type: 'email', message: '请输入有效邮箱' }]}
                  >
                    <Input prefix={<MailOutlined />} placeholder="请输入邮箱（接收处理结果）" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="urgent"
                    label="处理方式"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Select.Option value={0}>标准时效</Select.Option>
                      <Select.Option value={1}>加急处理（费用 +50%）</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {currentService.key === 'invoice' && (
                <>
                  <Divider style={{ margin: '4px 0 16px' }}>发票信息</Divider>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="invoice_type" label="发票类型" rules={[{ required: true }]}>
                        <Select placeholder="请选择">
                          <Select.Option value="normal">增值税普通发票</Select.Option>
                          <Select.Option value="special">增值税专用发票</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="invoice_title" label="发票抬头" rules={[{ required: true }]}>
                        <Input placeholder="公司名称" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="tax_no" label="纳税人识别号" rules={[{ required: true }]}>
                    <Input placeholder="15~20位纳税人识别号" />
                  </Form.Item>
                </>
              )}

              {currentService.key === 'check' && (
                <>
                  <Divider style={{ margin: '4px 0 16px' }}>背调信息</Divider>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="check_type" label="调查类型" rules={[{ required: true }]}>
                        <Select placeholder="请选择">
                          <Select.Option value="basic">基础版（身份核验）- ¥300/人</Select.Option>
                          <Select.Option value="standard">标准版（+技能认证）- ¥500/人</Select.Option>
                          <Select.Option value="advanced">高级版（+犯罪记录）- ¥800/人</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="worker_count" label="调查人数" rules={[{ required: true }]}>
                        <Input type="number" placeholder="请输入人数" min={1} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="workers_file" label="工人信息表" rules={[{ required: true, message: '请上传工人信息Excel' }]}>
                    <Dragger
                      multiple={false}
                      maxCount={1}
                      beforeUpload={() => false}
                    >
                      <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                      </p>
                      <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                      <p className="ant-upload-hint">
                        支持 .xlsx/.xls 格式，请包含姓名、身份证号、手机号等信息
                      </p>
                    </Dragger>
                  </Form.Item>
                </>
              )}

              {currentService.key === 'law' && (
                <>
                  <Divider style={{ margin: '4px 0 16px' }}>咨询信息</Divider>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item name="law_type" label="咨询方式" rules={[{ required: true }]}>
                        <Select placeholder="请选择">
                          <Select.Option value="text">在线文字 - ¥500/小时</Select.Option>
                          <Select.Option value="phone">电话语音 - ¥800/小时</Select.Option>
                          <Select.Option value="contract">合同审核 - ¥2000/份</Select.Option>
                          <Select.Option value="offline">线下预约 - ¥3000/小时</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="prefer_time" label="期望时间">
                        <Input placeholder="例如：明天下午3点" />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              )}

              <Form.Item name="remark" label="备注说明">
                <Input.TextArea rows={3} placeholder="请填写其他需要说明的内容（选填）" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <HistoryOutlined style={{ color: '#1890ff' }} />
            服务详情 - {currentRecord?.id}
          </Space>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width={720}
        footer={[
          currentRecord?.status === 'completed' && (
            <Button key="download" type="primary" icon={<UploadOutlined />}>
              下载结果
            </Button>
          ),
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        {currentRecord && (
          <div>
            <Descriptions
              bordered
              column={2}
              size="small"
              style={{ marginBottom: 20 }}
              items={[
                { key: 'id', label: '服务单号', children: <Text code>{currentRecord.id}</Text> },
                {
                  key: 'type',
                  label: '服务类型',
                  children: serviceCards.find(s => s.key === currentRecord.service_type)?.title,
                },
                { key: 'name', label: '服务名称', children: currentRecord.service_name, span: 2 },
                {
                  key: 'amount',
                  label: '服务费用',
                  children: <Text strong style={{ color: '#fa541c', fontSize: 16 }}>¥{currentRecord.amount.toFixed(2)}</Text>,
                },
                {
                  key: 'status',
                  label: '当前状态',
                  children: (
                    <Tag
                      color={statusMap[currentRecord.status].color}
                      icon={statusMap[currentRecord.status].icon}
                    >
                      {statusMap[currentRecord.status].text}
                    </Tag>
                  ),
                },
                { key: 'created', label: '申请时间', children: currentRecord.created_at },
                { key: 'updated', label: '更新时间', children: currentRecord.updated_at },
                { key: 'remark', label: '处理备注', children: currentRecord.remark, span: 2 },
              ]}
            />

            <Card
              size="small"
              bordered={false}
              style={{ background: '#fafafa', borderRadius: 12 }}
              title={
                <Text strong style={{ fontSize: 14 }}>
                  <Steps
                    size="small"
                    current={
                      currentRecord.status === 'completed'
                        ? 4
                        : currentRecord.status === 'processing'
                        ? 2
                        : currentRecord.status === 'rejected'
                        ? 1
                        : 0
                    }
                    status={currentRecord.status === 'rejected' ? 'error' : 'process'}
                    items={
                      stepMap[currentRecord.service_type]?.map(s => ({ title: s.title })) || [
                        { title: '提交申请' },
                        { title: '审核处理' },
                        { title: '服务进行' },
                        { title: '服务完成' },
                      ]
                    }
                  />
                </Text>
              }
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Services

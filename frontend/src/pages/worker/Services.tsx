import { useState } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  List,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  message,
  Upload,
  Descriptions,
  Divider,
  Empty,
  Progress,
  Timeline,
  Tooltip,
} from 'antd'
import {
  AppstoreOutlined,
  IdcardOutlined,
  FileSearchOutlined,
  ScheduleOutlined,
  PlusOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  SafetyOutlined,
  MoneyCollectOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

interface ServiceItem {
  key: string
  title: string
  icon: React.ReactNode
  color: string
  description: string
  price: string
  fee: string
  features: string[]
}

interface ServiceApplication {
  id: number
  service_key: string
  service_name: string
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'completed'
  submitted_at: string
  updated_at?: string
  amount: number
  progress: number
  steps: {
    title: string
    status: 'done' | 'process' | 'wait' | 'error'
    time?: string
  }[]
}

function Services() {
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [currentService, setCurrentService] = useState<ServiceItem | null>(null)
  const [applyLoading, setApplyLoading] = useState(false)
  const [form] = Form.useForm()
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [currentApp, setCurrentApp] = useState<ServiceApplication | null>(null)

  const services: ServiceItem[] = [
    {
      key: 'business_license',
      title: '个体户执照代办',
      icon: <IdcardOutlined />,
      color: '#1677ff',
      description: '专业代办个体工商户营业执照，正规渠道，最快3个工作日下证',
      price: '¥699',
      fee: '含工本费、服务费',
      features: [
        '线上提交资料，无需跑腿',
        '正规工商注册渠道',
        '最快3个工作日下证',
        '电子执照+纸质邮寄到家',
        '含1年记账报税咨询',
      ],
    },
    {
      key: 'invoice_service',
      title: '劳务发票代开',
      icon: <FileSearchOutlined />,
      color: '#52c41a',
      description: '正规税务代开劳务发票，完税证明齐全，可用于工资入账',
      price: '税率1.5%起',
      fee: '低税率，完税合规',
      features: [
        '个人劳务报酬发票代开',
        '个人经营所得核定征收',
        '税务正规发票+完税证明',
        '1-3个工作日开出发票',
        '支持电子发票+纸质邮寄',
      ],
    },
    {
      key: 'attendance_report',
      title: '考勤报表服务',
      icon: <ScheduleOutlined />,
      color: '#722ed1',
      description: '专业定制考勤报表，Excel/PDF格式，含日/周/月多种维度统计',
      price: '¥29/月',
      fee: '开通即享，随时下载',
      features: [
        '每日/每周/每月考勤报表',
        '工时、出勤、迟到早退统计',
        '薪资联动自动计算',
        'Excel/PDF多格式导出',
        '个人出勤分析图表',
      ],
    },
    {
      key: 'tax_consulting',
      title: '税务咨询',
      icon: <MoneyCollectOutlined />,
      color: '#fa8c16',
      description: '专业税务师1对1咨询，劳务个税、社保、发票问题全解答',
      price: '¥199/次',
      fee: '专业税务师1对1',
      features: [
        '个人劳务个税筹划',
        '个体户税务合规建议',
        '发票开具指导',
        '社保缴纳咨询',
        '30分钟专业解答',
      ],
    },
    {
      key: 'skill_training',
      title: '技能培训报名',
      icon: <TeamOutlined />,
      color: '#13c2c2',
      description: '国家级技能等级证书培训，名师授课，考证通过率高',
      price: '价格面议',
      fee: '多工种可选',
      features: [
        '电工/焊工/架子工等',
        '线上+线下结合教学',
        '名师授课，经验丰富',
        '考证通过率90%+',
        '证书全国通用，国网可查',
      ],
    },
    {
      key: 'insurance_service',
      title: '工伤意外险',
      icon: <SafetyOutlined />,
      color: '#eb2f96',
      description: '灵活就业人员专属保障，按月投保，高性价比',
      price: '¥39/月起',
      fee: '按天/按月灵活投',
      features: [
        '意外身故/伤残最高50万',
        '意外医疗最高5万',
        '住院津贴50元/天',
        '全国理赔绿色通道',
        '次日零时生效',
      ],
    },
  ]

  const myApplications: ServiceApplication[] = [
    {
      id: 1001,
      service_key: 'business_license',
      service_name: '个体户执照代办',
      status: 'processing',
      submitted_at: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
      amount: 699,
      progress: 60,
      steps: [
        { title: '提交申请', status: 'done', time: dayjs().subtract(5, 'day').format('MM-DD HH:mm') },
        { title: '资料审核', status: 'done', time: dayjs().subtract(4, 'day').format('MM-DD HH:mm') },
        { title: '工商注册', status: 'process', time: dayjs().subtract(2, 'day').format('MM-DD HH:mm') },
        { title: '执照发放', status: 'wait' },
        { title: '邮寄到家', status: 'wait' },
      ],
    },
    {
      id: 1002,
      service_key: 'invoice_service',
      service_name: '劳务发票代开',
      status: 'completed',
      submitted_at: dayjs().subtract(15, 'day').format('YYYY-MM-DD HH:mm:ss'),
      updated_at: dayjs().subtract(12, 'day').format('YYYY-MM-DD HH:mm:ss'),
      amount: 450,
      progress: 100,
      steps: [
        { title: '提交申请', status: 'done', time: dayjs().subtract(15, 'day').format('MM-DD HH:mm') },
        { title: '金额确认', status: 'done', time: dayjs().subtract(14, 'day').format('MM-DD HH:mm') },
        { title: '税务开票', status: 'done', time: dayjs().subtract(13, 'day').format('MM-DD HH:mm') },
        { title: '发票寄出', status: 'done', time: dayjs().subtract(12, 'day').format('MM-DD HH:mm') },
        { title: '服务完成', status: 'done', time: dayjs().subtract(12, 'day').format('MM-DD HH:mm') },
      ],
    },
    {
      id: 1003,
      service_key: 'attendance_report',
      service_name: '考勤报表服务',
      status: 'pending',
      submitted_at: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
      amount: 29,
      progress: 20,
      steps: [
        { title: '开通服务', status: 'done', time: dayjs().subtract(1, 'day').format('MM-DD HH:mm') },
        { title: '服务激活', status: 'process' },
        { title: '报表生成', status: 'wait' },
      ],
    },
  ]

  const statusConfig = {
    pending: { color: '#faad14', bg: '#fffbe6', text: '待处理' },
    processing: { color: '#1677ff', bg: '#e6f4ff', text: '处理中' },
    approved: { color: '#52c41a', bg: '#f6ffed', text: '已通过' },
    rejected: { color: '#ff4d4f', bg: '#fff1f0', text: '已驳回' },
    completed: { color: '#722ed1', bg: '#f9f0ff', text: '已完成' },
  }

  const handleApply = (service: ServiceItem) => {
    setCurrentService(service)
    form.resetFields()
    setApplyModalOpen(true)
  }

  const handleSubmitApply = async () => {
    try {
      await form.validateFields()
      setApplyLoading(true)
      setTimeout(() => {
        setApplyLoading(false)
        message.success(`${currentService?.title} 申请已提交！工作人员将在1个工作日内联系您`)
        setApplyModalOpen(false)
      }, 1000)
    } catch {
    }
  }

  const handleViewDetail = (app: ServiceApplication) => {
    setCurrentApp(app)
    setDetailModalOpen(true)
  }

  return (
    <div>
      <Card
        style={{ borderRadius: 12, marginBottom: 24 }}
        styles={{ body: { padding: 20, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } }}
      >
        <Space direction="vertical" size={8} style={{ width: '100%', color: '#fff' }}>
          <Title level={3} style={{ color: '#fff', margin: 0 }}>
            <Space size={10}>
              <AppstoreOutlined />
              延伸服务中心
            </Space>
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: 14 }}>
            为工友们提供工商、税务、保险、培训等一站式便民服务，专业靠谱，价格透明
          </Paragraph>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {services.map((service) => (
          <Col xs={24} sm={12} lg={8} key={service.key}>
            <Card
              hoverable
              style={{ borderRadius: 12, height: '100%' }}
              styles={{ body: { padding: 20 } }}
            >
              <Space direction="vertical" size={14} style={{ width: '100%', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: `${service.color}15`,
                      color: service.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                    }}
                  >
                    {service.icon}
                  </div>
                  <Tag
                    color={service.color}
                    style={{
                      border: 'none',
                      background: `${service.color}15`,
                      color: service.color,
                      fontWeight: 700,
                      fontSize: 14,
                      padding: '4px 10px',
                      borderRadius: 16,
                      margin: 0,
                    }}
                  >
                      {service.price}
                    </Tag>
                </div>

                <div>
                  <Title level={5} style={{ margin: 0, marginBottom: 6 }}>{service.title}</Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {service.description}
                  </Text>
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    background: '#fafafa',
                    borderRadius: 8,
                  }}
                >
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    {service.features.slice(0, 3).map((f) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12 }}>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginTop: 2 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>{f}</Text>
                      </div>
                    ))}
                  </Space>
                </div>

                <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 'auto', paddingTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    <InfoCircleOutlined /> 费用说明：{service.fee}
                  </Text>
                  <Button
                    type="primary"
                    block
                    size="large"
                    onClick={() => handleApply(service)}
                    style={{ borderRadius: 10 }}
                  >
                    <PlusOutlined /> 立即申请
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#fa8c16' }} />
            <span>我的服务申请记录</span>
            <Tag color="blue">{myApplications.length}条</Tag>
          </Space>
        }
        style={{ borderRadius: 12 }}
        extra={
          <Tooltip title="可查看每个服务申请的详细进度">
            <Button type="link" icon={<InfoCircleOutlined />} style={{ color: '#1677ff' }}>
              进度说明
            </Button>
          </Tooltip>
        }
      >
        {myApplications.length === 0 ? (
          <Empty description={<Text type="secondary">还没有申请过任何服务</Text>} />
        ) : (
          <List
            dataSource={myApplications}
            renderItem={(app) => {
              const sc = statusConfig[app.status]
              const matched = services.find((s) => s.key === app.service_key)
              return (
                <Card
                  key={app.id}
                  style={{ marginBottom: 16, borderRadius: 10 }}
                  styles={{ body: { padding: 16 } }}
                >
                  <Row gutter={[16, 12]} align="middle">
                    <Col xs={24} sm={4} md={3}>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 14,
                          background: `${matched?.color || '#1677ff'}15`,
                          color: matched?.color || '#1677ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 26,
                        }}
                      >
                        {matched?.icon || <AppstoreOutlined />}
                      </div>
                    </Col>
                    <Col xs={24} sm={10} md={8}>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Space size={8}>
                          <Text strong style={{ fontSize: 15 }}>{app.service_name}</Text>
                          <Tag
                            color={sc.color}
                            style={{
                              border: 'none',
                              background: sc.bg,
                              margin: 0,
                              padding: '2px 10px',
                              borderRadius: 14,
                            }}
                          >
                            {sc.text}
                          </Tag>
                        </Space>
                        <Space split={<Text type="secondary" style={{ fontSize: 11 }}>|</Text>} size={8}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            <ClockCircleOutlined /> 申请：{dayjs(app.submitted_at).format('MM-DD HH:mm')}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            金额：¥{app.amount}
                          </Text>
                        </Space>
                      </Space>
                    </Col>
                    <Col xs={24} sm={8} md={9}>
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            进度
                          </Text>
                          <Text strong style={{ color: sc.color, fontSize: 12 }}>
                            {app.progress}%
                          </Text>
                        </div>
                        <Progress
                          percent={app.progress}
                          status={app.status === 'rejected' ? 'exception' : app.status === 'completed' ? 'success' : 'active'}
                          showInfo={false}
                          strokeColor={sc.color}
                          style={{ margin: 0 }}
                        />
                      </Space>
                    </Col>
                    <Col xs={24} sm={2} md={4} style={{ textAlign: 'right' }}>
                      <Button type="primary" icon={<EyeOutlined />} onClick={() => handleViewDetail(app)}>
                        查看详情
                      </Button>
                    </Col>
                  </Row>
                </Card>
              )
            }}
          />
        )}
      </Card>

      <Modal
        title={
          currentService ? (
            <Space>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${currentService.color}15`,
                  color: currentService.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                {currentService.icon}
              </div>
              <span>申请 - {currentService.title}</span>
              <Tag color={currentService.color}>{currentService.price}</Tag>
            </Space>
          ) : null
        }
        open={applyModalOpen}
        onCancel={() => setApplyModalOpen(false)}
        onOk={handleSubmitApply}
        confirmLoading={applyLoading}
        okText="提交申请"
        cancelText="取消"
        width={560}
      >
        {currentService && (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <div
              style={{
              padding: '12px 16px',
              background: '#f0f5ff',
              borderRadius: 8,
              border: '1px solid #d6e4ff',
            }}
            >
              <Paragraph style={{ margin: 0, fontSize: 13 }}>
                <Text type="secondary">服务说明：</Text>
                {currentService.description}
              </Paragraph>
              <Paragraph style={{ margin: '8px 0 0 0', fontSize: 12 }}>
                <Text type="secondary">费用：</Text>
                <Text strong>{currentService.price}</Text>
                <Text type="secondary"> （{currentService.fee}）</Text>
              </Paragraph>
            </div>

            <Form form={form} layout="vertical" size="large">
              {currentService.key === 'business_license' ? (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="真实姓名" name="real_name" rules={[{ required: true, message: '请输入真实姓名' }]}>
                        <Input placeholder="请输入身份证上的姓名" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="身份证号" name="id_card" rules={[{ required: true, message: '请输入身份证号' }]}>
                        <Input placeholder="请输入18位身份证号" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="拟经营类型" name="biz_type" rules={[{ required: true, message: '请选择' }]}>
                    <Select placeholder="请选择拟经营的类型">
                      <Option value="construction">建筑劳务服务</Option>
                      <Option value="decoration">装修装饰服务</Option>
                      <Option value="repair">维修安装服务</Option>
                      <Option value="other">其他服务</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="经营地址" name="address">
                    <Input placeholder="请输入经营地址（选填）" />
                  </Form.Item>
                </>
              ) : null}

              {currentService.key === 'invoice_service' ? (
                <>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="发票抬头" name="invoice_title" rules={[{ required: true, message: '请输入' }]}>
                        <Input placeholder="个人姓名或企业名称" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="开票金额" name="amount" rules={[{ required: true, message: '请输入' }]}>
                        <Input addonBefore="¥" placeholder="请输入开票金额" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="发票类型" name="invoice_type" rules={[{ required: true }]}>
                    <Radio.Group>
                      <Radio value="personal">增值税普通发票</Radio>
                      <Radio value="special">增值税专用发票</Radio>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item label="发票用途" name="purpose">
                    <TextArea rows={2} placeholder="请简要说明开票用途、项目名称等" />
                  </Form.Item>
                </>
              ) : null}

              {currentService.key === 'attendance_report' ? (
                <>
                  <Form.Item label="报表周期" name="period" rules={[{ required: true }]}>
                    <Select placeholder="请选择">
                      <Option value="monthly">月度报表</Option>
                      <Option value="weekly">周度报表</Option>
                      <Option value="daily">每日报表</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="统计范围" name="range" rules={[{ required: true }]}>
                    <Radio.Group>
                      <Radio value="all">全部项目</Radio>
                      <Radio value="custom">指定项目</Radio>
                    </Radio.Group>
                  </Form.Item>
                </>
              ) : null}

              {!['business_license', 'invoice_service', 'attendance_report'].includes(currentService.key) ? (
                <Form.Item label="需求说明" name="remark">
                  <TextArea rows={4} placeholder="请描述您的具体需求，工作人员将在1个工作日内联系您确认" />
                </Form.Item>
              ) : null}

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="联系电话" name="phone" rules={[{ required: true, message: '请输入' }]}>
                    <Input placeholder="请输入手机号" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="联系邮箱" name="email">
                    <Input placeholder="选填" />
                  </Form.Item>
                </Col>
              </Row>

              {currentService.key === 'business_license' && (
                <Form.Item label="身份证照片" name="id_photo">
                  <Upload
                    listType="picture"
                    beforeUpload={() => false}
                    maxCount={2}
                  >
                    <Button icon={<UploadOutlined />}>上传身份证正反面</Button>
                  </Upload>
                </Form.Item>
              )}
            </Form>

            <Alert
              type="info"
              showIcon
              message={<Text strong>温馨提示</Text>}
              description="提交后，工作人员将在1个工作日内与您联系确认资料，请保持电话畅通。"
              />
          </Space>
        )}
      </Modal>

      <Modal
        title={
        currentApp ? (
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>{currentApp.service_name} - 申请详情</span>
          </Space>
          ) : null
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>
            关闭
          </Button>,
          currentApp?.status === 'completed' && currentApp.service_key === 'attendance_report' ? (
            <Button key="download" type="primary" icon={<DownloadOutlined />}>
              下载报表
            </Button>
          ) : null,
        ]}
        width={640}
      >
        {currentApp && (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Card size="small" style={{ borderRadius: 8 }}>
              <Descriptions column={2} size="small" labelStyle={{ color: '#8c8c8c' }}>
                <Descriptions.Item label="服务名称">{currentApp.service_name}</Descriptions.Item>
                <Descriptions.Item label="申请编号">#{currentApp.id}</Descriptions.Item>
                <Descriptions.Item label="申请时间">
                  {dayjs(currentApp.submitted_at).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="申请费用">¥{currentApp.amount}</Descriptions.Item>
                <Descriptions.Item label="当前状态" span={2}>
                  <Tag color={statusConfig[currentApp.status].color}>
                    {statusConfig[currentApp.status].text}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card
              size="small"
              title={<Space><CalendarOutlined style={{ color: '#1677ff' }} /><span>办理进度</span></Space>}
              style={{ borderRadius: 8 }}
            >
              <Timeline
                items={currentApp.steps.map((step) => ({
                color:
                  step.status === 'done'
                    ? 'green'
                    : step.status === 'process'
                    ? 'blue'
                    : step.status === 'error'
                    ? 'red'
                    : 'gray',
                children: (
                  <div>
                    <Text strong style={{ fontSize: 14 }}>{step.title}</Text>
                    {step.time && (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <ClockCircleOutlined /> {step.time}
                        </Text>
                      </div>
                    )}
                  </div>
                ),
              }))}
              />
            </Card>

            {currentApp.status === 'completed' && (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message="服务已完成"
                description={`您申请的「${currentApp.service_name}已完成办理完成，感谢您的使用！`}
                style={{ borderRadius: 8 }}
              />
            )}
            {currentApp.status === 'pending' && (
              <Alert
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
                message="正在处理中"
                description="工作人员将尽快处理您的申请，请保持电话畅通。"
                style={{ borderRadius: 8 }}
              />
            )}
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default Services

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Divider,
  List,
  Tabs,
  Form,
  InputNumber,
  Select,
  Steps,
} from 'antd'
import {
  ArrowLeftOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalculatorOutlined,
  FileTextOutlined,
} from '@ant-design/icons'

const mockProductDetail = {
  id: '1',
  name: '百万医疗险',
  company: '平安保险',
  type: 'medical',
  price: 299,
  period: '每年',
  coverage: '400万',
  deductible: '1万',
  tags: ['住院医疗', '门诊手术', '重疾绿通'],
  features: ['一般医疗200万', '重疾医疗200万', '住院垫付', '质子重离子'],
  rating: 4.9,
  sales: 125680,
  image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
  description: '平安健康百万医疗险，提供全面的医疗保障，一年仅需299元，最高可报销400万医疗费用。',
  coverageDetails: [
    {
      category: '一般医疗',
      items: [
        { name: '住院医疗费用', amount: '100万', description: '住院期间发生的合理且必要的医疗费用' },
        { name: '指定门诊医疗费用', amount: '100万', description: '门诊手术、特殊门诊、住院前后门急诊' },
      ],
    },
    {
      category: '重疾医疗',
      items: [
        { name: '重疾住院医疗费用', amount: '200万', description: '100种重疾住院医疗费用' },
        { name: '质子重离子医疗', amount: '100万', description: '上海质子重离子医院治疗费用' },
      ],
    },
    {
      category: '增值服务',
      items: [
        { name: '重疾绿通服务', amount: '-', description: '专家门诊、住院安排、手术安排' },
        { name: '住院垫付服务', amount: '-', description: '住院医疗费用垫付' },
        { name: '在线问诊服务', amount: '-', description: '7x24小时在线医生咨询' },
      ],
    },
  ],
  underwritingNotes: [
    '本产品适用年龄：出生满28天至60周岁',
    '职业类别：1-4类职业可投保',
    '健康告知：请如实填写健康告知，如有隐瞒可能影响理赔',
    '等待期：30天，扁桃腺、甲状腺、疝气等疾病等待期120天',
    '续保条件：不会因被保险人的健康状况变化或历史理赔情况而拒绝续保',
  ],
  exclusionClauses: [
    '投保人对被保险人的故意杀害、故意伤害',
    '被保险人故意自伤、故意犯罪或者抗拒依法采取的刑事强制措施',
    '被保险人醉酒，主动吸食或者注射毒品',
    '被保险人酒后驾驶、无合法有效驾驶证驾驶，或者驾驶无合法有效行驶证的机动车',
    '被保险人感染艾滋病病毒或者患艾滋病期间因疾病导致的医疗费用',
    '遗传性疾病，先天性畸形、变形或者染色体异常',
    '既往症及其并发症（投保前已患有的疾病）',
    '美容手术、整形手术、矫正手术等非治疗性项目',
  ],
}

const { Option } = Select
const { Step } = Steps

const InsuranceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [premium, setPremium] = useState(mockProductDetail.price)

  const calculatePremium = (values: { age: number; gender: string; period: number }) => {
    let basePrice = mockProductDetail.price
    if (values.age < 30) {
      basePrice = 259
    } else if (values.age >= 30 && values.age < 40) {
      basePrice = 299
    } else if (values.age >= 40 && values.age < 50) {
      basePrice = 459
    } else if (values.age >= 50 && values.age <= 60) {
      basePrice = 699
    }
    if (values.gender === 'female') {
      basePrice = Math.round(basePrice * 0.95)
    }
    setPremium(basePrice * (values.period || 1))
  }

  const handleApply = () => {
    navigate(`/insurance/apply/${id}`)
  }

  const tabItems = [
    {
      key: 'coverage',
      label: '保障范围',
      children: (
        <div className="space-y-6">
          {mockProductDetail.coverageDetails.map((category, index) => (
            <Card key={index} title={category.category} size="small">
              <List
                dataSource={category.items}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <div className="flex items-center justify-between w-full">
                          <span>{item.name}</span>
                          <Tag color="blue">{item.amount}</Tag>
                        </div>
                      }
                      description={item.description}
                    />
                  </List.Item>
                )}
              />
            </Card>
          ))}
        </div>
      ),
    },
    {
      key: 'underwriting',
      label: '核保须知',
      children: (
        <Card size="small">
          <List
            dataSource={mockProductDetail.underwritingNotes}
            renderItem={(item) => (
              <List.Item>
                <div className="flex items-start gap-2">
                  <FileTextOutlined className="text-[#1677ff] mt-1 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              </List.Item>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'exclusion',
      label: '免责条款',
      children: (
        <Card size="small">
          <List
            dataSource={mockProductDetail.exclusionClauses}
            renderItem={(item, index) => (
              <List.Item>
                <div className="flex items-start gap-2">
                  <ExclamationCircleOutlined className="text-[#f5222d] mt-1 flex-shrink-0" />
                  <span className="text-gray-600">{index + 1}. {item}</span>
                </div>
              </List.Item>
            )}
          />
        </Card>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/insurance')}
      >
        返回列表
      </Button>

      <Card className="shadow-sm">
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <img
              src={mockProductDetail.image}
              alt={mockProductDetail.name}
              className="w-full h-72 object-cover rounded-lg"
            />
          </Col>
          <Col xs={24} md={12}>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag color="green">{mockProductDetail.company}</Tag>
                  {mockProductDetail.tags.map((tag, index) => (
                    <Tag key={index} color="blue">{tag}</Tag>
                  ))}
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {mockProductDetail.name}
                </h1>
                <div className="flex items-center gap-4 text-gray-500">
                  <span className="text-yellow-500">★ {mockProductDetail.rating}</span>
                  <span>已售 {mockProductDetail.sales}</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#f5222d]">¥{premium}</span>
                <span className="text-gray-500">/{mockProductDetail.period}</span>
              </div>

              <p className="text-gray-500">{mockProductDetail.description}</p>

              <div className="space-y-2">
                {mockProductDetail.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-gray-600">
                    <CheckCircleOutlined className="text-[#52c41a]" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Divider />

              <Card title="保费测算" size="small" className="bg-gray-50">
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={{ age: 30, gender: 'male', period: 1 }}
                  onValuesChange={calculatePremium}
                >
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="age" label="年龄" rules={[{ required: true }]}>
                        <InputNumber min={1} max={60} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
                        <Select>
                          <Option value="male">男</Option>
                          <Option value="female">女</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="period" label="保障期限" rules={[{ required: true }]}>
                        <Select>
                          <Option value={1}>1年</Option>
                          <Option value={2}>2年（95折）</Option>
                          <Option value={3}>3年（9折）</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>

              <div className="pt-2">
                <Button
                  type="primary"
                  size="large"
                  icon={<SafetyOutlined />}
                  onClick={handleApply}
                  className="w-full md:w-auto px-8 h-12 text-base"
                >
                  立即投保
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Card className="shadow-sm" bodyStyle={{ padding: 0 }}>
        <Tabs defaultActiveKey="coverage" items={tabItems} className="px-6 pt-2" />
      </Card>

      <Card title="投保流程" className="shadow-sm">
        <Steps current={-1} className="max-w-3xl mx-auto">
          <Step title="填写信息" description="填写投保人及被保险人信息" icon={<FileTextOutlined />} />
          <Step title="健康告知" description="如实填写健康告知问卷" icon={<ExclamationCircleOutlined />} />
          <Step title="支付保费" description="在线支付保险费用" icon={<CalculatorOutlined />} />
          <Step title="获取保单" description="电子保单发送至邮箱" icon={<CheckCircleOutlined />} />
        </Steps>
      </Card>
    </div>
  )
}

export default InsuranceDetail

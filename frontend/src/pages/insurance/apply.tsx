may-89082/
├── .env                          # 根目录环境变量（端口、URL、数据库）
├── scripts/                      # 自动化脚本
│   ├── port-manager.sh          # 端口管理（含6个备用槽位）
│   ├── start.sh                 # 后台启动脚本
│   ├── stop.sh                  # 停止脚本
│   ├── restart.sh               # 重启脚本
│   └── verify.sh                # 验收脚本（四要素检查）
├── backend/                      # 后端 API
│   ├── src/
│   │   ├── routes/              # 32+ API 接口
│   │   ├── middleware/          # 认证、审计、错误处理
│   │   ├── services/            # 业务逻辑层
│   │   ├── types/enums.ts       # 14个 TypeScript 枚举
│   │   └── server.ts            # 入口文件
│   ├── prisma/
│   │   ├── schema.prisma        # 13 个数据模型
│   │   └── seed.ts              # 完整种子数据
│   └── data/app.sqlite          # SQLite 数据库
└── frontend/                     # Web 前端
    └── src/
        ├── pages/               # 15+ 页面组件
        ├── components/          # 布局、表单、图表组件
        ├── router/              # 路由配置（含守卫）
        ├── store/               # Zustand 状态管理
        └── utils/               # 请求封装、常量may-89082/
├── .env                          # 根目录环境变量（端口、URL、数据库）
├── scripts/                      # 自动化脚本
│   ├── port-manager.sh          # 端口管理（含6个备用槽位）
│   ├── start.sh                 # 后台启动脚本
│   ├── stop.sh                  # 停止脚本
│   ├── restart.sh               # 重启脚本
│   └── verify.sh                # 验收脚本（四要素检查）
├── backend/                      # 后端 API
│   ├── src/
│   │   ├── routes/              # 32+ API 接口
│   │   ├── middleware/          # 认证、审计、错误处理
│   │   ├── services/            # 业务逻辑层
│   │   ├── types/enums.ts       # 14个 TypeScript 枚举
│   │   └── server.ts            # 入口文件
│   ├── prisma/
│   │   ├── schema.prisma        # 13 个数据模型
│   │   └── seed.ts              # 完整种子数据
│   └── data/app.sqlite          # SQLite 数据库
└── frontend/                     # Web 前端
    └── src/
        ├── pages/               # 15+ 页面组件
        ├── components/          # 布局、表单、图表组件
        ├── router/              # 路由配置（含守卫）
        ├── store/               # Zustand 状态管理
        └── utils/               # 请求封装、常量may-89082/
├── .env                          # 根目录环境变量（端口、URL、数据库）
├── scripts/                      # 自动化脚本
│   ├── port-manager.sh          # 端口管理（含6个备用槽位）
│   ├── start.sh                 # 后台启动脚本
│   ├── stop.sh                  # 停止脚本
│   ├── restart.sh               # 重启脚本
│   └── verify.sh                # 验收脚本（四要素检查）
├── backend/                      # 后端 API
│   ├── src/
│   │   ├── routes/              # 32+ API 接口
│   │   ├── middleware/          # 认证、审计、错误处理
│   │   ├── services/            # 业务逻辑层
│   │   ├── types/enums.ts       # 14个 TypeScript 枚举
│   │   └── server.ts            # 入口文件
│   ├── prisma/
│   │   ├── schema.prisma        # 13 个数据模型
│   │   └── seed.ts              # 完整种子数据
│   └── data/app.sqlite          # SQLite 数据库
└── frontend/                     # Web 前端
    └── src/
        ├── pages/               # 15+ 页面组件
        ├── components/          # 布局、表单、图表组件
        ├── router/              # 路由配置（含守卫）
        ├── store/               # Zustand 状态管理
        └── utils/               # 请求封装、常量may-89082/
├── .env                          # 根目录环境变量（端口、URL、数据库）
├── scripts/                      # 自动化脚本
│   ├── port-manager.sh          # 端口管理（含6个备用槽位）
│   ├── start.sh                 # 后台启动脚本
│   ├── stop.sh                  # 停止脚本
│   ├── restart.sh               # 重启脚本
│   └── verify.sh                # 验收脚本（四要素检查）
├── backend/                      # 后端 API
│   ├── src/
│   │   ├── routes/              # 32+ API 接口
│   │   ├── middleware/          # 认证、审计、错误处理
│   │   ├── services/            # 业务逻辑层
│   │   ├── types/enums.ts       # 14个 TypeScript 枚举
│   │   └── server.ts            # 入口文件
│   ├── prisma/
│   │   ├── schema.prisma        # 13 个数据模型
│   │   └── seed.ts              # 完整种子数据
│   └── data/app.sqlite          # SQLite 数据库
└── frontend/                     # Web 前端
    └── src/
        ├── pages/               # 15+ 页面组件
        ├── components/          # 布局、表单、图表组件
        ├── router/              # 路由配置（含守卫）
        ├── store/               # Zustand 状态管理
        └── utils/               # 请求封装、常量首页 → 体检预约 → 套餐筛选 → 套餐详情 → 预约提交 → 订单支付 → 体检完成
                                          ↓
首页 → 保险商城 → 产品对比 → 产品详情 → 智能核保 → 投保提交 → 保单生效
                                          ↓
首页 → 健康档案 → 报告上传 → OCR解析 → 指标趋势 → 风险评估 → 干预建议
                                          ↓
后台 → 保司准入 → 佣金结算 → 审计日志 → 隐私隔离 → 用户管理 → 订单管理首页 → 体检预约 → 套餐筛选 → 套餐详情 → 预约提交 → 订单支付 → 体检完成
                                          ↓
首页 → 保险商城 → 产品对比 → 产品详情 → 智能核保 → 投保提交 → 保单生效
                                          ↓
首页 → 健康档案 → 报告上传 → OCR解析 → 指标趋势 → 风险评估 → 干预建议
                                          ↓
后台 → 保司准入 → 佣金结算 → 审计日志 → 隐私隔离 → 用户管理 → 订单管理首页 → 体检预约 → 套餐筛选 → 套餐详情 → 预约提交 → 订单支付 → 体检完成
                                          ↓
首页 → 保险商城 → 产品对比 → 产品详情 → 智能核保 → 投保提交 → 保单生效
                                          ↓
首页 → 健康档案 → 报告上传 → OCR解析 → 指标趋势 → 风险评估 → 干预建议
                                          ↓
后台 → 保司准入 → 佣金结算 → 审计日志 → 隐私隔离 → 用户管理 → 订单管理首页 → 体检预约 → 套餐筛选 → 套餐详情 → 预约提交 → 订单支付 → 体检完成
                                          ↓
首页 → 保险商城 → 产品对比 → 产品详情 → 智能核保 → 投保提交 → 保单生效
                                          ↓
首页 → 健康档案 → 报告上传 → OCR解析 → 指标趋势 → 风险评估 → 干预建议
                                          ↓
后台 → 保司准入 → 佣金结算 → 审计日志 → 隐私隔离 → 用户管理 → 订单管理import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  Input,
  Select,
  message,
  Steps,
  Radio,
  Checkbox,
  Divider,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'

const { Step } = Steps
const { Option } = Select
const { TextArea } = Input

const mockProduct = {
  id: '1',
  name: '百万医疗险',
  company: '平安保险',
  price: 299,
  period: '每年',
}

const InsuranceApply = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleNext = async () => {
    try {
      await form.validateFields()
      if (currentStep < 2) {
        setCurrentStep(currentStep + 1)
      }
    } catch {
      // 表单验证失败
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    try {
      await form.validateFields()
    } catch {
      return
    }
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      message.success('投保成功！保单已发送至您的邮箱')
      setTimeout(() => navigate('/orders'), 1500)
    } catch (error) {
      message.error('投保失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/insurance/${id}`)}
      >
        返回详情
      </Button>

      <Card className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">在线投保</h2>

        <Steps current={currentStep} className="mb-8">
          <Step title="填写信息" description="投保人和被保险人信息" />
          <Step title="健康告知" description="如实填写健康情况" />
          <Step title="确认投保" description="确认保单信息" />
        </Steps>

        <Form form={form} layout="vertical" initialValues={{ period: 1, beneficiaryType: 'legal' }}>
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-[#1677ff]">{mockProduct.name}</h3>
                <p className="text-gray-500">{mockProduct.company}</p>
                <p className="text-2xl font-bold text-[#f5222d] mt-2">¥{mockProduct.price}/{mockProduct.period}</p>
              </div>

              <Card title="投保人信息" size="small">
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="applicantName"
                      label="姓名"
                      rules={[{ required: true, message: '请输入姓名' }]}
                    >
                      <Input placeholder="请输入姓名" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="applicantPhone"
                      label="手机号"
                      rules={[
                        { required: true, message: '请输入手机号' },
                        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                      ]}
                    >
                      <Input placeholder="请输入手机号" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="applicantIdCard"
                      label="身份证号"
                      rules={[
                        { required: true, message: '请输入身份证号' },
                        { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入有效的身份证号' },
                      ]}
                    >
                      <Input placeholder="请输入身份证号" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="applicantGender"
                      label="性别"
                      rules={[{ required: true, message: '请选择性别' }]}
                    >
                      <Radio.Group>
                        <Radio value="male">男</Radio>
                        <Radio value="female">女</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="applicantBirthday"
                      label="出生日期"
                      rules={[{ required: true, message: '请选择出生日期' }]}
                    >
                      <Input placeholder="YYYY-MM-DD" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="applicantEmail"
                      label="邮箱"
                      rules={[
                        { required: true, message: '请输入邮箱' },
                        { type: 'email', message: '请输入有效的邮箱' },
                      ]}
                    >
                      <Input placeholder="保单将发送至此邮箱" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="被保险人信息" size="small">
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="sameAsApplicant"
                      valuePropName="checked"
                    >
                      <Checkbox>被保险人与投保人相同</Checkbox>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="insuredName"
                      label="姓名"
                      rules={[{ required: true, message: '请输入姓名' }]}
                    >
                      <Input placeholder="请输入姓名" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="insuredIdCard"
                      label="身份证号"
                      rules={[
                        { required: true, message: '请输入身份证号' },
                        { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入有效的身份证号' },
                      ]}
                    >
                      <Input placeholder="请输入身份证号" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="insuredRelation"
                      label="与投保人关系"
                      rules={[{ required: true, message: '请选择关系' }]}
                    >
                      <Select placeholder="请选择">
                        <Option value="self">本人</Option>
                        <Option value="spouse">配偶</Option>
                        <Option value="child">子女</Option>
                        <Option value="parent">父母</Option>
                        <Option value="other">其他</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title="受益人信息" size="small">
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="beneficiaryType"
                      label="受益人类型"
                      rules={[{ required: true, message: '请选择' }]}
                    >
                      <Radio.Group>
                        <Radio value="legal">法定受益人</Radio>
                        <Radio value="指定">指定受益人</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="period"
                      label="保障期限"
                      rules={[{ required: true, message: '请选择' }]}
                    >
                      <Select>
                        <Option value={1}>1年</Option>
                        <Option value={2}>2年（95折）</Option>
                        <Option value={3}>3年（9折）</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-[#fa8c16] mb-2">健康告知</h4>
                <p className="text-gray-600 text-sm mb-4">
                  请您仔细阅读并如实告知以下健康情况，如有隐瞒可能影响您的理赔权益。
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'q1', question: '过去2年内，您是否曾因病住院治疗或手术？' },
                  { key: 'q2', question: '您是否曾患有或正患有高血压、糖尿病、心脏病、脑血管疾病？' },
                  { key: 'q3', question: '您是否曾患有或正患有肿瘤、癌症、白血病、淋巴瘤？' },
                  { key: 'q4', question: '您是否曾患有或正患有肝炎、肝硬化、肾炎、肾病综合症？' },
                  { key: 'q5', question: '过去1年内，您的健康检查是否有异常？' },
                ].map((item) => (
                  <Form.Item
                    key={item.key}
                    name={item.key}
                    label={item.question}
                    rules={[{ required: true, message: '请选择' }]}
                  >
                    <Radio.Group>
                      <Radio value={false}>否</Radio>
                      <Radio value={true}>是</Radio>
                    </Radio.Group>
                  </Form.Item>
                ))}
              </div>

              <Form.Item
                name="healthRemark"
                label="如有其他需要说明的健康情况"
              >
                <TextArea rows={3} placeholder="请详细描述" />
              </Form.Item>

              <Form.Item
                name="agreeHealth"
                valuePropName="checked"
                rules={[
                  { validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('请确认健康告知')) },
                ]}
              >
                <Checkbox>
                  我确认以上信息真实有效，同意保险公司根据此信息进行核保
                </Checkbox>
              </Form.Item>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                <h4 className="font-bold text-lg">投保信息确认</h4>
                <Divider />
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">产品名称</span>
                    <span className="font-semibold">{mockProduct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">保险公司</span>
                    <span>{mockProduct.company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">投保人</span>
                    <span>{form.getFieldValue('applicantName')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">被保险人</span>
                    <span>{form.getFieldValue('insuredName')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">保障期限</span>
                    <span>{form.getFieldValue('period')}年</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">受益人</span>
                    <span>{form.getFieldValue('beneficiaryType') === 'legal' ? '法定' : '指定'}</span>
                  </div>
                </div>
                <Divider />
                <div className="flex justify-between text-xl font-bold">
                  <span>应缴保费</span>
                  <span className="text-[#f5222d]">¥{mockProduct.price * (form.getFieldValue('period') || 1)}</span>
                </div>
              </div>

              <Form.Item
                name="agreeTerms"
                valuePropName="checked"
                rules={[
                  { validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error('请阅读并同意条款')) },
                ]}
              >
                <Checkbox>
                  我已阅读并同意《保险条款》、《投保须知》、《隐私政策》
                </Checkbox>
              </Form.Item>
            </div>
          )}
        </Form>

        <div className="flex justify-between mt-8">
          <Button
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            上一步
          </Button>
          {currentStep < 2 ? (
            <Button type="primary" onClick={handleNext}>
              下一步
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handleSubmit}
              loading={loading}
            >
              确认投保并支付
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

export default InsuranceApply

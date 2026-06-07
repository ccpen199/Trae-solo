import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Steps,
  Form,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Button,
  message,
  Spin,
  Descriptions,
  Tag,
  Alert,
} from 'antd'
import {
  CarOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { createPermit } from '@/api/modules/permit'

const { Step } = Steps
const { Option } = Select
const { RangePicker } = DatePicker
const { TextArea } = Input

const vehicleTypes = [
  { value: 'small', label: '小型汽车' },
  { value: 'large', label: '大型汽车' },
  { value: 'truck', label: '货车' },
  { value: 'motorcycle', label: '摩托车' },
]

const routeOptions = [
  { value: 'g6', label: '京藏高速(G6)' },
  { value: 'g45', label: '大广高速(G45)' },
  { value: 'g1', label: '京哈高速(G1)' },
  { value: 'g2', label: '京沪高速(G2)' },
  { value: 'g4', label: '京港澳高速(G4)' },
  { value: 's15', label: '京津高速(S15)' },
]

interface FormData {
  plateNumber: string
  vehicleType: string
  ownerName: string
  idCardNo: string
  dateRange: [Dayjs, Dayjs]
  routes: string[]
}

export default function Apply() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<FormData>()
  const [formData, setFormData] = useState<FormData | null>(null)

  const steps = [
    {
      title: '车辆信息',
      icon: <CarOutlined />,
    },
    {
      title: '进京时段',
      icon: <CalendarOutlined />,
    },
    {
      title: '路线选择',
      icon: <EnvironmentOutlined />,
    },
    {
      title: '确认提交',
      icon: <CheckCircleOutlined />,
    },
  ]

  const next = async () => {
    try {
      if (current < 2) {
        const values = await form.validateFields()
        setFormData({ ...formData, ...values } as FormData)
      }
      setCurrent(current + 1)
    } catch {
      message.warning('请完善必填信息')
    }
  }

  const prev = () => {
    setCurrent(current - 1)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const allData = { ...formData, ...values } as FormData

      setLoading(true)
      await createPermit({
        plateNumber: allData.plateNumber.toUpperCase(),
        vehicleType: allData.vehicleType,
        startDate: allData.dateRange[0].format('YYYY-MM-DD'),
        endDate: allData.dateRange[1].format('YYYY-MM-DD'),
        route: allData.routes.join(','),
      })

      message.success('申请提交成功，等待审核')
      setTimeout(() => {
        navigate('/permit')
      }, 1500)
    } catch (error: any) {
      message.error(error.message || '提交失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const disabledDate = (current: Dayjs) => {
    const today = dayjs().startOf('day')
    const maxDate = dayjs().add(12, 'day').endOf('day')
    return current && (current < today || current > maxDate)
  }

  const getRouteLabels = (routes: string[]) => {
    return routes
      .map((r) => routeOptions.find((o) => o.value === r)?.label)
      .filter(Boolean)
      .join('、')
  }

  const renderStepContent = () => {
    switch (current) {
      case 0:
        return (
          <div className="max-w-lg mx-auto py-8">
            <Alert
              message="请如实填写车辆信息，信息将与交管部门数据库进行核验"
              type="info"
              showIcon
              className="mb-6"
            />
            <Form
              form={form}
              layout="vertical"
              initialValues={formData}
            >
              <Form.Item
                name="plateNumber"
                label="车牌号"
                rules={[
                  { required: true, message: '请输入车牌号' },
                  {
                    pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4,5}[A-Z0-9挂学警港澳]?$/,
                    message: '请输入正确的车牌号格式',
                  },
                ]}
              >
                <Input
                  placeholder="请输入车牌号，如：京A12345"
                  size="large"
                  maxLength={10}
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
              <Form.Item
                name="vehicleType"
                label="车辆类型"
                rules={[{ required: true, message: '请选择车辆类型' }]}
              >
                <Select placeholder="请选择车辆类型" size="large">
                  {vehicleTypes.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="ownerName"
                label="车主姓名"
                rules={[
                  { required: true, message: '请输入车主姓名' },
                  { min: 2, message: '姓名至少2个字符' },
                ]}
              >
                <Input placeholder="请输入车主姓名" size="large" />
              </Form.Item>
              <Form.Item
                name="idCardNo"
                label="身份证号"
                rules={[
                  { required: true, message: '请输入身份证号' },
                  {
                    pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
                    message: '请输入正确的身份证号',
                  },
                ]}
              >
                <Input placeholder="请输入18位身份证号" size="large" maxLength={18} />
              </Form.Item>
            </Form>
          </div>
        )
      case 1:
        return (
          <div className="max-w-lg mx-auto py-8">
            <Alert
              message="进京证有效期最长为7天，请选择合适的进京时段"
              type="info"
              showIcon
              className="mb-6"
            />
            <Form
              form={form}
              layout="vertical"
              initialValues={formData}
            >
              <Form.Item
                name="dateRange"
                label="进京日期范围"
                rules={[{ required: true, message: '请选择进京日期范围' }]}
              >
                <RangePicker
                  size="large"
                  style={{ width: '100%' }}
                  disabledDate={disabledDate}
                  placeholder={['开始日期', '结束日期']}
                />
              </Form.Item>
              <div className="text-sm text-gray-500 mt-2">
                <p>• 最早可选择今日开始</p>
                <p>• 最长可预约12天内的日期</p>
                <p>• 单次申请有效期最长7天</p>
              </div>
            </Form>
          </div>
        )
      case 2:
        return (
          <div className="max-w-lg mx-auto py-8">
            <Alert
              message="请选择您计划进入北京的主要路线，可多选"
              type="info"
              showIcon
              className="mb-6"
            />
            <Form
              form={form}
              layout="vertical"
              initialValues={formData}
            >
              <Form.Item
                name="routes"
                label="进京路线"
                rules={[{ required: true, message: '请至少选择一条路线' }]}
              >
                <Checkbox.Group style={{ width: '100%' }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {routeOptions.map((route) => (
                      <div key={route.value} className="p-4 border rounded-lg hover:border-[#0052D9] transition-colors">
                        <Checkbox value={route.value} className="w-full">
                          <span className="text-base">{route.label}</span>
                        </Checkbox>
                      </div>
                    ))}
                  </div>
                </Checkbox.Group>
              </Form.Item>
            </Form>
          </div>
        )
      case 3:
        const allData = { ...formData, ...form.getFieldsValue() } as FormData
        return (
          <div className="max-w-2xl mx-auto py-8">
            <Alert
              message="请确认以下信息无误后提交申请"
              type="warning"
              showIcon
              className="mb-6"
            />
            <Card title="申请信息确认" className="mb-6">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="车牌号">
                  <Tag color="blue" className="text-base">{allData.plateNumber?.toUpperCase()}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="车辆类型">
                  {vehicleTypes.find((t) => t.value === allData.vehicleType)?.label || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="车主姓名">
                  {allData.ownerName}
                </Descriptions.Item>
                <Descriptions.Item label="身份证号">
                  {allData.idCardNo?.replace(/(.{6}).*(.{4})/, '$1********$2')}
                </Descriptions.Item>
                <Descriptions.Item label="进京日期">
                  {allData.dateRange?.[0]?.format('YYYY-MM-DD')} 至 {allData.dateRange?.[1]?.format('YYYY-MM-DD')}
                </Descriptions.Item>
                <Descriptions.Item label="进京路线">
                  {getRouteLabels(allData.routes || [])}
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <div className="text-center text-gray-500 text-sm">
              <p>提交后，您的申请将在1-3个工作日内完成审核</p>
              <p>审核结果将通过短信和站内信通知您</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div>
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/permit')}
          >
            返回列表
          </Button>
          <h1 className="text-xl font-bold text-gray-800">进京证申请</h1>
        </div>

        <Steps
          current={current}
          items={steps}
          className="mb-8"
          responsive
        />

        <Spin spinning={loading}>
          {renderStepContent()}

          <div className="flex justify-center gap-4 mt-8">
            {current > 0 && (
              <Button size="large" onClick={prev}>
                上一步
              </Button>
            )}
            {current < steps.length - 1 ? (
              <Button
                type="primary"
                size="large"
                onClick={next}
                style={{ backgroundColor: '#0052D9' }}
              >
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                loading={loading}
                style={{ backgroundColor: '#0052D9' }}
              >
                提交申请
              </Button>
            )}
          </div>
        </Spin>
      </Card>
    </div>
  )
}

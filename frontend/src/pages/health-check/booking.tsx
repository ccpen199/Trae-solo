import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Button,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Steps,
  Radio,
} from 'antd'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { Step } = Steps
const { Option } = Select
const { TextArea } = Input

const mockPackage = {
  id: '1',
  name: '全面体检套餐A',
  organization: '北京协和医院体检中心',
  price: 1299,
}

const timeSlots = [
  '07:30-08:00',
  '08:00-08:30',
  '08:30-09:00',
  '09:00-09:30',
  '09:30-10:00',
  '10:00-10:30',
]

const HealthCheckBooking = () => {
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
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      message.success('预约成功！请按时到体检中心进行体检')
      setTimeout(() => navigate('/orders'), 1500)
    } catch (error) {
      message.error('预约失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const disabledDate = (current: any) => {
    return current && current < dayjs().startOf('day')
  }

  return (
    <div className="space-y-6">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(`/health-check/${id}`)}
      >
        返回详情
      </Button>

      <Card className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-6">体检预约</h2>

        <Steps current={currentStep} className="mb-8">
          <Step title="选择时间" description="选择体检日期和时段" />
          <Step title="填写信息" description="填写预约人信息" />
          <Step title="确认预约" description="确认预约信息" />
        </Steps>

        <Form form={form} layout="vertical" initialValues={{ gender: 'male' }}>
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-[#1677ff]">{mockPackage.name}</h3>
                <p className="text-gray-500">{mockPackage.organization}</p>
                <p className="text-2xl font-bold text-[#f5222d] mt-2">¥{mockPackage.price}</p>
              </div>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="date"
                    label="体检日期"
                    rules={[{ required: true, message: '请选择体检日期' }]}
                  >
                    <DatePicker
                      style={{ width: '100%' }}
                      disabledDate={disabledDate}
                      placeholder="请选择体检日期"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="timeSlot"
                    label="体检时段"
                    rules={[{ required: true, message: '请选择体检时段' }]}
                  >
                    <Select placeholder="请选择体检时段">
                      {timeSlots.map((slot) => (
                        <Option key={slot} value={slot}>{slot}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="name"
                    label="姓名"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input placeholder="请输入姓名" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone"
                    label="手机号"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                    ]}
                  >
                    <Input placeholder="请输入手机号" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="gender"
                    label="性别"
                    rules={[{ required: true, message: '请选择性别' }]}
                  >
                    <Radio.Group>
                      <Radio value="male">男</Radio>
                      <Radio value="female">女</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="idCard"
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

              <Form.Item
                name="remark"
                label="备注"
              >
                <TextArea rows={3} placeholder="如有特殊需求请备注" />
              </Form.Item>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">体检套餐</span>
                  <span className="font-semibold">{mockPackage.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">体检机构</span>
                  <span>{mockPackage.organization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">体检日期</span>
                  <span>{form.getFieldValue('date')?.format('YYYY-MM-DD')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">体检时段</span>
                  <span>{form.getFieldValue('timeSlot')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">预约人</span>
                  <span>{form.getFieldValue('name')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">联系电话</span>
                  <span>{form.getFieldValue('phone')}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-gray-500">预约金额</span>
                  <span className="text-2xl font-bold text-[#f5222d]">¥{mockPackage.price}</span>
                </div>
              </div>

              <div className="text-center text-gray-500 text-sm">
                <p>预约成功后，请按时到体检中心，携带身份证原件</p>
                <p>体检前一天请注意休息，晚上10点后禁食禁水</p>
              </div>
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
              确认预约并支付
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

export default HealthCheckBooking

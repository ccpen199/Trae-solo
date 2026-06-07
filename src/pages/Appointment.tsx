import { useState, useEffect } from 'react'
import {
  Tabs,
  Card,
  Select,
  Calendar,
  Button,
  Form,
  Input,
  message,
  Spin,
  Tag,
  Modal,
  Rate,
  Row,
  Col,
  Badge,
  List,
  Space,
  Divider,
  Alert,
} from 'antd'
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  PhoneOutlined,
  StarOutlined,
  DeleteOutlined,
  BellOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  getServiceWindows,
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  rateAppointment,
} from '@/api/modules/appointment'
import type { Appointment, ServiceWindow } from '@/types'

const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

const districts = ['东城区', '西城区', '朝阳区', '海淀区', '丰台区', '石景山区']

const businessTypes = [
  { value: 'permit', label: '进京证办理' },
  { value: 'ebike', label: '电动车登记' },
  { value: 'driver_license', label: '驾驶证业务' },
  { value: 'vehicle_registration', label: '机动车登记' },
  { value: 'annual_inspection', label: '车辆年检' },
  { value: 'transfer', label: '过户业务' },
]

const generateTimeSlots = () => {
  const slots: { time: string; booked: number; total: number }[] = []
  for (let hour = 9; hour < 17; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
      slots.push({
        time,
        booked: Math.floor(Math.random() * 10),
        total: 10,
      })
    }
  }
  return slots
}

const statusMap: Record<string, { text: string; color: string }> = {
  booked: { text: '已预约', color: 'blue' },
  cancelled: { text: '已取消', color: 'red' },
  completed: { text: '已完成', color: 'green' },
}

export default function AppointmentPage() {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('book')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [district, setDistrict] = useState<string>()
  const [windows, setWindows] = useState<ServiceWindow[]>([])
  const [selectedWindow, setSelectedWindow] = useState<number>()
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [selectedSlot, setSelectedSlot] = useState<string>()
  const [timeSlots] = useState(generateTimeSlots())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [ratingModalVisible, setRatingModalVisible] = useState(false)
  const [ratingAppointment, setRatingAppointment] = useState<Appointment | null>(null)
  const [rating, setRating] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [callNumber, setCallNumber] = useState<string | null>(null)

  useEffect(() => {
    fetchWindows()
    fetchAppointments()
    startCallNumberSimulation()
  }, [district])

  const fetchWindows = async () => {
    try {
      const data = await getServiceWindows(district ? { district } : undefined)
      setWindows(data)
    } catch {
      message.error('获取服务窗口失败')
    }
  }

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const response = await getMyAppointments({ page: 1, pageSize: 20 })
      setAppointments(response.list)
    } catch {
      message.error('获取预约列表失败')
    } finally {
      setLoading(false)
    }
  }

  const startCallNumberSimulation = () => {
    const queue = ['A001', 'A002', 'A003', 'A004', 'A005']
    let index = 0
    const interval = setInterval(() => {
      if (index < queue.length) {
        setCallNumber(queue[index])
        index++
      } else {
        clearInterval(interval)
      }
    }, 5000)
  }

  const handleDateSelect = (date: Dayjs) => {
    if (date.isBefore(dayjs(), 'day')) {
      message.warning('不能选择过去的日期')
      return
    }
    setSelectedDate(date)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await createAppointment({
        windowId: selectedWindow!,
        appointmentDate: selectedDate.format('YYYY-MM-DD'),
        timeSlot: selectedSlot!,
        businessType: values.businessType,
      })
      message.success('预约成功')
      form.resetFields()
      setSelectedSlot(undefined)
      fetchAppointments()
      setActiveTab('my')
    } catch {
      message.error('预约失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: number) => {
    Modal.confirm({
      title: '确认取消预约',
      content: '取消后将无法恢复，确定要取消吗？',
      onOk: async () => {
        try {
          await cancelAppointment(id)
          message.success('预约已取消')
          fetchAppointments()
        } catch {
          message.error('取消失败')
        }
      },
    })
  }

  const handleRate = async () => {
    if (!ratingAppointment) return
    try {
      await rateAppointment(ratingAppointment.id, { rating, comment: ratingComment })
      message.success('评价成功')
      setRatingModalVisible(false)
      setRating(5)
      setRatingComment('')
      fetchAppointments()
    } catch {
      message.error('评价失败')
    }
  }

  const disabledDate = (current: Dayjs) => {
    return current && current < dayjs().startOf('day')
  }

  return (
    <div>
      {callNumber && (
        <Alert
          message={
            <div className="flex items-center gap-2">
              <BellOutlined className="animate-pulse" />
              <span>叫号提醒：当前叫号 </span>
              <span className="font-bold text-lg">{callNumber}</span>
              <span>，请前往对应窗口办理</span>
            </div>
          }
          type="info"
          showIcon={false}
          className="mb-4"
          closable
        />
      )}

      <Card
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-[#00B42A]" />
            <span>预约导办</span>
          </div>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="预约办理" key="book">
            <Form form={form} layout="vertical">
              <Row gutter={24}>
                <Col span={12}>
                  <Card title="选择办理地点" size="small" className="mb-4">
                    <Form.Item
                      name="district"
                      label="选择区县"
                      rules={[{ required: true, message: '请选择区县' }]}
                    >
                      <Select
                        placeholder="请选择区县"
                        value={district}
                        onChange={setDistrict}
                      >
                        {districts.map((d) => (
                          <Option key={d} value={d}>
                            {d}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="windowId"
                      label="选择服务窗口"
                      rules={[{ required: true, message: '请选择服务窗口' }]}
                    >
                      <Select
                        placeholder="请选择服务窗口"
                        value={selectedWindow}
                        onChange={setSelectedWindow}
                        disabled={!district}
                      >
                        {windows.map((window) => (
                          <Option key={window.id} value={window.id}>
                            {window.name} - {window.address}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Card>

                  <Card title="业务类型" size="small" className="mb-4">
                    <Form.Item
                      name="businessType"
                      label="选择业务类型"
                      rules={[{ required: true, message: '请选择业务类型' }]}
                    >
                      <Select placeholder="请选择业务类型" mode="multiple">
                        {businessTypes.map((type) => (
                          <Option key={type.value} value={type.value}>
                            {type.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Card>

                  <Card title="预约人信息" size="small">
                    <Form.Item
                      name="name"
                      label="姓名"
                      rules={[{ required: true, message: '请输入姓名' }]}
                    >
                      <Input prefix={<UserOutlined />} placeholder="请输入姓名" />
                    </Form.Item>
                    <Form.Item
                      name="phone"
                      label="手机号"
                      rules={[
                        { required: true, message: '请输入手机号' },
                        { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
                      ]}
                    >
                      <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
                    </Form.Item>
                  </Card>
                </Col>

                <Col span={12}>
                  <Card title="选择日期" size="small" className="mb-4">
                    <Calendar
                      fullscreen={false}
                      disabledDate={disabledDate}
                      onSelect={handleDateSelect}
                      value={selectedDate}
                    />
                  </Card>

                  <Card title="选择时段" size="small" className="mb-4">
                    <div className="grid grid-cols-3 gap-2">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          type={selectedSlot === slot.time ? 'primary' : 'default'}
                          disabled={slot.booked >= slot.total}
                          onClick={() => setSelectedSlot(slot.time)}
                          className="h-auto py-2"
                        >
                          <div>{slot.time}</div>
                          <div className="text-xs">
                            {slot.booked >= slot.total ? (
                              <span className="text-red-500">已满</span>
                            ) : (
                              <span className="text-gray-500">
                                剩余 {slot.total - slot.booked} 个
                              </span>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </Card>

                  <div className="bg-blue-50 p-4 rounded mb-4">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <EnvironmentOutlined />
                      <span className="font-medium">已选择</span>
                    </div>
                    <div className="text-sm text-blue-600 space-y-1">
                      <p>日期：{selectedDate.format('YYYY-MM-DD')}</p>
                      <p>时段：{selectedSlot || '未选择'}</p>
                    </div>
                  </div>

                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={!selectedSlot}
                  >
                    提交预约
                  </Button>
                </Col>
              </Row>
            </Form>
          </TabPane>

          <TabPane tab="我的预约" key="my">
            <Spin spinning={loading}>
              <List
                dataSource={appointments}
                renderItem={(item) => (
                  <List.Item key={item.id} className="border-b border-gray-100">
                    <List.Item.Meta
                      avatar={
                        <Badge status={item.status === 'booked' ? 'processing' : item.status === 'completed' ? 'success' : 'default'}>
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <CalendarOutlined className="text-blue-600" />
                          </div>
                        </Badge>
                      }
                      title={
                        <div className="flex items-center gap-2">
                          <span>
                            {businessTypes.find((t) => t.value === item.businessType)?.label ||
                              item.businessType}
                          </span>
                          <Tag color={statusMap[item.status]?.color}>
                            {statusMap[item.status]?.text}
                          </Tag>
                          {item.queueNumber && (
                            <Tag color="orange">
                              排队号：{item.queueNumber}
                            </Tag>
                          )}
                        </div>
                      }
                      description={
                        <div className="space-y-1 text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span>
                              <ClockCircleOutlined className="mr-1" />
                              {item.appointmentDate} {item.timeSlot}
                            </span>
                            <span>
                              <EnvironmentOutlined className="mr-1" />
                              {windows.find((w) => w.id === item.windowId)?.name || '窗口' + item.windowId}
                            </span>
                          </div>
                          {item.rating && (
                            <div className="flex items-center gap-1">
                              <StarOutlined className="text-yellow-500" />
                              <Rate disabled defaultValue={item.rating} />
                            </div>
                          )}
                        </div>
                      }
                    />
                    <Space>
                      {item.status === 'booked' && (
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleCancel(item.id)}
                        >
                          取消预约
                        </Button>
                      )}
                      {item.status === 'completed' && !item.rating && (
                        <Button
                          type="link"
                          icon={<StarOutlined />}
                          onClick={() => {
                            setRatingAppointment(item)
                            setRatingModalVisible(true)
                          }}
                        >
                          服务评价
                        </Button>
                      )}
                    </Space>
                  </List.Item>
                )}
                locale={{
                  emptyText: '暂无预约记录',
                }}
              />
            </Spin>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="服务评价"
        open={ratingModalVisible}
        onOk={handleRate}
        onCancel={() => setRatingModalVisible(false)}
      >
        <div className="text-center mb-4">
          <p className="mb-2">请为本次服务打分</p>
          <Rate value={rating} onChange={setRating} />
        </div>
        <Divider />
        <TextArea
          rows={4}
          placeholder="请输入您的评价（选填）"
          value={ratingComment}
          onChange={(e) => setRatingComment(e.target.value)}
        />
      </Modal>
    </div>
  )
}

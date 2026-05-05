import React, { useState } from 'react'
import { 
  Card, Form, Input, Select, DatePicker, Button, Table, Space, Tag, 
  message, Steps, Descriptions, Divider, Popconfirm 
} from 'antd'
import { SearchOutlined, RightOutlined, CheckCircleOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { trainApi, orderApi } from '../services/api'

const { Step } = Steps

const Booking = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [searchForm] = Form.useForm()
  const [bookingForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [trains, setTrains] = useState([])
  const [selectedTrain, setSelectedTrain] = useState(null)
  const [selectedSeatType, setSelectedSeatType] = useState(null)
  const [orderResult, setOrderResult] = useState(null)

  const stations = ['北京', '上海', '广州', '深圳', '武汉', '成都', '西安', '郑州', '南京', '杭州']

  const seatTypeOptions = [
    { value: '商务座', label: '商务座' },
    { value: '一等座', label: '一等座' },
    { value: '二等座', label: '二等座' },
    { value: '软卧', label: '软卧' },
    { value: '硬卧', label: '硬卧' },
    { value: '硬座', label: '硬座' },
  ]

  const handleSearchTrains = async (values) => {
    if (!values.fromStation || !values.toStation) {
      message.warning('请选择出发站和到达站')
      return
    }

    setLoading(true)
    try {
      const params = {
        fromStation: values.fromStation,
        toStation: values.toStation,
      }
      if (values.travelDate) {
        params.travelDate = values.travelDate.format('YYYY-MM-DD')
      }

      const result = await trainApi.search(params)
      
      if (result.success) {
        setTrains(result.data)
        message.success('查询到 ' + result.total + ' 个车次')
        setCurrentStep(1)
      } else {
        message.error('查询失败')
      }
    } catch (error) {
      message.error('查询失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTrain = (record, seatType) => {
    setSelectedTrain(record)
    setSelectedSeatType(seatType)
    setCurrentStep(2)
    message.info('已选择 ' + record.train_number + ' ' + seatType)
  }

  const handleSubmitBooking = async (values) => {
    if (!selectedTrain || !selectedSeatType) {
      message.warning('请先选择车次和席别')
      return
    }

    setLoading(true)
    try {
      const travelDate = searchForm.getFieldValue('travelDate')
      const result = await orderApi.book({
        trainId: selectedTrain.id,
        fromStation: selectedTrain.from_station,
        toStation: selectedTrain.to_station,
        travelDate: travelDate ? travelDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        seatType: selectedSeatType,
        passengerName: values.passengerName,
        passengerPhone: values.passengerPhone,
        passengerIdCard: values.passengerIdCard,
        saleChannel: 'online',
      })
      
      if (result.success) {
        setOrderResult(result.data)
        setCurrentStep(3)
        message.success('订票成功！订单号: ' + result.data.order_no)
      } else {
        message.error(result.message || '订票失败')
      }
    } catch (error) {
      message.error('订票失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setCurrentStep(0)
    setTrains([])
    setSelectedTrain(null)
    setSelectedSeatType(null)
    setOrderResult(null)
    searchForm.resetFields()
    bookingForm.resetFields()
  }

  const trainColumns = [
    {
      title: '车次',
      dataIndex: 'train_number',
      key: 'train_number',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <strong style={{ color: '#1890ff' }}>{text}</strong>
          <Tag style={{ margin: 0 }}>{record.train_type}</Tag>
        </Space>
      ),
    },
    {
      title: '出发',
      key: 'departure',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 16, fontWeight: 'bold' }}>
            {String(record.departure_time).substring(0, 5)}
          </div>
          <div style={{ color: '#999' }}>{record.from_station}</div>
        </div>
      ),
    },
    {
      title: '到达',
      key: 'arrival',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 16, fontWeight: 'bold' }}>
            {String(record.arrival_time).substring(0, 5)}
          </div>
          <div style={{ color: '#999' }}>{record.to_station}</div>
        </div>
      ),
    },
    {
      title: '历时',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (minutes) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours + '小时' + mins + '分'
      },
    },
    {
      title: '席别及余票',
      key: 'seats',
      render: (_, record) => {
        const seatTypes = record.seat_types || []
        if (seatTypes.length === 0) {
          return <Tag>暂无余票</Tag>
        }
        return (
          <Space direction="vertical" size={0}>
            {seatTypes.map((st, idx) => (
              <div key={idx} style={{ marginBottom: 4 }}>
                <Tag 
                  color={st.available_count > 0 ? 'green' : 'red'}
                  style={{ minWidth: 60 }}
                >
                  {st.seat_type}
                </Tag>
                <span style={{ marginLeft: 8, color: st.available_count > 0 ? '#52c41a' : '#ff4d4f' }}>
                  {st.available_count > 0 ? '余' + st.available_count + '张' : '无'}
                </span>
                {st.available_count > 0 && (
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => handleSelectTrain(record, st.seat_type)}
                  >
                    预订
                  </Button>
                )}
              </div>
            ))}
          </Space>
        )
      },
    },
  ]

  const steps = [
    { title: '查询车次', icon: <SearchOutlined /> },
    { title: '选择车次', icon: <RightOutlined /> },
    { title: '填写信息', icon: <EditOutlined /> },
    { title: '订票完成', icon: <CheckCircleOutlined /> },
  ]

  return (
    <div>
      <Card title="在线订票" style={{ marginBottom: 24 }}>
        <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />
      </Card>

      {currentStep === 0 && (
        <Card title="第一步: 查询车次">
          <Form form={searchForm} layout="inline" onFinish={handleSearchTrains}>
            <Form.Item name="fromStation" label="出发站" rules={[{ required: true }]}>
              <Select placeholder="选择出发站" style={{ width: 120 }}>
                {stations.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="toStation" label="到达站" rules={[{ required: true }]}>
              <Select placeholder="选择到达站" style={{ width: 120 }}>
                {stations.map(s => <Select.Option key={s} value={s}>{s}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="travelDate" label="出发日期">
              <DatePicker 
                placeholder="选择日期" 
                style={{ width: 150 }}
                defaultValue={dayjs()}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
                查询
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {currentStep === 1 && (
        <Card 
          title="第二步: 选择车次和席别" 
          extra={
            <Button onClick={() => setCurrentStep(0)} icon={<ReloadOutlined />}>
              重新查询
            </Button>
          }
        >
          <Table
            columns={trainColumns}
            dataSource={trains}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        </Card>
      )}

      {currentStep === 2 && selectedTrain && (
        <Card 
          title="第三步: 填写旅客信息"
          extra={
            <Button onClick={() => setCurrentStep(1)}>
              返回选择
            </Button>
          }
        >
          <Card type="inner" title="已选择车次" style={{ marginBottom: 24 }}>
            <Descriptions column={4}>
              <Descriptions.Item label="车次">
                <Tag color="blue">{selectedTrain.train_number}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="席别">
                <Tag color="purple">{selectedSeatType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="出发">
                {selectedTrain.from_station} {String(selectedTrain.departure_time).substring(0, 5)}
              </Descriptions.Item>
              <Descriptions.Item label="到达">
                {selectedTrain.to_station} {String(selectedTrain.arrival_time).substring(0, 5)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Form
            form={bookingForm}
            layout="vertical"
            onFinish={handleSubmitBooking}
            style={{ maxWidth: 500 }}
          >
            <Form.Item 
              name="passengerName" 
              label="旅客姓名" 
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入旅客姓名" maxLength={20} />
            </Form.Item>
            <Form.Item 
              name="passengerIdCard" 
              label="身份证号" 
              rules={[
                { required: true, message: '请输入身份证号' },
                { pattern: /^\d{17}[\dXx]$/, message: '请输入正确的身份证号' }
              ]}
            >
              <Input placeholder="请输入身份证号" maxLength={18} />
            </Form.Item>
            <Form.Item 
              name="passengerPhone" 
              label="手机号码" 
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
              ]}
            >
              <Input placeholder="请输入手机号码" maxLength={11} />
            </Form.Item>
            <Divider />
            <Form.Item>
              <Button 
                type="primary" 
                size="large" 
                htmlType="submit" 
                loading={loading}
                style={{ width: '100%' }}
              >
                确认订票
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {currentStep === 3 && orderResult && (
        <Card title="第四步: 订票完成" extra={<Button type="primary" onClick={handleReset}>继续订票</Button>}>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
            <h2 style={{ marginTop: 20 }}>订票成功！</h2>
          </div>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="订单号">
              <Tag color="blue" style={{ fontSize: 14 }}>{orderResult.order_no}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="订单状态">
              <Tag color="green">已支付</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="车次">
              {orderResult.train_number}
            </Descriptions.Item>
            <Descriptions.Item label="席别">
              {orderResult.seat_type}
            </Descriptions.Item>
            <Descriptions.Item label="座位信息">
              {orderResult.carriage_number} {orderResult.seat_number}
            </Descriptions.Item>
            <Descriptions.Item label="票价">
              <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                ¥{orderResult.price}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="出发">
              {orderResult.from_station} {String(orderResult.departure_time).substring(0, 5)}
            </Descriptions.Item>
            <Descriptions.Item label="到达">
              {orderResult.to_station} {String(orderResult.arrival_time).substring(0, 5)}
            </Descriptions.Item>
            <Descriptions.Item label="旅客">
              {orderResult.passenger_name}
            </Descriptions.Item>
            <Descriptions.Item label="订单时间">
              {String(orderResult.created_at)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  )
}

export default Booking

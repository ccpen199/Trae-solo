import React, { useState } from 'react'
import { 
  Card, Form, Input, Select, DatePicker, Button, Table, Space, Tag, 
  message, Descriptions, Divider, Modal, Radio, Collapse, Popconfirm 
} from 'antd'
import { SearchOutlined, CheckOutlined, TicketOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { trainApi, ticketApi, orderApi } from '../services/api'

const { Panel } = Collapse

const TicketSell = () => {
  const [searchForm] = Form.useForm()
  const [bookingForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [trains, setTrains] = useState([])
  const [seats, setSeats] = useState([])
  const [selectedTrain, setSelectedTrain] = useState(null)
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [selectedSeatType, setSelectedSeatType] = useState(null)
  const [orderResult, setOrderResult] = useState(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [searchMode, setSearchMode] = useState('route')

  const stations = ['北京', '上海', '广州', '深圳', '武汉', '成都', '西安', '郑州', '南京', '杭州']

  const handleSearchByRoute = async (values) => {
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
      } else {
        message.error('查询失败')
      }
    } catch (error) {
      message.error('查询失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchByTrain = async (values) => {
    if (!values.trainNumber) {
      message.warning('请输入车次号')
      return
    }

    setLoading(true)
    try {
      const result = await trainApi.list({ trainNumber: values.trainNumber })
      
      if (result.success && result.data.length > 0) {
        setTrains(result.data)
        message.success('查询到 ' + result.total + ' 个车次')
      } else {
        message.warning('未找到该车次')
      }
    } catch (error) {
      message.error('查询失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSeats = async (train, seatType) => {
    setSelectedTrain(train)
    setSelectedSeatType(seatType)
    setSelectedSeat(null)
    setLoading(true)
    
    try {
      const travelDate = searchForm.getFieldValue('travelDate')
      const params = {
        trainId: train.id,
        fromStation: train.from_station,
        toStation: train.to_station,
        travelDate: travelDate ? travelDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        seatType: seatType,
      }

      const result = await ticketApi.getAvailableSeats(params)
      
      if (result.success) {
        setSeats(result.data)
        message.success('查询到 ' + result.data.length + ' 个可用座位')
      } else {
        message.error('查询座位失败')
      }
    } catch (error) {
      message.error('查询座位失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSeat = (seat) => {
    setSelectedSeat(seat)
  }

  const handleSubmitSale = async (values) => {
    if (!selectedTrain || !selectedSeat) {
      message.warning('请先选择车次和座位')
      return
    }

    setLoading(true)
    try {
      const travelDate = searchForm.getFieldValue('travelDate')
      const result = await orderApi.sell({
        trainId: selectedTrain.id,
        ticketId: selectedSeat.id,
        fromStation: selectedSeat.from_station,
        toStation: selectedSeat.to_station,
        travelDate: travelDate ? travelDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        seatType: selectedSeat.seat_type,
        carriageNumber: selectedSeat.carriage_number,
        seatNumber: selectedSeat.seat_number,
        passengerName: values.passengerName,
        passengerPhone: values.passengerPhone,
        passengerIdCard: values.passengerIdCard,
        saleChannel: 'counter',
        operatorId: 'SALES001',
      })
      
      if (result.success) {
        setOrderResult(result.data)
        setShowSuccessModal(true)
        message.success('售票成功！订单号: ' + result.data.order_no)
        setSeats([])
        setSelectedSeat(null)
        bookingForm.resetFields()
      } else {
        message.error(result.message || '售票失败')
      }
    } catch (error) {
      message.error('售票失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setTrains([])
    setSeats([])
    setSelectedTrain(null)
    setSelectedSeat(null)
    setSelectedSeatType(null)
    setOrderResult(null)
    setShowSuccessModal(false)
    searchForm.resetFields()
    bookingForm.resetFields()
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours + '小时' + mins + '分'
  }

  const trainColumns = [
    {
      title: '车次',
      dataIndex: 'train_number',
      key: 'train_number',
      width: 100,
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
      width: 100,
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
      width: 100,
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
      width: 80,
      render: formatDuration,
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
          <Space wrap>
            {seatTypes.map((st, idx) => (
              <div key={idx} style={{ display: 'inline-block', marginRight: 8 }}>
                <Tag 
                  color={st.available_count > 0 ? 'green' : 'red'}
                >
                  {st.seat_type}
                </Tag>
                <span style={{ marginLeft: 4, color: st.available_count > 0 ? '#52c41a' : '#ff4d4f' }}>
                  {st.available_count > 0 ? '余' + st.available_count + '张' : '无'}
                </span>
                {st.available_count > 0 && (
                  <Button 
                    type="link" 
                    size="small"
                    onClick={() => handleSearchSeats(record, st.seat_type)}
                  >
                    选座
                  </Button>
                )}
              </div>
            ))}
          </Space>
        )
      },
    },
  ]

  const seatColumns = [
    {
      title: '车厢',
      dataIndex: 'carriage_number',
      key: 'carriage_number',
      width: 80,
      align: 'center',
    },
    {
      title: '座位号',
      dataIndex: 'seat_number',
      key: 'seat_number',
      width: 100,
      align: 'center',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '席别',
      dataIndex: 'seat_type',
      key: 'seat_type',
      width: 80,
      render: (text) => <Tag>{text}</Tag>,
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      render: () => <Tag color="green">可用</Tag>,
    },
    {
      title: '票价',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => (
        <span style={{ color: '#ff4d4f', fontSize: 16, fontWeight: 'bold' }}>
          ¥{price}
        </span>
      ),
    },
    {
      title: '选择',
      key: 'select',
      width: 80,
      render: (_, record) => (
        <Radio
          checked={selectedSeat && selectedSeat.id === record.id}
          onChange={() => handleSelectSeat(record)}
        />
      ),
    },
  ]

  return (
    <div>
      <Card title="窗口售票" style={{ marginBottom: 24 }}>
        <Radio.Group value={searchMode} onChange={(e) => setSearchMode(e.target.value)} style={{ marginBottom: 16 }}>
          <Radio.Button value="route">按区间查询</Radio.Button>
          <Radio.Button value="train">按车次查询</Radio.Button>
        </Radio.Group>

        {searchMode === 'route' ? (
          <Form form={searchForm} layout="inline" onFinish={handleSearchByRoute}>
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
              <Space>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
                  查询车次
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <Form form={searchForm} layout="inline" onFinish={handleSearchByTrain}>
            <Form.Item name="trainNumber" label="车次号" rules={[{ required: true }]}>
              <Input placeholder="例如: G1" prefix={<SearchOutlined />} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="travelDate" label="出发日期">
              <DatePicker 
                placeholder="选择日期" 
                style={{ width: 150 }}
                defaultValue={dayjs()}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
                  查询车次
                </Button>
                <Button onClick={handleReset} icon={<ReloadOutlined />}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Card>

      {trains.length > 0 && (
        <Card title={'可售票车次 (共 ' + trains.length + ' 个)'} style={{ marginBottom: 24 }}>
          <Table
            columns={trainColumns}
            dataSource={trains}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        </Card>
      )}

      {seats.length > 0 && selectedTrain && (
        <Card 
          title={'选择座位 - ' + selectedTrain.train_number + ' ' + selectedSeatType}
          style={{ marginBottom: 24 }}
        >
          <Table
            columns={seatColumns}
            dataSource={seats}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showTotal: (total) => '共 ' + total + ' 个可用座位',
            }}
            rowClassName={(record) => 
              selectedSeat && selectedSeat.id === record.id ? 'table-row-selected' : ''
            }
          />
        </Card>
      )}

      {selectedSeat && (
        <Card title="填写旅客信息">
          <Card type="inner" title="已选座位信息" style={{ marginBottom: 24 }}>
            <Descriptions column={4}>
              <Descriptions.Item label="车次">
                <Tag color="blue">{selectedTrain.train_number}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="席别">
                <Tag color="purple">{selectedSeat.seat_type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="车厢">
                {selectedSeat.carriage_number}
              </Descriptions.Item>
              <Descriptions.Item label="座位号">
                <strong>{selectedSeat.seat_number}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="出发">
                {selectedSeat.from_station} {String(selectedTrain.departure_time).substring(0, 5)}
              </Descriptions.Item>
              <Descriptions.Item label="到达">
                {selectedSeat.to_station} {String(selectedTrain.arrival_time).substring(0, 5)}
              </Descriptions.Item>
              <Descriptions.Item label="票价" span={2}>
                <span style={{ color: '#ff4d4f', fontSize: 24, fontWeight: 'bold' }}>
                  ¥{selectedSeat.price}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Form
            form={bookingForm}
            layout="vertical"
            onFinish={handleSubmitSale}
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
              <Space>
                <Button 
                  type="primary" 
                  size="large" 
                  htmlType="submit" 
                  loading={loading}
                  icon={<TicketOutlined />}
                >
                  确认售票
                </Button>
                <Button 
                  onClick={() => {
                    setSelectedSeat(null)
                    bookingForm.resetFields()
                  }}
                >
                  取消选择
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      <Modal
        title={<Space><CheckOutlined style={{ color: '#52c41a' }} />售票成功</Space>}
        open={showSuccessModal}
        onCancel={() => setShowSuccessModal(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setShowSuccessModal(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {orderResult && (
          <div>
            <div style={{ textAlign: 'center', padding: '20px 0', backgroundColor: '#f6ffed', borderRadius: 8, marginBottom: 24 }}>
              <TicketOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              <h3 style={{ marginTop: 12 }}>车票已售出</h3>
              <p>订单号: <Tag color="blue" style={{ fontSize: 14 }}>{orderResult.order_no}</Tag></p>
            </div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="车次">{orderResult.train_number}</Descriptions.Item>
              <Descriptions.Item label="座位">
                {orderResult.seat_type} {orderResult.carriage_number} {orderResult.seat_number}
              </Descriptions.Item>
              <Descriptions.Item label="出发">
                {orderResult.from_station} {String(orderResult.departure_time).substring(0, 5)}
              </Descriptions.Item>
              <Descriptions.Item label="到达">
                {orderResult.to_station} {String(orderResult.arrival_time).substring(0, 5)}
              </Descriptions.Item>
              <Descriptions.Item label="旅客">{orderResult.passenger_name}</Descriptions.Item>
              <Descriptions.Item label="票价">
                <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{orderResult.price}</span>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <style>{
        '.table-row-selected { background-color: #e6f7ff !important; }'
      }</style>
    </div>
  )
}

export default TicketSell

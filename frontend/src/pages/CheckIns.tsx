import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Space,
  Tabs,
  Descriptions,
  Row,
  Col,
} from 'antd'
import {
  ReloadOutlined,
  LoginOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { checkInsApi, roomsApi, reservationsApi } from '@/services/api'

const CheckIns: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [checkIns, setCheckIns] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [checkInModalVisible, setCheckInModalVisible] = useState(false)
  const [checkOutModalVisible, setCheckOutModalVisible] = useState(false)
  const [selectedCheckIn, setSelectedCheckIn] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('active')
  const [checkInForm] = Form.useForm()
  const [checkOutForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ciResponse, roomsResponse, resResponse] = await Promise.all([
        checkInsApi.getInHouse(),
        roomsApi.getAll(),
        reservationsApi.getAll(),
      ])
      if (ciResponse.data.success) {
        setCheckIns(ciResponse.data.data || [])
      }
      if (roomsResponse.data.success) {
        setRooms(roomsResponse.data.data.filter((r: any) => r.status === 'VACANT'))
      }
      if (resResponse.data.success) {
        setReservations(
          (resResponse.data.data.reservations || []).filter((r: any) => r.status === 'CONFIRMED')
        )
      }
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCheckIn = () => {
    checkInForm.resetFields()
    checkInForm.setFieldsValue({
      depositAmount: 200,
      adultCount: 1,
      childCount: 0,
    })
    setCheckInModalVisible(true)
  }

  const handleCheckOut = (record: any) => {
    setSelectedCheckIn(record)
    checkOutForm.resetFields()
    checkOutForm.setFieldsValue({
      roomNumber: record.room?.roomNumber,
      guestName: record.guest?.name,
      checkInTime: dayjs(record.checkInTime).format('YYYY-MM-DD HH:mm'),
    })
    setCheckOutModalVisible(true)
  }

  const handleCheckInSubmit = async (values: any) => {
    try {
      const tomorrow = dayjs().add(1, 'day').hour(12).minute(0).second(0)
      
      const submitData = {
        roomId: values.roomId,
        reservationId: values.reservationId || undefined,
        guest: {
          name: values.guestName,
          phone: values.guestPhone,
          idCardNumber: values.guestIdNumber,
        },
        expectedCheckOutTime: tomorrow.toISOString(),
        adultCount: values.adultCount || 1,
        childCount: values.childCount || 0,
        depositAmount: values.depositAmount,
        depositMethod: values.paymentMethod,
        roomRate: values.roomRate,
        remark: values.specialRequests,
      }

      const response = await checkInsApi.create(submitData)
      if (response.data.success) {
        message.success('入住办理成功')
        setCheckInModalVisible(false)
        fetchData()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '办理入住失败')
    }
  }

  const handleCheckOutSubmit = async (values: any) => {
    try {
      const response = await checkInsApi.checkOut(selectedCheckIn.id, {
        payments: [],
      })
      if (response.data.success) {
        message.success('退房成功')
        setCheckOutModalVisible(false)
        fetchData()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '退房失败')
    }
  }

  const activeCheckIns = checkIns
  const checkedOutCheckIns: any[] = []

  const columns = [
    {
      title: '房号',
      dataIndex: ['room', 'roomNumber'],
      key: 'roomNumber',
    },
    {
      title: '客人姓名',
      dataIndex: ['guest', 'name'],
      key: 'guestName',
    },
    {
      title: '联系电话',
      dataIndex: ['guest', 'phone'],
      key: 'guestPhone',
      render: (val: string) => val || '-',
    },
    {
      title: '入住时间',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '押金',
      dataIndex: 'depositAmount',
      key: 'depositAmount',
      render: (amount: number) => `¥${(amount || 0).toFixed(2)}`,
    },
    {
      title: '状态',
      key: 'status',
      render: () => <Tag color="processing">在店</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={() => handleCheckOut(record)}
          >
            退房
          </Button>
        </Space>
      ),
    },
  ]

  const tabItems = [
    { key: 'active', label: `在店客人 (${activeCheckIns.length})` },
    { key: 'history', label: `历史入住 (${checkedOutCheckIns.length})` },
  ]

  const displayData = activeTab === 'active' ? activeCheckIns : checkedOutCheckIns

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>入住管理</h2>

      <Card
        loading={loading}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              刷新
            </Button>
            <Button type="primary" icon={<LoginOutlined />} onClick={handleCheckIn}>
              办理入住
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />

        <Table
          columns={columns}
          dataSource={displayData}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="办理入住"
        open={checkInModalVisible}
        onCancel={() => setCheckInModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={checkInForm}
          layout="vertical"
          onFinish={handleCheckInSubmit}
        >
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="roomId"
                label="选择房间"
                rules={[{ required: true, message: '请选择房间' }]}
              >
                <Select placeholder="请选择空闲房间">
                  {rooms.map((room) => (
                    <Select.Option key={room.id} value={room.id}>
                      {room.roomNumber} - {room.type === 'STANDARD' ? '标准间' : room.type === 'DELUXE' ? '豪华间' : room.type === 'SUITE' ? '套房' : '家庭房'} (¥{room.basePrice})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reservationId"
                label="关联预订（可选）"
              >
                <Select placeholder="选择预订单（可选）" allowClear>
                  {reservations.map((res) => (
                    <Select.Option key={res.id} value={res.id}>
                      {res.reservationNo || res.confirmationNumber || res.id.substring(0, 8)} - {res.guest?.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="guestName"
                label="客人姓名"
                rules={[{ required: true, message: '请输入客人姓名' }]}
              >
                <Input placeholder="请输入客人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="guestPhone"
                label="联系电话"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={8}>
              <Form.Item
                name="guestIdNumber"
                label="身份证号"
              >
                <Input placeholder="请输入身份证号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="adultCount"
                label="成人数量"
                rules={[{ required: true, message: '请输入成人数量' }]}
                initialValue={1}
              >
                <Select>
                  <Select.Option value={1}>1人</Select.Option>
                  <Select.Option value={2}>2人</Select.Option>
                  <Select.Option value={3}>3人</Select.Option>
                  <Select.Option value={4}>4人</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="childCount"
                label="儿童数量"
                rules={[{ required: true, message: '请输入儿童数量' }]}
                initialValue={0}
              >
                <Select>
                  <Select.Option value={0}>0人</Select.Option>
                  <Select.Option value={1}>1人</Select.Option>
                  <Select.Option value={2}>2人</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="depositAmount"
                label="押金金额"
                rules={[{ required: true, message: '请输入押金金额' }]}
                initialValue={200}
              >
                <Select>
                  <Select.Option value={100}>¥100</Select.Option>
                  <Select.Option value={200}>¥200</Select.Option>
                  <Select.Option value={300}>¥300</Select.Option>
                  <Select.Option value={500}>¥500</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="paymentMethod"
                label="支付方式"
                rules={[{ required: true, message: '请选择支付方式' }]}
                initialValue="CASH"
              >
                <Select>
                  <Select.Option value="CASH">现金</Select.Option>
                  <Select.Option value="WECHAT">微信</Select.Option>
                  <Select.Option value="ALIPAY">支付宝</Select.Option>
                  <Select.Option value="CARD">银行卡</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="roomRate"
            label="房价（元/天）"
            rules={[{ required: true, message: '请输入房价' }]}
          >
            <Select>
              <Select.Option value={158}>标准间 ¥158</Select.Option>
              <Select.Option value={258}>豪华间 ¥258</Select.Option>
              <Select.Option value={398}>套房 ¥398</Select.Option>
              <Select.Option value={498}>家庭房 ¥498</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="specialRequests"
            label="备注"
          >
            <Input.TextArea rows={2} placeholder="备注（可选）" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large">
              确认办理入住
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="办理退房"
        open={checkOutModalVisible}
        onCancel={() => setCheckOutModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedCheckIn && (
          <Form
            form={checkOutForm}
            layout="vertical"
            onFinish={handleCheckOutSubmit}
          >
            <Card size="small" title="入住信息">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="房号">
                  {selectedCheckIn.room?.roomNumber}
                </Descriptions.Item>
                <Descriptions.Item label="客人">
                  {selectedCheckIn.guest?.name}
                </Descriptions.Item>
                <Descriptions.Item label="入住时间">
                  {dayjs(selectedCheckIn.checkInTime).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="押金">
                  ¥{(selectedCheckIn.depositAmount || 0).toFixed(2)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Form.Item
              style={{ marginTop: 16 }}
            >
              <Button type="primary" htmlType="submit" block size="large" danger>
                确认退房结算
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  )
}

export default CheckIns

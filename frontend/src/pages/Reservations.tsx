import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Tag,
  Space,
  Popconfirm,
  Tabs,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { reservationsApi, roomsApi } from '@/services/api'

const Reservations: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [reservations, setReservations] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingReservation, setEditingReservation] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resResponse, roomsResponse] = await Promise.all([
        reservationsApi.getAll(),
        roomsApi.getAll(),
      ])
      if (resResponse.data.success) {
        setReservations(resResponse.data.data.reservations || [])
      }
      if (roomsResponse.data.success) {
        setRooms(roomsResponse.data.data.filter((r: any) => r.status === 'VACANT'))
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

  const getStatusLabel = (status: string): { text: string; color: string } => {
    const statusMap: Record<string, { text: string; color: string }> = {
      PENDING: { text: '待确认', color: 'warning' },
      CONFIRMED: { text: '已确认', color: 'processing' },
      CHECKED_IN: { text: '已入住', color: 'success' },
      CANCELLED: { text: '已取消', color: 'default' },
      NO_SHOW: { text: '未到店', color: 'error' },
    }
    return statusMap[status] || { text: status, color: 'default' }
  }

  const getRoomTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      STANDARD: '标准间',
      DELUXE: '豪华间',
      SUITE: '套房',
      FAMILY: '家庭房',
    }
    return typeMap[type] || type
  }

  const handleAdd = () => {
    setEditingReservation(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setEditingReservation(record)
    form.setFieldsValue({
      guestName: record.guest?.name,
      guestPhone: record.guest?.phone,
      roomType: record.roomType,
      roomId: record.roomId,
      checkInDate: dayjs(record.checkInDate),
      checkOutDate: dayjs(record.checkOutDate),
      numberOfRooms: record.numberOfRooms || 1,
      numberOfGuests: record.adultCount + (record.childCount || 0) || 1,
      totalAmount: record.totalAmount,
      specialRequests: record.specialRequests,
    })
    setModalVisible(true)
  }

  const handleCancel = async (id: string) => {
    try {
      const response = await reservationsApi.updateStatus(id, 'CANCELLED', '用户取消')
      if (response.data.success) {
        message.success('预订已取消')
        fetchData()
      }
    } catch (error) {
      message.error('取消失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        guest: {
          name: values.guestName,
          phone: values.guestPhone,
        },
        roomType: values.roomType,
        checkInDate: values.checkInDate?.toISOString(),
        checkOutDate: values.checkOutDate?.toISOString(),
        adultCount: values.numberOfGuests || 1,
        childCount: 0,
        roomRate: values.totalAmount / (values.numberOfRooms || 1),
        totalAmount: values.totalAmount,
        specialRequests: values.specialRequests,
      }

      let response
      if (editingReservation) {
        response = await reservationsApi.updateStatus(editingReservation.id, 'CONFIRMED')
      } else {
        response = await reservationsApi.create(submitData)
      }

      if (response.data.success) {
        message.success(editingReservation ? '更新成功' : '创建成功')
        setModalVisible(false)
        fetchData()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const filteredReservations = activeTab === 'all'
    ? reservations
    : reservations.filter((r) => r.status === activeTab)

  const columns = [
    {
      title: '预订编号',
      dataIndex: 'reservationNo',
      key: 'reservationNo',
      render: (val: string) => val || '-',
    },
    {
      title: '客人姓名',
      dataIndex: ['guest', 'name'],
      key: 'guestName',
      render: (val: string) => val || '-',
    },
    {
      title: '房型',
      dataIndex: 'roomType',
      key: 'roomType',
      render: (type: string) => getRoomTypeLabel(type),
    },
    {
      title: '房间',
      dataIndex: ['room', 'roomNumber'],
      key: 'roomNumber',
      render: (num: string) => num || '-',
    },
    {
      title: '入住日期',
      dataIndex: 'checkInDate',
      key: 'checkInDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '退房日期',
      dataIndex: 'checkOutDate',
      key: 'checkOutDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (val: number) => `¥${val?.toFixed(2) || 0}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const { text, color } = getStatusLabel(status)
        return <Tag color={color}>{text}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            查看
          </Button>
          {record.status === 'CONFIRMED' && (
            <Popconfirm title="确定要取消该预订吗？" onConfirm={() => handleCancel(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const tabItems = [
    { key: 'all', label: '全部预订' },
    { key: 'PENDING', label: '待确认' },
    { key: 'CONFIRMED', label: '已确认' },
    { key: 'CHECKED_IN', label: '已入住' },
    { key: 'CANCELLED', label: '已取消' },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>预订管理</h2>

      <Card
        loading={loading}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建预订
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
          dataSource={filteredReservations}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingReservation ? '查看预订' : '新建预订'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
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
            <Col span={12}>
              <Form.Item
                name="roomType"
                label="房型"
                rules={[{ required: true, message: '请选择房型' }]}
              >
                <Select placeholder="请选择房型">
                  <Select.Option value="STANDARD">标准间</Select.Option>
                  <Select.Option value="DELUXE">豪华间</Select.Option>
                  <Select.Option value="SUITE">套房</Select.Option>
                  <Select.Option value="FAMILY">家庭房</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="numberOfGuests"
                label="入住人数"
                rules={[{ required: true, message: '请输入人数' }]}
                initialValue={1}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="checkInDate"
                label="入住日期"
                rules={[{ required: true, message: '请选择入住日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择入住日期"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="checkOutDate"
                label="退房日期"
                rules={[{ required: true, message: '请选择退房日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="请选择退房日期"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="numberOfRooms"
                label="房间数量"
                rules={[{ required: true, message: '请输入间数' }]}
                initialValue={1}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="totalAmount"
                label="总金额"
                rules={[{ required: true, message: '请输入总金额' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} prefix="¥" precision={2} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="specialRequests"
            label="特殊要求"
          >
            <Input.TextArea rows={2} placeholder="请输入特殊要求（可选）" />
          </Form.Item>

          {!editingReservation && (
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                创建预订
              </Button>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default Reservations

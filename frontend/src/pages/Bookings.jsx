import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, InputNumber, Space, Tag, message, Row, Col, Popconfirm } from 'antd'
import { PlusOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import api from '../utils/api'

const { Option } = Select

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [resources, setResources] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [bookingsData, resourcesData, membersData] = await Promise.all([
        api.bookings(),
        api.resources({ type: 'meeting_room' }),
        api.members()
      ])
      setBookings(bookingsData)
      setResources(resourcesData.filter(r => r.status === 'available'))
      setMembers(membersData.filter(m => m.status === 'active'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values) => {
    try {
      await api.createBooking({
        ...values,
        start_time: values.time_range[0].format('YYYY-MM-DD HH:mm:ss'),
        end_time: values.time_range[1].format('YYYY-MM-DD HH:mm:ss')
      })
      message.success('预约成功')
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {
      message.error(e.response?.data?.error || '预约失败')
    }
  }

  const handleCancel = async (id) => {
    try {
      await api.cancelBooking(id, '前台取消')
      message.success('已取消')
      loadData()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const handleCheckout = async (id) => {
    try {
      const result = await api.checkoutBooking(id)
      if (result.isOverdue) {
        message.warning('会议已超时，已完成签退')
      } else {
        message.success('签退成功')
      }
      loadData()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const statusColors = { confirmed: 'green', cancelled: 'red', completed: 'blue', no_show: 'orange' }
  const statusLabels = { confirmed: '已确认', cancelled: '已取消', completed: '已完成', no_show: '未到场' }

  const columns = [
    { title: '会议主题', dataIndex: 'title', key: 'title' },
    { title: '会议室', dataIndex: 'resource_name', key: 'resource_name' },
    { title: '预订人', dataIndex: 'member_name', key: 'member_name' },
    { title: '企业', dataIndex: 'company_name', key: 'company_name' },
    { title: '开始时间', dataIndex: 'start_time', key: 'start_time', render: t => t?.slice(0, 16) },
    { title: '结束时间', dataIndex: 'end_time', key: 'end_time', render: t => t?.slice(0, 16) },
    { title: '参会人数', dataIndex: 'attendees', key: 'attendees' },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag> },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        {record.status === 'confirmed' && (
          <>
            <Popconfirm title="确认取消预约?" onConfirm={() => handleCancel(record.id)}>
              <Button type="link" danger icon={<CloseOutlined />}>取消</Button>
            </Popconfirm>
            <Button type="link" icon={<CheckOutlined />} onClick={() => handleCheckout(record.id)}>签退</Button>
          </>
        )}
      </Space>
    )}
  ]

  return (
    <div>
      <Row justify="space-between" style={{ marginBottom: 16 }}>
        <Col><h2>预约管理</h2></Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>新建预约</Button>
        </Col>
      </Row>

      <Table
        dataSource={bookings}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal title="新建预约" open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="resource_id" label="选择会议室" rules={[{ required: true }]}>
            <Select>
              {resources.map(r => (
                <Option key={r.id} value={r.id}>
                  {r.name} (容量: {r.capacity}人, {r.equipment || '无设备'})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="member_id" label="预订人" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">
              {members.map(m => (
                <Option key={m.id} value={m.id}>
                  {m.name} ({m.company_name})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="会议主题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="time_range" label="预约时间" rules={[{ required: true }]}>
            <DatePicker.RangePicker
              showTime={{ minuteStep: 30 }}
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item name="attendees" label="参会人数" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确认预约</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

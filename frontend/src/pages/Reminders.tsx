import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, Typography, DatePicker } from 'antd'
import { PlusOutlined, CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons'
import { reminderAPI, patientAPI } from '../api'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

const Reminders: React.FC = () => {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [reminderRes, patientRes] = await Promise.all([
        reminderAPI.list(),
        patientAPI.list({ pageSize: 100 }),
      ])
      setList(reminderRes.data || [])
      setPatients(patientRes.data.list || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    const data = {
      ...values,
      reminder_date: values.reminder_date.format('YYYY-MM-DD'),
    }

    try {
      await reminderAPI.create(data)
      message.success('创建成功')
      setModalVisible(false)
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const handleSend = async (id: number) => {
    try {
      await reminderAPI.send(id)
      message.success('已标记为已发送')
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleCancel = async (id: number) => {
    try {
      await reminderAPI.cancel(id)
      message.success('已取消')
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await reminderAPI.delete(id)
      message.success('已删除')
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待发送' },
      sent: { color: 'green', text: '已发送' },
      cancelled: { color: 'default', text: '已取消' },
    }
    const info = statusMap[status] || { color: 'default', text: status }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const getTypeTag = (type: string) => {
    const typeMap: Record<string, { color: string; text: string }> = {
      follow_up: { color: 'blue', text: '复诊提醒' },
      treatment: { color: 'purple', text: '治疗提醒' },
      checkup: { color: 'cyan', text: '检查提醒' },
    }
    const info = typeMap[type] || { color: 'default', text: type }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const columns = [
    { title: '提醒日期', dataIndex: 'reminder_date', key: 'reminder_date', width: 120 },
    { title: '类型', key: 'type', width: 100, render: (_: any, r: any) => getTypeTag(r.reminder_type) },
    { title: '患者', dataIndex: 'patient_name', key: 'patient_name' },
    { title: '电话', dataIndex: 'patient_phone', key: 'patient_phone' },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '状态', key: 'status', width: 100, render: (_: any, r: any) => getStatusTag(r.status) },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Button size="small" type="link" icon={<CheckOutlined />} onClick={() => handleSend(record.id)}>发送</Button>
              <Button size="small" type="link" onClick={() => handleCancel(record.id)}>取消</Button>
            </>
          )}
          <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>复诊提醒</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建提醒
        </Button>
      </div>

      <Table
        loading={loading}
        dataSource={list}
        columns={columns}
        rowKey="id"
      />

      <Modal
        title="新建提醒"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="patient_id" label="患者" rules={[{ required: true }]}>
            <Select showSearch placeholder="选择患者" filterOption={(input, option) =>
              (option?.children as string || '').toLowerCase().includes(input.toLowerCase())
            }>
              {patients.map((p) => (
                <Option key={p.id} value={p.id}>{p.name} - {p.phone}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="reminder_type" label="提醒类型" rules={[{ required: true }]}>
            <Select>
              <Option value="follow_up">复诊提醒</Option>
              <Option value="treatment">治疗提醒</Option>
              <Option value="checkup">检查提醒</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reminder_date" label="提醒日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().startOf('day')} />
          </Form.Item>
          <Form.Item name="content" label="提醒内容" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="请输入提醒内容" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Reminders

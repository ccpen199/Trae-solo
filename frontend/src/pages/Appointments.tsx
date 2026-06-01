import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, DatePicker, TimePicker, Typography, Popconfirm, Alert } from 'antd'
import { PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined, DeleteOutlined } from '@ant-design/icons'
import { appointmentAPI, masterAPI, patientAPI } from '../api'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select
const { TextArea } = Input

const Appointments: React.FC = () => {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState<any>(null)
  const [doctors, setDoctors] = useState<any[]>([])
  const [chairs, setChairs] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filterDate, setFilterDate] = useState<string>(dayjs().format('YYYY-MM-DD'))
  const [conflictWarning, setConflictWarning] = useState('')
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [page, pageSize, filterDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const [aptRes, docRes, chairRes, patientRes, treatRes] = await Promise.all([
        appointmentAPI.list({ date: filterDate, page, pageSize }),
        masterAPI.doctors(),
        masterAPI.chairs(),
        patientAPI.list({ pageSize: 100 }),
        masterAPI.treatments(),
      ])
      setList(aptRes.data.list || [])
      setTotal(aptRes.data.total || 0)
      setDoctors(docRes.data)
      setChairs(chairRes.data)
      setPatients(patientRes.data.list || [])
      setTreatments(treatRes.data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setCurrentItem(null)
    form.resetFields()
    setConflictWarning('')
    setModalVisible(true)
  }

  const handleEdit = (record: any) => {
    setCurrentItem(record)
    form.setFieldsValue({
      ...record,
      appointment_date: dayjs(record.appointment_date),
      start_time: dayjs(record.start_time, 'HH:mm'),
      end_time: dayjs(record.end_time, 'HH:mm'),
    })
    setConflictWarning('')
    setModalVisible(true)
  }

  const checkConflict = async (values: any) => {
    if (!values.doctor_id || !values.chair_id || !values.appointment_date || !values.start_time || !values.end_time) return
    
    try {
      const res = await appointmentAPI.checkConflict({
        doctor_id: values.doctor_id,
        chair_id: values.chair_id,
        date: values.appointment_date.format('YYYY-MM-DD'),
        start_time: values.start_time.format('HH:mm'),
        end_time: values.end_time.format('HH:mm'),
      })
      if (res.data.conflict) {
        setConflictWarning('该时间段医生或椅位已被预约！')
      } else {
        setConflictWarning('')
      }
    } catch (error) {}
  }

  const handleSubmit = async (values: any) => {
    const data = {
      ...values,
      appointment_date: values.appointment_date.format('YYYY-MM-DD'),
      start_time: values.start_time.format('HH:mm'),
      end_time: values.end_time.format('HH:mm'),
    }

    try {
      if (currentItem) {
        await appointmentAPI.update(currentItem.id, data)
        message.success('更新成功')
      } else {
        const res = await appointmentAPI.create(data)
        if (res.data.missed_warning) {
          message.warning(res.data.missed_warning)
        } else {
          message.success('创建成功')
        }
      }
      setModalVisible(false)
      loadData()
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败')
    }
  }

  const handleCancel = async (id: number) => {
    Modal.confirm({
      title: '取消预约',
      content: (
        <Form>
          <Form.Item name="reason" label="取消原因" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          await appointmentAPI.cancel(id, '用户取消')
          message.success('已取消')
          loadData()
        } catch (error: any) {
          message.error(error.response?.data?.error || '操作失败')
        }
      },
    })
  }

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await appointmentAPI.updateStatus(id, status)
      message.success('状态已更新')
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      scheduled: { color: 'blue', text: '已预约' },
      confirmed: { color: 'green', text: '已确认' },
      completed: { color: 'purple', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' },
      missed: { color: 'orange', text: '爽约' },
    }
    const info = statusMap[status] || { color: 'default', text: status }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const columns = [
    { title: '日期', dataIndex: 'appointment_date', key: 'appointment_date', width: 110 },
    { title: '时间', key: 'time', width: 100, render: (_: any, r: any) => `${r.start_time}-${r.end_time}` },
    { title: '患者', dataIndex: 'patient_name', key: 'patient_name' },
    { title: '医生', dataIndex: 'doctor_name', key: 'doctor_name' },
    { title: '椅位', dataIndex: 'chair_name', key: 'chair_name' },
    { title: '项目', dataIndex: 'treatment_name', key: 'treatment_name' },
    { title: '状态', key: 'status', render: (_: any, r: any) => getStatusTag(r.status) },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'scheduled' && (
            <>
              <Button size="small" type="link" icon={<CheckOutlined />} onClick={() => handleUpdateStatus(record.id, 'confirmed')}>确认</Button>
              <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>改期</Button>
              <Button size="small" type="link" danger onClick={() => handleCancel(record.id)}>取消</Button>
            </>
          )}
          {record.status === 'confirmed' && (
            <Button size="small" type="link" onClick={() => handleUpdateStatus(record.id, 'completed')}>完成</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>预约管理</Title>
        <Space>
          <DatePicker
          value={filterDate ? dayjs(filterDate) : null}
          onChange={(date) => setFilterDate(date ? date.format('YYYY-MM-DD') : '')}
          style={{ width: 150 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增预约
        </Button>
        </Space>
      </div>

      <Table
        loading={loading}
        dataSource={list}
        columns={columns}
        rowKey="id"
        pagination={{
          total,
          current: page,
          pageSize,
          onChange: (p, ps) => { setPage(p); setPageSize(ps || 20) },
        }}
      />

      <Modal
        title={currentItem ? '改期预约' : '新增预约'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        {conflictWarning && <Alert message={conflictWarning} type="warning" showIcon style={{ marginBottom: 16 }} />}
        
        <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={(_, allValues) => checkConflict(allValues)}>
          <Form.Item name="patient_id" label="患者" rules={[{ required: true }]}>
            <Select showSearch placeholder="选择患者" filterOption={(input, option) =>
              (option?.children as string || '').toLowerCase().includes(input.toLowerCase())
            }>
              {patients.map((p) => (
                <Option key={p.id} value={p.id}>{p.name} - {p.phone}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="doctor_id" label="医生" rules={[{ required: true }]}>
            <Select placeholder="选择医生">
              {doctors.map((d) => <Option key={d.id} value={d.id}>{d.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="chair_id" label="椅位" rules={[{ required: true }]}>
            <Select placeholder="选择椅位">
              {chairs.map((c) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="treatment_id" label="治疗项目">
            <Select placeholder="选择项目">
              {treatments.map((t) => <Option key={t.id} value={t.id}>{t.name} (¥{t.price})</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="appointment_date" label="预约日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current < dayjs().startOf('day')} />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="start_time" label="开始时间" rules={[{ required: true }]} style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={15} />
            </Form.Item>
            <Form.Item name="end_time" label="结束时间" rules={[{ required: true }]} style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={15} />
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="备注">
            <TextArea rows={2} />
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

export default Appointments

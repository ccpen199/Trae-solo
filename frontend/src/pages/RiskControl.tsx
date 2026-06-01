import { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Tag, 
  Card,
  App,
  Row,
  Col,
  Statistic,
  Alert
} from 'antd'
import { PlusOutlined, EditOutlined, EyeOutlined, WarningOutlined } from '@ant-design/icons'
import { dashboardApi } from '../services/api'
import type { CollectionTask } from '../types'

const { Option } = Select

const RiskControl = () => {
  const [tasks, setTasks] = useState<CollectionTask[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [currentTask, setCurrentTask] = useState<CollectionTask | null>(null)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const { message, confirm } = App.useApp()

  useEffect(() => {
    loadData()
  }, [page, pageSize, statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (statusFilter) params.status = statusFilter
      const res = await dashboardApi.getCollectionTasks(params)
      if (res.data.success) {
        setTasks(res.data.data)
        setTotal(res.data.total || 0)
      }
    } catch (error) {
      message.error('加载催收任务失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setCurrentTask(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (task: CollectionTask) => {
    setCurrentTask(task)
    editForm.setFieldsValue({
      task_status: task.task_status,
      last_contact_date: task.last_contact_date ? dayjs(task.last_contact_date) : null,
      contact_result: task.contact_result,
      next_followup_date: task.next_followup_date ? dayjs(task.next_followup_date) : null,
      notes: task.notes
    })
    setEditVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      const data = {
        repayment_id: values.repayment_id,
        assignee: values.assignee,
        priority: values.priority,
        notes: values.notes || ''
      }
      
      const res = await dashboardApi.createCollectionTask(data)
      if (res.data.success) {
        message.success('创建成功')
        setModalVisible(false)
        loadData()
      }
    } catch (error: any) {
      if (error.errorFields) return
      message.error(error.response?.data?.message || '创建失败')
    }
  }

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      
      const data = {
        task_status: values.task_status,
        last_contact_date: values.last_contact_date?.format('YYYY-MM-DD') || null,
        contact_result: values.contact_result || null,
        next_followup_date: values.next_followup_date?.format('YYYY-MM-DD') || null,
        notes: values.notes || null
      }
      
      const res = await dashboardApi.updateCollectionTask(currentTask!.id!, data)
      if (res.data.success) {
        message.success('更新成功')
        setEditVisible(false)
        loadData()
      }
    } catch (error: any) {
      if (error.errorFields) return
      message.error(error.response?.data?.message || '更新失败')
    }
  }

  const getPriorityTag = (priority: string) => {
    switch (priority) {
      case 'high': return <Tag color="red">高优先级</Tag>
      case 'medium': return <Tag color="orange">中优先级</Tag>
      default: return <Tag>普通</Tag>
    }
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending': return <Tag color="orange">待处理</Tag>
      case 'in_progress': return <Tag color="blue">进行中</Tag>
      case 'completed': return <Tag color="green">已完成</Tag>
      default: return <Tag>{status}</Tag>
    }
  }

  const columns = [
    { title: '农户', dataIndex: 'farmer_name', key: 'farmer_name', width: 100 },
    { title: '联系电话', dataIndex: 'farmer_phone', key: 'farmer_phone', width: 120 },
    { 
      title: '待收金额', 
      dataIndex: 'remaining_amount', 
      key: 'remaining_amount',
      width: 120,
      render: (v: number) => <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{v?.toFixed(2) || 0}</span>
    },
    { 
      title: '逾期天数', 
      dataIndex: 'overdue_days', 
      key: 'overdue_days',
      width: 100,
      render: (v: number) => v > 30 ? <Tag color="red">{v}天</Tag> : <Tag color="orange">{v}天</Tag>
    },
    { title: '负责人', dataIndex: 'assignee', key: 'assignee', width: 100 },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 100, render: getPriorityTag },
    { title: '状态', dataIndex: 'task_status', key: 'task_status', width: 100, render: getStatusTag },
    { title: '上次联系', dataIndex: 'last_contact_date', key: 'last_contact_date', width: 120 },
    { title: '下次跟进', dataIndex: 'next_followup_date', key: 'next_followup_date', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: CollectionTask) => (
        <Space>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            跟进
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="待处理任务" value={tasks.filter(t => t.task_status === 'pending').length} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="进行中" value={tasks.filter(t => t.task_status === 'in_progress').length} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="高优先级" value={tasks.filter(t => t.priority === 'high').length} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="逾期超30天" value={tasks.filter(t => (t.overdue_days || 0) > 30).length} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card 
        title="催收任务" 
        size="small"
        extra={
          <Space>
            <Select
              placeholder="状态筛选"
              style={{ width: 140 }}
              allowClear
              value={statusFilter || undefined}
              onChange={(value) => { setStatusFilter(value); setPage(1) }}
            >
              <Option value="pending">待处理</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              创建任务
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
        />
      </Card>

      <Modal
        title="创建催收任务"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={500}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="repayment_id" label="关联还款记录" rules={[{ required: true, message: '请输入还款记录ID' }]}>
            <Input placeholder="请输入还款记录ID" />
          </Form.Item>
          <Form.Item name="assignee" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}>
            <Input placeholder="请输入负责人" />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="normal">
            <Select>
              <Option value="low">普通</Option>
              <Option value="medium">中优先级</Option>
              <Option value="high">高优先级</Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="跟进催收任务"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={handleEditSubmit}
        width={500}
        destroyOnClose
      >
        {currentTask && (
          <Alert
            message={`农户：${currentTask.farmer_name} | 待收：¥${currentTask.remaining_amount?.toFixed(2) || 0} | 逾期：${currentTask.overdue_days || 0}天`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        <Form form={editForm} layout="vertical">
          <Form.Item name="task_status" label="任务状态" rules={[{ required: true }]}>
            <Select>
              <Option value="pending">待处理</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Form.Item>
          <Form.Item name="last_contact_date" label="上次联系日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="contact_result" label="联系结果">
            <Input.TextArea rows={2} placeholder="请输入联系结果" />
          </Form.Item>
          <Form.Item name="next_followup_date" label="下次跟进日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RiskControl

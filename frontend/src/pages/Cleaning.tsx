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
  Popconfirm,
  Tabs,
  Descriptions,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { cleaningApi, roomsApi } from '@/services/api'

const Cleaning: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [form] = Form.useForm()
  const [assignForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tasksResponse, roomsResponse] = await Promise.all([
        cleaningApi.getAll(),
        roomsApi.getAll(),
      ])
      if (tasksResponse.data.success) {
        setTasks(tasksResponse.data.data.tasks || [])
      }
      if (roomsResponse.data.success) {
        setRooms(roomsResponse.data.data.filter((r: any) => r.status === 'DIRTY'))
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
      PENDING: { text: '待分配', color: 'default' },
      ASSIGNED: { text: '已分配', color: 'processing' },
      IN_PROGRESS: { text: '进行中', color: 'warning' },
      COMPLETED: { text: '已完成', color: 'success' },
      CANCELLED: { text: '已取消', color: 'default' },
    }
    return statusMap[status] || { text: status, color: 'default' }
  }

  const getPriorityLabel = (priority: string): { text: string; color: string } => {
    const priorityMap: Record<string, { text: string; color: string }> = {
      LOW: { text: '低', color: 'default' },
      MEDIUM: { text: '中', color: 'processing' },
      HIGH: { text: '高', color: 'warning' },
      URGENT: { text: '紧急', color: 'error' },
    }
    return priorityMap[priority] || { text: priority, color: 'default' }
  }

  const handleAdd = () => {
    setSelectedTask(null)
    form.resetFields()
    form.setFieldsValue({
      priority: 1,
      taskType: 'DAILY',
    })
    setModalVisible(true)
  }

  const handleAssign = (task: any) => {
    setSelectedTask(task)
    assignForm.resetFields()
    setAssignModalVisible(true)
  }

  const handleStart = async (id: string) => {
    try {
      const response = await cleaningApi.startTask(id)
      if (response.data.success) {
        message.success('任务已开始')
        fetchData()
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleComplete = async (id: string) => {
    try {
      const response = await cleaningApi.completeTask(id, '')
      if (response.data.success) {
        message.success('任务已完成')
        fetchData()
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleCancel = async (id: string) => {
    try {
      const response = await cleaningApi.cancelTask(id, '')
      if (response.data.success) {
        message.success('任务已取消')
        fetchData()
      }
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const submitData = {
        roomId: values.roomId,
        taskType: values.taskType,
        priority: values.priority,
        remark: values.instructions,
      }

      const response = await cleaningApi.create(submitData)
      if (response.data.success) {
        message.success('任务创建成功')
        setModalVisible(false)
        fetchData()
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建失败')
    }
  }

  const handleAssignSubmit = async (values: any) => {
    try {
      const response = await cleaningApi.assignTask(selectedTask.id, values.assigneeId, values.notes)
      if (response.data.success) {
        message.success('任务分配成功')
        setAssignModalVisible(false)
        fetchData()
      }
    } catch (error) {
      message.error('分配失败')
    }
  }

  const pendingTasks = tasks.filter((t) => t.status === 'PENDING' || t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS')
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'CANCELLED')

  const columns = [
    {
      title: '任务编号',
      dataIndex: 'taskNo',
      key: 'taskNo',
      render: (val: string) => val || '-',
    },
    {
      title: '房间',
      dataIndex: ['room', 'roomNumber'],
      key: 'roomNumber',
      render: (num: string) => num || '-',
    },
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          DAILY: '日常清洁',
          TURNDOWN: '夜床服务',
          DEEP: '深度清洁',
          MAINTENANCE: '维修准备',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => {
        const priorityNum = typeof priority === 'number' ? priority : parseInt(priority as string) || 1
        const text = priorityNum >= 4 ? '紧急' : priorityNum >= 3 ? '高' : priorityNum >= 2 ? '中' : '低'
        const color = priorityNum >= 4 ? 'error' : priorityNum >= 3 ? 'warning' : priorityNum >= 2 ? 'processing' : 'default'
        return <Tag color={color}>{text}</Tag>
      },
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
      title: '分配人员',
      dataIndex: ['assignee', 'name'],
      key: 'assignee',
      render: (name: string) => name || '未分配',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => date ? dayjs(date).format('MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'PENDING' && (
            <>
              <Button size="small" onClick={() => handleAssign(record)}>
                分配
              </Button>
              <Popconfirm title="确定要取消吗？" onConfirm={() => handleCancel(record.id)}>
                <Button size="small" danger>
                  取消
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'ASSIGNED' && (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleStart(record.id)}>
              开始
            </Button>
          )}
          {record.status === 'IN_PROGRESS' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleComplete(record.id)}>
              完成
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const tabItems = [
    { key: 'pending', label: `待处理 (${pendingTasks.length})` },
    { key: 'completed', label: `已处理 (${completedTasks.length})` },
  ]

  const displayData = activeTab === 'pending' ? pendingTasks : completedTasks

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>清洁任务</h2>

      <Card
        loading={loading}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新建任务
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
        title="新建清洁任务"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="roomId"
                label="选择房间"
                rules={[{ required: true, message: '请选择房间' }]}
              >
                <Select placeholder="请选择脏房">
                  {rooms.map((room) => (
                    <Select.Option key={room.id} value={room.id}>
                      {room.roomNumber} - {room.type === 'STANDARD' ? '标准间' : room.type === 'DELUXE' ? '豪华间' : '套房'}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="taskType"
                label="任务类型"
                rules={[{ required: true, message: '请选择任务类型' }]}
                initialValue="DAILY"
              >
                <Select>
                  <Select.Option value="DAILY">日常清洁</Select.Option>
                  <Select.Option value="TURNDOWN">夜床服务</Select.Option>
                  <Select.Option value="DEEP">深度清洁</Select.Option>
                  <Select.Option value="MAINTENANCE">维修准备</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
                initialValue={1}
              >
                <Select>
                  <Select.Option value={1}>低</Select.Option>
                  <Select.Option value={2}>中</Select.Option>
                  <Select.Option value={3}>高</Select.Option>
                  <Select.Option value={5}>紧急</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="instructions"
                label="清洁说明"
              >
                <Input.TextArea rows={2} placeholder="清洁说明（可选）" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              创建任务
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分配任务"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedTask && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="房间">
                  {selectedTask.room?.roomNumber}
                </Descriptions.Item>
                <Descriptions.Item label="任务类型">
                  {selectedTask.taskType === 'DAILY' ? '日常清洁' : selectedTask.taskType === 'TURNDOWN' ? '夜床服务' : '深度清洁'}
                </Descriptions.Item>
                <Descriptions.Item label="优先级">
                  <Tag color={selectedTask.priority >= 3 ? 'warning' : 'processing'}>
                    {selectedTask.priority >= 3 ? '高' : '中'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Form
              form={assignForm}
              layout="vertical"
              onFinish={handleAssignSubmit}
            >
              <Form.Item
                name="assigneeId"
                label="选择负责人"
              >
                <Select placeholder="请选择负责人（可选）" allowClear>
                </Select>
              </Form.Item>

              <Form.Item
                name="notes"
                label="分配说明"
              >
                <Input.TextArea rows={2} placeholder="分配说明（可选）" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  确认分配
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Cleaning

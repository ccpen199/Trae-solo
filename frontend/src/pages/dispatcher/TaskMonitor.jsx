import React, { useState, useEffect } from 'react'
import { Card, Button, Tag, Table, message, Modal, Descriptions, Space, Empty } from 'antd'
import { EyeOutlined, EnvironmentOutlined, PlayCircleOutlined } from '@ant-design/icons'
import request from '../../utils/request'
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS } from '../../utils/constants'

const TaskMonitor = () => {
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(fetchTasks, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const data = await request.get('/dispatch/active-tasks')
      setTasks(data.list || data || [])
    } catch (error) {
      message.error('获取任务列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (record) => {
    setSelectedTask(record)
    setDetailVisible(true)
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 140
    },
    {
      title: '服务项目',
      dataIndex: 'service_name',
      key: 'service_name'
    },
    {
      title: '患者姓名',
      dataIndex: 'patient_name',
      key: 'patient_name'
    },
    {
      title: '护士',
      dataIndex: 'nurse_name',
      key: 'nurse_name'
    },
    {
      title: '护士位置',
      key: 'location',
      render: (_, record) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#1890ff' }} />
          <span>{record.nurse_location || '位置更新中...'}</span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag color={ORDER_STATUS_COLORS[status]} icon={<PlayCircleOutlined />}>
          {ORDER_STATUS_LABELS[status]}
        </Tag>
      )
    },
    {
      title: '开始时间',
      dataIndex: 'checkin_time',
      key: 'checkin_time',
      width: 160
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2>任务监控</h2>
        <Button onClick={fetchTasks}>刷新</Button>
      </div>

      <Card className="detail-card" title="地图视图（模拟）">
        <div style={{ height: 300, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
          <Empty description="地图组件位置" />
        </div>
      </Card>

      <Card className="detail-card" title="进行中的任务列表" style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={tasks}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="任务详情"
        open={detailVisible}
        width={800}
        footer={null}
        onCancel={() => setDetailVisible(false)}
      >
        {selectedTask && (
          <div>
            <Descriptions column={2}>
              <Descriptions.Item label="订单号">{selectedTask.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={ORDER_STATUS_COLORS[selectedTask.status]}>
                  {ORDER_STATUS_LABELS[selectedTask.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="服务项目">{selectedTask.service_name}</Descriptions.Item>
              <Descriptions.Item label="预约时间">{selectedTask.scheduled_at}</Descriptions.Item>
              <Descriptions.Item label="患者姓名">{selectedTask.patient_name}</Descriptions.Item>
              <Descriptions.Item label="护士">{selectedTask.nurse_name}</Descriptions.Item>
              <Descriptions.Item label="服务地址" span={2}>{selectedTask.address}</Descriptions.Item>
              <Descriptions.Item label="签到时间">{selectedTask.checkin_time || '-'}</Descriptions.Item>
              <Descriptions.Item label="签到位置">{selectedTask.checkin_location || '-'}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default TaskMonitor

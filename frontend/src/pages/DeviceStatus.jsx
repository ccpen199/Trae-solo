import React, { useState, useEffect } from 'react'
import { Table, Card, Row, Col, Button, Tag, Space, Modal, Select, message, Badge } from 'antd'
import { BellOutlined, CheckCircleOutlined, WarningOutlined, PlusOutlined } from '@ant-design/icons'
import { api } from '../utils/api'

function DeviceStatus() {
  const [cameras, setCameras] = useState([])
  const [events, setEvents] = useState([])
  const [maintenanceTasks, setMaintenanceTasks] = useState([])
  const [eventModalVisible, setEventModalVisible] = useState(false)
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [eventType, setEventType] = useState('')
  const [eventLevel, setEventLevel] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [camerasData, eventsData, tasksData] = await Promise.all([
      api.getCameras(),
      api.getDeviceEvents({ acknowledged: 0 }),
      api.getMaintenanceTasks({ status: 'pending' }),
    ])
    setCameras(camerasData)
    setEvents(eventsData)
    setMaintenanceTasks(tasksData)
  }

  const handleAcknowledge = async (id) => {
    try {
      await api.acknowledgeEvent(id, '当前用户')
      message.success('已确认')
      loadData()
    } catch (e) {
      message.error('操作失败')
    }
  }

  const handleCreateEvent = async () => {
    try {
      await api.createDeviceEvent({
        camera_id: selectedCamera,
        event_type: eventType,
        level: eventLevel,
        message: `设备异常: ${eventType}`,
      })
      message.success('事件已创建')
      setEventModalVisible(false)
      loadData()
    } catch (e) {
      message.error('创建失败')
    }
  }

  const handleUpdateTaskStatus = async (id, status) => {
    try {
      await api.updateMaintenanceTask(id, { status })
      message.success('状态已更新')
      loadData()
    } catch (e) {
      message.error('更新失败')
    }
  }

  const getLevelTag = (level) => {
    const config = {
      info: { color: 'blue', text: '信息' },
      warning: { color: 'orange', text: '警告' },
      error: { color: 'red', text: '错误' },
      critical: { color: 'red', text: '严重' },
    }
    const { color, text } = config[level] || { color: 'default', text: level }
    return <Tag color={color}>{text}</Tag>
  }

  const eventColumns = [
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 170 },
    { title: '设备', dataIndex: 'camera_name', key: 'camera_name' },
    { title: '事件类型', dataIndex: 'event_type', key: 'event_type' },
    { title: '级别', dataIndex: 'level', key: 'level', render: v => getLevelTag(v) },
    { title: '消息', dataIndex: 'message', key: 'message' },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) => (
        <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleAcknowledge(r.id)}>
          确认
        </Button>
      ),
    },
  ]

  const taskColumns = [
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 170 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '设备', dataIndex: 'camera_name', key: 'camera_name' },
    { title: '优先级', dataIndex: 'priority', key: 'priority', render: v => <Tag color={v === 'high' ? 'red' : 'orange'}>{v === 'high' ? '高' : '中'}</Tag> },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) => (
        <Button size="small" type="primary" onClick={() => handleUpdateTaskStatus(r.id, 'completed')}>
          完成
        </Button>
      ),
    },
  ]

  const onlineCount = cameras.filter(c => c.status === 'online').length
  const offlineCount = cameras.filter(c => c.status === 'offline').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>设备状态监控</h2>
        <Button icon={<PlusOutlined />} onClick={() => setEventModalVisible(true)}>
          模拟设备事件
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div className="stat-card">
              <div className="stat-value">{cameras.length}</div>
              <div className="stat-label">设备总数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#52c41a' }}>{onlineCount}</div>
              <div className="stat-label">在线设备</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#ff4d4f' }}>{offlineCount}</div>
              <div className="stat-label">离线设备</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#fa8c16' }}>{events.length}</div>
              <div className="stat-label">未处理事件</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="相机列表" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          {cameras.map(camera => (
            <Col span={8} key={camera.id}>
              <Card size="small" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{camera.name}</span>
                  <Badge status={camera.status === 'online' ? 'success' : 'error'} />
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  {camera.ip_address} | {camera.station_name}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title={<span><WarningOutlined /> 待处理事件</span>} style={{ marginBottom: 16 }}>
        <Table
          columns={eventColumns}
          dataSource={events}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </Card>

      <Card title={<span><BellOutlined /> 维护任务</span>}>
        <Table
          columns={taskColumns}
          dataSource={maintenanceTasks}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </Card>

      <Modal
        title="模拟设备事件"
        open={eventModalVisible}
        onOk={handleCreateEvent}
        onCancel={() => setEventModalVisible(false)}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            placeholder="选择相机"
            value={selectedCamera}
            onChange={setSelectedCamera}
            style={{ width: '100%' }}
          >
            {cameras.map(c => (
              <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
            ))}
          </Select>
          <Select
            placeholder="事件类型"
            value={eventType}
            onChange={setEventType}
            style={{ width: '100%' }}
          >
            <Select.Option value="camera_offline">相机离线</Select.Option>
            <Select.Option value="light_error">光源异常</Select.Option>
            <Select.Option value="capture_failed">采集失败</Select.Option>
            <Select.Option value="line_stop">生产线停止</Select.Option>
          </Select>
          <Select
            placeholder="事件级别"
            value={eventLevel}
            onChange={setEventLevel}
            style={{ width: '100%' }}
          >
            <Select.Option value="warning">警告</Select.Option>
            <Select.Option value="error">错误</Select.Option>
            <Select.Option value="critical">严重</Select.Option>
          </Select>
        </Space>
      </Modal>
    </div>
  )
}

export default DeviceStatus

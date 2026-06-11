import React, { useState, useEffect } from 'react'
import { Row, Col, Card, List, Button, Space, Tag, Progress, Timeline, message } from 'antd'
import {
  VideoCameraOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  ClockCircleFilled,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import StatCard from '../components/StatCard.jsx'
import { getOverview } from '../api/statistics.js'
import { getDevices } from '../api/devices.js'
import { getScenes, executeScene } from '../api/scenes.js'
import { getSchedules, executeSchedule } from '../api/schedule.js'
import { getOperationLogs } from '../api/operationLog.js'
import { logOperation } from '../api/operationLog.js'
import { sendIRCommand } from '../api/devices.js'
import dayjs from 'dayjs'

function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    totalScenes: 0,
    totalSchedules: 0,
    todayCommands: 0,
    powerConsumption: 0,
    powerTrend: 'up',
    commandTrend: 'down'
  })
  const [devices, setDevices] = useState([])
  const [scenes, setScenes] = useState([])
  const [schedules, setSchedules] = useState([])
  const [logs, setLogs] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [overviewData, devicesData, scenesData, schedulesData, logsData] = await Promise.all([
        getOverview().catch(err => {
          console.warn('Overview load failed, using defaults:', err.message)
          return { totalDevices: 0, onlineDevices: 0, totalScenes: 0, totalSchedules: 0, todayCommands: 0, powerConsumption: 0, powerTrend: 'up', commandTrend: 'down' }
        }),
        getDevices({ pageSize: 4 }).catch(err => {
          console.warn('Devices load failed:', err.message)
          return []
        }),
        getScenes({ pageSize: 4 }).catch(err => {
          console.warn('Scenes load failed:', err.message)
          return []
        }),
        getSchedules({ pageSize: 3 }).catch(err => {
          console.warn('Schedules load failed:', err.message)
          return []
        }),
        getOperationLogs({ pageSize: 5 }).catch(err => {
          console.warn('Logs load failed:', err.message)
          return []
        })
      ])

      setOverview(overviewData)
      
      const devicesList = Array.isArray(devicesData) ? devicesData : (devicesData?.data || [])
      setDevices(devicesList.slice(0, 4))
      
      const scenesList = Array.isArray(scenesData) ? scenesData : (scenesData?.data || [])
      setScenes(scenesList.slice(0, 4))
      
      const schedulesList = Array.isArray(schedulesData) ? schedulesData : (schedulesData?.data || [])
      setSchedules(schedulesList.slice(0, 3))
      
      const logsList = Array.isArray(logsData) ? logsData : (logsData?.data || [])
      setLogs(logsList.slice(0, 5))
      
      message.success('数据加载成功')
    } catch (error) {
      console.error('Load dashboard data failed:', error)
      message.error('部分数据加载失败，请检查网络')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = async (action) => {
    try {
      const device = devices.find(d => d.type === action.deviceType || d.device_category === action.deviceType)
      if (!device) {
        message.warning(`没有找到${action.label.replace('打开', '')}设备`)
        return
      }
      await sendIRCommand(device.id, 'power', { state: 'on' })
      message.success(`${action.label}成功`)
      logOperation('quick_action', { action: action.key, deviceId: device.id })
      loadData()
    } catch (error) {
      message.error(`${action.label}失败: ${error.message}`)
    }
  }

  const handleExecuteScene = async (scene) => {
    try {
      const result = await executeScene(scene.id)
      message.success(`场景「${scene.name}」执行成功 (${result?.success_count || result?.actions_executed || 0} 个动作)`)
      logOperation('scene_execute', { sceneId: scene.id, sceneName: scene.name })
      loadData()
    } catch (error) {
      message.error(`场景执行失败: ${error.message}`)
    }
  }

  const handleExecuteSchedule = async (schedule) => {
    try {
      await executeSchedule(schedule.id)
      message.success(`定时任务「${schedule.name}」已立即执行`)
      logOperation('schedule_execute', { scheduleId: schedule.id, scheduleName: schedule.name })
      loadData()
    } catch (error) {
      message.error(`执行失败: ${error.message}`)
    }
  }

  const getQuickActions = () => [
    { key: 'tv', label: '打开电视', icon: <VideoCameraOutlined />, deviceType: 'tv' },
    { key: 'ac', label: '打开空调', icon: <ThunderboltOutlined />, deviceType: 'ac' },
    { key: 'light', label: '打开灯光', icon: <BulbOutlined />, deviceType: 'light' },
    { key: 'projector', label: '打开投影', icon: <VideoCameraOutlined />, deviceType: 'projector' }
  ]

  const getDeviceTypeIcon = (type) => {
    const icons = { tv: '📺', ac: '❄️', light: '💡', projector: '🎬' }
    return icons[type] || icons[type?.device_category] || '📱'
  }

  const formatLogAction = (log) => {
    const data = log.data || {}
    switch (log.action) {
      case 'ir_command':
      case 'ir_send':
        return `发送指令: ${data.command || log.command} → ${data.deviceName || data.device_id || '设备'}`
      case 'scene_execute':
        return `执行场景: ${data.sceneName || '场景'}`
      case 'schedule_trigger':
      case 'schedule_execute':
        return `定时触发: ${data.scheduleName || '任务'}`
      case 'device_create':
        return `添加设备: ${data.name || '新设备'}`
      case 'device_delete':
        return `删除设备`
      case 'admin:ota':
        return `OTA推送: ${data.version || '新版本'}`
      default:
        return log.action?.replace(/_/g, ' ') || '操作'
    }
  }

  const getSceneActionCount = (scene) => {
    if (scene.actionCount !== undefined) return scene.actionCount
    if (scene.action_count !== undefined) return scene.action_count
    return Array.isArray(scene.actions) ? scene.actions.length : 0
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>仪表盘</h2>
        <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
          刷新数据
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <StatCard
            title="设备总数"
            value={overview.totalDevices}
            icon="📱"
            color="#1890ff"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="在线设备"
            value={overview.onlineDevices}
            icon="✅"
            color="#52c41a"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="今日指令"
            value={overview.todayCommands}
            unit="次"
            icon="📡"
            color="#722ed1"
            trend={overview.commandTrend === 'up' ? 'up' : 'down'}
            trendValue={12}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="今日耗电"
            value={overview.powerConsumption}
            unit="kWh"
            icon="⚡"
            color="#faad14"
            trend={overview.powerTrend === 'up' ? 'up' : 'down'}
            trendValue={8}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="快捷操作" style={{ marginBottom: 16 }} loading={loading}>
            <Row gutter={[12, 12]}>
              {getQuickActions().map(action => (
                <Col xs={12} sm={6} key={action.key}>
                  <Button 
                    className="quick-action-btn" 
                    size="large" 
                    onClick={() => handleQuickAction(action)}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                </Col>
              ))}
            </Row>
          </Card>

          <Card 
            title="快捷场景" 
            extra={<Button type="link" onClick={() => { window.location.href = '/scenes' }}>查看全部</Button>}
            loading={loading}
          >
            {scenes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                暂无场景，<a href="/scenes">去创建</a>
              </div>
            ) : (
              <Row gutter={[12, 12]}>
                {scenes.map(scene => (
                  <Col xs={12} sm={6} key={scene.id}>
                    <Card
                      hoverable
                      onClick={() => handleExecuteScene(scene)}
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: '32px', marginBottom: 8 }}>
                        {scene.icon || getDeviceTypeIcon(scene.device_type)}
                      </div>
                      <div style={{ fontWeight: 'bold' }}>{scene.name}</div>
                      <div style={{ color: '#999', fontSize: '12px', marginTop: 4 }}>
                        {getSceneActionCount(scene)} 个动作
                      </div>
                      {scene.description && (
                        <div style={{ color: '#666', fontSize: '11px', marginTop: 4 }}>
                          {scene.description}
                        </div>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card 
            title="设备状态" 
            style={{ marginBottom: 16 }} 
            extra={<Button type="link" onClick={() => { window.location.href = '/devices' }}>管理</Button>}
            loading={loading}
          >
            {devices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                暂无设备，<a href="/devices">去添加</a>
              </div>
            ) : (
              <List
                dataSource={devices}
                renderItem={device => {
                  const isOnline = device.status === 'online' || 
                    (device.last_used_at && Date.now() - new Date(device.last_used_at).getTime() < 3600000)
                  return (
                    <List.Item
                      actions={[
                        <Button type="link" size="small" onClick={() => { window.location.href = '/devices' }}>
                          详情
                        </Button>,
                        <Tag color={isOnline ? 'success' : 'error'}>
                          {isOnline ? '在线' : '离线'}
                        </Tag>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <span style={{ fontSize: '18px' }}>
                              {getDeviceTypeIcon(device.type || device.device_category)}
                            </span>
                            <span>{device.name}</span>
                          </Space>
                        }
                        description={
                          <Space>
                            <span style={{ color: '#666' }}>
                              {device.brand || device.brand_name || ''} {device.model || device.model_number || ''}
                            </span>
                            {device.lastUsed || device.last_used_at ? (
                              <>
                                <span>·</span>
                                <ClockCircleOutlined />
                                {dayjs(device.lastUsed || device.last_used_at).fromNow()}
                              </>
                            ) : null}
                          </Space>
                        }
                      />
                    </List.Item>
                  )
                }}
              />
            )}
          </Card>

          <Card 
            title="即将执行" 
            style={{ marginBottom: 16 }} 
            extra={<Button type="link" onClick={() => { window.location.href = '/schedule' }}>管理</Button>}
            loading={loading}
          >
            {schedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                暂无定时任务，<a href="/schedule">去创建</a>
              </div>
            ) : (
              <List
                dataSource={schedules}
                renderItem={schedule => (
                  <List.Item
                    actions={[
                      <Button 
                        type="text" 
                        size="small" 
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleExecuteSchedule(schedule)}
                      >
                        立即执行
                      </Button>,
                      <Tag color={schedule.enabled || schedule.is_active ? 'success' : 'default'}>
                        {schedule.enabled || schedule.is_active ? '已启用' : '已禁用'}
                      </Tag>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<ClockCircleFilled style={{ color: '#1890ff', fontSize: '24px' }} />}
                      title={schedule.name}
                      description={
                        <Space>
                          <span style={{ fontWeight: 'bold' }}>{schedule.time}</span>
                          <span>·</span>
                          <span>
                            {schedule.repeatType === 'once' ? '仅一次' :
                             schedule.repeatType === 'daily' ? '每天' :
                             schedule.repeatType === 'weekday' ? '工作日' :
                             schedule.repeatType === 'weekend' ? '周末' : '自定义'}
                          </span>
                          {schedule.sceneName && (
                            <>
                              <span>·</span>
                              <Tag color="blue">{schedule.sceneName}</Tag>
                            </>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card title="最近操作" loading={loading}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                暂无操作记录
              </div>
            ) : (
              <Timeline
                size="small"
                items={logs.map(log => ({
                  color: log.success ? 'green' : 'red',
                  dot: log.success ? <CheckCircleOutlined /> : <WarningOutlined />,
                  children: (
                    <div className="timeline-item">
                      <div>{formatLogAction(log)}</div>
                      <div style={{ color: '#999', fontSize: '12px', marginTop: 4 }}>
                        {dayjs(log.timestamp || log.created_at).fromNow()}
                      </div>
                      {log.networkStatus && (
                        <Tag size="small" color={log.networkStatus === 'online' ? 'green' : 'orange'}>
                          {log.networkStatus === 'online' ? '在线' : '离线'}
                        </Tag>
                      )}
                    </div>
                  )
                }))}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

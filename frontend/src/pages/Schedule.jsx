import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  TimePicker,
  Checkbox,
  Space,
  Tag,
  message,
  Empty,
  Radio,
  Card,
  Row,
  Col,
  Divider,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  SoundOutlined,
  ThunderboltOutlined,
  CloudServerOutlined,
  MobileOutlined,
  WifiOutlined
} from '@ant-design/icons'
import {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleSchedule,
  executeSchedule
} from '../api/schedule.js'
import { getScenes } from '../api/scenes.js'
import { getDevices } from '../api/devices.js'
import { logOperation } from '../api/operationLog.js'
import dayjs from 'dayjs'

const { Option } = Select

const repeatOptions = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 }
]

const executionChannelOptions = [
  { label: 'Web 浏览器', value: 'web', icon: <CloudServerOutlined /> },
  { label: 'Android 红外', value: 'android_ir', icon: <MobileOutlined /> },
  { label: 'iOS AirPlay', value: 'ios_airplay', icon: <WifiOutlined /> }
]

const offlineStrategyOptions = [
  { label: '立即执行（失败跳过）', value: 'execute' },
  { label: '队列缓存（联网后重试）', value: 'queue' },
  { label: '离线不执行', value: 'skip' }
]

const targetTypeOptions = [
  { label: '控制设备', value: 'device' },
  { label: '触发场景', value: 'scene' }
]

function Schedule() {
  const [schedules, setSchedules] = useState([])
  const [scenes, setScenes] = useState([])
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [form] = Form.useForm()
  const targetType = Form.useWatch('targetType', form)
  const selectedDeviceId = Form.useWatch('deviceId', form)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [schedulesData, scenesData, devicesData] = await Promise.all([
        getSchedules().catch(err => {
          console.error('Failed to load schedules:', err)
          return []
        }),
        getScenes().catch(err => {
          console.error('Failed to load scenes:', err)
          return []
        }),
        getDevices().catch(err => {
          console.error('Failed to load devices:', err)
          return []
        })
      ])

      const schedulesList = Array.isArray(schedulesData) 
        ? schedulesData 
        : (schedulesData?.data || [])
      
      const scenesList = Array.isArray(scenesData)
        ? scenesData
        : (scenesData?.data || [])
      
      const devicesList = Array.isArray(devicesData)
        ? devicesData
        : (devicesData?.data || [])

      setSchedules(schedulesList.map(normalizeSchedule))
      setScenes(scenesList.map(s => ({ ...s, name: s.name || s.scene_name })))
      setDevices(devicesList.map(d => ({ ...d, name: d.name || d.device_name })))

      if (schedulesList.length > 0 || scenesList.length > 0 || devicesList.length > 0) {
        message.success('数据加载成功')
      }
    } catch (error) {
      console.error('Load data failed:', error)
      message.error('部分数据加载失败，请检查网络')
    } finally {
      setLoading(false)
    }
  }

  const normalizeSchedule = (s) => {
    return {
      ...s,
      id: s.id,
      name: s.name || s.task_name || '未命名任务',
      time: s.time || (s.target_time ? dayjs(s.target_time).format('HH:mm') : '00:00'),
      isActive: s.is_active !== undefined ? s.is_active : (s.enabled !== undefined ? s.enabled : true),
      actionType: s.action_type || s.actionType || (s.cron_expression ? 'cron' : 'once'),
      cronExpression: s.cron_expression || s.cronExpression,
      targetTime: s.target_time || s.targetTime,
      deviceId: s.device_id || s.deviceId,
      sceneId: s.scene_id || s.sceneId,
      command: s.command,
      commandParams: s.command_params || s.commandParams,
      executionChannel: s.execution_channel || s.executionChannel || 'web',
      offlineStrategy: s.offline_strategy || s.offlineStrategy || 'queue',
      deviceName: s.device_name || s.deviceName,
      sceneName: s.scene_name || s.sceneName,
      brandName: s.brand_name || s.brandName,
      modelName: s.model_name || s.modelName,
      deviceType: s.device_type_name || s.deviceTypeName,
      deviceCategory: s.device_category || s.deviceCategory,
      lastExecutedAt: s.last_executed_at || s.lastExecutedAt,
      createdAt: s.created_at || s.createdAt
    }
  }

  const getSelectedDeviceCommands = () => {
    if (!selectedDeviceId) return []
    const device = devices.find(d => d.id === selectedDeviceId || d.deviceId === selectedDeviceId)
    if (!device) return []
    
    const irCodes = device.ir_codes || device.irCodes || []
    const commandNames = [...new Set(irCodes.map(c => c.command_name || c.commandName || c.command))]
    
    return commandNames.map(cmd => ({
      label: formatCommandName(cmd),
      value: cmd
    }))
  }

  const formatCommandName = (cmd) => {
    const nameMap = {
      'power': '电源',
      'power_on': '开机',
      'power_off': '关机',
      'volume_up': '音量+',
      'volume_down': '音量-',
      'channel_up': '频道+',
      'channel_down': '频道-',
      'mute': '静音',
      'temp_up': '温度+',
      'temp_down': '温度-',
      'mode_cool': '制冷模式',
      'mode_heat': '制热模式',
      'mode_auto': '自动模式',
      'swing': '摆风',
      'fan_speed': '风速'
    }
    return nameMap[cmd] || cmd
  }

  const getDeviceCategoryIcon = (category) => {
    switch (category) {
      case 'cooling': return <ThunderboltOutlined style={{ color: '#1890ff' }} />
      case 'AV': return <SoundOutlined style={{ color: '#722ed1' }} />
      case 'lighting': return <BulbOutlined style={{ color: '#faad14' }} />
      default: return <CloudServerOutlined style={{ color: '#8c8c8c' }} />
    }
  }

  const getExecutionChannelTag = (channel) => {
    const tagMap = {
      'web': { color: 'blue', text: 'Web' },
      'android_ir': { color: 'green', text: 'Android红外' },
      'ios_airplay': { color: 'purple', text: 'AirPlay' }
    }
    const tag = tagMap[channel] || tagMap['web']
    return <Tag color={tag.color}>{tag.text}</Tag>
  }

  const getOfflineStrategyTag = (strategy) => {
    const tagMap = {
      'execute': { color: 'cyan', text: '立即执行' },
      'queue': { color: 'orange', text: '队列缓存' },
      'skip': { color: 'default', text: '离线跳过' }
    }
    const tag = tagMap[strategy] || tagMap['queue']
    return <Tag color={tag.color}>{tag.text}</Tag>
  }

  const handleCreate = () => {
    setEditingSchedule(null)
    form.resetFields()
    form.setFieldsValue({
      enabled: true,
      isActive: true,
      repeatType: 'daily',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      targetType: 'device',
      executionChannel: 'web',
      offlineStrategy: 'queue'
    })
    setModalVisible(true)
  }

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule)
    
    const formValues = {
      name: schedule.name,
      time: dayjs(schedule.time, 'HH:mm'),
      repeatType: schedule.actionType === 'once' ? 'once' : 
                  schedule.cronExpression?.includes('* * * * 1-5') ? 'weekday' :
                  schedule.cronExpression?.includes('* * * * 6,0') ? 'weekend' :
                  schedule.cronExpression?.includes('* * * * *') ? 'daily' : 'custom',
      repeatDays: parseRepeatDays(schedule.cronExpression),
      targetType: schedule.deviceId ? 'device' : 'scene',
      deviceId: schedule.deviceId,
      sceneId: schedule.sceneId,
      command: schedule.command,
      executionChannel: schedule.executionChannel,
      offlineStrategy: schedule.offlineStrategy,
      enabled: schedule.isActive,
      isActive: schedule.isActive
    }
    
    form.setFieldsValue(formValues)
    setModalVisible(true)
  }

  const parseRepeatDays = (cronExpression) => {
    if (!cronExpression) return [0, 1, 2, 3, 4, 5, 6]
    const parts = cronExpression.split(' ')
    if (parts.length < 5) return [0, 1, 2, 3, 4, 5, 6]
    const dayPart = parts[4]
    if (dayPart === '*') return [0, 1, 2, 3, 4, 5, 6]
    if (dayPart === '1-5') return [1, 2, 3, 4, 5]
    if (dayPart === '6,0') return [6, 0]
    return dayPart.split(',').map(Number)
  }

  const buildCronExpression = (values) => {
    const hour = values.time.hour()
    const minute = values.time.minute()
    
    if (values.repeatType === 'once') {
      return null
    }
    
    let dayPart = '*'
    if (values.repeatType === 'weekday') dayPart = '1-5'
    else if (values.repeatType === 'weekend') dayPart = '6,0'
    else if (values.repeatType === 'custom' && values.repeatDays?.length > 0) {
      dayPart = values.repeatDays.sort().join(',')
    }
    
    return `${minute} ${hour} * * ${dayPart}`
  }

  const handleDelete = async (schedule) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除定时任务 "${schedule.name}" 吗？`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteSchedule(schedule.id)
          message.success('定时任务删除成功')
          logOperation('schedule_delete', { scheduleId: schedule.id, scheduleName: schedule.name })
          loadData()
        } catch (error) {
          console.error('Delete failed:', error)
          message.error('删除失败')
        }
      }
    })
  }

  const handleToggle = async (schedule, enabled) => {
    try {
      await toggleSchedule(schedule.id, enabled)
      message.success(`定时任务已${enabled ? '启用' : '禁用'}`)
      logOperation('schedule_toggle', { scheduleId: schedule.id, enabled })
      loadData()
    } catch (error) {
      console.error('Toggle failed:', error)
      message.error('操作失败')
    }
  }

  const handleExecute = async (schedule) => {
    try {
      message.loading({ content: '正在执行...', key: 'exec' })
      const result = await executeSchedule(schedule.id)
      message.destroy('exec')
      
      if (result?.result?.type === 'scene') {
        const successCount = result.result.success_count || 0
        const totalCount = result.result.total_count || 0
        message.success(`场景执行完成：${successCount}/${totalCount} 个动作成功`)
      } else if (result?.result?.success) {
        message.success(`定时任务 "${schedule.name}" 执行成功`)
      } else {
        message.warning(`执行完成，但部分操作失败`)
      }
      
      logOperation('schedule_execute', { scheduleId: schedule.id, scheduleName: schedule.name, result })
      loadData()
    } catch (error) {
      message.destroy('exec')
      console.error('Execute failed:', error)
      message.error('执行失败')
    }
  }

  const handleSubmit = async (values) => {
    const cronExpression = buildCronExpression(values)
    const actionType = values.repeatType === 'once' ? 'once' : 'cron'
    
    const scheduleData = {
      name: values.name,
      action_type: actionType,
      cron_expression: cronExpression,
      target_time: values.repeatType === 'once' ? values.time.toISOString() : null,
      is_active: values.enabled ? 1 : 0,
      execution_channel: values.executionChannel,
      offline_strategy: values.offlineStrategy,
      command: values.targetType === 'device' ? values.command : null,
      command_params: null
    }

    if (values.targetType === 'device') {
      scheduleData.device_id = values.deviceId
      scheduleData.scene_id = null
    } else {
      scheduleData.device_id = null
      scheduleData.scene_id = values.sceneId
    }

    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, scheduleData)
        message.success('定时任务更新成功')
        logOperation('schedule_update', { scheduleId: editingSchedule.id, ...scheduleData })
      } else {
        await createSchedule(scheduleData)
        message.success('定时任务创建成功')
        logOperation('schedule_create', scheduleData)
      }
      setModalVisible(false)
      loadData()
    } catch (error) {
      console.error('Save failed:', error)
      message.error(error?.response?.data?.error || '保存失败')
    }
  }

  const getRepeatText = (schedule) => {
    if (schedule.actionType === 'once') return '仅一次'
    const cron = schedule.cronExpression
    if (!cron) return '自定义'
    const parts = cron.split(' ')
    if (parts.length < 5) return '自定义'
    const dayPart = parts[4]
    if (dayPart === '*') return '每天'
    if (dayPart === '1-5') return '工作日'
    if (dayPart === '6,0') return '周末'
    const days = dayPart.split(',')
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return days.sort((a, b) => Number(a) - Number(b)).map(d => dayNames[Number(d)]).join('、')
  }

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 160,
      render: (text, record) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#1890ff' }} />
          <div>
            <strong>{text}</strong>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {record.deviceName || record.sceneName}
            </div>
          </div>
          <Tag color={record.isActive ? 'success' : 'default'}>
            {record.isActive ? '已启用' : '已禁用'}
          </Tag>
        </Space>
      )
    },
    {
      title: '执行时间',
      dataIndex: 'time',
      key: 'time',
      width: 100,
      render: (text) => <strong style={{ fontSize: '18px' }}>{text}</strong>
    },
    {
      title: '重复',
      key: 'repeat',
      width: 120,
      render: (_, record) => getRepeatText(record)
    },
    {
      title: '控制目标',
      key: 'target',
      width: 180,
      render: (_, record) => {
        if (record.sceneId) {
          return (
            <Space>
              <Tag color="purple">场景</Tag>
              {record.sceneName || '-'}
            </Space>
          )
        }
        return (
          <Space>
            {getDeviceCategoryIcon(record.deviceCategory)}
            <div>
              <div style={{ fontWeight: 500 }}>{record.deviceName || '-'}</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                {record.brandName} {record.modelName}
              </div>
            </div>
          </Space>
        )
      }
    },
    {
      title: '红外指令',
      dataIndex: 'command',
      key: 'command',
      width: 100,
      render: (text) => text ? formatCommandName(text) : '-'
    },
    {
      title: '执行通道',
      dataIndex: 'executionChannel',
      key: 'executionChannel',
      width: 100,
      render: (text) => getExecutionChannelTag(text)
    },
    {
      title: '离线策略',
      dataIndex: 'offlineStrategy',
      key: 'offlineStrategy',
      width: 100,
      render: (text) => getOfflineStrategyTag(text)
    },
    {
      title: '上次执行',
      dataIndex: 'lastExecutedAt',
      key: 'lastExecutedAt',
      width: 150,
      render: (text) => text ? dayjs(text).fromNow() : '未执行'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggle(record, checked)}
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="立即执行">
            <Button
              type="text"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleExecute(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>定时任务</h2>
          <p style={{ margin: '8px 0 0 0', color: '#8c8c8c' }}>
            共 {schedules.length} 个定时任务，支持设备单控和场景联动
          </p>
        </div>
        <Space>
          <Button onClick={loadData}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建定时任务
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={schedules}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: <Empty description="暂无定时任务，点击右上角创建" /> }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingSchedule ? '编辑定时任务' : '创建定时任务'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
        destroyOnHidden
        forceRender
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="name"
                label="任务名称"
                rules={[{ required: true, message: '请输入任务名称' }]}
              >
                <Input placeholder="例如: 早上起床开空调" maxLength={50} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="time"
                label="执行时间"
                rules={[{ required: true, message: '请选择执行时间' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="repeatType"
                label="重复类型"
                rules={[{ required: true, message: '请选择重复类型' }]}
              >
                <Select>
                  <Option value="once">仅一次</Option>
                  <Option value="daily">每天</Option>
                  <Option value="weekday">工作日</Option>
                  <Option value="weekend">周末</Option>
                  <Option value="custom">自定义</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.repeatType !== currentValues.repeatType}
          >
            {({ getFieldValue }) => {
              const repeatType = getFieldValue('repeatType')
              if (repeatType === 'custom') {
                return (
                  <Form.Item
                    name="repeatDays"
                    label="重复日期"
                    rules={[{ required: true, message: '请选择重复日期' }]}
                  >
                    <Checkbox.Group options={repeatOptions} />
                  </Form.Item>
                )
              }
              return null
            }}
          </Form.Item>

          <Divider style={{ margin: '16px 0' }}>触发设置</Divider>

          <Form.Item
            name="targetType"
            label="触发类型"
            rules={[{ required: true, message: '请选择触发类型' }]}
          >
            <Radio.Group options={targetTypeOptions} />
          </Form.Item>

          {targetType === 'device' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="deviceId"
                  label="控制设备"
                  rules={[{ required: true, message: '请选择要控制的设备' }]}
                >
                  <Select placeholder="选择设备" showSearch optionFilterProp="children">
                    {devices.map(device => (
                      <Option key={device.id} value={device.id}>
                        <Space>
                          {getDeviceCategoryIcon(device.category || device.deviceCategory)}
                          {device.name}
                          <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                            {device.brand || device.brandName} {device.model || device.modelName}
                          </span>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="command"
                  label="红外指令"
                  rules={[{ required: true, message: '请选择红外指令' }]}
                >
                  <Select 
                    placeholder="选择指令"
                    disabled={!selectedDeviceId}
                    showSearch
                    optionFilterProp="children"
                  >
                    {getSelectedDeviceCommands().map(cmd => (
                      <Option key={cmd.value} value={cmd.value}>
                        {cmd.label}
                      </Option>
                    ))}
                    {!selectedDeviceId && (
                      <Option value="" disabled>请先选择设备</Option>
                    )}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          {targetType === 'scene' && (
            <Form.Item
              name="sceneId"
              label="触发场景"
              rules={[{ required: true, message: '请选择触发场景' }]}
            >
              <Select placeholder="选择要执行的场景">
                {scenes.map(scene => (
                  <Option key={scene.id} value={scene.id}>
                    {scene.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Divider style={{ margin: '16px 0' }}>高级设置</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="executionChannel"
                label="执行通道"
                rules={[{ required: true, message: '请选择执行通道' }]}
              >
                <Select>
                  {executionChannelOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>
                      <Space>
                        {opt.icon}
                        {opt.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="offlineStrategy"
                label="离线执行策略"
                rules={[{ required: true, message: '请选择离线策略' }]}
              >
                <Select>
                  {offlineStrategyOptions.map(opt => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="enabled"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingSchedule ? '更新定时任务' : '创建定时任务'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Schedule

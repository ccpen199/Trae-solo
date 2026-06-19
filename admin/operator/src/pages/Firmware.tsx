import { useState, useMemo } from 'react'
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Progress,
  Input,
  Descriptions,
  Drawer,
  List,
  Badge,
  Steps,
  message,
  Divider,
  Tooltip,
  Empty,
  Alert,
  theme
} from 'antd'
import {
  UploadOutlined,
  CloudUploadOutlined,
  CloudOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  ReloadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  SearchOutlined,
  DeviceTabletOutlined,
  FileZipOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import FirmwareUpload from '@/components/FirmwareUpload'
import UpgradeProgress from '@/components/UpgradeProgress'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { useToken } = theme

interface Firmware {
  id: string
  version: string
  model: string
  size: string
  sizeBytes: number
  uploadTime: string
  uploader: string
  description: string
  md5: string
  status: 'active' | 'deprecated'
  deviceCount: number
}

interface UpgradeTask {
  taskId: string
  taskName: string
  firmwareId: string
  firmwareVersion: string
  firmwareModel: string
  totalDevices: number
  successCount: number
  failedCount: number
  inProgressCount: number
  pendingCount: number
  scheduledTime?: string
  status: 'pending' | 'running' | 'completed' | 'cancelled'
  createTime: string
  createBy: string
  devices: {
    id: string
    deviceId: string
    deviceName: string
    status: 'pending' | 'downloading' | 'upgrading' | 'success' | 'failed'
    progress: number
    message?: string
    startTime?: string
    endTime?: string
  }[]
}

const mockFirmwares: Firmware[] = [
  {
    id: 'FW001', version: 'v2.3.5', model: 'RO-MINI-200',
    size: '8.42 MB', sizeBytes: 8420000,
    uploadTime: '2026-06-18 15:30:00', uploader: '张运维',
    description: '修复UV灯控制逻辑异常，优化水温调节精度', md5: 'a1b2c3d4e5f6',
    status: 'active', deviceCount: 45
  },
  {
    id: 'FW002', version: 'v2.2.1', model: 'RO-MINI-200',
    size: '8.15 MB', sizeBytes: 8150000,
    uploadTime: '2026-06-10 10:15:00', uploader: '李工程师',
    description: '增加数据上报频率选项，优化MQTT连接稳定性', md5: 'f6e5d4c3b2a1',
    status: 'deprecated', deviceCount: 12
  },
  {
    id: 'FW003', version: 'v3.1.0', model: 'RO-PRO-500',
    size: '12.68 MB', sizeBytes: 12680000,
    uploadTime: '2026-06-17 09:45:00', uploader: '张运维',
    description: '重大版本更新：新增远程诊断功能，优化滤芯寿命算法', md5: '1a2b3c4d5e6f',
    status: 'active', deviceCount: 38
  },
  {
    id: 'FW004', version: 'v3.0.2', model: 'RO-PRO-500',
    size: '12.30 MB', sizeBytes: 12300000,
    uploadTime: '2026-06-05 14:20:00', uploader: '王主管',
    description: '修复高压泵启动时电流过大问题', md5: '6f5e4d3c2b1a',
    status: 'deprecated', deviceCount: 5
  },
  {
    id: 'FW005', version: 'v1.8.9', model: 'RO-STD-300',
    size: '9.85 MB', sizeBytes: 9850000,
    uploadTime: '2026-06-15 16:00:00', uploader: '张运维',
    description: '优化掉电恢复逻辑，修复RTC时钟偏差', md5: 'aa11bb22cc33',
    status: 'active', deviceCount: 62
  },
  {
    id: 'FW006', version: 'v4.0.0', model: 'RO-MAX-800',
    size: '15.20 MB', sizeBytes: 15200000,
    uploadTime: '2026-06-12 11:30:00', uploader: '李工程师',
    description: '首发版本：支持双路TDS检测，新增漏水保护联动', md5: '1234567890ab',
    status: 'active', deviceCount: 28
  }
]

const mockAvailableDevices = (model: string) => Array.from({ length: 18 }).map((_, i) => ({
  id: `DEV${2000 + i}`,
  deviceId: `RO-${model === 'RO-PRO-500' ? 'B' : model === 'RO-STD-300' ? 'C' : model === 'RO-MAX-800' ? 'D' : 'A'}${String(i + 1).padStart(3, '0')}`,
  name: `${['阳光花园', '幸福里小区', '翠湖花园', '明月苑'][i % 4]}${Math.floor(i / 4) + 1}号机组`,
  currentVersion: i % 4 === 0 ? `v${1 + (i % 2)}.${i % 5}.${i % 3}` : null,
  status: i % 7 === 0 ? 'warning' : 'online'
}))

function Firmware() {
  const { token } = useToken()
  const [activeTab, setActiveTab] = useState<'list' | 'tasks'>('list')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [selectedFirmware, setSelectedFirmware] = useState<Firmware | null>(null)
  const [upgradeTasks, setUpgradeTasks] = useState<UpgradeTask[]>([])
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<UpgradeTask | null>(null)
  const [upgradeForm] = Form.useForm()
  const [searchText, setSearchText] = useState('')
  const [filterModel, setFilterModel] = useState<string | undefined>()
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([])
  const [isSimulating, setIsSimulating] = useState(false)

  const modelOptions = useMemo(() =>
    Array.from(new Set(mockFirmwares.map(f => f.model))).map(m => ({ label: m, value: m }))
  , [])

  const filteredFirmwares = useMemo(() => mockFirmwares.filter(f => {
    if (filterModel && f.model !== filterModel) return false
    if (searchText) {
      const kw = searchText.toLowerCase()
      return f.version.toLowerCase().includes(kw) || f.model.toLowerCase().includes(kw)
    }
    return true
  }), [searchText, filterModel])

  const availableDevices = useMemo(() =>
    selectedFirmware ? mockAvailableDevices(selectedFirmware.model) : []
  , [selectedFirmware])

  const eligibleDevices = useMemo(() => availableDevices.filter(d =>
    d.status !== 'offline' && d.currentVersion !== selectedFirmware?.version
  ), [availableDevices, selectedFirmware])

  const handleDeleteFirmware = (fw: Firmware) => {
    Modal.confirm({
      title: '确认删除固件？',
      icon: <WarningOutlined style={{ color: '#ff4d4f' }} />,
      content: `即将删除固件 ${fw.version} (${fw.model})，此操作不可恢复。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消'
    })
  }

  const handleOpenUpgrade = (fw: Firmware) => {
    setSelectedFirmware(fw)
    upgradeForm.resetFields()
    upgradeForm.setFieldsValue({ model: fw.model, scheduled: false })
    setSelectedDeviceIds([])
    setUpgradeOpen(true)
  }

  const simulateUpgradeProgress = (task: UpgradeTask) => {
    setIsSimulating(true)
    const totalSteps = 5
    const perStepDelay = 1200

    for (let step = 1; step <= totalSteps; step++) {
      setTimeout(() => {
        setUpgradeTasks(prev => prev.map(t => {
          if (t.taskId !== task.taskId) return t
          const newDevices = t.devices.map((d, idx) => {
            if (d.status === 'success' || d.status === 'failed') return d
            const stage = Math.min(step, totalSteps)
            let status: typeof d.status = 'pending'
            let progress = 0
            let message = ''
            if (stage === 1) { status = 'downloading'; progress = 25; message = '正在下载固件...' }
            else if (stage === 2) { status = 'downloading'; progress = 50; message = '固件校验中...' }
            else if (stage === 3) { status = 'upgrading'; progress = 70; message = '正在写入固件...' }
            else if (stage === 4) { status = 'upgrading'; progress = 90; message = '重启设备中...' }
            else {
              const failed = idx % 8 === 0
              status = failed ? 'failed' : 'success'
              progress = 100
              message = failed ? '升级失败：校验不通过' : '升级成功完成'
            }
            return { ...d, status, progress, message, endTime: stage === totalSteps ? dayjs().format('YYYY-MM-DD HH:mm:ss') : undefined }
          })
          const successCount = newDevices.filter(d => d.status === 'success').length
          const failedCount = newDevices.filter(d => d.status === 'failed').length
          const inProgressCount = newDevices.filter(d => ['downloading', 'upgrading'].includes(d.status)).length
          const pendingCount = newDevices.filter(d => d.status === 'pending').length
          return {
            ...t,
            devices: newDevices,
            successCount, failedCount, inProgressCount, pendingCount,
            status: successCount + failedCount === t.totalDevices ? 'completed' : 'running'
          }
        }))
        if (step === totalSteps) {
          setIsSimulating(false)
          message.success('升级任务已完成')
        }
      }, step * perStepDelay)
    }
  }

  const handleConfirmUpgrade = () => {
    upgradeForm.validateFields().then(values => {
      if (selectedDeviceIds.length === 0) {
        message.warning('请选择要升级的设备')
        return
      }
      const now = dayjs()
      const scheduledTime = values.scheduled && values.scheduleTime
        ? values.scheduleTime.format('YYYY-MM-DD HH:mm:ss')
        : undefined
      const taskId = `TASK${now.format('YYYYMMDDHHmmss')}`
      const devices = eligibleDevices
        .filter(d => selectedDeviceIds.includes(d.id))
        .map(d => ({
          id: d.id,
          deviceId: d.deviceId,
          deviceName: d.name,
          status: 'pending' as const,
          progress: 0,
          message: scheduledTime ? '等待定时执行...' : '等待开始升级...',
          startTime: scheduledTime ? undefined : now.format('YYYY-MM-DD HH:mm:ss')
        }))
      const newTask: UpgradeTask = {
        taskId,
        taskName: values.taskName || `${selectedFirmware!.model} 固件升级`,
        firmwareId: selectedFirmware!.id,
        firmwareVersion: selectedFirmware!.version,
        firmwareModel: selectedFirmware!.model,
        totalDevices: devices.length,
        successCount: 0,
        failedCount: 0,
        inProgressCount: 0,
        pendingCount: devices.length,
        scheduledTime,
        status: scheduledTime ? 'pending' : 'running',
        createTime: now.format('YYYY-MM-DD HH:mm:ss'),
        createBy: '张运维',
        devices
      }
      setUpgradeTasks(prev => [newTask, ...prev])
      setUpgradeOpen(false)
      setActiveTab('tasks')
      if (!scheduledTime) {
        simulateUpgradeProgress(newTask)
        message.success(`升级任务已创建，正在升级 ${devices.length} 台设备`)
      } else {
        message.success(`定时升级任务已创建，将于 ${scheduledTime} 执行（${devices.length}台）`)
      }
    })
  }

  const viewTaskDetail = (task: UpgradeTask) => {
    setCurrentTask(task)
    setTaskDetailOpen(true)
  }

  const firmwareColumns: ColumnsType<Firmware> = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: 120,
      render: (t, r) => (
        <Space>
          <FileZipOutlined style={{ color: '#1890ff' }} />
          <a style={{ fontWeight: 600, fontSize: 14 }}>{t}</a>
          {r.status === 'active' && <Tag color="green" style={{ fontSize: 11 }}>最新</Tag>}
        </Space>
      )
    },
    {
      title: '适用型号',
      dataIndex: 'model',
      key: 'model',
      width: 140,
      render: (t) => <Tag color="blue" style={{ fontSize: 12 }}>{t}</Tag>
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      sorter: (a, b) => a.sizeBytes - b.sizeBytes
    },
    {
      title: 'MD5校验',
      dataIndex: 'md5',
      key: 'md5',
      width: 130,
      render: (t) => <Text code style={{ fontSize: 11 }}>{t}</Text>
    },
    {
      title: '已升级设备',
      dataIndex: 'deviceCount',
      key: 'deviceCount',
      width: 110,
      sorter: (a, b) => a.deviceCount - b.deviceCount,
      render: (v, r) => (
        <Space>
          <DeviceTabletOutlined style={{ color: token.colorTextSecondary }} />
          <Text strong style={{ color: r.status === 'active' ? '#52c41a' : undefined }}>
            {v} 台
          </Text>
        </Space>
      )
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (t) => <Tooltip title={t}><Text type="secondary">{t}</Text></Tooltip>
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime',
      key: 'uploadTime',
      width: 160,
      sorter: (a, b) => a.uploadTime.localeCompare(b.uploadTime),
      render: (t) => <Text type="secondary" style={{ fontSize: 12 }}>{t}</Text>
    },
    {
      title: '上传者',
      dataIndex: 'uploader',
      key: 'uploader',
      width: 90
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="批量升级">
            <Button
              type="primary"
              size="small"
              icon={<CloudUploadOutlined />}
              onClick={() => handleOpenUpgrade(r)}
              disabled={r.status === 'deprecated'}
            >
              升级
            </Button>
          </Tooltip>
          <Tooltip title="下载">
            <Button type="text" size="small" icon={<DownloadOutlined />} />
          </Tooltip>
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteFirmware(r)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  const taskColumns: ColumnsType<UpgradeTask> = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 200,
      render: (t, r) => (
        <a onClick={() => viewTaskDetail(r)} style={{ fontWeight: 500 }}>{t}</a>
      )
    },
    {
      title: '固件版本',
      key: 'firmware',
      width: 180,
      render: (_, r) => (
        <Space>
          <Tag color="blue">{r.firmwareModel}</Tag>
          <Text code style={{ fontSize: 12 }}>{r.firmwareVersion}</Text>
        </Space>
      )
    },
    {
      title: '升级进度',
      key: 'progress',
      width: 240,
      render: (_, r) => {
        const percent = r.totalDevices > 0 ? Math.round(((r.successCount + r.failedCount) / r.totalDevices) * 100) : 0
        return (
          <div>
            <Progress
              percent={percent}
              size="small"
              status={r.status === 'completed' && r.failedCount > 0 ? 'exception' : r.status === 'completed' ? 'success' : 'active'}
              strokeColor={r.status === 'completed' && r.failedCount === 0 ? '#52c41a' : undefined}
            />
            <div style={{ display: 'flex', gap: 10, fontSize: 11, marginTop: 2 }}>
              <Text type="secondary">共{r.totalDevices}</Text>
              <Text type="success">成功{r.successCount}</Text>
              {r.failedCount > 0 && <Text type="danger">失败{r.failedCount}</Text>}
              {r.inProgressCount > 0 && <Text type="warning">进行{r.inProgressCount}</Text>}
            </div>
          </div>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => {
        const map: Record<string, { label: string; color: string; icon: any }> = {
          pending: { label: '待执行', color: 'default', icon: ClockCircleOutlined },
          running: { label: '进行中', color: 'processing', icon: SyncOutlined },
          completed: { label: '已完成', color: 'success', icon: CheckCircleOutlined },
          cancelled: { label: '已取消', color: 'default', icon: CloseCircleOutlined }
        }
        const cfg = map[s]
        return <Tag color={cfg.color} icon={<cfg.icon spin={s === 'running'} />}>{cfg.label}</Tag>
      }
    },
    {
      title: '计划时间',
      dataIndex: 'scheduledTime',
      key: 'scheduledTime',
      width: 160,
      render: (t) => t
        ? <Text type="secondary" style={{ fontSize: 12 }}><CalendarOutlined /> {t}</Text>
        : <Tag color="green" style={{ fontSize: 11 }}>立即执行</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150,
      render: (t) => <Text type="secondary" style={{ fontSize: 12 }}>{t}</Text>
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, r) => (
        <Space size={2}>
          <Button type="link" size="small" onClick={() => viewTaskDetail(r)}>详情</Button>
          {r.status === 'running' && <Button type="link" size="small" danger>取消</Button>}
        </Space>
      )
    }
  ]

  const overallStats = useMemo(() => {
    const totalDevices = mockFirmwares.reduce((s, f) => s + f.deviceCount, 0)
    const active = mockFirmwares.filter(f => f.status === 'active').length
    const running = upgradeTasks.filter(t => t.status === 'running').length
    return {
      firmwares: mockFirmwares.length,
      activeFirmwares: active,
      devices: totalDevices,
      runningTasks: running
    }
  }, [upgradeTasks])

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { label: '固件总数', value: overallStats.firmwares, color: '#1890ff', icon: <CloudOutlined /> },
          { label: '活跃版本', value: overallStats.activeFirmwares, color: '#52c41a', icon: <CheckCircleOutlined /> },
          { label: '覆盖设备', value: overallStats.devices, color: '#722ed1', icon: <DeviceTabletOutlined /> },
          { label: '升级中任务', value: overallStats.runningTasks, color: '#faad14', icon: <SyncOutlined spin={overallStats.runningTasks > 0} /> }
        ].map((s, i) => (
          <Col xs={12} sm={12} md={6} key={i}>
            <Card bordered={false} style={{ borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: `${s.color}15`, color: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20
                }}>
                  {s.icon}
                </div>
                <div>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>}
                    value={s.value}
                    valueStyle={{ color: s.color, fontSize: 22, fontWeight: 600 }}
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        tabList={[
          { key: 'list', label: <Space><CloudOutlined />固件版本库</Space> },
          { key: 'tasks', label: <Space><HistoryOutlined />升级任务 <Badge count={overallStats.runningTasks} offset={[2, -2]} /></Space> }
        ]}
        activeTabKey={activeTab}
        onTabChange={(k) => setActiveTab(k as any)}
        tabBarExtraContent={activeTab === 'list' ? (
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>
            上传固件
          </Button>
        ) : (
          <Space>
            {isSimulating && <Tag color="processing"><SyncOutlined spin />正在模拟升级进度...</Tag>}
            <Button icon={<ReloadOutlined />}>刷新</Button>
          </Space>
        )}
      >
        {activeTab === 'list' ? (
          <>
            <Space wrap style={{ marginBottom: 16 }} size={[8, 8]}>
              <Input
                placeholder="搜索版本号/型号"
                prefix={<SearchOutlined />}
                allowClear
                style={{ width: 220 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Select
                placeholder="选择型号"
                allowClear
                style={{ width: 160 }}
                options={modelOptions}
                value={filterModel}
                onChange={setFilterModel}
              />
              <Button icon={<ReloadOutlined />}>刷新</Button>
            </Space>

            <Table<Firmware>
              columns={firmwareColumns}
              dataSource={filteredFirmwares}
              rowKey="id"
              size="middle"
              scroll={{ x: 1400 }}
              pagination={{
                showSizeChanger: true,
                showTotal: (t) => `共 ${t} 个固件版本`
              }}
            />
          </>
        ) : (
          upgradeTasks.length === 0 ? (
            <Empty
              description={
                <Space direction="vertical" size={8} style={{ padding: '40px 0' }}>
                  <InboxOutlined style={{ fontSize: 48, color: token.colorTextTertiary }} />
                  <Text type="secondary">暂无升级任务</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>请在固件版本库选择固件，发起批量升级</Text>
                </Space>
              }
            />
          ) : (
            <Table<UpgradeTask>
              columns={taskColumns}
              dataSource={upgradeTasks}
              rowKey="taskId"
              size="middle"
              pagination={{ showTotal: (t) => `共 ${t} 个任务` }}
            />
          )
        )}
      </Card>

      <Modal
        title={
          <Space>
            <UploadOutlined style={{ color: '#52c41a' }} />
            上传固件
          </Space>
        }
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <FirmwareUpload
          modelOptions={modelOptions}
          onSuccess={(info) => {
            message.success(`固件上传成功：${info.version}`)
            setUploadOpen(false)
          }}
          onCancel={() => setUploadOpen(false)}
        />
      </Modal>

      <Modal
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#faad14' }} />
            批量固件升级
            {selectedFirmware && (
              <Space>
                <Tag color="blue">{selectedFirmware.model}</Tag>
                <Tag color="green">{selectedFirmware.version}</Tag>
              </Space>
            )}
          </Space>
        }
        open={upgradeOpen}
        onCancel={() => setUpgradeOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setUpgradeOpen(false)}>取消</Button>,
          <Button
            key="confirm"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleConfirmUpgrade}
          >
            确认升级
          </Button>
        ]}
        width={800}
        destroyOnClose
      >
        {selectedFirmware && (
          <Form form={upgradeForm} layout="vertical">
            <Alert
              type="info"
              showIcon
              message={`即将将 ${selectedFirmware.model} 设备升级到 ${selectedFirmware.version} 版本`}
              description={selectedFirmware.description}
              style={{ marginBottom: 16 }}
            />

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="taskName"
                  label="任务名称"
                  rules={[{ required: true, message: '请输入任务名称' }]}
                  initialValue={`${selectedFirmware.model}-${selectedFirmware.version} 批量升级`}
                >
                  <Input prefix={<CloudUploadOutlined />} placeholder="请输入升级任务名称" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="model"
                  label="适用型号"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="scheduled" valuePropName="checked" initialValue={false}>
              <Checkbox>
                <CalendarOutlined /> 定时升级
              </Checkbox>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prev, cur) => prev.scheduled !== cur.scheduled}
            >
              {({ getFieldValue }) => getFieldValue('scheduled') ? (
                <Form.Item
                  name="scheduleTime"
                  label="计划执行时间"
                  rules={[{ required: true, message: '请选择执行时间' }]}
                >
                  <DatePicker
                    showTime
                    style={{ width: '100%' }}
                    disabledDate={(d) => d && d.isBefore(dayjs().startOf('minute'))}
                    placeholder="选择升级执行时间"
                  />
                </Form.Item>
              ) : null}
            </Form.Item>

            <Divider orientation="left" orientationMargin={0} plain>
              <Space>
                <DeviceTabletOutlined />
                选择升级设备
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                  （共 {eligibleDevices.length} 台可升级，已选 {selectedDeviceIds.length} 台）
                </Text>
              </Space>
            </Divider>

            <div style={{
              maxHeight: 300, overflow: 'auto',
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 8, padding: 8
            }}>
              {eligibleDevices.length === 0 ? (
                <Empty description="暂无需要升级的设备" style={{ padding: '30px 0' }} />
              ) : (
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', padding: '8px 12px', background: '#fafafa', borderRadius: 6, marginBottom: 4 }}>
                    <div style={{ width: 30 }}>
                      <input
                        type="checkbox"
                        checked={selectedDeviceIds.length === eligibleDevices.length && eligibleDevices.length > 0}
                        onChange={(e) => setSelectedDeviceIds(e.target.checked ? eligibleDevices.map(d => d.id) : [])}
                      />
                    </div>
                    <div style={{ flex: 1, fontWeight: 500 }}>设备编号 / 名称</div>
                    <div style={{ width: 100, textAlign: 'center' }}>当前版本</div>
                    <div style={{ width: 80, textAlign: 'center' }}>状态</div>
                  </div>
                  {eligibleDevices.map(d => (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDeviceIds(prev =>
                        prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id]
                      )}
                      style={{
                        display: 'flex', alignItems: 'center',
                        padding: '8px 12px', borderRadius: 6,
                        cursor: 'pointer',
                        background: selectedDeviceIds.includes(d.id) ? '#e6f4ff' : undefined,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = selectedDeviceIds.includes(d.id) ? '#bae0ff' : '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.background = selectedDeviceIds.includes(d.id) ? '#e6f4ff' : undefined}
                    >
                      <div style={{ width: 30 }}>
                        <input
                          type="checkbox"
                          checked={selectedDeviceIds.includes(d.id)}
                          readOnly
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Space>
                          <Text strong>{d.deviceId}</Text>
                          <Text type="secondary" ellipsis={{ tooltip: d.name, style: { maxWidth: 180 } }} style={{ fontSize: 12 }}>
                            {d.name}
                          </Text>
                        </Space>
                      </div>
                      <div style={{ width: 100, textAlign: 'center' }}>
                        {d.currentVersion
                          ? <Tag color="warning" style={{ fontSize: 11 }}>{d.currentVersion}</Tag>
                          : <Tag style={{ fontSize: 11 }}>未知</Tag>}
                      </div>
                      <div style={{ width: 80, textAlign: 'center' }}>
                        <Badge
                          color={d.status === 'online' ? '#52c41a' : '#faad14'}
                          text={d.status === 'online' ? '在线' : '告警'}
                        />
                      </div>
                    </div>
                  ))}
                </Space>
              )}
            </div>
          </Form>
        )}
      </Modal>

      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            升级任务详情
          </Space>
        }
        placement="right"
        width={600}
        open={taskDetailOpen}
        onClose={() => setTaskDetailOpen(false)}
        extra={
          currentTask && (
            <Space>
              {currentTask.status === 'running' && (
                <Button size="small" icon={<SyncOutlined spin />}>
                  监控中
                </Button>
              )}
              <Button size="small" icon={<ReloadOutlined />} onClick={() => setCurrentTask({ ...currentTask })}>
                刷新
              </Button>
            </Space>
          )
        }
      >
        {currentTask && (
          <UpgradeProgress task={currentTask} />
        )}
      </Drawer>
    </div>
  )
}

export default Firmware

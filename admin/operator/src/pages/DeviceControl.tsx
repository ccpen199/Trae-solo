import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Tag,
  Input,
  Select,
  Table,
  Button,
  Modal,
  Form,
  Descriptions,
  Progress,
  Steps,
  Popconfirm,
  message,
  Empty,
  Badge,
  Tooltip,
  Drawer,
  List,
  theme,
  Divider
} from 'antd'
import {
  SearchOutlined,
  PoweroffOutlined,
  SendOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  DashboardOutlined,
  EnvironmentOutlined,
  HistoryOutlined,
  FilterOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import ParamsForm from '@/components/ParamsForm'
import RemoteControlPanel from '@/components/RemoteControlPanel'

const { Title, Text } = Typography
const { useToken } = theme

interface Device {
  id: string
  deviceId: string
  name: string
  model: string
  status: 'online' | 'offline' | 'warning'
  project: string
  location: string
  firmwareVersion: string
  lastHeartbeat: string
  temperature: number
  power: number
  uvStatus: boolean
  selected?: boolean
}

interface CommandRecord {
  id: string
  commandId: string
  type: 'restart' | 'params'
  deviceId: string
  deviceName: string
  status: 'pending' | 'sending' | 'sent' | 'executing' | 'success' | 'failed' | 'timeout'
  progress: number
  message?: string
  params?: any
  createTime: string
  updateTime: string
}

const mockDevices: Device[] = Array.from({ length: 28 }).map((_, i) => {
  const statuses: Device['status'][] = ['online', 'online', 'online', 'online', 'online', 'online', 'online', 'offline', 'warning']
  const projects = ['阳光花园', '幸福里小区', '翠湖花园', '明月苑', '金桂家园', '星河湾']
  const models = ['RO-MINI-200', 'RO-PRO-500', 'RO-STD-300', 'RO-MAX-800']
  const status = statuses[i % statuses.length]
  return {
    id: `DEV${1000 + i}`,
    deviceId: `RO-${String.fromCharCode(65 + (i % 3))}${String(i + 1).padStart(3, '0')}`,
    name: `${projects[i % projects.length]}${Math.floor(i / 6) + 1}号机组`,
    model: models[i % models.length],
    status,
    project: projects[i % projects.length],
    location: `${projects[i % projects.length]}${Math.floor(i / 6) + 1}号楼${(i % 3) + 1}单元门口`,
    firmwareVersion: `v2.${1 + (i % 3)}.${i % 8}`,
    lastHeartbeat: status === 'offline' ? dayjs().subtract(i + 2, 'hour').format('YYYY-MM-DD HH:mm:ss') : dayjs().subtract(i % 5, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    temperature: status === 'warning' ? 46 + (i % 5) : 25 + (i % 12),
    power: status === 'offline' ? 0 : 150 + (i % 30) * 10,
    uvStatus: i % 3 !== 0
  }
})

const statusColorMap: Record<string, string> = {
  pending: '#bfbfbf',
  sending: '#1890ff',
  sent: '#1890ff',
  executing: '#faad14',
  success: '#52c41a',
  failed: '#ff4d4f',
  timeout: '#8c8c8c'
}

const statusTextMap: Record<string, string> = {
  pending: '等待中',
  sending: '发送中',
  sent: '已发送',
  executing: '执行中',
  success: '成功',
  failed: '失败',
  timeout: '超时'
}

function DeviceControl() {
  const { token } = useToken()
  const [searchForm] = Form.useForm()
  const [selectedDevices, setSelectedDevices] = useState<Device[]>([])
  const [commandRecords, setCommandRecords] = useState<CommandRecord[]>([])
  const [paramsModalOpen, setParamsModalOpen] = useState(false)
  const [paramsLoading, setParamsLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<CommandRecord | null>(null)
  const [activeTab, setActiveTab] = useState<'command' | 'record'>('command')
  const [filterStatus, setFilterStatus] = useState<'all' | Device['status']>('all')

  const filteredDevices = useMemo(() => {
    const values = searchForm.getFieldsValue()
    return mockDevices.filter(d => {
      if (filterStatus !== 'all' && d.status !== filterStatus) return false
      if (values.keyword) {
        const kw = values.keyword.toLowerCase()
        if (!d.deviceId.toLowerCase().includes(kw) &&
            !d.name.toLowerCase().includes(kw) &&
            !d.location.toLowerCase().includes(kw)) return false
      }
      if (values.project && d.project !== values.project) return false
      return true
    })
  }, [searchForm, filterStatus])

  const projectOptions = useMemo(() =>
    Array.from(new Set(mockDevices.map(d => d.project))).map(p => ({ label: p, value: p }))
  , [])

  const isSelected = (id: string) => selectedDevices.some(d => d.id === id)

  const toggleSelect = (device: Device) => {
    if (device.status === 'offline') {
      message.warning('离线设备无法进行远程操作')
      return
    }
    setSelectedDevices(prev =>
      isSelected(device.id)
        ? prev.filter(d => d.id !== device.id)
        : [...prev, device]
    )
  }

  const toggleSelectAll = () => {
    const onlineFiltered = filteredDevices.filter(d => d.status !== 'offline')
    const allSelected = onlineFiltered.every(d => isSelected(d.id))
    setSelectedDevices(allSelected ? [] : onlineFiltered)
  }

  const clearSelected = () => setSelectedDevices([])

  const generateCommandId = () => `CMD${Date.now()}${Math.floor(Math.random() * 1000)}`

  const simulateCommandProgress = (records: CommandRecord[]) => {
    records.forEach(record => {
      const steps = [
        { status: 'sending', progress: 20, delay: 300 },
        { status: 'sent', progress: 40, delay: 600 },
        { status: 'executing', progress: 60, delay: 1000 },
        { status: 'executing', progress: 80, delay: 1500 },
        { status: Math.random() > 0.1 ? 'success' : 'failed', progress: 100, delay: 2200 + Math.random() * 1000 }
      ]
      steps.forEach((step, idx) => {
        setTimeout(() => {
          setCommandRecords(prev => prev.map(r =>
            r.id === record.id
              ? {
                  ...r,
                  status: step.status as CommandRecord['status'],
                  progress: step.progress,
                  message: idx === steps.length - 1
                    ? (step.status === 'success' ? '指令执行完成' : '执行失败，请检查设备状态')
                    : step.status === 'sending' ? '正在发送指令到设备...'
                    : step.status === 'sent' ? '指令已送达设备'
                    : step.status === 'executing' ? '设备正在执行指令...'
                    : r.message,
                  updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
                }
              : r
          ))
        }, step.delay)
      })
    })
  }

  const handleRestart = (devices?: Device[]) => {
    const target = devices || selectedDevices
    if (target.length === 0) {
      message.warning('请先选择设备')
      return
    }
    Modal.confirm({
      title: `确认${target.length > 1 ? '批量' : ''}远程重启`,
      icon: <PoweroffOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <p>即将重启以下 <Text strong type="danger">{target.length}</Text> 台设备：</p>
          <div style={{ maxHeight: 180, overflow: 'auto', background: '#fafafa', padding: 12, borderRadius: 8 }}>
            <Space wrap size={[8, 4]}>
              {target.map(d => (
                <Tag key={d.id} color="blue">
                  {d.deviceId}
                </Tag>
              ))}
            </Space>
          </div>
          <p style={{ marginTop: 12, color: '#faad14' }}>
            <ClockCircleOutlined /> 设备重启预计需要 2-5 分钟，期间服务将暂停。
          </p>
        </div>
      ),
      okText: '确认重启',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
        const newRecords: CommandRecord[] = target.map(d => ({
          id: `${generateCommandId()}-${d.id}`,
          commandId: generateCommandId(),
          type: 'restart',
          deviceId: d.deviceId,
          deviceName: d.name,
          status: 'pending',
          progress: 0,
          message: '已创建重启指令，等待发送...',
          createTime: now,
          updateTime: now
        }))
        setCommandRecords(prev => [...newRecords, ...prev])
        simulateCommandProgress(newRecords)
        setActiveTab('record')
        message.success(`已发送 ${target.length} 条重启指令`)
      }
    })
  }

  const handleParamsSubmit = (values: any) => {
    if (selectedDevices.length === 0) {
      message.warning('请先选择设备')
      return
    }
    setParamsLoading(true)
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const newRecords: CommandRecord[] = selectedDevices.map(d => ({
      id: `${generateCommandId()}-${d.id}`,
      commandId: generateCommandId(),
      type: 'params',
      deviceId: d.deviceId,
      deviceName: d.name,
      status: 'pending',
      progress: 0,
      params: values,
      message: '已创建参数下发指令，等待发送...',
      createTime: now,
      updateTime: now
    }))
    setTimeout(() => {
      setParamsLoading(false)
      setParamsModalOpen(false)
      setCommandRecords(prev => [...newRecords, ...prev])
      simulateCommandProgress(newRecords)
      setActiveTab('record')
      message.success(`已发送 ${selectedDevices.length} 条参数下发指令`)
      clearSelected()
    }, 800)
  }

  const viewRecordDetail = (record: CommandRecord) => {
    setSelectedRecord(record)
    setDetailOpen(true)
  }

  const deviceColumns: ColumnsType<Device> = [
    {
      title: '设备编号',
      dataIndex: 'deviceId',
      key: 'deviceId',
      width: 120,
      render: (t, r) => (
        <Space>
          <Badge
            color={r.status === 'online' ? '#52c41a' : r.status === 'warning' ? '#faad14' : '#bfbfbf'}
          />
          <a onClick={() => toggleSelect(r)} style={{ fontWeight: 500, textDecoration: isSelected(r.id) ? 'underline' : 'none' }}>
            {t}
          </a>
        </Space>
      )
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s) => (
        <Tag
          color={s === 'warning' ? 'warning' : s === 'online' ? 'success' : 'default'}
          style={{ marginInlineEnd: 0 }}
        >
          {s === 'online' ? '在线' : s === 'warning' ? '告警' : '离线'}
        </Tag>
      )
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 120
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
      render: (t) => (
        <Tooltip title={t}>
          <Space size={4}>
            <EnvironmentOutlined style={{ color: token.colorTextTertiary }} />
            <span>{t}</span>
          </Space>
        </Tooltip>
      )
    },
    {
      title: '温度',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 90,
      render: (t: number) => t > 45
        ? <Text type="danger" strong>{t}°C</Text>
        : <Text>{t}°C</Text>
    },
    {
      title: '功率',
      dataIndex: 'power',
      key: 'power',
      width: 90,
      render: (p) => `${p}W`
    },
    {
      title: 'UV灯',
      dataIndex: 'uvStatus',
      key: 'uvStatus',
      width: 80,
      render: (on) => on
        ? <Tag color="green" icon={<BulbOutlined />}>开</Tag>
        : <Tag icon={<BulbOutlined />}>关</Tag>
    },
    {
      title: '固件',
      dataIndex: 'firmwareVersion',
      key: 'firmwareVersion',
      width: 90,
      render: (t) => <Text code style={{ fontSize: 12 }}>{t}</Text>
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, r) => (
        <Space size={4}>
          <Button
            type={isSelected(r.id) ? 'primary' : 'default'}
            size="small"
            onClick={() => toggleSelect(r)}
            disabled={r.status === 'offline'}
          >
            {isSelected(r.id) ? '已选择' : '选择'}
          </Button>
          <Popconfirm
            title={`确认重启 ${r.deviceId}？`}
            okText="确认"
            cancelText="取消"
            onConfirm={() => handleRestart([r])}
            disabled={r.status === 'offline'}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<PoweroffOutlined />}
              disabled={r.status === 'offline'}
            >
              重启
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const commandColumns: ColumnsType<CommandRecord> = [
    {
      title: '指令ID',
      dataIndex: 'commandId',
      key: 'commandId',
      width: 160,
      render: (t) => <Text code style={{ fontSize: 11 }}>{t}</Text>
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (t) => (
        <Tag icon={t === 'restart' ? <PoweroffOutlined /> : <SendOutlined />} color={t === 'restart' ? 'red' : 'blue'}>
          {t === 'restart' ? '远程重启' : '参数下发'}
        </Tag>
      )
    },
    {
      title: '设备',
      dataIndex: 'deviceId',
      key: 'deviceId',
      width: 110,
      render: (t, r) => (
        <Tooltip title={r.deviceName}>
          <Tag>{t}</Tag>
        </Tooltip>
      )
    },
    {
      title: '执行进度',
      key: 'progress',
      width: 200,
      render: (_, r) => (
        <Progress
          percent={r.progress}
          size="small"
          status={r.status === 'success' ? 'success' : r.status === 'failed' ? 'exception' : r.status === 'timeout' ? 'exception' : 'active'}
          strokeColor={statusColorMap[r.status]}
          style={{ marginBottom: 0 }}
        />
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => {
        const Icon = s === 'success' ? CheckCircleOutlined : s === 'failed' ? CloseCircleOutlined : SyncOutlined
        return (
          <Tag color={s === 'success' ? 'green' : s === 'failed' ? 'red' : s === 'timeout' ? 'default' : 'blue'} icon={<Icon spin={s === 'sending' || s === 'executing'} />}>
            {statusTextMap[s]}
          </Tag>
        )
      }
    },
    {
      title: '信息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (t) => <Text type="secondary" style={{ fontSize: 12 }}>{t}</Text>
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150,
      render: (t) => (
        <Tooltip title={t}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(t).fromNow()}
          </Text>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => viewRecordDetail(r)}>
          详情
        </Button>
      )
    }
  ]

  const commandStats = useMemo(() => ({
    total: commandRecords.length,
    pending: commandRecords.filter(r => !['success', 'failed', 'timeout'].includes(r.status)).length,
    success: commandRecords.filter(r => r.status === 'success').length,
    failed: commandRecords.filter(r => ['failed', 'timeout'].includes(r.status)).length
  }), [commandRecords])

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <RemoteControlPanel
            selectedDevices={selectedDevices}
            onClearSelected={clearSelected}
            onRestart={() => handleRestart()}
            onOpenParams={() => setParamsModalOpen(true)}
          />
        </Col>

        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            style={{ borderRadius: 12 }}
            tabList={[
              { key: 'command', label: <Space><SearchOutlined />选择设备</Space> },
              { key: 'record', label: <Space><HistoryOutlined />执行记录 <Badge count={commandStats.pending} offset={[2, -2]} /></Space> }
            ]}
            activeTabKey={activeTab}
            onTabChange={(k) => setActiveTab(k as any)}
            bodyStyle={{ padding: 0 }}
          >
            {activeTab === 'command' ? (
              <div style={{ padding: 16 }}>
                <Form form={searchForm} layout="inline" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
                  <Space wrap size={[8, 8]}>
                    <Form.Item name="keyword" style={{ marginBottom: 0 }}>
                      <Input
                        placeholder="搜索设备编号/名称/位置"
                        prefix={<SearchOutlined />}
                        allowClear
                        style={{ width: 240 }}
                      />
                    </Form.Item>
                    <Form.Item name="project" style={{ marginBottom: 0 }}>
                      <Select
                        placeholder="项目"
                        allowClear
                        style={{ width: 140 }}
                        options={projectOptions}
                      />
                    </Form.Item>
                    <Space size={4}>
                      {[
                        { k: 'all', label: '全部', color: '' },
                        { k: 'online', label: '在线', color: 'success' },
                        { k: 'warning', label: '告警', color: 'warning' },
                        { k: 'offline', label: '离线', color: 'default' }
                      ].map(({ k, label, color }) => (
                        <Tag.CheckableTag
                          key={k}
                          checked={filterStatus === k}
                          onChange={() => setFilterStatus(k as any)}
                          color={filterStatus === k ? color : undefined}
                        >
                          {label}
                        </Tag.CheckableTag>
                      ))}
                    </Space>
                  </Space>
                </Form>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    共 {filteredDevices.length} 台，
                    其中在线可操作 {filteredDevices.filter(d => d.status !== 'offline').length} 台
                  </Text>
                  <Space>
                    <Button
                      type="link"
                      size="small"
                      onClick={toggleSelectAll}
                      disabled={filteredDevices.filter(d => d.status !== 'offline').length === 0}
                    >
                      {filteredDevices.filter(d => d.status !== 'offline').every(d => isSelected(d.id)) ? '取消全选' : '全选可操作'}
                    </Button>
                  </Space>
                </div>

                <Table<Device>
                  columns={deviceColumns}
                  dataSource={filteredDevices}
                  rowKey="id"
                  size="small"
                  rowClassName={(r) => isSelected(r.id) ? 'table-row-selected' : ''}
                  onRow={(r) => ({
                    onClick: () => toggleSelect(r),
                    style: {
                      cursor: r.status === 'offline' ? 'not-allowed' : 'pointer',
                      background: isSelected(r.id) ? '#e6f4ff' : undefined
                    }
                  })}
                  scroll={{ y: 420 }}
                  pagination={{
                    pageSize: 8,
                    showSizeChanger: false,
                    showTotal: (t) => `共 ${t} 台`
                  }}
                />
              </div>
            ) : (
              <div style={{ padding: 16 }}>
                <Row gutter={12} style={{ marginBottom: 16 }}>
                  {[
                    { label: '总指令', value: commandStats.total, color: '#1890ff' },
                    { label: '执行中', value: commandStats.pending, color: '#faad14' },
                    { label: '成功', value: commandStats.success, color: '#52c41a' },
                    { label: '失败', value: commandStats.failed, color: '#ff4d4f' }
                  ].map((s, i) => (
                    <Col span={6} key={i}>
                      <Card size="small" bordered={false} style={{ borderRadius: 8, background: `${s.color}08`, textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.value}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>
                      </Card>
                    </Col>
                  ))}
                </Row>
                {commandRecords.length === 0 ? (
                  <Empty description="暂无执行记录" style={{ padding: '40px 0' }} />
                ) : (
                  <Table<CommandRecord>
                    columns={commandColumns}
                    dataSource={commandRecords}
                    rowKey="id"
                    size="small"
                    pagination={{
                      pageSize: 8,
                      showSizeChanger: false,
                      showTotal: (t) => `共 ${t} 条记录`
                    }}
                  />
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <Space>
            <SendOutlined style={{ color: '#52c41a' }} />
            批量参数下发
            {selectedDevices.length > 0 && (
              <Tag color="blue">{selectedDevices.length} 台设备</Tag>
            )}
          </Space>
        }
        open={paramsModalOpen}
        onCancel={() => setParamsModalOpen(false)}
        footer={null}
        width={560}
        destroyOnClose
      >
        {selectedDevices.length === 0 ? (
          <Empty description="请先选择设备" />
        ) : (
          <ParamsForm
            loading={paramsLoading}
            onSubmit={handleParamsSubmit}
            onCancel={() => setParamsModalOpen(false)}
          />
        )}
      </Modal>

      <Drawer
        title="指令执行详情"
        placement="right"
        width={480}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {selectedRecord && (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Card
              bordered={false}
              style={{
                borderRadius: 12,
                background: `${statusColorMap[selectedRecord.status]}08`,
                border: `1px solid ${statusColorMap[selectedRecord.status]}30`
              }}
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Row justify="space-between" align="middle">
                  <Tag
                    icon={selectedRecord.type === 'restart' ? <PoweroffOutlined /> : <SendOutlined />}
                    color={selectedRecord.type === 'restart' ? 'red' : 'blue'}
                    style={{ fontSize: 14, padding: '4px 12px' }}
                  >
                    {selectedRecord.type === 'restart' ? '远程重启' : '参数下发'}
                  </Tag>
                  <Tag
                    color={selectedRecord.status === 'success' ? 'green' : selectedRecord.status === 'failed' ? 'red' : 'blue'}
                    icon={selectedRecord.status === 'success' ? <CheckCircleOutlined /> : selectedRecord.status === 'failed' ? <CloseCircleOutlined /> : <SyncOutlined spin />}
                    style={{ fontSize: 14, padding: '4px 12px' }}
                  >
                    {statusTextMap[selectedRecord.status]}
                  </Tag>
                </Row>
                <Progress
                  percent={selectedRecord.progress}
                  size="small"
                  status={selectedRecord.status === 'success' ? 'success' : selectedRecord.status === 'failed' ? 'exception' : 'active'}
                  strokeColor={statusColorMap[selectedRecord.status]}
                />
                <Text style={{ fontSize: 13 }}>{selectedRecord.message}</Text>
              </Space>
            </Card>

            <Steps
              direction="vertical"
              size="small"
              current={
                selectedRecord.status === 'success' ? 5 :
                selectedRecord.status === 'failed' ? 4 :
                selectedRecord.status === 'executing' ? 3 :
                selectedRecord.status === 'sent' ? 2 :
                selectedRecord.status === 'sending' ? 1 : 0
              }
              status={selectedRecord.status === 'failed' ? 'error' : undefined}
              items={[
                { title: '创建指令', description: selectedRecord.createTime, status: 'finish' },
                { title: '发送指令', description: selectedRecord.progress >= 20 ? '指令已发出' : '' },
                { title: '设备接收', description: selectedRecord.progress >= 40 ? '设备已确认接收' : '' },
                { title: '执行指令', description: selectedRecord.progress >= 60 ? selectedRecord.message : '' },
                { title: '完成', description: selectedRecord.progress >= 100 ? (selectedRecord.status === 'success' ? '执行成功' : '执行失败') : '' }
              ]}
            />

            <Descriptions title="指令信息" column={1} bordered size="small" labelStyle={{ width: 110, background: '#fafafa' }}>
              <Descriptions.Item label="指令ID">{selectedRecord.commandId}</Descriptions.Item>
              <Descriptions.Item label="设备编号">{selectedRecord.deviceId}</Descriptions.Item>
              <Descriptions.Item label="设备名称">{selectedRecord.deviceName}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedRecord.createTime}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{selectedRecord.updateTime}</Descriptions.Item>
            </Descriptions>

            {selectedRecord.params && (
              <Descriptions title="下发参数" column={1} bordered size="small" labelStyle={{ width: 110, background: '#fafafa' }}>
                {Object.entries(selectedRecord.params).map(([k, v]) => (
                  <Descriptions.Item key={k} label={
                    k === 'targetTemperature' ? '目标温度' :
                    k === 'power' ? '功率限制' :
                    k === 'waterPrice' ? '水价' :
                    k === 'uvEnabled' ? 'UV灯' : k
                  }>
                    {k === 'uvEnabled' ? (v ? '开启' : '关闭') :
                     k === 'targetTemperature' ? `${v}°C` :
                     k === 'power' ? `${v}W` :
                     k === 'waterPrice' ? `¥${v}/吨` : String(v)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )}
          </Space>
        )}
      </Drawer>

      <style>{`
        .table-row-selected {
          background: #e6f4ff !important;
        }
        .table-row-selected:hover > td {
          background: #bae0ff !important;
        }
      `}</style>
    </div>
  )
}

export default DeviceControl

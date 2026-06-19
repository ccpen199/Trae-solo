import { useState, useMemo } from 'react'
import {
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  Form,
  Row,
  Col,
  Popconfirm,
  Tooltip,
  Badge,
  Drawer,
  Descriptions,
  Progress,
  Statistic,
  message,
  theme,
  Divider,
  Typography
} from 'antd'
const { Text } = Typography
import {
  SearchOutlined,
  EyeOutlined,
  PoweroffOutlined,
  SendOutlined,
  EnvironmentOutlined,
  WifiOutlined,
  WifiOffOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  ReloadOutlined,
  DashboardOutlined,
  FilterOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import type { ColumnsType, TableRowSelection } from 'antd/es/table'
import dayjs from 'dayjs'

const { Text } = Typography
const { useToken } = theme

interface DeviceTableDevice {
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
  waterPrice?: number
  targetTemperature?: number
  installDate?: string
  manufacturer?: string
  owner?: string
  contact?: string
}

interface DeviceTableProps {
  devices?: DeviceTableDevice[]
  showCheckbox?: boolean
  showActions?: boolean
  showFilters?: boolean
  selectedRowKeys?: React.Key[]
  onSelectionChange?: (keys: React.Key[]) => void
  onRestart?: (device: DeviceTableDevice) => void
  onSendParams?: (device: DeviceTableDevice) => void
  onViewDetail?: (device: DeviceTableDevice) => void
  onBatchRestart?: (ids: string[]) => void
  onBatchParams?: (ids: string[]) => void
  pageSize?: number
}

const statusConfig: Record<DeviceTableDevice['status'], { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  online: { label: '在线', color: '#52c41a', bgColor: '#f6ffed', icon: <WifiOutlined /> },
  offline: { label: '离线', color: '#bfbfbf', bgColor: '#fafafa', icon: <WifiOffOutlined /> },
  warning: { label: '告警', color: '#faad14', bgColor: '#fffbe6', icon: <ExclamationCircleOutlined /> }
}

const defaultDevices: DeviceTableDevice[] = Array.from({ length: 20 }).map((_, i) => {
  const statuses: DeviceTableDevice['status'][] = ['online', 'online', 'online', 'online', 'online', 'online', 'offline', 'warning']
  const projects = ['阳光花园', '幸福里小区', '翠湖花园', '明月苑', '金桂家园']
  const models = ['RO-MINI-200', 'RO-PRO-500', 'RO-STD-300', 'RO-MAX-800']
  const status = statuses[i % statuses.length]
  return {
    id: `DVC${1000 + i}`,
    deviceId: `RO-${String.fromCharCode(65 + (i % 3))}${String(i + 1).padStart(3, '0')}`,
    name: `${projects[i % projects.length]}${Math.floor(i / 5) + 1}号机组`,
    model: models[i % models.length],
    status,
    project: projects[i % projects.length],
    location: `${projects[i % projects.length]}${Math.floor(i / 5) + 1}号楼${(i % 3) + 1}单元`,
    firmwareVersion: `v2.${1 + (i % 3)}.${i % 8}`,
    lastHeartbeat: status === 'offline' ? dayjs().subtract(i + 2, 'hour').format('YYYY-MM-DD HH:mm:ss') : dayjs().subtract(i % 5, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    temperature: status === 'warning' ? 46 + (i % 5) : 25 + (i % 12),
    power: status === 'offline' ? 0 : 150 + (i % 30) * 10,
    uvStatus: i % 3 !== 0,
    waterPrice: 2.5 + (i % 3) * 0.5,
    targetTemperature: 35,
    installDate: dayjs().subtract(100 + i * 10, 'day').format('YYYY-MM-DD'),
    manufacturer: '某科技有限公司',
    owner: ['李经理', '王主任', '张物业'][i % 3],
    contact: `138${String(10000000 + i * 137).slice(0, 8)}`
  }
})

function DeviceTable({
  devices = defaultDevices,
  showCheckbox = true,
  showActions = true,
  showFilters = true,
  selectedRowKeys: externalSelected,
  onSelectionChange,
  onRestart,
  onSendParams,
  onViewDetail,
  onBatchRestart,
  onBatchParams,
  pageSize = 10
}: DeviceTableProps) {
  const { token } = useToken()
  const [form] = Form.useForm()
  const [internalSelected, setInternalSelected] = useState<React.Key[]>([])
  const [detailOpen, setDetailOpen] = useState(false)
  const [currentDevice, setCurrentDevice] = useState<DeviceTableDevice | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedKeys = externalSelected !== undefined ? externalSelected : internalSelected
  const setSelectedKeys = onSelectionChange || setInternalSelected

  const projectOptions = useMemo(() =>
    Array.from(new Set(devices.map(d => d.project))).map(p => ({ label: p, value: p }))
  , [devices])

  const modelOptions = useMemo(() =>
    Array.from(new Set(devices.map(d => d.model))).map(m => ({ label: m, value: m }))
  , [devices])

  const filtered = useMemo(() => {
    const v = form.getFieldsValue()
    return devices.filter(d => {
      if (v.status && d.status !== v.status) return false
      if (v.project && d.project !== v.project) return false
      if (v.model && d.model !== v.model) return false
      if (v.keyword) {
        const kw = v.keyword.toLowerCase()
        if (!d.deviceId.toLowerCase().includes(kw) && !d.name.toLowerCase().includes(kw) && !d.location.toLowerCase().includes(kw)) return false
      }
      return true
    })
  }, [devices, form])

  const handleRestart = (device: DeviceTableDevice) => {
    if (onRestart) onRestart(device)
    else message.success(`重启指令已发送到 ${device.deviceId}`)
  }

  const handleSendParams = (device: DeviceTableDevice) => {
    if (onSendParams) onSendParams(device)
    else message.info(`打开参数下发：${device.deviceId}`)
  }

  const handleViewDetail = (device: DeviceTableDevice) => {
    setCurrentDevice(device)
    setDetailOpen(true)
    onViewDetail?.(device)
  }

  const handleBatchRestart = () => {
    if (selectedKeys.length === 0) { message.warning('请先选择设备'); return }
    if (onBatchRestart) onBatchRestart(selectedKeys as string[])
    else message.success(`批量重启指令已发送（${selectedKeys.length}台）`)
  }

  const handleBatchParams = () => {
    if (selectedKeys.length === 0) { message.warning('请先选择设备'); return }
    if (onBatchParams) onBatchParams(selectedKeys as string[])
    else message.info(`批量参数下发（${selectedKeys.length}台）`)
  }

  const columns: ColumnsType<DeviceTableDevice> = [
    {
      title: '设备编号',
      dataIndex: 'deviceId',
      key: 'deviceId',
      width: 120,
      fixed: 'left' as const,
      render: (t, r) => (
        <Space>
          <Badge color={statusConfig[r.status].color} />
          <a onClick={() => handleViewDetail(r)} style={{ fontWeight: 500 }}>{t}</a>
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
      width: 100,
      render: (s: DeviceTableDevice['status']) => {
        const cfg = statusConfig[s]
        return <Tag color={s === 'warning' ? 'warning' : s === 'online' ? 'success' : 'default'} icon={cfg.icon} style={{ marginInlineEnd: 0 }}>{cfg.label}</Tag>
      },
      filters: [{ text: '在线', value: 'online' }, { text: '离线', value: 'offline' }, { text: '告警', value: 'warning' }],
      onFilter: (v, r) => r.status === v
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 130,
      render: (t) => <Tag style={{ marginInlineEnd: 0 }}>{t}</Tag>
    },
    {
      title: '所属项目',
      dataIndex: 'project',
      key: 'project',
      width: 120
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      width: 200,
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
      width: 100,
      sorter: (a, b) => a.temperature - b.temperature,
      render: (t: number, r) => (
        <Space>
          <RiseOutlined style={{ color: t > 45 ? '#ff4d4f' : token.colorTextSecondary }} />
          <Text strong style={{ color: t > 45 ? '#ff4d4f' : undefined }}>{t}°C</Text>
        </Space>
      )
    },
    {
      title: '功率',
      dataIndex: 'power',
      key: 'power',
      width: 90,
      sorter: (a, b) => a.power - b.power,
      render: (p) => <Space size={4}><ThunderboltOutlined style={{ color: token.colorTextTertiary }} /><Text>{p}W</Text></Space>
    },
    {
      title: 'UV灯',
      dataIndex: 'uvStatus',
      key: 'uvStatus',
      width: 80,
      render: (on) => <Tag icon={<BulbOutlined />} color={on ? 'green' : 'default'} style={{ marginInlineEnd: 0 }}>{on ? '开启' : '关闭'}</Tag>
    },
    {
      title: '固件',
      dataIndex: 'firmwareVersion',
      key: 'firmwareVersion',
      width: 90,
      render: (t) => <Text code style={{ fontSize: 12 }}>{t}</Text>
    },
    {
      title: '最后心跳',
      dataIndex: 'lastHeartbeat',
      key: 'lastHeartbeat',
      width: 150,
      sorter: (a, b) => a.lastHeartbeat.localeCompare(b.lastHeartbeat),
      render: (t) => (
        <Tooltip title={t}>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(t).fromNow()}</Text>
        </Tooltip>
      )
    },
    ...(showActions ? [{
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, r: DeviceTableDevice) => (
        <Space size={2}>
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)} />
          </Tooltip>
          <Tooltip title="远程重启">
            <Popconfirm title={`确认重启 ${r.deviceId}？`} description="重启需要2-5分钟" okText="确认" cancelText="取消" onConfirm={() => handleRestart(r)} disabled={r.status === 'offline'}>
              <Button type="text" size="small" danger icon={<PoweroffOutlined />} disabled={r.status === 'offline'} />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="参数下发">
            <Button type="text" size="small" icon={<SendOutlined />} onClick={() => handleSendParams(r)} disabled={r.status === 'offline'} />
          </Tooltip>
        </Space>
      )
    }] : [])
  ]

  const rowSelection: TableRowSelection<DeviceTableDevice> | undefined = showCheckbox ? {
    selectedRowKeys: selectedKeys,
    onChange: setSelectedKeys,
    getCheckboxProps: (r) => ({ disabled: r.status === 'offline' })
  } : undefined

  const stats = [
    { label: '总数', value: devices.length, color: '#1890ff' },
    { label: '在线', value: devices.filter(d => d.status === 'online').length, color: '#52c41a' },
    { label: '离线', value: devices.filter(d => d.status === 'offline').length, color: '#bfbfbf' },
    { label: '告警', value: devices.filter(d => d.status === 'warning').length, color: '#faad14' }
  ]

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {stats.map((s, i) => (
          <Col xs={12} sm={6} key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 8, background: `${s.color}08` }}>
              <DashboardOutlined style={{ fontSize: 20, color: s.color }} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: s.color }}>{s.value}</div>
                <Text type="secondary" style={{ fontSize: 11 }}>{s.label}</Text>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {showFilters && (
        <Form form={form} layout="vertical" onValuesChange={() => setLoading(true) || setTimeout(() => setLoading(false), 200)} style={{ marginBottom: 12 }}>
          <Row gutter={12} align="bottom">
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="keyword" label="搜索" style={{ marginBottom: 0 }}>
                <Input placeholder="设备编号/名称/位置" prefix={<SearchOutlined />} allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item name="status" label="状态" style={{ marginBottom: 0 }}>
                <Select placeholder="全部" allowClear options={[{ label: '在线', value: 'online' }, { label: '离线', value: 'offline' }, { label: '告警', value: 'warning' }]} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item name="project" label="项目" style={{ marginBottom: 0 }}>
                <Select placeholder="全部" allowClear showSearch options={projectOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item name="model" label="型号" style={{ marginBottom: 0 }}>
                <Select placeholder="全部" allowClear options={modelOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={3}>
              <Space>
                <Button icon={<FilterOutlined />} onClick={() => setLoading(true) || setTimeout(() => setLoading(false), 300)}>筛选</Button>
                <Button onClick={() => form.resetFields()}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      )}

      {showCheckbox && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            {selectedKeys.length > 0 && <Tag color="blue" closable onClose={() => setSelectedKeys([])}>已选 {selectedKeys.length} 台</Tag>}
            <Popconfirm title="确认批量重启？" okText="确认" onConfirm={handleBatchRestart} disabled={selectedKeys.length === 0}>
              <Button icon={<PoweroffOutlined />} disabled={selectedKeys.length === 0} danger>批量重启</Button>
            </Popconfirm>
            <Button icon={<SendOutlined />} onClick={handleBatchParams} disabled={selectedKeys.length === 0}>批量参数下发</Button>
          </Space>
          <Space>
            <Button icon={<DownloadOutlined />}>导出</Button>
            <Button icon={<ReloadOutlined />} onClick={() => setLoading(true) || setTimeout(() => setLoading(false), 500)}>刷新</Button>
          </Space>
        </div>
      )}

      <Table<DeviceTableDevice>
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        rowSelection={rowSelection}
        loading={loading}
        scroll={{ x: 1500 }}
        size="middle"
        pagination={{ showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 台`, pageSize }}
      />

      <Drawer
        title="设备详情"
        placement="right"
        width={520}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        extra={
          currentDevice && (
            <Space>
              <Popconfirm title="确认重启？" okText="确认" onConfirm={() => { handleRestart(currentDevice); setDetailOpen(false) }} disabled={currentDevice.status === 'offline'}>
                <Button icon={<PoweroffOutlined />} danger disabled={currentDevice.status === 'offline'}>重启</Button>
              </Popconfirm>
              <Button type="primary" icon={<SendOutlined />} onClick={() => { handleSendParams(currentDevice); setDetailOpen(false) }} disabled={currentDevice.status === 'offline'}>参数下发</Button>
            </Space>
          )
        }
      >
        {currentDevice && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div style={{ padding: 16, borderRadius: 10, background: statusConfig[currentDevice.status].bgColor, border: `1px solid ${statusConfig[currentDevice.status].color}30` }}>
              <Row align="middle" justify="space-between">
                <Space size={12}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: statusConfig[currentDevice.status].color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                    {statusConfig[currentDevice.status].icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{currentDevice.deviceId}</div>
                    <Text type="secondary">{currentDevice.name}</Text>
                  </div>
                </Space>
                <Tag color={currentDevice.status === 'warning' ? 'warning' : currentDevice.status === 'online' ? 'success' : 'default'} style={{ fontSize: 13 }}>
                  {statusConfig[currentDevice.status].label}
                </Tag>
              </Row>
            </div>

            <Card size="small" bordered={false} style={{ borderRadius: 8, background: '#fafafa' }}>
              <Row gutter={[12, 12]}>
                <Col span={12} style={{ textAlign: 'center' }}>
                  <Progress type="dashboard" percent={Math.round(currentDevice.temperature / 60 * 100)} size={68} strokeColor={currentDevice.temperature > 45 ? '#ff4d4f' : '#52c41a'} style={{ marginBottom: 0 }} />
                  <div style={{ marginTop: -6 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>温度</Text><br />
                    <Text strong>{currentDevice.temperature}°C</Text>
                  </div>
                </Col>
                <Col span={12} style={{ textAlign: 'center' }}>
                  <Progress type="dashboard" percent={Math.round(currentDevice.power / 500 * 100)} size={68} strokeColor="#1890ff" style={{ marginBottom: 0 }} />
                  <div style={{ marginTop: -6 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>功率</Text><br />
                    <Text strong>{currentDevice.power}W</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Statistic title={<Text type="secondary" style={{ fontSize: 11 }}>目标温度</Text>} value={currentDevice.targetTemperature} suffix="°C" valueStyle={{ fontSize: 14 }} />
                </Col>
                <Col span={12}>
                  <Statistic title={<Text type="secondary" style={{ fontSize: 11 }}>水价</Text>} value={currentDevice.waterPrice} suffix="元/吨" valueStyle={{ fontSize: 14 }} />
                </Col>
                <Col span={12}>
                  <Statistic title={<Text type="secondary" style={{ fontSize: 11 }}>UV灯</Text>} value={currentDevice.uvStatus ? '开启' : '关闭'} valueStyle={{ fontSize: 14, color: currentDevice.uvStatus ? '#52c41a' : undefined }} prefix={<BulbOutlined />} />
                </Col>
                <Col span={12}>
                  <Statistic title={<Text type="secondary" style={{ fontSize: 11 }}>固件</Text>} value={currentDevice.firmwareVersion} valueStyle={{ fontSize: 14 }} />
                </Col>
              </Row>
            </Card>

            <Descriptions title="基本信息" column={1} bordered size="small" labelStyle={{ width: 100, background: '#fafafa' }}>
              <Descriptions.Item label="设备ID">{currentDevice.deviceId}</Descriptions.Item>
              <Descriptions.Item label="名称">{currentDevice.name}</Descriptions.Item>
              <Descriptions.Item label="型号">{currentDevice.model}</Descriptions.Item>
              <Descriptions.Item label="项目">{currentDevice.project}</Descriptions.Item>
              <Descriptions.Item label="位置">{currentDevice.location}</Descriptions.Item>
              <Descriptions.Item label="安装日期">{currentDevice.installDate}</Descriptions.Item>
              <Descriptions.Item label="厂商">{currentDevice.manufacturer}</Descriptions.Item>
              <Descriptions.Item label="负责人">{currentDevice.owner}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentDevice.contact}</Descriptions.Item>
              <Descriptions.Item label="最后心跳">
                <Tooltip title={currentDevice.lastHeartbeat}><Text type="secondary">{dayjs(currentDevice.lastHeartbeat).fromNow()}</Text></Tooltip>
              </Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Drawer>
    </div>
  )
}

export default DeviceTable

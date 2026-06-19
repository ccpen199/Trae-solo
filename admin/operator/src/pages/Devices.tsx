import { useState, useMemo } from 'react'
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Form,
  Row,
  Col,
  Modal,
  Drawer,
  Descriptions,
  Statistic,
  Progress,
  Typography,
  Divider,
  Tooltip,
  Badge,
  Popconfirm,
  message,
  theme,
  Dropdown
} from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  SyncOutlined,
  SettingOutlined,
  ExportOutlined,
  EyeOutlined,
  PoweroffOutlined,
  SendOutlined,
  FilterOutlined,
  DownloadOutlined,
  MoreOutlined,
  EnvironmentOutlined,
  WifiOutlined,
  WifiOffOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  DashboardOutlined
} from '@ant-design/icons'
import type { ColumnsType, TableRowSelection } from 'antd/es/table'
import dayjs from 'dayjs'
import ParamsForm from '@/components/ParamsForm'

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
  waterPrice: number
  targetTemperature: number
  installDate: string
  manufacturer: string
  owner: string
  contact: string
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
    uvStatus: i % 3 !== 0,
    waterPrice: 2.5 + (i % 3) * 0.5,
    targetTemperature: 35,
    installDate: dayjs().subtract(100 + i * 10, 'day').format('YYYY-MM-DD'),
    manufacturer: '某科技有限公司',
    owner: ['李经理', '王主任', '张物业', '刘主管'][i % 4],
    contact: `138${String(10000000 + i * 137).slice(0, 8)}`
  }
})

const statusConfig: Record<Device['status'], { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  online: { label: '在线', color: '#52c41a', bgColor: '#f6ffed', icon: <WifiOutlined /> },
  offline: { label: '离线', color: '#bfbfbf', bgColor: '#fafafa', icon: <WifiOffOutlined /> },
  warning: { label: '告警', color: '#faad14', bgColor: '#fffbe6', icon: <ExclamationCircleOutlined /> }
}

function Devices() {
  const { token } = useToken()
  const [form] = Form.useForm()
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [loading, setLoading] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null)
  const [paramsModalOpen, setParamsModalOpen] = useState(false)
  const [paramsLoading, setParamsLoading] = useState(false)

  const projectOptions = useMemo(() =>
    Array.from(new Set(mockDevices.map(d => d.project))).map(p => ({ label: p, value: p }))
  , [])

  const modelOptions = useMemo(() =>
    Array.from(new Set(mockDevices.map(d => d.model))).map(m => ({ label: m, value: m }))
  , [])

  const filteredDevices = useMemo(() => {
    const values = form.getFieldsValue()
    return mockDevices.filter(d => {
      if (values.status && d.status !== values.status) return false
      if (values.project && d.project !== values.project) return false
      if (values.model && d.model !== values.model) return false
      if (values.keyword) {
        const kw = values.keyword.toLowerCase()
        if (!d.deviceId.toLowerCase().includes(kw) &&
            !d.name.toLowerCase().includes(kw) &&
            !d.location.toLowerCase().includes(kw)) return false
      }
      return true
    })
  }, [form])

  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 500)
  }

  const handleReset = () => {
    form.resetFields()
  }

  const handleViewDetail = (device: Device) => {
    setCurrentDevice(device)
    setDetailOpen(true)
  }

  const handleRestart = (device: Device) => {
    message.success(`正在发送重启指令到 ${device.deviceId}...`)
  }

  const handleBatchRestart = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择设备')
      return
    }
    Modal.confirm({
      title: '确认批量重启设备',
      icon: <PoweroffOutlined style={{ color: '#faad14' }} />,
      content: (
        <div>
          <p>即将重启以下 <Text strong>{selectedRowKeys.length}</Text> 台设备：</p>
          <Tag color="blue">{selectedRowKeys.slice(0, 5).join('、')}{selectedRowKeys.length > 5 ? `...等${selectedRowKeys.length}台` : ''}</Tag>
          <p style={{ marginTop: 8, color: '#faad14' }}>
            <ExclamationCircleOutlined /> 重启期间设备将暂停服务约2-5分钟，请确认操作。
          </p>
        </div>
      ),
      okText: '确认重启',
      cancelText: '取消',
      onOk: () => message.success(`批量重启指令已发送（${selectedRowKeys.length}台）`)
    })
  }

  const handleSendParams = (device: Device) => {
    setCurrentDevice(device)
    setParamsModalOpen(true)
  }

  const handleBatchParams = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择设备')
      return
    }
    setParamsModalOpen(true)
  }

  const handleParamsSubmit = (values: any) => {
    setParamsLoading(true)
    setTimeout(() => {
      setParamsLoading(false)
      setParamsModalOpen(false)
      const count = selectedRowKeys.length > 0 ? selectedRowKeys.length : 1
      message.success(`参数下发成功（${count}台）`)
      setSelectedRowKeys([])
    }, 1000)
  }

  const handleExport = () => {
    message.success(`正在导出 ${filteredDevices.length} 条设备数据...`)
  }

  const columns: ColumnsType<Device> = [
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
      ellipsis: true,
      render: (t) => <Text>{t}</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: Device['status']) => {
        const cfg = statusConfig[s]
        return (
          <Tag
            icon={cfg.icon}
            color={s === 'warning' ? 'warning' : s === 'online' ? 'success' : 'default'}
            style={{ marginInlineEnd: 0 }}
          >
            {cfg.label}
          </Tag>
        )
      }
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
      width: 120,
      render: (t) => <Text>{t}</Text>
    },
    {
      title: '安装位置',
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
      title: '当前温度',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 110,
      sorter: (a, b) => a.temperature - b.temperature,
      render: (t: number, r) => {
        const high = t > 45
        return (
          <Space>
            <RiseOutlined style={{ color: high ? '#ff4d4f' : token.colorTextSecondary }} />
            <Text strong style={{ color: high ? '#ff4d4f' : undefined }}>
              {t}°C
            </Text>
          </Space>
        )
      }
    },
    {
      title: '功率',
      dataIndex: 'power',
      key: 'power',
      width: 100,
      sorter: (a, b) => a.power - b.power,
      render: (p: number) => (
        <Space size={4}>
          <ThunderboltOutlined style={{ color: token.colorTextTertiary }} />
          <Text>{p}W</Text>
        </Space>
      )
    },
    {
      title: 'UV灯',
      dataIndex: 'uvStatus',
      key: 'uvStatus',
      width: 80,
      render: (on: boolean) => (
        <Tag
          icon={<BulbOutlined />}
          color={on ? 'green' : 'default'}
          style={{ marginInlineEnd: 0 }}
        >
          {on ? '开启' : '关闭'}
        </Tag>
      )
    },
    {
      title: '固件版本',
      dataIndex: 'firmwareVersion',
      key: 'firmwareVersion',
      width: 100,
      render: (t) => <Text code style={{ fontSize: 12 }}>{t}</Text>
    },
    {
      title: '最后心跳',
      dataIndex: 'lastHeartbeat',
      key: 'lastHeartbeat',
      width: 160,
      sorter: (a, b) => a.lastHeartbeat.localeCompare(b.lastHeartbeat),
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
      width: 200,
      fixed: 'right' as const,
      render: (_, r) => (
        <Space size={2}>
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(r)}
            />
          </Tooltip>
          <Tooltip title="远程重启">
            <Popconfirm
              title={`确认重启设备 ${r.deviceId}？`}
              description="重启期间设备将暂停服务约2-5分钟"
              okText="确认"
              cancelText="取消"
              onConfirm={() => handleRestart(r)}
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<PoweroffOutlined />}
                disabled={r.status === 'offline'}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="参数下发">
            <Button
              type="text"
              size="small"
              icon={<SendOutlined />}
              onClick={() => handleSendParams(r)}
              disabled={r.status === 'offline'}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                { key: 'upgrade', label: '固件升级', icon: <DashboardOutlined /> },
                { key: 'workorder', label: '创建工单', icon: <ExportOutlined /> }
              ]
            }}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ]

  const rowSelection: TableRowSelection<Device> = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (r) => ({ disabled: r.status === 'offline' })
  }

  const statsConfig = [
    { label: '设备总数', value: mockDevices.length, color: '#1890ff', icon: <DashboardOutlined /> },
    { label: '在线', value: mockDevices.filter(d => d.status === 'online').length, color: '#52c41a', icon: <WifiOutlined /> },
    { label: '离线', value: mockDevices.filter(d => d.status === 'offline').length, color: '#bfbfbf', icon: <WifiOffOutlined /> },
    { label: '告警', value: mockDevices.filter(d => d.status === 'warning').length, color: '#faad14', icon: <ExclamationCircleOutlined /> }
  ]

  return (
    <div>
      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
        <Row gutter={[16, 12]} align="middle">
          {statsConfig.map((s, idx) => (
            <Col xs={12} sm={12} md={6} key={idx}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: `${s.color}15`, color: s.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20
                  }}
                >
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
            </Col>
          ))}
        </Row>
      </Card>

      <Card bordered={false} style={{ borderRadius: 12 }} bodyStyle={{ padding: 16 }}>
        <Form form={form} layout="vertical" onValuesChange={handleSearch}>
          <Row gutter={16} align="bottom">
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="keyword" label="搜索" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="设备编号/名称/位置"
                  prefix={<SearchOutlined />}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item name="status" label="设备状态" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="全部状态"
                  allowClear
                  options={[
                    { label: '在线', value: 'online' },
                    { label: '离线', value: 'offline' },
                    { label: '告警', value: 'warning' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item name="project" label="所属项目" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="全部项目"
                  allowClear
                  showSearch
                  options={projectOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={5}>
              <Form.Item name="model" label="设备型号" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="全部型号"
                  allowClear
                  options={modelOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={3}>
              <Space>
                <Button type="primary" icon={<FilterOutlined />} onClick={handleSearch}>
                  筛选
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
          <Space wrap>
            {selectedRowKeys.length > 0 && (
              <Tag color="blue" closable onClose={() => setSelectedRowKeys([])}>
                已选 {selectedRowKeys.length} 台
              </Tag>
            )}
            <Popconfirm
              title="确认批量重启选中设备？"
              okText="确认"
              cancelText="取消"
              onConfirm={handleBatchRestart}
              disabled={selectedRowKeys.length === 0}
            >
              <Button
                icon={<PoweroffOutlined />}
                disabled={selectedRowKeys.length === 0}
                danger
              >
                批量重启
              </Button>
            </Popconfirm>
            <Button
              icon={<SendOutlined />}
              onClick={handleBatchParams}
              disabled={selectedRowKeys.length === 0}
            >
              批量参数下发
            </Button>
            <Button icon={<ExportOutlined />}>批量创建工单</Button>
          </Space>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleSearch} loading={loading}>
              刷新
            </Button>
          </Space>
        </div>

        <Table<Device>
          columns={columns}
          dataSource={filteredDevices}
          rowKey="id"
          rowSelection={rowSelection}
          loading={loading}
          scroll={{ x: 1600, y: 500 }}
          size="middle"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 台设备`,
            pageSize: 10
          }}
        />
      </Card>

      <Drawer
        title="设备详情"
        placement="right"
        width={560}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        extra={
          <Space>
            <Popconfirm
              title="确认重启设备？"
              okText="确认"
              cancelText="取消"
              onConfirm={() => currentDevice && handleRestart(currentDevice)}
              disabled={currentDevice?.status === 'offline'}
            >
              <Button
                icon={<PoweroffOutlined />}
                danger
                disabled={currentDevice?.status === 'offline'}
              >
                远程重启
              </Button>
            </Popconfirm>
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={() => { setDetailOpen(false); setParamsModalOpen(true) }}
              disabled={currentDevice?.status === 'offline'}
            >
              参数下发
            </Button>
          </Space>
        }
      >
        {currentDevice && (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <div style={{
              padding: 20,
              borderRadius: 12,
              background: statusConfig[currentDevice.status].bgColor,
              border: `1px solid ${statusConfig[currentDevice.status].color}30`
            }}>
              <Row align="middle" justify="space-between">
                <Space size={16}>
                  <div
                    style={{
                      width: 56, height: 56, borderRadius: 14,
                      background: statusConfig[currentDevice.status].color,
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28
                    }}
                  >
                    {statusConfig[currentDevice.status].icon}
                  </div>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>{currentDevice.deviceId}</Title>
                    <Text>{currentDevice.name}</Text>
                  </div>
                </Space>
                <Tag
                  icon={statusConfig[currentDevice.status].icon}
                  color={currentDevice.status === 'warning' ? 'warning' : currentDevice.status === 'online' ? 'success' : 'default'}
                  style={{ fontSize: 14, padding: '4px 12px', borderRadius: 6 }}
                >
                  {statusConfig[currentDevice.status].label}
                </Tag>
              </Row>
            </div>

            <Card title="运行参数" size="small" bordered={false} style={{ borderRadius: 10, background: '#fafafa' }}>
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Progress
                    type="dashboard"
                    percent={Math.round(currentDevice.temperature / 60 * 100)}
                    size={80}
                    strokeColor={currentDevice.temperature > 45 ? '#ff4d4f' : '#52c41a'}
                  />
                  <div style={{ textAlign: 'center', marginTop: -8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>当前温度</Text><br />
                    <Text strong style={{ fontSize: 16 }}>{currentDevice.temperature}°C</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Progress
                    type="dashboard"
                    percent={Math.round(currentDevice.power / 500 * 100)}
                    size={80}
                    strokeColor="#1890ff"
                  />
                  <div style={{ textAlign: 'center', marginTop: -8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>当前功率</Text><br />
                    <Text strong style={{ fontSize: 16 }}>{currentDevice.power}W</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>目标温度</Text>}
                    value={currentDevice.targetTemperature}
                    suffix="°C"
                    valueStyle={{ fontSize: 16 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>水价</Text>}
                    value={currentDevice.waterPrice}
                    suffix="元/吨"
                    valueStyle={{ fontSize: 16 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>UV灯状态</Text>}
                    valueStyle={{ fontSize: 16, color: currentDevice.uvStatus ? '#52c41a' : '#bfbfbf' }}
                    prefix={currentDevice.uvStatus ? <BulbOutlined /> : <BulbOutlined />}
                    value={currentDevice.uvStatus ? '开启' : '关闭'}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title={<Text type="secondary" style={{ fontSize: 12 }}>固件版本</Text>}
                    value={currentDevice.firmwareVersion}
                    valueStyle={{ fontSize: 16 }}
                  />
                </Col>
              </Row>
            </Card>

            <Descriptions title="基本信息" column={1} bordered size="small" labelStyle={{ width: 110, background: '#fafafa' }}>
              <Descriptions.Item label="设备ID">{currentDevice.deviceId}</Descriptions.Item>
              <Descriptions.Item label="设备名称">{currentDevice.name}</Descriptions.Item>
              <Descriptions.Item label="设备型号">{currentDevice.model}</Descriptions.Item>
              <Descriptions.Item label="所属项目">{currentDevice.project}</Descriptions.Item>
              <Descriptions.Item label="安装位置">{currentDevice.location}</Descriptions.Item>
              <Descriptions.Item label="安装日期">{currentDevice.installDate}</Descriptions.Item>
              <Descriptions.Item label="生产厂商">{currentDevice.manufacturer}</Descriptions.Item>
              <Descriptions.Item label="负责人">{currentDevice.owner}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentDevice.contact}</Descriptions.Item>
              <Descriptions.Item label="最后心跳">
                <Tooltip title={currentDevice.lastHeartbeat}>
                  <Text type="secondary">{dayjs(currentDevice.lastHeartbeat).fromNow()}</Text>
                </Tooltip>
              </Descriptions.Item>
            </Descriptions>
          </Space>
        )}
      </Drawer>

      <Modal
        title={selectedRowKeys.length > 0 ? `批量参数下发（${selectedRowKeys.length}台）` : `参数下发 - ${currentDevice?.deviceId || ''}`}
        open={paramsModalOpen}
        onCancel={() => setParamsModalOpen(false)}
        footer={null}
        width={520}
        destroyOnClose
      >
        <ParamsForm
          initialValues={{
            targetTemperature: currentDevice?.targetTemperature,
            power: currentDevice?.power,
            waterPrice: currentDevice?.waterPrice,
            uvEnabled: currentDevice?.uvStatus
          }}
          loading={paramsLoading}
          onSubmit={handleParamsSubmit}
          onCancel={() => setParamsModalOpen(false)}
        />
      </Modal>
    </div>
  )
}

export default Devices

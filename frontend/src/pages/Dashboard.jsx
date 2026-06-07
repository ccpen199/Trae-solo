import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Row, Col, Card, Statistic, Tag, Spin, message, Button, Alert, Progress, Timeline, Space, Divider,
  Table, Input, Select, DatePicker, Form, Modal, Popover, List, Badge, Descriptions
} from 'antd'
import {
  UserOutlined, ApiOutlined, CheckCircleOutlined, WalletOutlined, DollarOutlined,
  CarOutlined, WarningOutlined, StopOutlined, RiseOutlined, FallOutlined,
  AlertOutlined, DashboardOutlined, InfoCircleOutlined,
  UploadOutlined, SendOutlined, FileTextOutlined, SyncOutlined,
  HistoryOutlined, PlusOutlined, CreditCardOutlined, ReconciliationOutlined,
  CloudServerOutlined, SafetyCertificateOutlined, BarChartOutlined,
  LineChartOutlined, FileSearchOutlined, CloudUploadOutlined,
  DownOutlined, UpOutlined, SettingOutlined, BgColorsOutlined,
  ExclamationCircleOutlined, ClockCircleOutlined, CheckSquareOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../utils/request'

const { RangePicker } = DatePicker

const roleMap = {
  admin: { label: '系统管理员', color: 'red', desc: '拥有系统全部权限，可管理所有用户、设备、账户及所有配置' },
  platform: { label: '运营平台', color: 'blue', desc: '运营管理权限，可查看运营数据、处理异常、管理结算、配置策略' },
  operator: { label: '运维操作员', color: 'purple', desc: '运维操作权限，可进行设备激活、升级、数据质量监控等技术操作' },
  owner: { label: '车主', color: 'green', desc: '车主自助服务权限，可申领OBU、充值、查询通行记录、发起争议申诉' },
  fleet_admin: { label: '车队管理者', color: 'orange', desc: '车队管理权限，可管理多车辆账户、批量充值、查看车队通行数据' },
}

const typeTextMap = {
  deduction_failed: '扣费失败',
  path_missing: '路径缺失',
  duplicate_billing: '重复计费',
  abnormal_deduction: '异常扣费',
  low_balance: '余额不足',
  device_offline: '设备离线',
  duplicate_transaction: '重复交易',
  missing_exit: '缺失出口记录',
}

function getUser() {
  const userStr = localStorage.getItem('etc_user')
  try { return JSON.parse(userStr) || {} } catch { return {} }
}

const statusColorMap = {
  active: 'green', inactive: 'default', pending: 'orange',
  deactivated: 'red', suspended: 'volcano', confirmed: 'green',
  processing: 'blue', resolved: 'green', rejected: 'red',
  approved: 'green', normal: 'green', frozen: 'red',
}

const typeColorMap = {
  low_balance: 'orange', device_offline: 'red', duplicate_transaction: 'volcano',
  abnormal_deduction: 'magenta', missing_exit: 'cyan',
  deduction_failed: 'red', path_missing: 'orange', duplicate_billing: 'volcano'
}

const alertColorMap = { critical: 'red', warning: 'orange', normal: 'green' }
const settlementStatusMap = {
  pending: { text: '待确认', color: 'orange' },
  confirmed: { text: '已确认', color: 'green' },
  processing: { text: '处理中', color: 'blue' },
  failed: { text: '失败', color: 'red' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [exceptionDist, setExceptionDist] = useState(null)
  const [deviceStatus, setDeviceStatus] = useState(null)
  const [dataQuality, setDataQuality] = useState(null)
  const [detailedStats, setDetailedStats] = useState(null)
  const [recentTolls, setRecentTolls] = useState([])
  const [tollTotal, setTollTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tollLoading, setTollLoading] = useState(false)
  const [statsExpanded, setStatsExpanded] = useState(false)

  const [tollFilters, setTollFilters] = useState({
    vehiclePlate: '',
    gantryId: '',
    stationId: '',
    dateRange: null,
  })

  const [batchActivateOpen, setBatchActivateOpen] = useState(false)
  const [batchActivateLoading, setBatchActivateLoading] = useState(false)
  const [availableObuList, setAvailableObuList] = useState([])
  const [selectedObuIds, setSelectedObuIds] = useState([])

  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [upgradeForm] = Form.useForm()

  const [applyOpen, setApplyOpen] = useState(false)
  const [applyLoading, setApplyLoading] = useState(false)
  const [applyForm] = Form.useForm()

  const user = getUser()
  const userRole = user.role || 'owner'
  const roleCfg = roleMap[userRole] || roleMap.owner

  const ownerQuickActions = [
    { key: 'apply-obu', icon: <PlusOutlined />, label: '申领OBU', desc: '提交OBU设备申领申请', action: 'openApply' },
    { key: 'recharge', icon: <CreditCardOutlined />, label: '在线充值', desc: 'ETC账户在线充值', path: '/accounts' },
    { key: 'monthly', icon: <ReconciliationOutlined />, label: '月结单', desc: '查看月度结算账单', path: '/toll', action: 'monthly' },
    { key: 'trajectory', icon: <LineChartOutlined />, label: '通行轨迹', desc: '查看车辆行驶轨迹', path: '/toll', action: 'trajectory' },
    { key: 'toll-query', icon: <HistoryOutlined />, label: '通行记录', desc: '查询历史通行记录', path: '/toll' },
    { key: 'dispute', icon: <WarningOutlined />, label: '争议申诉', desc: '发起通行费争议申诉', path: '/disputes', action: 'create' },
  ]

  const opsQuickActions = [
    { key: 'batch-activate', icon: <CheckCircleOutlined />, label: '批量激活', desc: '批量激活OBU设备', action: 'openBatchActivate', badge: 'pending' },
    { key: 'remote-upgrade', icon: <CloudUploadOutlined />, label: '远程升级', desc: 'OBU设备固件升级', action: 'openUpgrade', badge: 'pending' },
    { key: 'data-quality', icon: <BarChartOutlined />, label: '数据质量监控', desc: '通行数据缺失率/延迟率监控', path: '/operations' },
    { key: 'blacklist', icon: <StopOutlined />, label: '黑名单策略', desc: '管理车辆黑名单策略', path: '/operations', action: 'blacklist' },
    { key: 'obu-manage', icon: <ApiOutlined />, label: '设备管理', desc: 'OBU设备全生命周期管理', path: '/obu' },
    { key: 'exceptions', icon: <AlertOutlined />, label: '异常事件', desc: '处理异常扣费事件', path: '/exceptions' },
  ]

  const adminQuickActions = [
    { key: 'settlement', icon: <ReconciliationOutlined />, label: '清分结算对账', desc: '高速公路集团/银行对账', path: '/settlements' },
    { key: 'value-added', icon: <CloudServerOutlined />, label: 'ETC+增值服务', desc: '管理增值服务配置', path: '/operations', action: 'value-added' },
    { key: 'open-api', icon: <SafetyCertificateOutlined />, label: '数据开放接口', desc: '地市交通局数据开放', path: '/open-api' },
    { key: 'users', icon: <UserOutlined />, label: '用户管理', desc: '用户账号与角色权限管理', path: '/users' },
    { key: 'audit', icon: <FileSearchOutlined />, label: '审计复查', desc: '操作审计日志查询', path: '/audit-logs' },
    { key: 'reports', icon: <BarChartOutlined />, label: '统计报表', desc: '运营数据统计报表', path: '/settlements' },
  ]

  const getQuickActions = () => {
    if (userRole === 'owner' || userRole === 'fleet_admin') {
      return ownerQuickActions
    } else if (userRole === 'operator') {
      return [...opsQuickActions, ...adminQuickActions.slice(0, 3)]
    } else {
      return [...opsQuickActions, ...adminQuickActions]
    }
  }

  const handleQuickAction = async (item) => {
    if (item.action === 'openBatchActivate') {
      await loadAvailableObu()
      setBatchActivateOpen(true)
    } else if (item.action === 'openUpgrade') {
      setUpgradeOpen(true)
      upgradeForm.setFieldsValue({ firmware_version: 'v3.2.0' })
    } else if (item.action === 'openApply') {
      setApplyOpen(true)
      applyForm.setFieldsValue({
        device_sn: `OBU-DEMO-${Date.now().toString().slice(-6)}`,
        model: 'JL-3000',
      })
    } else if (item.path) {
      navigate(item.path)
    }
    if (item.label) {
      message.success(`已进入：${item.label}`)
    }
  }

  const loadAvailableObu = async () => {
    try {
      const res = await request.get('/obu', { params: { status: 'inactive', pageSize: 20 } })
      setAvailableObuList(res.data.list)
    } catch {
      message.error('获取待激活设备失败')
    }
  }

  const handleBatchActivate = async () => {
    if (selectedObuIds.length === 0) {
      message.warning('请先选择要激活的设备')
      return
    }
    try {
      setBatchActivateLoading(true)
      const res = await request.post('/obu/batch-activate', { device_ids: selectedObuIds })
      const { activated, ineligible_count, total, progress, ineligible_devices } = res.data
      const ineligibleInfo = ineligible_devices?.length > 0
        ? `\n跳过设备：${ineligible_devices.map(d => `${d.device_sn}(${d.activation_status})`).join('、')}`
        : ''
      message.success(`✅ 批量激活完成：成功 ${activated}/${total} 台，跳过 ${ineligible_count} 台，进度 ${progress}${ineligibleInfo}`)
      setBatchActivateOpen(false)
      setSelectedObuIds([])
      fetchAll()
    } catch (err) {
      message.error(err.response?.data?.message || '批量激活失败')
    } finally {
      setBatchActivateLoading(false)
    }
  }

  const handleUpgradeOk = async () => {
    try {
      const values = await upgradeForm.validateFields()
      setUpgradeLoading(true)
      const res = await request.post(`/obu/${values.device_id}/upgrade`, values)
      const { status, old_version, new_version } = res.data
      if (status === 'success') {
        message.success(`✅ 固件升级成功：${old_version} → ${new_version}`)
      } else {
        message.error(`❌ 固件升级失败：${old_version} 保持不变`)
      }
      setUpgradeOpen(false)
      upgradeForm.resetFields()
      fetchAll()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || '固件升级失败')
      }
    } finally {
      setUpgradeLoading(false)
    }
  }

  const handleApplyOk = async () => {
    try {
      const values = await applyForm.validateFields()
      setApplyLoading(true)
      const res = await request.post('/obu/apply', values)
      message.success(`✅ OBU申领已提交，状态：${res.data.status}，已记录审计日志`)
      setApplyOpen(false)
      applyForm.resetFields()
      fetchAll()
    } catch (err) {
      if (err.response) {
        message.error(err.response.data?.message || 'OBU申领失败')
      }
    } finally {
      setApplyLoading(false)
    }
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [statsRes, excRes, devRes, dqRes, dsRes] = await Promise.all([
        request.get('/dashboard/stats'),
        request.get('/dashboard/exception-distribution'),
        request.get('/dashboard/device-status'),
        request.get('/dashboard/data-quality'),
        request.get('/dashboard/detailed-stats'),
      ])
      setStats(statsRes.data)
      setExceptionDist(excRes.data)
      setDeviceStatus(devRes.data)
      setDataQuality(dqRes.data)
      setDetailedStats(dsRes.data)
      await fetchRecentTolls()
    } catch (err) {
      message.error('获取仪表盘数据失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentTolls = async (filters = tollFilters) => {
    setTollLoading(true)
    try {
      const params = { pageSize: 5 }
      if (filters.vehiclePlate) params.vehiclePlate = filters.vehiclePlate
      if (filters.gantryId) params.gantryId = filters.gantryId
      if (filters.stationId) params.stationId = filters.stationId
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD')
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD')
      }
      const res = await request.get('/dashboard/recent-tolls', { params })
      setRecentTolls(res.data.list)
      setTollTotal(res.data.total)
    } catch (err) {
      message.error('获取通行记录失败')
    } finally {
      setTollLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleTollSearch = () => {
    fetchRecentTolls(tollFilters)
  }

  const handleTollReset = () => {
    const empty = { vehiclePlate: '', gantryId: '', stationId: '', dateRange: null }
    setTollFilters(empty)
    fetchRecentTolls(empty)
  }

  const getExceptionBadge = (type, status) => {
    const color = typeColorMap[type] || 'default'
    const statusColor = statusColorMap[status] || 'default'
    return (
      <Space size={4}>
        <Badge color={color} text={typeTextMap[type] || type} />
        <Tag color={statusColor} size="small">{status}</Tag>
      </Space>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  const statCards = [
    { title: '用户数', value: stats?.user_count, icon: <UserOutlined />, color: '#1890ff' },
    { title: '设备数', value: stats?.device_count, icon: <ApiOutlined />, color: '#722ed1' },
    { title: '活跃设备', value: stats?.active_device_count, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: 'ETC账户', value: stats?.account_count, icon: <WalletOutlined />, color: '#13c2c2' },
    { title: '总余额', value: stats?.total_balance, icon: <DollarOutlined />, color: '#faad14', prefix: '¥', precision: 2 },
    { title: '今日通行', value: stats?.today_toll_count, icon: <CarOutlined />, color: '#2f54eb' },
    { title: '今日金额', value: stats?.today_toll_amount, icon: <DollarOutlined />, color: '#eb2f96', prefix: '¥', precision: 2 },
    { title: '待处理异常', value: stats?.pending_exception_count, icon: <WarningOutlined />, color: '#fa541c' },
    { title: '黑名单', value: stats?.blacklist_count, icon: <StopOutlined />, color: '#f5222d' },
  ]

  const quickActions = getQuickActions()

  const tollColumns = [
    {
      title: '车牌号',
      dataIndex: 'vehicle_plate',
      key: 'vehicle_plate',
      width: 100,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '门架/收费站',
      key: 'location',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontSize: 12 }}>
            <BgColorsOutlined style={{ color: '#1890ff' }} /> {record.gantry_id || '-'}
          </span>
          <span style={{ fontSize: 12 }}>
            <SettingOutlined style={{ color: '#52c41a' }} /> {record.toll_station_id || '-'}
          </span>
        </Space>
      ),
    },
    {
      title: '时间',
      key: 'time',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <span style={{ fontSize: 12 }}>
            <ClockCircleOutlined /> 入: {record.entry_time || '-'}
          </span>
          <span style={{ fontSize: 12 }}>
            <CheckSquareOutlined /> 出: {record.exit_time || '-'}
          </span>
        </Space>
      ),
    },
    {
      title: '费用',
      dataIndex: 'fee',
      key: 'fee',
      width: 80,
      render: (val) => <span style={{ color: '#fa8c16', fontWeight: 600 }}>¥{val}</span>,
    },
    {
      title: '结算状态',
      dataIndex: 'settlement_status',
      key: 'settlement_status',
      width: 100,
      render: (status) => status ? <Tag color={settlementStatusMap[status]?.color}>{settlementStatusMap[status]?.text}</Tag> : <Tag color="default">未结算</Tag>,
    },
    {
      title: '异常/争议',
      key: 'exception',
      width: 160,
      render: (_, record) => {
        if (record.exception_id) {
          return (
            <Space direction="vertical" size={2}>
              {getExceptionBadge(record.exception_type, record.exception_status)}
              {record.dispute_id && (
                <Tag color="orange" size="small">争议: {record.dispute_status}</Tag>
              )}
              <Button type="link" size="small" onClick={() => navigate('/exceptions')}>
                <InfoCircleOutlined /> 处理
              </Button>
            </Space>
          )
        }
        return <span style={{ color: '#999' }}>正常</span>
      },
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 20, fontWeight: 600 }}>仪表盘概览</h2>

      <Alert
        message={
          <Space wrap>
            <Tag color={roleCfg.color} style={{ fontSize: 14, padding: '2px 12px' }}>
              当前角色：{roleCfg.label}
            </Tag>
            <span style={{ color: '#666' }}>{roleCfg.desc}</span>
          </Space>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {dataQuality && (dataQuality.missing_alert_level !== 'normal' || dataQuality.latency_alert_level !== 'normal') && (
        <Alert
          message="数据质量告警"
          description={
            <div>
              {dataQuality.missing_alert_level !== 'normal' && (
                <div>缺失率 {dataQuality.current_missing_rate}%，已触发{dataQuality.missing_alert_level === 'critical' ? '严重' : '警告'}告警</div>
              )}
              {dataQuality.latency_alert_level !== 'normal' && (
                <div>延迟率 {dataQuality.current_latency_rate}%，已触发{dataQuality.latency_alert_level === 'critical' ? '严重' : '警告'}告警</div>
              )}
            </div>
          }
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 16 }}
          action={<Button size="small" type="primary" onClick={() => navigate('/operations')}>查看详情</Button>}
        />
      )}

      <Card
        title={`${roleCfg.label}工作台 - 快捷入口（可直接操作）`}
        style={{ marginBottom: 16 }}
        extra={<Button size="small" onClick={() => navigate('/toll')}>查看全部业务</Button>}
      >
        <Row gutter={[16, 16]}>
          {quickActions.map((item) => {
            const badgeCount = item.badge === 'pending'
              ? (item.key === 'batch-activate' ? detailedStats?.devices?.pending_review : detailedStats?.devices?.pending_upgrade) || 0
              : 0
            return (
              <Col xs={12} sm={8} md={6} lg={4} xl={4} key={item.key}>
                <Card
                  hoverable
                  styles={{ body: { padding: 16, textAlign: 'center', position: 'relative' } }}
                  onClick={() => handleQuickAction(item)}
                >
                  {badgeCount > 0 && (
                    <Badge count={badgeCount} style={{ position: 'absolute', top: 8, right: 8 }} />
                  )}
                  <div style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }}>
                    {item.icon}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>{item.desc}</div>
                  <Button type="primary" size="small" onClick={(e) => { e.stopPropagation(); handleQuickAction(item) }}>
                    {item.action?.includes('open') ? '立即操作' : '进入'}
                  </Button>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <span>通行记录查询</span>
            <Tag color="blue">共 {tollTotal} 条</Tag>
            <Button size="small" onClick={() => navigate('/toll')}>
              进入完整查询
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <Input
              placeholder="车牌号"
              allowClear
              value={tollFilters.vehiclePlate}
              onChange={(e) => setTollFilters({ ...tollFilters, vehiclePlate: e.target.value })}
              style={{ width: 120 }}
              onPressEnter={handleTollSearch}
            />
            <Input
              placeholder="门架ID"
              allowClear
              value={tollFilters.gantryId}
              onChange={(e) => setTollFilters({ ...tollFilters, gantryId: e.target.value })}
              style={{ width: 120 }}
              onPressEnter={handleTollSearch}
            />
            <Input
              placeholder="收费站ID"
              allowClear
              value={tollFilters.stationId}
              onChange={(e) => setTollFilters({ ...tollFilters, stationId: e.target.value })}
              style={{ width: 120 }}
              onPressEnter={handleTollSearch}
            />
            <RangePicker
              value={tollFilters.dateRange}
              onChange={(val) => setTollFilters({ ...tollFilters, dateRange: val })}
              onCalendarChange={handleTollSearch}
            />
            <Button type="primary" onClick={handleTollSearch}>查询</Button>
            <Button onClick={handleTollReset}>重置</Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={tollColumns}
          dataSource={recentTolls}
          loading={tollLoading}
          pagination={false}
          size="small"
          locale={{ emptyText: '暂无通行记录' }}
        />
      </Card>

      <Card
        title={
          <Space>
            <span>核心数据统计</span>
            <Button
              type="link"
              size="small"
              onClick={() => setStatsExpanded(!statsExpanded)}
              icon={statsExpanded ? <UpOutlined /> : <DownOutlined />}
            >
              {statsExpanded ? '收起' : '展开更多状态'}
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[16, 16]}>
          {statCards.map((item) => (
            <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={4} key={item.title}>
              <Card hoverable styles={{ body: { padding: 20 } }}>
                <Statistic
                  title={item.title}
                  value={item.value ?? 0}
                  precision={item.precision}
                  prefix={<><span style={{ marginRight: 8 }}>{item.icon}</span>{item.prefix}</>}
                  valueStyle={{ color: item.color, fontSize: 28 }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {statsExpanded && detailedStats && (
          <>
            <Divider orientation="left" plain>账户状态详情</Divider>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={6} md={4}>
                <Card size="small" styles={{ body: { textAlign: 'center' } }}>
                  <Statistic title="正常账户" value={detailedStats.accounts.normal} valueStyle={{ color: '#52c41a' }} />
                </Card>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Card size="small" styles={{ body: { textAlign: 'center' } }}>
                  <Statistic title="冻结账户" value={detailedStats.accounts.frozen} valueStyle={{ color: '#f5222d' }} />
                </Card>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Card size="small" styles={{ body: { textAlign: 'center' } }}>
                  <Statistic title="已绑卡" value={detailedStats.accounts.bound_cards} valueStyle={{ color: '#1890ff' }} />
                </Card>
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Card size="small" styles={{ body: { textAlign: 'center' } }}>
                  <Statistic title="未绑卡" value={detailedStats.accounts.unbound_cards} valueStyle={{ color: '#faad14' }} />
                </Card>
              </Col>
            </Row>

            <Divider orientation="left" plain>设备固件版本分布</Divider>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              {detailedStats.devices.firmware_versions?.map((fv) => (
                <Col xs={12} sm={8} md={6} key={fv.firmware_version}>
                  <Card size="small" styles={{ body: { textAlign: 'center' } }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{fv.firmware_version}</div>
                    <Progress percent={((fv.count / (stats?.device_count || 1)) * 100).toFixed(0)} size="small" />
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{fv.count} 台</div>
                  </Card>
                </Col>
              ))}
            </Row>

            <Divider orientation="left" plain>异常事件处置进度</Divider>
            <Row gutter={[16, 16]}>
              {detailedStats.exceptions.by_type_status?.map((ex) => (
                <Col xs={12} sm={8} md={6} key={`${ex.type}-${ex.status}`}>
                  <Card size="small" styles={{ body: { textAlign: 'center' } }}>
                    <Tag color={typeColorMap[ex.type]} style={{ marginBottom: 8 }}>
                      {typeTextMap[ex.type] || ex.type}
                    </Tag>
                    <div style={{ fontSize: 24, fontWeight: 600, color: statusColorMap[ex.status] }}>
                      {ex.count}
                    </div>
                    <Tag color={statusColorMap[ex.status]}>{ex.status}</Tag>
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        )}
      </Card>

      {(userRole !== 'owner' && userRole !== 'fleet_admin') && (
        <Card
          title="运营报表与监管能力"
          style={{ marginBottom: 16 }}
          extra={<Button size="small" onClick={() => navigate('/settlements')}>进入完整报表</Button>}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card
                title="清分结算对账"
                size="small"
                hoverable
                onClick={() => navigate('/settlements')}
                styles={{ body: { minHeight: 160 } }}
              >
                {detailedStats?.settlements?.by_status?.length > 0 ? (
                  <>
                    <List
                      size="small"
                      dataSource={detailedStats.settlements.by_status}
                      renderItem={(item) => (
                        <List.Item>
                          <Space>
                            <Tag color={settlementStatusMap[item.status]?.color}>
                              {settlementStatusMap[item.status]?.text || item.status}
                            </Tag>
                            <span>{item.count} 笔</span>
                            <span style={{ color: '#fa8c16' }}>¥{(item.total_amount / 100).toFixed(2)}</span>
                          </Space>
                        </List.Item>
                      )}
                    />
                    <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }} onClick={() => navigate('/settlements')}>
                      查看对账明细 <InfoCircleOutlined />
                    </Button>
                  </>
                ) : (
                  <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无结算数据</div>
                )}
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                title="ETC+增值服务"
                size="small"
                hoverable
                onClick={() => navigate('/operations')}
                styles={{ body: { minHeight: 160 } }}
              >
                {detailedStats?.value_added_services?.by_status?.length > 0 ? (
                  <>
                    <List
                      size="small"
                      dataSource={detailedStats.value_added_services.by_status}
                      renderItem={(item) => (
                        <List.Item>
                          <Space>
                            <Tag color={statusColorMap[item.status]}>{item.status === 'active' ? '已启用' : '已停用'}</Tag>
                            <span>{item.count} 项服务</span>
                          </Space>
                        </List.Item>
                      )}
                    />
                    <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }} onClick={() => navigate('/operations')}>
                      管理服务配置 <InfoCircleOutlined />
                    </Button>
                  </>
                ) : (
                  <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无服务数据</div>
                )}
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                title="地市交通局数据开放"
                size="small"
                hoverable
                onClick={() => navigate('/open-api')}
                styles={{ body: { minHeight: 160 } }}
              >
                {detailedStats?.open_api && (
                  <>
                    <Row gutter={[16, 16]} style={{ marginBottom: 8 }}>
                      <Col span={12} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#1890ff' }}>
                          {detailedStats.open_api.total_calls}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>累计调用</div>
                      </Col>
                      <Col span={12} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>
                          {detailedStats.open_api.last_7_days_calls || 0}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>近7日</div>
                      </Col>
                    </Row>
                    <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate('/open-api')}>
                      查看接口调用日志 <InfoCircleOutlined />
                    </Button>
                  </>
                )}
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card
                title="审计复查"
                size="small"
                hoverable
                onClick={() => navigate('/audit-logs')}
                styles={{ body: { minHeight: 160 } }}
              >
                {detailedStats?.recent_audit_logs?.length > 0 ? (
                  <>
                    <Timeline
                      size="small"
                      items={detailedStats.recent_audit_logs.slice(0, 3).map(log => ({
                        color: 'blue',
                        children: (
                          <div>
                            <div style={{ fontSize: 12 }}>
                              <Tag color="blue" size="small">{log.user_name}</Tag>
                              {log.action}
                            </div>
                            <div style={{ fontSize: 11, color: '#999' }}>{log.created_at}</div>
                          </div>
                        ),
                      }))}
                    />
                    <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate('/audit-logs')}>
                      查看完整审计日志 <InfoCircleOutlined />
                    </Button>
                  </>
                ) : (
                  <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无审计日志</div>
                )}
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="通行数据质量监控" styles={{ body: { minHeight: 180 } }} extra={<Button size="small" onClick={() => navigate('/operations')}>查看监控</Button>}>
            {dataQuality ? (
              <div>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>当前缺失率</div>
                      <div style={{ color: alertColorMap[dataQuality.missing_alert_level], fontSize: 24, fontWeight: 600 }}>
                        {dataQuality.current_missing_rate}%
                      </div>
                      <Progress
                        percent={dataQuality.current_missing_rate}
                        status={dataQuality.missing_alert_level === 'critical' ? 'exception' : dataQuality.missing_alert_level === 'warning' ? 'active' : 'success'}
                        showInfo={false}
                        style={{ marginTop: 8 }}
                      />
                      <Tag color={alertColorMap[dataQuality.missing_alert_level]} style={{ marginTop: 8 }}>
                        {dataQuality.missing_alert_level === 'normal' ? '正常' : dataQuality.missing_alert_level === 'warning' ? '警告' : '严重'}
                      </Tag>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>当前延迟率</div>
                      <div style={{ color: alertColorMap[dataQuality.latency_alert_level], fontSize: 24, fontWeight: 600 }}>
                        {dataQuality.current_latency_rate}%
                      </div>
                      <Progress
                        percent={dataQuality.current_latency_rate}
                        status={dataQuality.latency_alert_level === 'critical' ? 'exception' : dataQuality.latency_alert_level === 'warning' ? 'active' : 'success'}
                        showInfo={false}
                        style={{ marginTop: 8 }}
                      />
                      <Tag color={alertColorMap[dataQuality.latency_alert_level]} style={{ marginTop: 8 }}>
                        {dataQuality.latency_alert_level === 'normal' ? '正常' : dataQuality.latency_alert_level === 'warning' ? '警告' : '严重'}
                      </Tag>
                    </div>
                  </Col>
                </Row>
                <Divider style={{ margin: '16px 0' }} />
                <Row gutter={[8, 8]}>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#999' }}>7日平均缺失率</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{dataQuality.avg_missing_rate}%</div>
                    {dataQuality.avg_missing_rate > dataQuality.current_missing_rate
                      ? <FallOutlined style={{ color: '#52c41a' }} />
                      : dataQuality.avg_missing_rate < dataQuality.current_missing_rate
                        ? <RiseOutlined style={{ color: '#fa541c' }} />
                        : null}
                  </Col>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#999' }}>7日平均延迟率</div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{dataQuality.avg_latency_rate}%</div>
                  </Col>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#999' }}>7日告警数</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#fa541c' }}>
                      <AlertOutlined /> {dataQuality.total_alerts}
                    </div>
                  </Col>
                </Row>
              </div>
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: 40 }}>暂无数据</div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="异常事件分布（按类型）" styles={{ body: { minHeight: 180 } }}>
            {exceptionDist?.by_type?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {exceptionDist.by_type.map((item) => (
                  <Tag
                    key={item.type}
                    color={typeColorMap[item.type] || 'blue'}
                    style={{ fontSize: 14, padding: '4px 12px' }}
                  >
                    {typeTextMap[item.type] || item.type}：{item.count}
                  </Tag>
                ))}
              </div>
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: 40 }}>暂无异常事件</div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="异常事件分布（按状态）" styles={{ body: { minHeight: 180 } }}>
            {exceptionDist?.by_status?.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {exceptionDist.by_status.map((item) => (
                  <Tag
                    key={item.status}
                    color={statusColorMap[item.status] || 'blue'}
                    style={{ fontSize: 14, padding: '4px 12px' }}
                  >
                    {item.status}：{item.count}
                  </Tag>
                ))}
              </div>
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: 40 }}>暂无异常事件</div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="设备状态分布">
            {deviceStatus?.list?.length > 0 ? (
              <Row gutter={[24, 16]}>
                {deviceStatus.list.map((item) => {
                  const total = deviceStatus.list.reduce((s, d) => s + d.count, 0)
                  const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0
                  return (
                    <Col xs={12} sm={8} md={6} key={item.activation_status}>
                      <div style={{ textAlign: 'center' }}>
                        <Statistic
                          title={item.activation_status}
                          value={item.count}
                          suffix={<span style={{ fontSize: 14, color: '#999' }}>({pct}%)</span>}
                          valueStyle={{ color: statusColorMap[item.activation_status] || '#1890ff' }}
                        />
                        <Tag color={statusColorMap[item.activation_status] || 'blue'} style={{ marginTop: 8 }}>
                          {item.activation_status}
                        </Tag>
                      </div>
                    </Col>
                  )
                })}
              </Row>
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: 40 }}>暂无设备数据</div>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="批量激活OBU设备"
        open={batchActivateOpen}
        onOk={handleBatchActivate}
        onCancel={() => {
          setBatchActivateOpen(false)
          setSelectedObuIds([])
        }}
        confirmLoading={batchActivateLoading}
        okText="确认激活"
        width={600}
      >
        <Alert
          message={`待审核设备：${detailedStats?.devices?.pending_review || 0} 台，待激活设备：${availableObuList.length} 台`}
          description='仅激活状态为"待激活"的设备，已激活、故障、停用设备将自动跳过。'
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Table
          rowKey="id"
          columns={[
            { title: '设备SN', dataIndex: 'device_sn', key: 'device_sn' },
            { title: '型号', dataIndex: 'model', key: 'model' },
            { title: '固件版本', dataIndex: 'firmware_version', key: 'firmware_version' },
            { title: '状态', dataIndex: 'activation_status', key: 'status', render: (s) => <Tag color="orange">{s}</Tag> },
          ]}
          dataSource={availableObuList}
          rowSelection={{
            selectedRowKeys: selectedObuIds,
            onChange: setSelectedObuIds,
          }}
          pagination={{ pageSize: 5 }}
          size="small"
          locale={{ emptyText: '暂无可激活的设备' }}
        />
      </Modal>

      <Modal
        title="远程升级OBU固件"
        open={upgradeOpen}
        onOk={handleUpgradeOk}
        onCancel={() => {
          setUpgradeOpen(false)
          upgradeForm.resetFields()
        }}
        confirmLoading={upgradeLoading}
      >
        <Alert
          message={`待升级设备：${detailedStats?.devices?.pending_upgrade || 0} 台`}
          description="请选择设备并输入目标固件版本，升级过程约需3-5分钟。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={upgradeForm} layout="vertical" preserve={false}>
          <Form.Item
            name="device_id"
            label="选择设备"
            rules={[{ required: true, message: '请选择设备' }]}
          >
            <Select
              placeholder="请选择要升级的设备"
              options={[
                { value: 1, label: 'OBU-001 (v2.1.0)' },
                { value: 2, label: 'OBU-002 (v3.0.0)' },
                { value: 4, label: 'OBU-004 (v2.0.5)' },
                { value: 5, label: 'OBU-005 (v3.0.0)' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="firmware_version"
            label="目标固件版本"
            rules={[{ required: true, message: '请输入固件版本' }]}
          >
            <Input placeholder="如 v3.2.0" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申领OBU设备"
        open={applyOpen}
        onOk={handleApplyOk}
        onCancel={() => {
          setApplyOpen(false)
          applyForm.resetFields()
        }}
        confirmLoading={applyLoading}
      >
        <Alert
          message="申领说明"
          description="申领提交后需运营审核，审核通过后设备将自动激活。请填写真实信息以便审核。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={applyForm} layout="vertical" preserve={false}>
          <Form.Item name="device_sn" label="设备序列号" rules={[{ required: true }]}>
            <Input placeholder="OBU设备背面的SN码" />
          </Form.Item>
          <Form.Item name="model" label="设备型号" rules={[{ required: true }]}>
            <Input placeholder="如 JL-3000" />
          </Form.Item>
          <Form.Item name="owner_name" label="车主姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item
            name="owner_phone"
            label="联系手机号"
            rules={[
              { required: true },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder="请输入11位手机号" />
          </Form.Item>
          <Form.Item name="vehicle_plate" label="车牌号" rules={[{ required: true }]}>
            <Input placeholder="如 京A12345" />
          </Form.Item>
          <Form.Item name="reason" label="申领原因">
            <Input.TextArea rows={3} placeholder="请简要说明申领用途" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

import { useEffect, useState } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  Badge,
  Spin,
  message,
  Progress,
  Tabs,
  List,
  Avatar,
  Tooltip,
  Alert,
  Button,
  Space,
  Modal,
  Descriptions,
} from 'antd'
import {
  ShoppingCartOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  CarOutlined,
  AlertOutlined,
  AuditOutlined,
  WarningOutlined,
  EnvironmentOutlined,
  DashboardOutlined,
  BarChartOutlined,
  FileTextOutlined,
  CreditCardOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { Pie, Column } from '@ant-design/charts'
import { dashboardAPI, waybillAPI, knightAPI, exceptionAPI } from '@/api'
import { useAuthStore } from '@/store'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  KNIGHT_STATUS_COLORS,
  KNIGHT_STATUS_LABELS,
  KNIGHT_TYPE_COLORS,
  KNIGHT_TYPE_LABELS,
  INSURANCE_LEVEL_COLORS,
  INSURANCE_LEVEL_LABELS,
  EXCEPTION_STATUS_COLORS,
  EXCEPTION_STATUS_LABELS,
  EXCEPTION_TYPE_COLORS,
  EXCEPTION_TYPE_LABELS,
  formatTime,
} from '@/types'
import { Link, useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const role = user?.role || 'admin'
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})
  const [recentWaybills, setRecentWaybills] = useState<any[]>([])
  const [pieData, setPieData] = useState<any[]>([])
  const [slaColumnData, setSlaColumnData] = useState<any[]>([])
  const [statusModal, setStatusModal] = useState<{ open: boolean; waybill: any | null }>({ open: false, waybill: null })

  useEffect(() => {
    loadData()
  }, [role])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsResult, waybillsResult]: any[] = await Promise.all([
        role === 'admin' ? dashboardAPI.adminStats() : dashboardAPI.merchantStats(user?.id),
        waybillAPI.list({ pageSize: 10 }),
      ])

      const statsData = statsResult?.data || statsResult || {}
      const waybillsData = waybillsResult?.data?.list || waybillsResult?.data || waybillsResult || []

      setStats(statsData)
      setRecentWaybills(Array.isArray(waybillsData) ? waybillsData : [])

      const statusCounts: Record<string, number> = {}
      waybillsData.forEach((w: any) => {
        statusCounts[w.status] = (statusCounts[w.status] || 0) + 1
      })
      const pie = Object.entries(statusCounts).map(([type, value]) => ({
        type: STATUS_LABELS[type] || type,
        value,
        color: STATUS_COLORS[type] || '#1890ff',
      }))
      setPieData(pie)

      if (statsData.sla) {
        setSlaColumnData([
          { type: '1分钟响应', rate: statsData.sla.response_1min_rate, count: statsData.sla.response_1min_count, total: statsData.sla.total, color: '#52c41a' },
          { type: '8分钟取件', rate: statsData.sla.pickup_8min_rate, count: statsData.sla.pickup_8min_count, total: statsData.sla.total, color: '#1890ff' },
          { type: '1小时送达', rate: statsData.sla.deliver_60min_rate, count: statsData.sla.deliver_60min_count, total: statsData.sla.total, color: '#722ed1' },
          { type: '准时履约', rate: statsData.sla.on_time_rate, count: statsData.sla.total_completed ? Math.round(statsData.sla.on_time_completed || 0) : 0, total: statsData.sla.total_completed || 0, color: '#fa8c16' },
        ])
      }
    } catch (error) {
      console.error('Failed to load dashboard data', error)
      message.warning('部分数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    color: pieData.map((d) => d.color),
    radius: 0.9,
    label: {
      text: 'value',
      style: { fontWeight: 'bold' },
    },
    legend: {
      color: { title: false, position: 'right', rowPadding: 5 },
    },
    style: { stroke: '#fff', lineWidth: 2 },
    tooltip: {
      formatter: (datum: any) => ({ name: datum.type, value: datum.value }),
    },
  }

  const slaColumnConfig = {
    data: slaColumnData,
    xField: 'type',
    yField: 'rate',
    colorField: 'type',
    color: slaColumnData.map((d) => d.color),
    columnStyle: { radius: [4, 4, 0, 0] },
    label: {
      text: (d: any) => `${d.rate}%`,
      position: 'top',
      style: { fontWeight: 'bold' },
    },
    yAxis: { min: 0, max: 100, label: { formatter: (v: any) => `${v}%` } },
    tooltip: {
      formatter: (d: any) => ({ name: d.type, value: `${d.count}/${d.total} (${d.rate}%)` }),
    },
  }

  const getSlaColor = (rate: number) => {
    if (rate >= 95) return '#52c41a'
    if (rate >= 80) return '#fa8c16'
    return '#ff4d4f'
  }

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = { high: '#ff4d4f', medium: '#fa8c16', low: '#52c41a' }
    return colors[urgency] || '#8c8c8c'
  }

  const getUrgencyText = (urgency: string) => {
    const texts: Record<string, string> = { high: '紧急', medium: '警告', low: '正常' }
    return texts[urgency] || urgency
  }

  const formatDuration = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return '-'
    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`
    return `${Math.floor(seconds / 3600)}时${Math.floor((seconds % 3600) / 60)}分`
  }

  const renderStatusFlow = (flow: any[]) => {
    if (!flow || flow.length === 0) return <Tag color="default">待调度</Tag>
    return (
      <Space size={4} direction="vertical" style={{ width: '100%' }}>
        {flow.slice(-3).map((s: any, i: number) => (
          <div key={i} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tag color={STATUS_COLORS[s.to_status]} style={{ margin: 0, fontSize: 10 }}>
              {STATUS_LABELS[s.to_status]}
            </Tag>
            <span style={{ color: '#8c8c8c' }}>{formatTime(s.created_at).slice(11, 16)}</span>
          </div>
        ))}
      </Space>
    )
  }

  const waybillColumns = [
    {
      title: '运单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160,
      render: (v: string, record: any) => (
        <div>
          <Link to={`/waybills/${record.id}`} style={{ fontFamily: 'monospace' }}>{v}</Link>
          {record.sla?.is_ontime === false && (
            <div><Tag color="red" style={{ marginTop: 2, fontSize: 10 }}>超时履约</Tag></div>
          )}
        </div>
      ),
    },
    {
      title: '寄件人',
      dataIndex: 'sender_name',
      key: 'sender',
      width: 90,
    },
    {
      title: '收件人',
      dataIndex: 'receiver_name',
      key: 'receiver',
      width: 90,
    },
    {
      title: '品类',
      dataIndex: 'category',
      key: 'category',
      width: 70,
      render: (v: string) => (
        <Tag color={CATEGORY_COLORS[v]}>{CATEGORY_LABELS[v] || v}</Tag>
      ),
    },
    {
      title: '保价等级',
      dataIndex: ['dispatch', 'insurance_label'],
      key: 'insurance',
      width: 90,
      render: (v: string, record: any) => (
        <Tooltip title={`保额: ¥${record.dispatch?.insurance_value?.toFixed(2) || 0}`}>
          <Tag color={INSURANCE_LEVEL_COLORS[record.dispatch?.insurance_level]}>{v || '-'}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '配送距离',
      dataIndex: ['dispatch', 'distance'],
      key: 'distance',
      width: 80,
      render: (v: number) => v ? `${v.toFixed(1)}km` : '-',
    },
    {
      title: '骑士负载',
      key: 'knight_load',
      width: 100,
      render: (_: any, record: any) => {
        if (!record.knight) return '-'
        const load = record.knight.current_load
        const capacity = record.knight.capacity
        const rate = (load / capacity) * 100
        return (
          <Tooltip title={`当前承载: ${load}/${capacity} 单`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Progress
                percent={Math.round(rate)}
                size="small"
                showInfo={false}
                width={50}
                strokeColor={rate > 80 ? '#ff4d4f' : rate > 60 ? '#fa8c16' : '#52c41a'}
              />
              <span style={{ fontSize: 12 }}>{load}/{capacity}</span>
            </div>
          </Tooltip>
        )
      },
    },
    {
      title: '履约率',
      dataIndex: ['knight', 'completion_rate'],
      key: 'completion',
      width: 80,
      render: (v: number) => v !== undefined ? (
        <Tag color={v >= 90 ? 'green' : v >= 70 ? 'orange' : 'red'}>{v}%</Tag>
      ) : '-',
    },
    {
      title: 'SLA时效',
      key: 'sla',
      width: 110,
      render: (_: any, record: any) => {
        const sla = record.sla
        if (!sla) return '-'
        const items: any[] = []
        if (sla.response_time !== null) items.push(<div key="r" style={{ fontSize: 11 }}>响应: {formatDuration(sla.response_time)}</div>)
        if (sla.pickup_time !== null) items.push(<div key="p" style={{ fontSize: 11 }}>取件: {formatDuration(sla.pickup_time)}</div>)
        if (sla.delivery_time !== null) items.push(<div key="d" style={{ fontSize: 11 }}>送达: {formatDuration(sla.delivery_time)}</div>)
        return <div>{items}</div>
      },
    },
    {
      title: '状态流转',
      key: 'flow',
      width: 120,
      render: (_: any, record: any) => renderStatusFlow(record.status_flow),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => (
        <Badge color={STATUS_COLORS[v]} text={STATUS_LABELS[v] || v} />
      ),
    },
    {
      title: '费用',
      dataIndex: 'fee',
      key: 'fee',
      width: 80,
      render: (v: number) => `¥${v?.toFixed(2) || '0.00'}`,
    },
    {
      title: '分单评分',
      dataIndex: ['dispatch', 'final_score'],
      key: 'score',
      width: 90,
      render: (v: number, record: any) => v ? (
        <Tooltip title={
          <div>
            <div>距离分: {record.dispatch?.distance_score?.toFixed(4)}</div>
            <div>负载分: {record.dispatch?.load_score?.toFixed(4)}</div>
            <div>履约分: {record.dispatch?.history_score?.toFixed(4)}</div>
            <div>保价分: {record.dispatch?.insurance_score?.toFixed(4)}</div>
          </div>
        }>
          <Tag color={v > 0.7 ? 'green' : v > 0.5 ? 'orange' : 'red'}>
            {v.toFixed(4)}
          </Tag>
        </Tooltip>
      ) : <span style={{ color: '#8c8c8c' }}>待调度</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => formatTime(v),
    },
  ]

  const auditMenuItems = [
    { key: 'on-time', label: '商家准时率', icon: <CheckCircleOutlined />, path: '/waybills?status=completed', color: '#52c41a' },
    { key: 'complaint', label: '投诉率', icon: <ExclamationCircleOutlined />, path: '/exceptions?type=complaint', color: '#ff4d4f' },
    { key: 'settlement', label: '运费结算', icon: <CreditCardOutlined />, path: '/settlements', color: '#1890ff' },
    { key: 'credit', label: '骑士信用扣分', icon: <TeamOutlined />, path: '/knights', color: '#722ed1' },
    { key: 'exception', label: '异常转派', icon: <AlertOutlined />, path: '/exceptions', color: '#fa8c16' },
    { key: 'audit', label: '签收核验', icon: <AuditOutlined />, path: '/waybills?status=signed', color: '#13c2c2' },
  ]

  if (role === 'merchant') {
    return (
      <Spin spinning={loading}>
        <h2 style={{ marginTop: 0 }}>商家数据看板</h2>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="我的订单总数"
                value={stats.total_orders || 0}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="配送完成率"
                value={stats.delivery_rate || 0}
                precision={2}
                suffix="%"
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="投诉率"
                value={stats.complaint_rate || 0}
                precision={2}
                suffix="%"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="结算汇总"
                value={stats.settlement_summary?.total || 0}
                precision={2}
                prefix="¥"
              />
            </Card>
          </Col>
        </Row>
        <Card title="最近订单" style={{ marginTop: 16 }}>
          <Table
            columns={waybillColumns}
            dataSource={recentWaybills}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1400 }}
          />
        </Card>
      </Spin>
    )
  }

  return (
    <Spin spinning={loading}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>管理员数据看板</h2>
        <Space>
          <Button icon={<BarChartOutlined />} onClick={() => navigate('/heatmap')}>
            运力热力图
          </Button>
          <Button type="primary" icon={<DashboardOutlined />} onClick={loadData}>
            刷新数据
          </Button>
        </Space>
      </div>

      <Alert
        type="info"
        showIcon
        icon={<ThunderboltOutlined />}
        message="SLA 时效监控"
        description={
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <span><strong style={{ color: getSlaColor(stats.sla?.response_1min_rate) }}>{stats.sla?.response_1min_rate || 0}%</strong> 1分钟响应 ({stats.sla?.response_1min_count || 0}/{stats.sla?.total || 0})</span>
            <span><strong style={{ color: getSlaColor(stats.sla?.pickup_8min_rate) }}>{stats.sla?.pickup_8min_rate || 0}%</strong> 8分钟取件 ({stats.sla?.pickup_8min_count || 0}/{stats.sla?.total || 0})</span>
            <span><strong style={{ color: getSlaColor(stats.sla?.deliver_60min_rate) }}>{stats.sla?.deliver_60min_rate || 0}%</strong> 1小时送达 ({stats.sla?.deliver_60min_count || 0}/{stats.sla?.total || 0})</span>
            <span style={{ color: '#ff4d4f' }}><WarningOutlined /> 违约: {stats.sla?.breach_count || 0} 单</span>
          </div>
        }
        style={{ marginBottom: 16 }}
      />

      {stats.capacity_gaps?.length > 0 && stats.capacity_gaps?.some((g: any) => g.gap > 0) && (
        <Alert
          type="warning"
          showIcon
          icon={<AlertOutlined />}
          message="运力缺口预警"
          description={
            <Space wrap>
              {stats.capacity_gaps?.filter((g: any) => g.gap > 0).slice(0, 5).map((g: any, i: number) => (
                <Tag key={i} color={getUrgencyColor(g.urgency)}>
                  <EnvironmentOutlined /> 区域 {g.region}: 待派单 {g.pending_orders} / 可用骑手 {g.available_knights} (缺口 {g.gap}) - {getUrgencyText(g.urgency)}
                </Tag>
              ))}
            </Space>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日运单总数"
              value={stats.orders?.today || 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃骑手"
              value={stats.knights?.online || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix={<span style={{ fontSize: 14, color: '#8c8c8c' }}>/{stats.knights?.total || 0}</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理订单"
              value={stats.orders?.pending || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="准时送达率"
              value={stats.sla?.on_time_rate || 0}
              precision={2}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="SLA 时效分层统计" extra={<Button size="small" type="link" onClick={() => navigate('/exceptions')}>查看违约明细 <ArrowRightOutlined /></Button>}>
            <div style={{ height: 260 }}>
              <Column {...slaColumnConfig} />
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="运单状态分布">
            {pieData.length > 0 ? (
              <div style={{ height: 260 }}>
                <Pie {...pieConfig} />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c' }}>
                暂无数据
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="风控与审计入口"
            extra={<Button size="small" type="link" onClick={() => navigate('/exceptions')}>异常处理 <ArrowRightOutlined /></Button>}
          >
            <List
              grid={{ gutter: 8, column: 2 }}
              dataSource={auditMenuItems}
              renderItem={(item: any) => (
                <List.Item>
                  <Card
                    hoverable
                    size="small"
                    style={{ textAlign: 'center', cursor: 'pointer', borderColor: item.color + '40' }}
                    onClick={() => navigate(item.path)}
                    bodyStyle={{ padding: '12px 8px' }}
                  >
                    <div style={{ color: item.color, fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontSize: 12, color: '#595959' }}>{item.label}</div>
                  </Card>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={6}>
          <Card
            title={<><CarOutlined /> 运力实时监控</>}
            extra={<Button size="small" type="link" onClick={() => navigate('/knights')}>全部骑手 <ArrowRightOutlined /></Button>}
          >
            <List
              size="small"
              dataSource={stats.knights?.details?.slice(0, 8) || []}
              renderItem={(k: any) => (
                <List.Item
                  style={{ cursor: 'pointer', padding: '8px 0' }}
                  onClick={() => navigate(`/knights/${k.id}`)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={<UserOutlined />}
                        style={{ backgroundColor: k.status === 'suspended' ? '#ff4d4f' : k.status === 'online' || k.status === 'busy' ? '#52c41a' : '#8c8c8c' }}
                      />
                    }
                    title={
                      <Space size={4}>
                        <span>{k.name}</span>
                        <Tag color={KNIGHT_STATUS_COLORS[k.status]} style={{ fontSize: 10, margin: 0 }}>
                          {KNIGHT_STATUS_LABELS[k.status]}
                        </Tag>
                        <Tag color={KNIGHT_TYPE_COLORS[k.type]} style={{ fontSize: 10, margin: 0 }}>
                          {KNIGHT_TYPE_LABELS[k.type]}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div style={{ fontSize: 11 }}>
                        <Space wrap size={[8, 2]}>
                          <span><CreditCardOutlined /> {k.credit_score}分</span>
                          <span><BarChartOutlined /> {k.active_order_count}单</span>
                          <span><EnvironmentOutlined /> {k.lat?.toFixed(2)}, {k.lng?.toFixed(2)}</span>
                        </Space>
                        <Progress
                          percent={k.load_rate}
                          size="small"
                          showInfo={true}
                          format={() => `${k.current_load}/${k.capacity}`}
                          strokeColor={k.load_rate > 80 ? '#ff4d4f' : k.load_rate > 60 ? '#fa8c16' : '#52c41a'}
                          style={{ marginTop: 4 }}
                        />
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={18}>
          <Card
            title={<><FileTextOutlined /> 最近运单 (含分单依据)</>}
            extra={<Button size="small" type="link" onClick={() => navigate('/waybills')}>全部运单 <ArrowRightOutlined /></Button>}
          >
            <Table
              columns={waybillColumns}
              dataSource={recentWaybills}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1500 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        style={{ marginTop: 16 }}
        items={[
          {
            key: 'capacity',
            label: <><AlertOutlined /> 区域运力缺口预测</>,
            children: (
              <Card>
                {stats.capacity_gaps?.length > 0 ? (
                  <Table
                    size="small"
                    dataSource={stats.capacity_gaps}
                    rowKey="region"
                    pagination={false}
                    columns={[
                      { title: '区域(经纬度)', dataIndex: 'region', key: 'region', render: (v: string) => <><EnvironmentOutlined /> {v}</> },
                      { title: '待调度订单', dataIndex: 'pending_orders', key: 'pending', align: 'center' },
                      { title: '可用骑手', dataIndex: 'available_knights', key: 'available', align: 'center' },
                      { title: '运力缺口', dataIndex: 'gap', key: 'gap', align: 'center', render: (v: number) => <span style={{ color: v > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>{v}</span> },
                      { title: '紧急程度', dataIndex: 'urgency', key: 'urgency', align: 'center', render: (v: string) => <Tag color={getUrgencyColor(v)}>{getUrgencyText(v)}</Tag> },
                    ]}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
                    <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }} />
                    <div>当前无运力缺口，运力充足</div>
                  </div>
                )}
              </Card>
            ),
          },
          {
            key: 'exceptions',
            label: <><ThunderboltOutlined /> 异常处理记录</>,
            children: (
              <RecentExceptions />
            ),
          },
          {
            key: 'audit',
            label: <><AuditOutlined /> 运营审计指标</>,
            children: (
              <AuditMetrics stats={stats} />
            ),
          },
        ]}
      />

      <Modal
        title="运单状态机完整流转"
        open={statusModal.open}
        onCancel={() => setStatusModal({ open: false, waybill: null })}
        footer={[
          <Button key="close" onClick={() => setStatusModal({ open: false, waybill: null })}>关闭</Button>,
          <Button key="detail" type="primary" onClick={() => {
            if (statusModal.waybill) navigate(`/waybills/${statusModal.waybill.id}`)
            setStatusModal({ open: false, waybill: null })
          }}>查看详情</Button>,
        ]}
        width={700}
      >
        {statusModal.waybill && (
          <StatusFlowDetail waybill={statusModal.waybill} />
        )}
      </Modal>
    </Spin>
  )
}

function RecentExceptions() {
  const [exceptions, setExceptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadExceptions()
  }, [])

  const loadExceptions = async () => {
    try {
      const result = await exceptionAPI.list({ pageSize: 10 })
      setExceptions(result?.data?.list || result?.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <Spin spinning={loading}>
        <Table
          size="small"
          dataSource={exceptions}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '运单号', dataIndex: 'order_no', key: 'order_no', render: (v: string, r: any) => <Link to={`/waybills/${r.waybill_id}`}>{v}</Link> },
            { title: '异常类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={EXCEPTION_TYPE_COLORS[v]}>{EXCEPTION_TYPE_LABELS[v] || v}</Tag> },
            { title: '原骑手', dataIndex: 'original_knight_name', key: 'orig' },
            { title: '新骑手', dataIndex: 'new_knight_name', key: 'new', render: (v: string) => v || <Tag color="orange">待转派</Tag> },
            { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={EXCEPTION_STATUS_COLORS[v]}>{EXCEPTION_STATUS_LABELS[v] || v}</Tag> },
            { title: '解决时间', dataIndex: 'resolved_at', key: 'resolved', render: (v: string) => v ? formatTime(v) : '-' },
            { title: '操作', key: 'action', render: (_: any, r: any) => <Button type="link" size="small" onClick={() => navigate('/exceptions')}>处理</Button> },
          ]}
        />
      </Spin>
    </Card>
  )
}

function AuditMetrics({ stats }: { stats: any }) {
  const navigate = useNavigate()

  const metrics = [
    {
      title: '商家准时率',
      value: stats.sla?.on_time_rate || 0,
      suffix: '%',
      color: '#52c41a',
      icon: <CheckCircleOutlined />,
      path: '/waybills?status=completed',
      desc: '已完成订单中准时送达占比',
    },
    {
      title: '投诉率',
      value: '0.00',
      suffix: '%',
      color: '#ff4d4f',
      icon: <ExclamationCircleOutlined />,
      path: '/exceptions?type=complaint',
      desc: '订单中投诉订单占比',
    },
    {
      title: '运费结算总额',
      value: stats.revenue?.total || 0,
      prefix: '¥',
      color: '#1890ff',
      icon: <CreditCardOutlined />,
      path: '/settlements',
      desc: '累计已产生的运费总额',
    },
    {
      title: '骑士信用平均分',
      value: stats.knights?.avg_credit || 0,
      color: '#722ed1',
      icon: <TeamOutlined />,
      path: '/knights',
      desc: '所有骑士的平均信用分数',
    },
    {
      title: '异常转派数',
      value: stats.exceptions?.pending || 0,
      color: '#fa8c16',
      icon: <AlertOutlined />,
      path: '/exceptions',
      desc: '当前待处理的异常转派数',
    },
    {
      title: '签收核验',
      value: stats.orders?.completed || 0,
      color: '#13c2c2',
      icon: <AuditOutlined />,
      path: '/waybills?status=signed',
      desc: '已完成订单签收照片/身份核验',
    },
  ]

  return (
    <Card>
      <Row gutter={[16, 16]}>
        {metrics.map((m, i) => (
          <Col xs={24} sm={12} lg={8} key={i}>
            <Card
              hoverable
              onClick={() => navigate(m.path)}
              style={{ cursor: 'pointer', borderLeft: `4px solid ${m.color}` }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontSize: 32, color: m.color }}>{m.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>{m.title}</div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: m.color }}>
                    {m.prefix}{typeof m.value === 'number' ? m.value.toFixed(2) : m.value}{m.suffix}
                  </div>
                  <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>{m.desc}</div>
                </div>
                <InfoCircleOutlined style={{ color: '#d9d9d9' }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  )
}

function StatusFlowDetail({ waybill }: { waybill: any }) {
  const flow = waybill.status_flow || []

  return (
    <div>
      <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="运单号">{waybill.order_no}</Descriptions.Item>
        <Descriptions.Item label="当前状态">
          <Tag color={STATUS_COLORS[waybill.status]}>{STATUS_LABELS[waybill.status]}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="寄件人">{waybill.sender_name}</Descriptions.Item>
        <Descriptions.Item label="收件人">{waybill.receiver_name}</Descriptions.Item>
        <Descriptions.Item label="品类">
          <Tag color={CATEGORY_COLORS[waybill.category]}>{CATEGORY_LABELS[waybill.category]}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="保价">{waybill.dispatch?.insurance_label} (¥{waybill.dispatch?.insurance_value?.toFixed(2)})</Descriptions.Item>
      </Descriptions>

      <h4 style={{ marginTop: 0 }}>完整状态机流转链路</h4>
      {flow.length > 0 ? (
        <List
          dataSource={flow}
          renderItem={(item: any, index: number) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: STATUS_COLORS[item.to_status],
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                  }}>
                    {index + 1}
                  </div>
                }
                title={
                  <Space>
                    <Tag color={STATUS_COLORS[item.to_status]} style={{ margin: 0 }}>
                      {item.from_status ? `${STATUS_LABELS[item.from_status]} → ` : ''}{STATUS_LABELS[item.to_status]}
                    </Tag>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>{formatTime(item.created_at)}</span>
                  </Space>
                }
                description={item.note || '系统自动流转'}
              />
            </List.Item>
          )}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#8c8c8c' }}>
          暂无流转记录
        </div>
      )}
    </div>
  )
}

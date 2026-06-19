import { useEffect, useState, useMemo } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Tag,
  List,
  Badge,
  Typography,
  Space,
  Button,
  Avatar,
  Tooltip,
  Progress,
  theme
} from 'antd'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  SyncOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeviceTabletOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text } = Typography
const { useToken } = theme

interface WorkOrderStat {
  key: string
  label: string
  value: number
  icon: React.ReactNode
  color: string
  trend?: number
}

const mockWorkOrderStats: WorkOrderStat[] = [
  { key: 'today', label: '今日工单', value: 28, icon: <FileTextOutlined />, color: '#1890ff', trend: 12 },
  { key: 'pending', label: '待分配', value: 8, icon: <ClockCircleOutlined />, color: '#faad14', trend: -3 },
  { key: 'inProgress', label: '进行中', value: 12, icon: <SyncOutlined spin />, color: '#52c41a', trend: 5 },
  { key: 'completed', label: '已完成', value: 8, icon: <CheckCircleOutlined />, color: '#52c41a', trend: 10 }
]

const mockStatusDistribution = [
  { value: 156, name: '在线', itemStyle: { color: '#52c41a' } },
  { value: 23, name: '离线', itemStyle: { color: '#d9d9d9' } },
  { value: 11, name: '告警', itemStyle: { color: '#faad14' } }
]

const mockPendingOrders = [
  {
    id: 'WO20260619001',
    title: 'RO-A001设备离线故障',
    type: 'repair',
    priority: 'high',
    deviceName: 'RO-A001',
    createTime: '2026-06-19 08:23:00'
  },
  {
    id: 'WO20260619002',
    title: 'RO-B012滤芯更换提醒',
    type: 'maintenance',
    priority: 'medium',
    deviceName: 'RO-B012',
    createTime: '2026-06-19 09:15:00'
  },
  {
    id: 'WO20260619003',
    title: '阳光花园季度巡检',
    type: 'inspection',
    priority: 'low',
    deviceName: 'RO-C001~C010',
    createTime: '2026-06-19 10:00:00'
  },
  {
    id: 'WO20260619004',
    title: 'RO-D005水温异常告警',
    type: 'repair',
    priority: 'urgent',
    deviceName: 'RO-D005',
    createTime: '2026-06-19 10:32:00'
  },
  {
    id: 'WO20260619005',
    title: 'RO-A008UV灯运行超时',
    type: 'repair',
    priority: 'medium',
    deviceName: 'RO-A008',
    createTime: '2026-06-19 11:08:00'
  }
]

const mockRecentAlarms = [
  {
    id: 'A001',
    deviceId: 'RO-A001',
    deviceName: '阳光花园1号楼 RO-A001',
    level: 'critical',
    message: '设备离线超过30分钟',
    time: '5分钟前',
    handled: false
  },
  {
    id: 'A002',
    deviceId: 'RO-D005',
    deviceName: '幸福里小区3栋 RO-D005',
    level: 'error',
    message: '水温异常偏高（当前48°C，阈值45°C）',
    time: '12分钟前',
    handled: false
  },
  {
    id: 'A003',
    deviceId: 'RO-B012',
    deviceName: '翠湖花园5号 RO-B012',
    level: 'warning',
    message: 'UV灯运行超过建议时长',
    time: '28分钟前',
    handled: false
  },
  {
    id: 'A004',
    deviceId: 'RO-C007',
    deviceName: '明月苑二期 RO-C007',
    level: 'warning',
    message: '滤芯使用时长已达95%',
    time: '45分钟前',
    handled: true
  },
  {
    id: 'A005',
    deviceId: 'RO-A003',
    deviceName: '阳光花园3号楼 RO-A003',
    level: 'info',
    message: '固件升级成功完成',
    time: '1小时前',
    handled: true
  }
]

const mockOnlineTrend = {
  dates: ['6-13', '6-14', '6-15', '6-16', '6-17', '6-18', '6-19'],
  rates: [88.5, 90.2, 89.8, 92.1, 91.5, 93.2, 94.8],
  totals: [180, 185, 188, 190, 188, 190, 190]
}

const typeMap: Record<string, { label: string; color: string }> = {
  repair: { label: '故障维修', color: 'red' },
  maintenance: { label: '保养维护', color: 'blue' },
  inspection: { label: '巡检', color: 'green' },
  other: { label: '其他', color: 'default' }
}

const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'default' },
  medium: { label: '中', color: 'blue' },
  high: { label: '高', color: 'orange' },
  urgent: { label: '紧急', color: 'red' }
}

const levelMap: Record<string, { color: string; icon: React.ReactNode }> = {
  info: { color: '#1890ff', icon: <Badge status="default" /> },
  warning: { color: '#faad14', icon: <Badge status="warning" /> },
  error: { color: '#ff4d4f', icon: <Badge status="error" /> },
  critical: { color: '#cf1322', icon: <ExclamationCircleOutlined style={{ color: '#cf1322' }} /> }
}

function Dashboard() {
  const navigate = useNavigate()
  const { token } = useToken()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const pieOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}台 ({d}%)'
    },
    legend: {
      bottom: '0%',
      left: 'center'
    },
    series: [
      {
        name: '设备状态',
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{c}台'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: true
        },
        data: mockStatusDistribution
      }
    ]
  }), [])

  const lineOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const rate = params[0]
        const total = params[1]
        return `${rate.name}<br/>${rate.marker}在线率: ${rate.value}%<br/>${total.marker}设备总数: ${total.value}台`
      }
    },
    legend: {
      data: ['在线率', '设备总数'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: mockOnlineTrend.dates
    },
    yAxis: [
      {
        type: 'value',
        name: '在线率(%)',
        min: 80,
        max: 100,
        position: 'left',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      {
        type: 'value',
        name: '总数(台)',
        min: 150,
        max: 220,
        position: 'right'
      }
    ],
    series: [
      {
        name: '在线率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        yAxisIndex: 0,
        itemStyle: { color: '#52c41a' },
        lineStyle: { width: 3, color: '#52c41a' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82,196,26,0.3)' },
              { offset: 1, color: 'rgba(82,196,26,0.05)' }
            ]
          }
        },
        data: mockOnlineTrend.rates
      },
      {
        name: '设备总数',
        type: 'line',
        smooth: true,
        symbol: 'diamond',
        symbolSize: 6,
        yAxisIndex: 1,
        itemStyle: { color: '#1890ff' },
        lineStyle: { width: 2, color: '#1890ff', type: 'dashed' },
        data: mockOnlineTrend.totals
      }
    ]
  }), [])

  const workOrderColumns: ColumnsType<any> = [
    {
      title: '工单编号',
      dataIndex: 'id',
      key: 'id',
      width: 140,
      render: (t) => <Text code style={{ fontSize: 12 }}>{t}</Text>
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (t) => <Text strong>{t}</Text>
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (t) => <Tag color={typeMap[t].color}>{typeMap[t].label}</Tag>
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (p) => {
        const cfg = priorityMap[p]
        return <Tag color={cfg.color}>{cfg.label}</Tag>
      }
    },
    {
      title: '关联设备',
      dataIndex: 'deviceName',
      key: 'deviceName',
      width: 140,
      render: (t) => <Tag icon={<DeviceTabletOutlined />}>{t}</Tag>
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
      width: 100,
      render: () => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate('/work-orders')}>
            处理
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Space direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>运维仪表盘</Title>
          <Text type="secondary">
            今日是 {dayjs().format('YYYY年MM月DD日')} {dayjs().format('dddd')}，欢迎回来！
          </Text>
        </Space>
        <Button
          icon={<ReloadOutlined spin={refreshing} />}
          onClick={handleRefresh}
        >
          刷新数据
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {mockWorkOrderStats.map((stat) => (
          <Col xs={12} sm={12} md={6} key={stat.key}>
            <Card
              bordered={false}
              style={{ borderRadius: 12, overflow: 'hidden' }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{stat.label}</Text>
                  <Statistic
                    value={stat.value}
                    style={{ marginTop: 8 }}
                    valueStyle={{ color: stat.color, fontWeight: 600 }}
                  />
                  {stat.trend !== undefined && (
                    <div style={{ marginTop: 4 }}>
                      <Tag
                        color={stat.trend >= 0 ? 'green' : 'red'}
                        icon={stat.trend >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        style={{ marginInlineEnd: 0 }}
                      >
                        较昨日 {Math.abs(stat.trend)}
                      </Tag>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${stat.color}15`,
                    color: stat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22
                  }}
                >
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={10}>
          <Card
            title="设备状态分布"
            bordered={false}
            style={{ borderRadius: 12, height: '100%' }}
            extra={
              <Button type="link" onClick={() => navigate('/devices')}>
                查看全部 →
              </Button>
            }
          >
            <ReactECharts
              option={pieOption}
              style={{ height: 280 }}
              opts={{ renderer: 'canvas' }}
            />
            <Row gutter={8} style={{ marginTop: 8 }}>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>156</div>
                <Text type="secondary" style={{ fontSize: 12 }}>在线</Text>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#d9d9d9' }}>23</div>
                <Text type="secondary" style={{ fontSize: 12 }}>离线</Text>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#faad14' }}>11</div>
                <Text type="secondary" style={{ fontSize: 12 }}>告警</Text>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card
            title="最近告警"
            bordered={false}
            style={{ borderRadius: 12, height: '100%' }}
            extra={
              <Badge count={mockRecentAlarms.filter(a => !a.handled).length} offset={[0, 2]}>
                <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>未处理</Text>
              </Badge>
            }
          >
            <List
              dataSource={mockRecentAlarms}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid #f5f5f5',
                    opacity: item.handled ? 0.6 : 1
                  }}
                >
                  <Space size={12} style={{ width: '100%' }} align="start">
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 18
                      }}
                    >
                      {levelMap[item.level].icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Space wrap>
                        <Tag
                          color={item.handled ? 'default' : (
                            item.level === 'critical' || item.level === 'error' ? 'red' :
                            item.level === 'warning' ? 'orange' : 'blue'
                          )}
                          style={{ fontSize: 12 }}
                        >
                          {item.deviceId}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                        {item.handled && <Tag color="green" style={{ fontSize: 11 }}>已处理</Tag>}
                      </Space>
                      <div style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: 13 }}>{item.message}</Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 11, marginTop: 2, display: 'block' }}>
                        {item.deviceName}
                      </Text>
                    </div>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card
            title="设备在线率趋势（近7天）"
            bordered={false}
            style={{ borderRadius: 12 }}
            extra={
              <Space>
                <Progress
                  type="dashboard"
                  percent={94.8}
                  size={60}
                  strokeColor="#52c41a"
                  format={(p) => <span style={{ fontSize: 12, color: '#52c41a' }}>{p}%</span>}
                  style={{ margin: 0 }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>当前在线率</Text>
              </Space>
            }
          >
            <ReactECharts
              option={lineOption}
              style={{ height: 300 }}
              opts={{ renderer: 'canvas' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title="待处理工单"
            bordered={false}
            style={{ borderRadius: 12 }}
            extra={
              <Button type="primary" icon={<ThunderboltOutlined />} onClick={() => navigate('/work-orders')}>
                进入工单管理
              </Button>
            }
          >
            <Table
              columns={workOrderColumns}
              dataSource={mockPendingOrders}
              rowKey="id"
              size="middle"
              pagination={false}
              scroll={{ x: 900 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

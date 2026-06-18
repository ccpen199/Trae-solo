import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Space } from 'antd'
import {
  ThunderboltOutlined,
  CarOutlined,
  DollarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'

interface PileStatusItem {
  id: string
  name: string
  stationName: string
  status: 'idle' | 'charging' | 'offline' | 'fault'
  power: number
}

const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  idle: { color: 'green', text: '空闲', icon: <CheckCircleOutlined /> },
  charging: { color: 'blue', text: '充电中', icon: <ThunderboltOutlined /> },
  offline: { color: 'default', text: '离线', icon: <CloseCircleOutlined /> },
  fault: { color: 'red', text: '故障', icon: <WarningOutlined /> }
}

const mockPileData: PileStatusItem[] = [
  { id: '1', name: 'A001', stationName: '浦东充电站', status: 'charging', power: 60 },
  { id: '2', name: 'A002', stationName: '浦东充电站', status: 'idle', power: 0 },
  { id: '3', name: 'B001', stationName: '虹桥充电站', status: 'fault', power: 0 },
  { id: '4', name: 'B002', stationName: '虹桥充电站', status: 'charging', power: 120 },
  { id: '5', name: 'C001', stationName: '徐汇充电站', status: 'offline', power: 0 },
  { id: '6', name: 'C002', stationName: '徐汇充电站', status: 'idle', power: 0 }
]

const trendOption = {
  title: { text: '近7日充电趋势', left: 'center' },
  tooltip: { trigger: 'axis' },
  legend: { data: ['充电次数', '充电量(kWh)'], bottom: 0 },
  xAxis: {
    type: 'category',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: [
    { type: 'value', name: '次数' },
    { type: 'value', name: 'kWh' }
  ],
  series: [
    {
      name: '充电次数',
      type: 'bar',
      data: [120, 132, 101, 134, 90, 230, 210],
      itemStyle: { color: '#5470c6' }
    },
    {
      name: '充电量(kWh)',
      type: 'line',
      yAxisIndex: 1,
      data: [820, 932, 701, 934, 590, 1330, 1220],
      itemStyle: { color: '#91cc75' }
    }
  ]
}

const pieOption = {
  title: { text: '充电桩状态分布', left: 'center' },
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left' },
  series: [
    {
      name: '状态',
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 156, name: '空闲', itemStyle: { color: '#52c41a' } },
        { value: 89, name: '充电中', itemStyle: { color: '#1890ff' } },
        { value: 23, name: '离线', itemStyle: { color: '#bfbfbf' } },
        { value: 12, name: '故障', itemStyle: { color: '#f5222d' } }
      ]
    }
  ]
}

function Dashboard() {
  const [realtimeData, setRealtimeData] = useState({
    totalPiles: 280,
    onlinePiles: 245,
    chargingPiles: 89,
    todayOrders: 1256,
    todayRevenue: 28560.5,
    totalUsers: 15680
  })

  const columns: ColumnsType<PileStatusItem> = [
    { title: '桩编号', dataIndex: 'name', key: 'name' },
    { title: '所属场站', dataIndex: 'stationName', key: 'stationName' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status]
        return <Tag color={info.color}>{info.icon} {info.text}</Tag>
      }
    },
    { title: '功率(kW)', dataIndex: 'power', key: 'power' }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setRealtimeData((prev) => ({
        ...prev,
        todayOrders: prev.todayOrders + Math.floor(Math.random() * 3),
        todayRevenue: prev.todayRevenue + Math.random() * 50
      }))
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="充电桩总数"
              value={realtimeData.totalPiles}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在线桩数"
              value={realtimeData.onlinePiles}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日订单"
              value={realtimeData.todayOrders}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日收益"
              value={realtimeData.todayRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="桩状态实时巡检" style={{ marginBottom: 16 }}>
            <Table
              columns={columns}
              dataSource={mockPileData}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
          <Card>
            <ReactECharts option={trendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ marginBottom: 16 }}>
            <ReactECharts option={pieOption} style={{ height: 300 }} />
          </Card>
          <Card title="实时数据">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>充电中: {realtimeData.chargingPiles} 台</div>
              <div>今日充电量: 8,560.5 kWh</div>
              <div>活跃用户: {Math.floor(realtimeData.totalUsers * 0.15)} 人</div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Space, Button, Badge } from 'antd'
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import { formatDateTime, formatMoney } from '@/utils'

interface AlarmItem {
  id: string
  type: 'offline' | 'comm_error' | 'power_error' | 'timeout'
  pileCode: string
  stationName: string
  operator: string
  message: string
  time: string
  handled: boolean
}

interface PileStatusItem {
  id: string
  code: string
  stationName: string
  operator: string
  protocol: string
  status: 'idle' | 'charging' | 'offline' | 'fault'
  power: number
  lastHeartbeat: string
}

interface HighwayStation {
  name: string
  code: string
  totalPiles: number
  onlinePiles: number
  faultPiles: number
  lng: number
  lat: number
}

const alarmTypeMap: Record<string, { color: string; text: string }> = {
  offline: { color: 'red', text: '桩离线' },
  comm_error: { color: 'orange', text: '通信异常' },
  power_error: { color: 'volcano', text: '功率异常' },
  timeout: { color: 'gold', text: '超时未结算' }
}

const statusMap: Record<string, { color: string; text: string }> = {
  idle: { color: 'green', text: '空闲' },
  charging: { color: 'blue', text: '充电中' },
  offline: { color: 'default', text: '离线' },
  fault: { color: 'red', text: '故障' }
}

const operators = ['国网', '特来电', '星星充电', '小桔充电', '云快充']
const protocols = ['OCPP1.6J', 'OCPP2.0', '国网协议', '二合一协议', 'TCP/ISO']

const highwayStations: HighwayStation[] = [
  { name: 'G1京哈-山海关服务区站', code: 'G1-SHG', totalPiles: 24, onlinePiles: 22, faultPiles: 1, lng: 119.75, lat: 40.0 },
  { name: 'G1京哈-秦皇岛站', code: 'G1-QHD', totalPiles: 16, onlinePiles: 15, faultPiles: 0, lng: 119.6, lat: 39.95 },
  { name: 'G2京沪-济南服务区站', code: 'G2-JN', totalPiles: 32, onlinePiles: 28, faultPiles: 2, lng: 117.0, lat: 36.67 },
  { name: 'G2京沪-泰安站', code: 'G2-TA', totalPiles: 20, onlinePiles: 18, faultPiles: 1, lng: 117.13, lat: 36.2 },
  { name: 'G4京港澳-郑州站', code: 'G4-ZZ', totalPiles: 28, onlinePiles: 25, faultPiles: 1, lng: 113.65, lat: 34.76 },
  { name: 'G4京港澳-武汉站', code: 'G4-WH', totalPiles: 36, onlinePiles: 33, faultPiles: 2, lng: 114.3, lat: 30.6 },
  { name: 'G15沈海-青岛站', code: 'G15-QD', totalPiles: 20, onlinePiles: 18, faultPiles: 1, lng: 120.38, lat: 36.07 },
  { name: 'G15沈海-福州站', code: 'G15-FZ', totalPiles: 24, onlinePiles: 22, faultPiles: 0, lng: 119.3, lat: 26.08 },
  { name: 'G5京昆-西安站', code: 'G5-XA', totalPiles: 18, onlinePiles: 16, faultPiles: 1, lng: 108.95, lat: 34.27 },
  { name: 'G6京藏-张家口站', code: 'G6-ZJK', totalPiles: 12, onlinePiles: 11, faultPiles: 0, lng: 114.88, lat: 40.82 },
  { name: 'G15沈海-厦门站', code: 'G15-XM', totalPiles: 20, onlinePiles: 19, faultPiles: 1, lng: 118.1, lat: 24.46 },
  { name: 'G4京港澳-长沙站', code: 'G4-CS', totalPiles: 26, onlinePiles: 24, faultPiles: 1, lng: 112.98, lat: 28.23 }
]

const initAlarms: AlarmItem[] = [
  { id: '1', type: 'offline', pileCode: 'G2-JN-DC003', stationName: 'G2京沪-济南服务区站', operator: '国网', message: '充电桩离线超过30分钟', time: '2024-06-18 14:23:05', handled: false },
  { id: '2', type: 'comm_error', pileCode: 'G4-WH-DC007', stationName: 'G4京港澳-武汉站', operator: '特来电', message: '通信协议握手失败，连续3次', time: '2024-06-18 14:18:32', handled: false },
  { id: '3', type: 'power_error', pileCode: 'G1-SHG-DC012', stationName: 'G1京哈-山海关服务区站', operator: '星星充电', message: '实际输出功率与请求功率偏差>15%', time: '2024-06-18 14:12:18', handled: false },
  { id: '4', type: 'timeout', pileCode: 'G15-QD-AC005', stationName: 'G15沈海-青岛站', operator: '小桔充电', message: '充电结束2小时未生成结算单', time: '2024-06-18 13:58:44', handled: false },
  { id: '5', type: 'offline', pileCode: 'G4-ZZ-DC015', stationName: 'G4京港澳-郑州站', operator: '云快充', message: '充电桩离线超过15分钟', time: '2024-06-18 13:45:20', handled: true },
  { id: '6', type: 'power_error', pileCode: 'G2-TA-DC008', stationName: 'G2京沪-泰安站', operator: '国网', message: '输出功率骤降至0但未断开连接', time: '2024-06-18 13:30:11', handled: true },
  { id: '7', type: 'comm_error', pileCode: 'G5-XA-DC003', stationName: 'G5京昆-西安站', operator: '特来电', message: '心跳包间隔超时60秒', time: '2024-06-18 13:15:08', handled: true },
  { id: '8', type: 'timeout', pileCode: 'G15-FZ-AC009', stationName: 'G15沈海-福州站', operator: '星星充电', message: '订单支付回调超时', time: '2024-06-18 12:50:33', handled: false }
]

const initPileData: PileStatusItem[] = (() => {
  const stations = ['G1京哈-山海关服务区站', 'G2京沪-济南服务区站', 'G4京港澳-武汉站', 'G15沈海-青岛站', 'G4京港澳-郑州站', 'G5京昆-西安站', 'G6京藏-张家口站', 'G15沈海-厦门站']
  const statuses: PileStatusItem['status'][] = ['idle', 'charging', 'offline', 'fault']
  const items: PileStatusItem[] = []
  let idx = 0
  stations.forEach((station, si) => {
    const count = 6 + (si % 4)
    for (let i = 0; i < count; i++) {
      const sIdx = i % 4
      const status = sIdx === 3 && si % 3 === 0 ? 'fault' : statuses[sIdx]
      items.push({
        id: String(++idx),
        code: `${highwayStations[si]?.code || 'XX'}-DC${String(i + 1).padStart(3, '0')}`,
        stationName: station,
        operator: operators[si % operators.length],
        protocol: protocols[si % protocols.length],
        status,
        power: status === 'charging' ? 30 + Math.floor(Math.random() * 90) : 0,
        lastHeartbeat: status === 'offline'
          ? '2024-06-18 12:00:00'
          : new Date(Date.now() - Math.floor(Math.random() * 300000)).toISOString().replace('T', ' ').substring(0, 19)
      })
    }
  })
  return items
})()

const getHeatmapOption = () => ({
  title: { text: '十横十纵两环高速网络桩状态分布', left: 'center', textStyle: { fontSize: 14 } },
  tooltip: {
    trigger: 'item',
    formatter: (params: any) => {
      const s = highwayStations[params.dataIndex]
      return s ? `${s.name}<br/>总桩数: ${s.totalPiles}<br/>在线: ${s.onlinePiles}<br/>故障: ${s.faultPiles}` : ''
    }
  },
  grid: { left: 40, right: 80, top: 70, bottom: 40 },
  xAxis: {
    type: 'value',
    name: '经度',
    min: 105,
    max: 122,
    splitLine: { lineStyle: { type: 'dashed', color: '#e8e8e8' } }
  },
  yAxis: {
    type: 'value',
    name: '纬度',
    min: 23,
    max: 42,
    splitLine: { lineStyle: { type: 'dashed', color: '#e8e8e8' } }
  },
  series: [{
    type: 'scatter',
    data: highwayStations.map((s) => ({
      name: s.name,
      value: [s.lng, s.lat, s.onlinePiles],
      itemStyle: {
        color: s.faultPiles > 1 ? '#d94e5d' : s.onlinePiles / s.totalPiles > 0.85 ? '#50a3ba' : '#eac763'
      }
    })),
    symbolSize: (val: number[]) => Math.max(12, val[2] * 0.8),
    label: {
      show: true,
      formatter: '{b}',
      position: 'right',
      fontSize: 10,
      color: '#333'
    }
  }]
})

const getOperatorBarOption = () => ({
  title: { text: '各运营商桩状态分布对比', left: 'center', textStyle: { fontSize: 14 } },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { data: ['空闲', '充电中', '离线', '故障'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
  xAxis: { type: 'category', data: operators },
  yAxis: { type: 'value', name: '桩数' },
  series: [
    { name: '空闲', type: 'bar', stack: 'total', data: [86, 72, 48, 35, 28], itemStyle: { color: '#52c41a' } },
    { name: '充电中', type: 'bar', stack: 'total', data: [45, 38, 25, 20, 15], itemStyle: { color: '#1890ff' } },
    { name: '离线', type: 'bar', stack: 'total', data: [12, 8, 6, 4, 3], itemStyle: { color: '#bfbfbf' } },
    { name: '故障', type: 'bar', stack: 'total', data: [7, 5, 3, 2, 2], itemStyle: { color: '#f5222d' } }
  ]
})

function Dashboard() {
  const [alarms, setAlarms] = useState<AlarmItem[]>(initAlarms)
  const [pileData] = useState<PileStatusItem[]>(initPileData)
  const [realtime, setRealtime] = useState({
    totalPiles: 1680,
    onlineRate: 91.2,
    todayOrders: 3856,
    todayRevenue: 289650,
    faultPiles: 47,
    inspectionAnomalies: 23
  })

  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  const [powerData, setPowerData] = useState<number[]>([
    1200, 980, 750, 620, 530, 480, 620, 1100, 2800, 4500, 5800, 6200,
    5900, 5600, 5200, 4800, 5100, 5800, 6100, 5500, 4200, 3100, 2200, 1500
  ])

  const handleAlarm = useCallback((id: string) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, handled: true } : a))
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setRealtime(prev => ({
        ...prev,
        todayOrders: prev.todayOrders + Math.floor(Math.random() * 5),
        todayRevenue: prev.todayRevenue + Math.floor(Math.random() * 300),
        faultPiles: Math.max(30, prev.faultPiles + (Math.random() > 0.7 ? 1 : -1)),
        inspectionAnomalies: Math.max(15, prev.inspectionAnomalies + (Math.random() > 0.8 ? 1 : -1))
      }))
      setPowerData(prev => {
        const next = [...prev]
        const hour = new Date().getHours()
        next[hour] = Math.max(400, next[hour] + Math.floor(Math.random() * 200 - 100))
        return next
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const alarmColumns: ColumnsType<AlarmItem> = [
    {
      title: '告警类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const info = alarmTypeMap[type]
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    { title: '桩编号', dataIndex: 'pileCode', key: 'pileCode', width: 150 },
    { title: '场站', dataIndex: 'stationName', key: 'stationName', ellipsis: true },
    { title: '运营商', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '告警信息', dataIndex: 'message', key: 'message', ellipsis: true },
    { title: '时间', dataIndex: 'time', key: 'time', width: 170, render: (t) => formatDateTime(t) },
    {
      title: '状态',
      dataIndex: 'handled',
      key: 'handled',
      width: 100,
      render: (handled: boolean) =>
        handled
          ? <Tag color="green">已处理</Tag>
          : <Badge status="error" text={<span style={{ color: '#f5222d' }}>未处理</span>} />
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) =>
        record.handled ? null : (
          <Button type="link" size="small" onClick={() => handleAlarm(record.id)}>
            标记处理
          </Button>
        )
    }
  ]

  const pileColumns: ColumnsType<PileStatusItem> = [
    { title: '桩编号', dataIndex: 'code', key: 'code', width: 150 },
    { title: '所属场站', dataIndex: 'stationName', key: 'stationName', ellipsis: true },
    { title: '运营商', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '协议类型', dataIndex: 'protocol', key: 'protocol', width: 120 },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status]
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    { title: '功率(kW)', dataIndex: 'power', key: 'power', width: 100, render: (p) => p > 0 ? `${p}` : '-' },
    { title: '最后心跳', dataIndex: 'lastHeartbeat', key: 'lastHeartbeat', width: 170, render: (t) => formatDateTime(t) }
  ]

  const powerCurveOption = {
    title: { text: '24小时充电功率曲线', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: hours, name: '时间' },
    yAxis: { type: 'value', name: '功率(kW)' },
    series: [{
      type: 'line',
      data: powerData,
      smooth: true,
      areaStyle: { opacity: 0.3, color: '#1890ff' },
      lineStyle: { color: '#1890ff', width: 2 },
      itemStyle: { color: '#1890ff' },
      markPoint: { data: [{ type: 'max', name: '峰值' }, { type: 'min', name: '谷值' }] },
      markLine: { data: [{ type: 'average', name: '均值' }] }
    }]
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic title="充电桩总数" value={realtime.totalPiles} prefix={<ThunderboltOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="在线率" value={realtime.onlineRate} precision={1} suffix="%" prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="今日订单" value={realtime.todayOrders} prefix={<FileTextOutlined />} valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="今日营收" value={realtime.todayRevenue} prefix={<DollarOutlined />} valueStyle={{ color: '#fa8c16' }} formatter={(val) => formatMoney(Number(val))} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="故障桩数" value={realtime.faultPiles} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="巡检异常数" value={realtime.inspectionAnomalies} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#eb2f96' }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <ReactECharts option={getHeatmapOption()} style={{ height: 400 }} opts={{ renderer: 'canvas' }} />
        <Space style={{ marginTop: 8 }} wrap>
          <Tag color="#50a3ba">● 在线率 &gt;85%</Tag>
          <Tag color="#eac763">● 在线率 70%-85%</Tag>
          <Tag color="#d94e5d">● 故障桩 &gt;1</Tag>
        </Space>
      </Card>

      <Card
        title={
          <Space>
            <WarningOutlined style={{ color: '#fa8c16' }} />
            <span>实时巡检告警</span>
            <Badge count={alarms.filter(a => !a.handled).length} />
          </Space>
        }
        style={{ marginBottom: 16 }}
        extra={
          <Space>
            <SyncOutlined spin style={{ color: '#1890ff' }} />
            <span style={{ fontSize: 12, color: '#999' }}>实时监控中</span>
          </Space>
        }
      >
        <Table columns={alarmColumns} dataSource={alarms} rowKey="id" size="small" pagination={false} />
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={14}>
          <Card title="充电桩实时状态">
            <Table columns={pileColumns} dataSource={pileData} rowKey="id" size="small" scroll={{ y: 360 }} pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 台` }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="各运营商桩状态分布" style={{ marginBottom: 16 }}>
            <ReactECharts option={getOperatorBarOption()} style={{ height: 300 }} />
          </Card>
          <Card title="24小时充电功率曲线">
            <ReactECharts option={powerCurveOption} style={{ height: 260 }} />
          </Card>
        </Col>
      </Row>

      <Card title="高速网络站点概览">
        <Row gutter={[16, 16]}>
          {highwayStations.map((station) => {
            const rate = ((station.onlinePiles / station.totalPiles) * 100).toFixed(1)
            const isWarning = station.faultPiles > 1 || Number(rate) < 85
            return (
              <Col span={6} key={station.code}>
                <Card size="small" style={{ borderColor: isWarning ? '#fa8c16' : undefined }}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space>
                      <EnvironmentOutlined style={{ color: isWarning ? '#fa8c16' : '#1890ff' }} />
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{station.name}</span>
                    </Space>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      总桩数: {station.totalPiles} | 在线: <span style={{ color: '#52c41a' }}>{station.onlinePiles}</span>
                      {station.faultPiles > 0 && <span style={{ color: '#f5222d' }}> | 故障: {station.faultPiles}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>在线率: <span style={{ color: Number(rate) >= 85 ? '#52c41a' : '#fa8c16', fontWeight: 500 }}>{rate}%</span></div>
                  </Space>
                </Card>
              </Col>
            )
          })}
        </Row>
      </Card>
    </div>
  )
}

export default Dashboard

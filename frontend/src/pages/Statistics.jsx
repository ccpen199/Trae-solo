import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Select, DatePicker, Space, Tabs } from 'antd'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import StatCard from '../components/StatCard.jsx'
import { getPowerConsumption, getUsagePatterns, getDeviceUsage, getCommandStats, getOverview } from '../api/statistics.js'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16']

const mockPowerData = [
  { date: '06-01', tv: 2.5, ac: 5.2, light: 1.2, projector: 0.8 },
  { date: '06-02', tv: 3.1, ac: 4.8, light: 1.5, projector: 1.2 },
  { date: '06-03', tv: 2.8, ac: 6.1, light: 1.3, projector: 0.5 },
  { date: '06-04', tv: 2.2, ac: 5.5, light: 1.1, projector: 1.8 },
  { date: '06-05', tv: 3.5, ac: 4.9, light: 1.4, projector: 2.1 },
  { date: '06-06', tv: 4.2, ac: 5.8, light: 1.6, projector: 2.5 },
  { date: '06-07', tv: 3.8, ac: 5.3, light: 1.2, projector: 1.9 }
]

const mockUsagePatterns = [
  { hour: '00:00', commands: 5, devices: 2 },
  { hour: '02:00', commands: 2, devices: 1 },
  { hour: '04:00', commands: 1, devices: 1 },
  { hour: '06:00', commands: 8, devices: 3 },
  { hour: '08:00', commands: 25, devices: 5 },
  { hour: '10:00', commands: 15, devices: 3 },
  { hour: '12:00', commands: 35, devices: 6 },
  { hour: '14:00', commands: 20, devices: 4 },
  { hour: '16:00', commands: 18, devices: 4 },
  { hour: '18:00', commands: 45, devices: 7 },
  { hour: '20:00', commands: 65, devices: 8 },
  { hour: '22:00', commands: 30, devices: 5 }
]

const mockDeviceUsage = [
  { name: '客厅电视', value: 156, color: '#1890ff' },
  { name: '客厅空调', value: 128, color: '#52c41a' },
  { name: '投影仪', value: 86, color: '#722ed1' },
  { name: '客厅灯光', value: 245, color: '#faad14' },
  { name: '主卧空调', value: 98, color: '#13c2c2' },
  { name: '次卧电视', value: 45, color: '#eb2f96' }
]

const mockCommandStats = [
  { command: 'power', count: 312, label: '电源' },
  { command: 'volume_up', count: 186, label: '音量+' },
  { command: 'volume_down', count: 165, label: '音量-' },
  { command: 'temp_up', count: 98, label: '温度+' },
  { command: 'temp_down', count: 87, label: '温度-' },
  { command: 'channel_up', count: 124, label: '频道+' },
  { command: 'channel_down', count: 102, label: '频道-' },
  { command: 'mute', count: 76, label: '静音' }
]

const mockOverview = {
  totalPower: 58.5,
  avgDailyPower: 8.36,
  totalCommands: 1256,
  avgDailyCommands: 179,
  powerTrend: 'up',
  commandTrend: 'down',
  mostUsedDevice: '客厅灯光',
  mostUsedCommand: '电源'
}

function Statistics() {
  const [timeRange, setTimeRange] = useState('week')
  const [overview, setOverview] = useState(mockOverview)
  const [powerData, setPowerData] = useState(mockPowerData)
  const [usagePatterns, setUsagePatterns] = useState(mockUsagePatterns)
  const [deviceUsage, setDeviceUsage] = useState(mockDeviceUsage)
  const [commandStats, setCommandStats] = useState(mockCommandStats)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [timeRange])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = { range: timeRange }
      const [overviewData, powerData, usageData, deviceData, commandData] = await Promise.all([
        getOverview().catch(() => mockOverview),
        getPowerConsumption(params).catch(() => mockPowerData),
        getUsagePatterns(params).catch(() => mockUsagePatterns),
        getDeviceUsage(params).catch(() => mockDeviceUsage),
        getCommandStats(params).catch(() => mockCommandStats)
      ])
      setOverview(overviewData)
      setPowerData(powerData?.data || powerData || mockPowerData)
      setUsagePatterns(usageData?.data || usageData || mockUsagePatterns)
      setDeviceUsage(deviceData?.data || deviceData || mockDeviceUsage)
      setCommandStats(commandData?.data || commandData || mockCommandStats)
    } catch (error) {
      console.error('Load statistics failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPower = powerData.reduce((sum, item) =>
    sum + item.tv + item.ac + item.light + item.projector, 0
  )

  const totalCommands = commandStats.reduce((sum, item) => sum + item.count, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>数据统计</h2>
        <Space>
          <Select value={timeRange} onChange={setTimeRange} style={{ width: 120 }}>
            <Option value="today">今天</Option>
            <Option value="week">本周</Option>
            <Option value="month">本月</Option>
            <Option value="year">本年</Option>
          </Select>
          <RangePicker
            defaultValue={[dayjs().subtract(7, 'day'), dayjs()]}
            onChange={() => {}}
          />
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <StatCard
            title="总耗电量"
            value={totalPower.toFixed(1)}
            unit="kWh"
            icon="⚡"
            color="#1890ff"
            trend={overview.powerTrend === 'up' ? 'up' : 'down'}
            trendValue={12}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="日均耗电"
            value={overview.avgDailyPower}
            unit="kWh"
            icon="📊"
            color="#52c41a"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="总指令数"
            value={totalCommands}
            unit="次"
            icon="📡"
            color="#722ed1"
            trend={overview.commandTrend === 'up' ? 'up' : 'down'}
            trendValue={8}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="最常用设备"
            value={overview.mostUsedDevice}
            icon="📱"
            color="#faad14"
          />
        </Col>
      </Row>

      <Tabs defaultActiveKey="power">
        <TabPane tab="耗电统计" key="power">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="耗电量趋势" loading={loading}>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={powerData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="tv" stackId="1" stroke="#1890ff" fill="#1890ff" fillOpacity={0.6} name="电视" />
                      <Area type="monotone" dataKey="ac" stackId="1" stroke="#52c41a" fill="#52c41a" fillOpacity={0.6} name="空调" />
                      <Area type="monotone" dataKey="light" stackId="1" stroke="#faad14" fill="#faad14" fillOpacity={0.6} name="灯光" />
                      <Area type="monotone" dataKey="projector" stackId="1" stroke="#722ed1" fill="#722ed1" fillOpacity={0.6} name="投影仪" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="设备耗电占比" loading={loading}>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceUsage}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {deviceUsage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="使用模式" key="usage">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="24小时使用分布" loading={loading}>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usagePatterns}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="commands" stroke="#1890ff" strokeWidth={2} name="指令数" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="devices" stroke="#52c41a" strokeWidth={2} name="活跃设备数" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="设备使用排行" loading={loading}>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deviceUsage} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#1890ff" name="使用次数">
                        {deviceUsage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="指令统计" key="commands">
          <Card title="指令使用排行" loading={loading}>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commandStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#722ed1" name="使用次数">
                    {commandStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default Statistics

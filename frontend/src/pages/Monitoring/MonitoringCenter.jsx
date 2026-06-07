import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Tabs, Button, message } from 'antd'
import {
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import api from '../../api'

const defaultAlerts = [
  { id: 1, service: '社保缴费接口', api: '/api/social/pay', reason: '响应超时 > 5s', level: '严重', time: '2024-01-15 10:30' },
  { id: 2, service: '公积金查询接口', api: '/api/fund/query', reason: '返回错误码 500', level: '严重', time: '2024-01-15 10:15' },
  { id: 3, service: '医保报销接口', api: '/api/medical/claim', reason: '响应超时 > 3s', level: '警告', time: '2024-01-15 09:45' },
  { id: 4, service: '不动产登记接口', api: '/api/estate/register', reason: '服务降级', level: '警告', time: '2024-01-15 09:20' },
]

const heatmapData = [
  { step: '申请提交', avgTime: '2min', timeoutRate: '1.2%', level: 1 },
  { step: '材料审核', avgTime: '45min', timeoutRate: '8.5%', level: 3 },
  { step: '部门受理', avgTime: '30min', timeoutRate: '5.3%', level: 2 },
  { step: '审批决策', avgTime: '2h', timeoutRate: '15.2%', level: 4 },
  { step: '结果通知', avgTime: '10min', timeoutRate: '3.1%', level: 2 },
  { step: '证照制作', avgTime: '1h', timeoutRate: '6.8%', level: 3 },
]

export default function MonitoringCenter() {
  const [alerts, setAlerts] = useState(defaultAlerts)
  const [checking, setChecking] = useState(false)

  const bizIndicators = [
    { title: '平均跑动次数', value: 1.2, unit: '次', trend: 'down', change: '0.3' },
    { title: '承诺时限压缩率', value: 68.5, unit: '%', trend: 'up', change: '5.2' },
    { title: '一次办结率', value: 96.8, unit: '%', trend: 'up', change: '2.1' },
    { title: '零跑动事项占比', value: 82.3, unit: '%', trend: 'up', change: '3.5' },
    { title: '即办事项占比', value: 55.6, unit: '%', trend: 'up', change: '4.8' },
    { title: '好评率', value: 98.2, unit: '%', trend: 'up', change: '0.5' },
  ]

  const generateTrendData = () => {
    const months = []
    for (let i = 11; i >= 0; i--) {
      months.push(dayjs().subtract(i, 'month').format('YYYY-MM'))
    }
    return months
  }

  const months = generateTrendData()

  const timeoutTrendOption = {
    tooltip: { trigger: 'axis', formatter: '{b}<br/>超时率: {c}%' },
    grid: { left: 60, right: 30, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%' }, max: 5 },
    series: [{
      type: 'line',
      data: [3.2, 2.8, 3.5, 2.1, 1.8, 2.5, 3.1, 2.9, 1.6, 2.2, 1.9, 1.5],
      smooth: true,
      lineStyle: { color: '#ff4d4f', width: 2 },
      itemStyle: { color: '#ff4d4f' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255,77,79,0.3)' },
          { offset: 1, color: 'rgba(255,77,79,0.02)' },
        ]),
      },
      markLine: { data: [{ yAxis: 3, name: '告警线', lineStyle: { color: '#faad14', type: 'dashed' } }] },
    }],
  }

  const topServiceOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 100, right: 30, top: 20, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: ['户籍迁移', '食品许可', '车辆年检', '医保报销', '公积金提取', '社保缴费', '居住证办理', '营业执照', '不动产登记', '教师资格认定'].reverse(),
      axisLabel: { fontSize: 12 },
    },
    series: [{
      type: 'bar',
      data: [156, 189, 234, 278, 312, 367, 423, 489, 534, 612].reverse(),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#1890ff' },
          { offset: 1, color: '#36cfc9' },
        ]),
        borderRadius: [0, 4, 4, 0],
      },
      barWidth: 18,
    }],
  }

  const volumeTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['办理量', '办结量'], bottom: 0 },
    grid: { left: 60, right: 30, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value' },
    series: [
      {
        name: '办理量', type: 'line', smooth: true,
        data: [3200, 3500, 3100, 3800, 4200, 3900, 4500, 4800, 4300, 4600, 5100, 5300],
        lineStyle: { color: '#1890ff' }, itemStyle: { color: '#1890ff' },
      },
      {
        name: '办结量', type: 'line', smooth: true,
        data: [3000, 3300, 2900, 3600, 4000, 3700, 4300, 4600, 4100, 4400, 4900, 5100],
        lineStyle: { color: '#52c41a' }, itemStyle: { color: '#52c41a' },
      },
    ],
  }

  const bizTrendOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['一次办结率', '承诺时限压缩率'], bottom: 0 },
    grid: { left: 60, right: 30, top: 30, bottom: 40 },
    xAxis: { type: 'category', data: months },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
    series: [
      {
        name: '一次办结率', type: 'line', smooth: true,
        data: [88.5, 89.2, 90.1, 91.3, 92.0, 93.5, 94.1, 94.8, 95.2, 95.8, 96.3, 96.8],
        lineStyle: { color: '#1890ff' }, itemStyle: { color: '#1890ff' },
      },
      {
        name: '承诺时限压缩率', type: 'line', smooth: true,
        data: [55.2, 56.8, 58.3, 60.1, 61.5, 63.2, 64.5, 65.8, 66.2, 67.1, 67.8, 68.5],
        lineStyle: { color: '#52c41a' }, itemStyle: { color: '#52c41a' },
      },
    ],
  }

  const handleCheck = async () => {
    setChecking(true)
    const res = await api.post('/monitoring/check')
    setTimeout(() => {
      if (res.success) {
        message.success('检查完成，所有服务运行正常')
      } else {
        message.success('检查完成，发现2个异常服务')
      }
      setChecking(false)
    }, 1500)
  }

  const alertColumns = [
    { title: '服务名称', dataIndex: 'service', key: 'service' },
    { title: '接口', dataIndex: 'api', key: 'api' },
    { title: '原因', dataIndex: 'reason', key: 'reason' },
    {
      title: '级别', dataIndex: 'level', key: 'level', width: 80,
      render: (l) => <Tag color={l === '严重' ? 'error' : 'warning'}>{l}</Tag>,
    },
    { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
  ]

  const getHeatColor = (level) => {
    const colors = ['#f6ffed', '#d9f7be', '#bae637', '#faad14', '#ff4d4f']
    return colors[Math.min(level, 4)] || colors[0]
  }

  const tabItems = [
    {
      key: 'availability',
      label: '服务可用性',
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card title="接口超时率趋势" extra={<Button icon={<ReloadOutlined />} loading={checking} onClick={handleCheck}>手动检查</Button>} style={{ borderRadius: 8 }}>
                <ReactECharts option={timeoutTrendOption} style={{ height: 320 }} />
              </Card>
            </Col>
          </Row>
          <Card title="事项不可用告警" style={{ borderRadius: 8 }}>
            <Table columns={alertColumns} dataSource={alerts} rowKey="id" pagination={false} size="middle" />
          </Card>
        </div>
      ),
    },
    {
      key: 'behavior',
      label: '行为分析',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="高频事项TOP10" style={{ borderRadius: 8 }}>
              <ReactECharts option={topServiceOption} style={{ height: 360 }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="事项办理量趋势" style={{ borderRadius: 8 }}>
              <ReactECharts option={volumeTrendOption} style={{ height: 360 }} />
            </Card>
          </Col>
          <Col span={24}>
            <Card title="堵点环节热力图" style={{ borderRadius: 8 }}>
              <Row gutter={[8, 8]}>
                <Col span={24} style={{ marginBottom: 8 }}>
                  <Row>
                    <Col span={6} style={{ textAlign: 'center', fontWeight: 600, padding: 8 }}>环节</Col>
                    <Col span={6} style={{ textAlign: 'center', fontWeight: 600, padding: 8 }}>平均耗时</Col>
                    <Col span={6} style={{ textAlign: 'center', fontWeight: 600, padding: 8 }}>超时率</Col>
                    <Col span={6} style={{ textAlign: 'center', fontWeight: 600, padding: 8 }}>堵点指数</Col>
                  </Row>
                </Col>
                {heatmapData.map((item) => (
                  <Col span={24} key={item.step}>
                    <Row
                      style={{
                        background: getHeatColor(item.level),
                        borderRadius: 4,
                        transition: 'background 0.3s',
                      }}
                    >
                      <Col span={6} style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 500 }}>{item.step}</Col>
                      <Col span={6} style={{ textAlign: 'center', padding: '10px 8px' }}>{item.avgTime}</Col>
                      <Col span={6} style={{ textAlign: 'center', padding: '10px 8px' }}>{item.timeoutRate}</Col>
                      <Col span={6} style={{ textAlign: 'center', padding: '10px 8px' }}>
                        <Tag color={item.level >= 3 ? 'error' : item.level >= 2 ? 'warning' : 'success'}>
                          {item.level >= 4 ? '严重' : item.level >= 3 ? '较高' : item.level >= 2 ? '一般' : '正常'}
                        </Tag>
                      </Col>
                    </Row>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'business',
      label: '营商环境',
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            {bizIndicators.map((ind) => (
              <Col xs={12} sm={8} lg={4} key={ind.title}>
                <Card style={{ borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{ind.title}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#1a3a5c' }}>
                    {ind.value}
                    <span style={{ fontSize: 14, fontWeight: 400 }}>{ind.unit}</span>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    {ind.trend === 'up' ? (
                      <span style={{ color: '#52c41a', fontSize: 13 }}><ArrowUpOutlined /> {ind.change}{ind.unit}</span>
                    ) : (
                      <span style={{ color: '#ff4d4f', fontSize: 13 }}><ArrowDownOutlined /> {ind.change}{ind.unit}</span>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          <Card title="指标趋势" style={{ borderRadius: 8 }}>
            <ReactECharts option={bizTrendOption} style={{ height: 360 }} />
          </Card>
        </div>
      ),
    },
  ]

  return (
    <Card style={{ borderRadius: 8 }}>
      <Tabs items={tabItems} />
    </Card>
  )
}

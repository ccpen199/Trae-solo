import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Space } from 'antd'
import { CheckCircleOutlined, WarningOutlined, ClockCircleOutlined, BugOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { api } from '../utils/api'

function Dashboard() {
  const [overview, setOverview] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [overviewData, trend] = await Promise.all([
        api.getStatisticsOverview(),
        api.getQualityTrend(7),
      ])
      setOverview(overviewData)
      setTrendData(trend)
    } catch (e) {
      console.error('Failed to load dashboard data:', e)
    } finally {
      setLoading(false)
    }
  }

  const trendChart = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总检测', '确认缺陷', '误检'] },
    xAxis: { type: 'category', data: trendData.map(d => d.date) },
    yAxis: { type: 'value' },
    series: [
      { name: '总检测', type: 'line', data: trendData.map(d => d.total) },
      { name: '确认缺陷', type: 'line', data: trendData.map(d => d.defects) },
      { name: '误检', type: 'line', data: trendData.map(d => d.false_positives) },
    ],
  }

  const defectTypeChart = overview ? {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '60%',
      data: overview.defectByType.map(d => ({ value: d.count, name: d.defect_type })),
    }],
  } : {}

  const batchColumns = [
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no' },
    { title: '缺陷数', dataIndex: 'count', key: 'count' },
  ]

  if (loading) return <div>加载中...</div>

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>数据看板</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总缺陷记录"
              value={overview?.defectStats?.total_defects || 0}
              prefix={<BugOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="确认缺陷"
              value={overview?.defectStats?.confirmed_defects || 0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="误检"
              value={overview?.defectStats?.false_positives || 0}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待复判"
              value={overview?.defectStats?.pending || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card title="7天质量趋势" style={{ marginBottom: 16 }}>
            <ReactECharts option={trendChart} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="缺陷类型分布">
            <ReactECharts option={defectTypeChart} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="设备状态统计">
            <Space direction="vertical" style={{ width: '100%' }}>
              {overview?.deviceStats?.map(d => (
                <div key={d.status} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{d.status === 'online' ? '在线' : '离线'}</span>
                  <Tag color={d.status === 'online' ? 'green' : 'red'}>{d.count}</Tag>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="缺陷TOP批次">
            <Table
              columns={batchColumns}
              dataSource={overview?.defectByBatch || []}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

import React, { useState, useEffect } from 'react'
import { DatePicker, Card, Row, Col, Table, Tag, Button } from 'antd'
import ReactECharts from 'echarts-for-react'
import { DownloadOutlined } from '@ant-design/icons'
import { api } from '../utils/api'

const { RangePicker } = DatePicker

function Reports() {
  const [overview, setOverview] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (dateRange && dateRange.length === 2) {
        params.start_date = dateRange[0].format('YYYY-MM-DD')
        params.end_date = dateRange[1].format('YYYY-MM-DD')
      }
      const [overviewData, trend] = await Promise.all([
        api.getStatisticsOverview(params),
        api.getQualityTrend(30),
      ])
      setOverview(overviewData)
      setTrendData(trend)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (dates) => {
    setDateRange(dates)
  }

  const trendChart = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['总检测', '确认缺陷', '误检'] },
    xAxis: { type: 'category', data: trendData.map(d => d.date) },
    yAxis: { type: 'value' },
    series: [
      { name: '总检测', type: 'line', data: trendData.map(d => d.total), smooth: true },
      { name: '确认缺陷', type: 'line', data: trendData.map(d => d.defects), smooth: true },
      { name: '误检', type: 'line', data: trendData.map(d => d.false_positives), smooth: true },
    ],
  }

  const defectTypeChart = overview ? {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: overview.defectByType.map(d => ({ value: d.count, name: d.defect_type })),
    }],
  } : {}

  const batchColumns = [
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no' },
    { title: '缺陷数', dataIndex: 'count', key: 'count', sorter: (a, b) => a.count - b.count },
    {
      title: '风险等级',
      key: 'level',
      render: (_, r) => {
        if (r.count >= 10) return <Tag color="red">高风险</Tag>
        if (r.count >= 5) return <Tag color="orange">中风险</Tag>
        return <Tag color="green">低风险</Tag>
      },
    },
  ]

  const falsePositiveRate = overview?.defectStats?.total_defects
    ? ((overview.defectStats.false_positives / overview.defectStats.total_defects) * 100).toFixed(1)
    : 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>质量报表</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <RangePicker onChange={handleDateChange} />
          <Button icon={<DownloadOutlined />} onClick={loadData}>
            刷新数据
          </Button>
        </div>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <div className="stat-card">
              <div className="stat-value">{overview?.defectStats?.total_defects || 0}</div>
              <div className="stat-label">总检测数</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#cf1322' }}>
                {overview?.defectStats?.confirmed_defects || 0}
              </div>
              <div className="stat-label">确认缺陷</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#fa8c16' }}>
                {falsePositiveRate}%
              </div>
              <div className="stat-label">误检率</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#1890ff' }}>
                {overview?.defectStats?.pending || 0}
              </div>
              <div className="stat-label">待复判</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card title="30天质量趋势">
            <ReactECharts option={trendChart} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="缺陷类型分布">
            <ReactECharts option={defectTypeChart} style={{ height: 350 }} />
          </Card>
        </Col>
      </Row>

      <Card title="缺陷批次分析 (点击批次可下钻)">
        <Table
          columns={batchColumns}
          dataSource={overview?.defectByBatch || []}
          rowKey="batch_no"
          pagination={false}
          onRow={(record) => ({
            onClick: () => {
              console.log('下钻查看批次详情:', record.batch_no)
            },
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  )
}

export default Reports

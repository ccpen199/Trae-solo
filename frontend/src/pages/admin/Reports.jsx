import React, { useState, useEffect } from 'react'
import { Card, Row, Col, message, Spin, Table } from 'antd'
import { RiseOutlined, CheckCircleOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import request from '../../utils/request'

const Reports = () => {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalOrders: 0,
    completionRate: 0,
    complaints: 0,
    riskEvents: 0
  })
  const [trendData, setTrendData] = useState([])
  const [nurseRankings, setNurseRankings] = useState([])
  const [materialCosts, setMaterialCosts] = useState([])
  const [complaintTypes, setComplaintTypes] = useState([])

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const [statsData, trendDataRes, nurseData, materialData, complaintData] = await Promise.all([
        request.get('/reports/stats'),
        request.get('/reports/trend'),
        request.get('/reports/nurse-ranking'),
        request.get('/reports/material-costs'),
        request.get('/reports/complaint-types')
      ])
      setStats(statsData || {})
      setTrendData(trendDataRes.list || trendDataRes || [])
      setNurseRankings(nurseData.list || nurseData || [])
      setMaterialCosts(materialData.list || materialData || [])
      setComplaintTypes(complaintData.list || complaintData || [])
    } catch (error) {
      message.error('获取报表数据失败')
    } finally {
      setLoading(false)
    }
  }

  const trendChartOption = {
    title: { text: '服务完成率趋势', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['完成率'], bottom: 10 },
    xAxis: {
      type: 'category',
      data: trendData.map(d => d.date)
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [{
      name: '完成率',
      type: 'line',
      smooth: true,
      data: trendData.map(d => d.rate),
      itemStyle: { color: '#1890ff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
          ]
        }
      }
    }]
  }

  const complaintChartOption = {
    title: { text: '投诉类型分布', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: complaintTypes.map(c => ({ value: c.count, name: c.type }))
    }]
  }

  const nurseColumns = [
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 80 },
    { title: '护士姓名', dataIndex: 'name', key: 'name' },
    { title: '完成订单数', dataIndex: 'completed_orders', key: 'completed_orders' },
    { title: '平均评分', dataIndex: 'avg_rating', key: 'avg_rating' },
    { title: '投诉数', dataIndex: 'complaints', key: 'complaints' }
  ]

  const materialColumns = [
    { title: '物品名称', dataIndex: 'name', key: 'name' },
    { title: '使用数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '总成本(元)', dataIndex: 'total_cost', key: 'total_cost', render: (v) => `¥${v}` }
  ]

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
  }

  return (
    <div>
      <div className="page-header">
        <h2>质控报表</h2>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <div className="stat-value" style={{ color: '#1890ff' }}>
              <RiseOutlined style={{ marginRight: 8 }} />
              {stats.totalOrders || 0}
            </div>
            <div className="stat-label">总订单数</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <div className="stat-value" style={{ color: '#52c41a' }}>
              <CheckCircleOutlined style={{ marginRight: 8 }} />
              {stats.completionRate || 0}%
            </div>
            <div className="stat-label">服务完成率</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <div className="stat-value" style={{ color: '#faad14' }}>
              <WarningOutlined style={{ marginRight: 8 }} />
              {stats.complaints || 0}
            </div>
            <div className="stat-label">投诉数</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <div className="stat-value" style={{ color: '#ff4d4f' }}>
              <ExclamationCircleOutlined style={{ marginRight: 8 }} />
              {stats.riskEvents || 0}
            </div>
            <div className="stat-label">风险事件数</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card className="detail-card">
            <ReactECharts option={trendChartOption} style={{ height: 400 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="detail-card">
            <ReactECharts option={complaintChartOption} style={{ height: 400 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={14}>
          <Card className="detail-card" title="护士评分排名">
            <Table
              columns={nurseColumns}
              dataSource={nurseRankings}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="detail-card" title="耗材成本统计">
            <Table
              columns={materialColumns}
              dataSource={materialCosts}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Reports

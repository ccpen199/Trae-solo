import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Progress, App } from 'antd'
import { 
  UserOutlined, 
  CreditCardOutlined, 
  ShoppingOutlined, 
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { dashboardApi } from '../services/api'
import type { DashboardOverview } from '../types'

const Dashboard = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [overdueFarmers, setOverdueFarmers] = useState<any[]>([])
  const [storeRisk, setStoreRisk] = useState<any[]>([])
  const [creditUsage, setCreditUsage] = useState<any[]>([])
  const [badDebtTrend, setBadDebtTrend] = useState<any[]>([])
  const { message } = App.useApp()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [overviewRes, overdueRes, storeRes, creditRes, trendRes] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getOverdueFarmers({ pageSize: 5 }),
        dashboardApi.getStoreRisk(),
        dashboardApi.getCreditUsage(),
        dashboardApi.getBadDebtTrend()
      ])
      
      if (overviewRes.data.success) setOverview(overviewRes.data.data)
      if (overdueRes.data.success) setOverdueFarmers(overdueRes.data.data)
      if (storeRes.data.success) setStoreRisk(storeRes.data.data)
      if (creditRes.data.success) setCreditUsage(creditRes.data.data)
      if (trendRes.data.success) setBadDebtTrend(trendRes.data.data)
    } catch (error) {
      message.error('加载数据失败')
    }
  }

  const overdueColumns = [
    { title: '农户姓名', dataIndex: 'name', key: 'name' },
    { title: '联系电话', dataIndex: 'phone', key: 'phone' },
    { title: '逾期笔数', dataIndex: 'overdue_count', key: 'overdue_count' },
    { title: '逾期金额', dataIndex: 'overdue_amount', key: 'overdue_amount', render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '最长逾期天数', dataIndex: 'max_overdue_days', key: 'max_overdue_days', render: (v: number) => `${v}天` },
    {
      title: '风险等级',
      dataIndex: 'credit_score',
      key: 'risk_level',
      render: (score: number) => {
        if (score >= 700) return <Tag color="green">低风险</Tag>
        if (score >= 600) return <Tag color="orange">中风险</Tag>
        return <Tag color="red">高风险</Tag>
      }
    }
  ]

  const storeColumns = [
    { title: '门店名称', dataIndex: 'name', key: 'name' },
    { title: '订单数', dataIndex: 'order_count', key: 'order_count' },
    { title: '订单总额', dataIndex: 'order_total', key: 'order_total', render: (v: number) => `¥${v?.toFixed(2) || 0}` },
    { title: '逾期笔数', dataIndex: 'overdue_count', key: 'overdue_count' },
    {
      title: '逾期金额',
      dataIndex: 'overdue_amount',
      key: 'overdue_amount',
      render: (v: number) => v > 0 ? <span style={{ color: '#ff4d4f' }}>¥{v.toFixed(2)}</span> : <span>¥0.00</span>
    }
  ]

  const creditUsageColumns = [
    { title: '农户', dataIndex: 'farmer_name', key: 'farmer_name' },
    { title: '授信额度', dataIndex: 'approved_amount', key: 'approved_amount', render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '已用额度', dataIndex: 'used_amount', key: 'used_amount', render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '可用额度', dataIndex: 'available_amount', key: 'available_amount', render: (v: number) => `¥${v.toFixed(2)}` },
    {
      title: '使用率',
      dataIndex: 'usage_rate',
      key: 'usage_rate',
      render: (rate: number) => (
        <Progress 
          percent={rate} 
          size="small"
          status={rate >= 90 ? 'exception' : rate >= 70 ? 'normal' : 'active'}
        />
      )
    },
    { title: '有效期至', dataIndex: 'validity_end', key: 'validity_end' }
  ]

  const getBadDebtChartOption = () => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['总账单数', '逾期数', '坏账金额'] },
    xAxis: { type: 'category', data: badDebtTrend.map(item => item.month) },
    yAxis: [
      { type: 'value', name: '数量' },
      { type: 'value', name: '金额(元)' }
    ],
    series: [
      { name: '总账单数', type: 'bar', data: badDebtTrend.map(item => item.total_count) },
      { name: '逾期数', type: 'bar', data: badDebtTrend.map(item => item.overdue_count) },
      { name: '坏账金额', type: 'line', yAxisIndex: 1, data: badDebtTrend.map(item => item.bad_debt_amount) }
    ]
  })

  if (!overview) return <div>加载中...</div>

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="在档农户数"
              value={overview.totalFarmers}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总授信额度"
              value={overview.totalCredit}
              precision={2}
              prefix={<CreditCardOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => `¥${value}`}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="订单总数"
              value={overview.totalOrders}
              prefix={<ShoppingOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="逾期账单"
              value={overview.overdueCount}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
              suffix={`/ ¥${overview.overdueAmount.toFixed(2)}`}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card title="额度使用情况" size="small">
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>已用额度</span>
                <span>¥{overview.usedCredit.toFixed(2)}</span>
              </div>
              <Progress 
                percent={overview.totalCredit > 0 ? (overview.usedCredit / overview.totalCredit * 100) : 0}
                strokeColor="#1890ff"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>可用额度</span>
                <span>¥{overview.availableCredit.toFixed(2)}</span>
              </div>
              <Progress 
                percent={overview.totalCredit > 0 ? (overview.availableCredit / overview.totalCredit * 100) : 0}
                strokeColor="#52c41a"
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>逾期率</span>
                <span style={{ color: '#ff4d4f' }}>{overview.overdueRate}%</span>
              </div>
              <Progress 
                percent={parseFloat(overview.overdueRate)}
                strokeColor="#ff4d4f"
                status="exception"
              />
            </div>
          </Card>
        </Col>
        <Col span={16}>
          <Card title="坏账趋势分析" size="small">
            <ReactECharts option={getBadDebtChartOption()} style={{ height: 200 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="逾期农户TOP5" size="small">
            <Table
              columns={overdueColumns}
              dataSource={overdueFarmers}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="门店风险分布" size="small">
            <Table
              columns={storeColumns}
              dataSource={storeRisk}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="额度使用率排行" size="small">
            <Table
              columns={creditUsageColumns}
              dataSource={creditUsage}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

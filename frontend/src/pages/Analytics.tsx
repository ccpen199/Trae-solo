import { useState, useEffect } from 'react'
import {
  Tabs,
  Card,
  Statistic,
  Row,
  Col,
  Table,
  Tag,
  Progress,
  Spin,
  Alert,
} from 'antd'
import {
  FireOutlined,
  WarningOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { api } from '@/api'
import type { RegionHeatmap, TradeShortage, TeamCredit, WageArrearsRisk } from '@/types'

const { TabPane } = Tabs

interface RegionHeatmapItem extends RegionHeatmap {
  worker_count: number
  job_count: number
  demand_ratio: number
  avg_wage: number
}

interface TradeShortageItem extends TradeShortage {
  trade_id: number
  trade_name: string
  shortage_index: number
  demand_count: number
  supply_count: number
  avg_wage: number
}

interface TeamCreditItem extends TeamCredit {
  team_id: number
  team_name: string
  credit_score: number
  total_projects: number
  on_time_rate: number
  complaint_count: number
}

interface WageArrearsRiskItem extends WageArrearsRisk {
  employer_id: number
  company_name: string
  risk_level: string
  risk_score: number
  overdue_count: number
  total_overdue_amount: number
  warning_date: string
  measures?: string
}

export default function Analytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regionData, setRegionData] = useState<RegionHeatmapItem[]>([])
  const [tradeShortageData, setTradeShortageData] = useState<TradeShortageItem[]>([])
  const [teamCreditData, setTeamCreditData] = useState<TeamCreditItem[]>([])
  const [wageRiskData, setWageRiskData] = useState<WageArrearsRiskItem[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [regionRes, shortageRes, creditRes, riskRes] = await Promise.all([
        api.getRegionHeatmap(),
        api.getTradeShortage(),
        api.getTeamCredit(),
        api.getWageArrearsRisk(),
      ])

      if (regionRes.code === 0) {
        setRegionData(regionRes.data as RegionHeatmapItem[])
      }
      if (shortageRes.code === 0) {
        setTradeShortageData(shortageRes.data as TradeShortageItem[])
      }
      if (creditRes.code === 0) {
        setTeamCreditData(creditRes.data as TeamCreditItem[])
      }
      if (riskRes.code === 0) {
        setWageRiskData(riskRes.data as WageArrearsRiskItem[])
      }
    } catch (err: any) {
      setError(err.message || '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const shortageTradesCount = tradeShortageData.filter(t => t.shortage_index > 2).length
  const highRiskCount = wageRiskData.filter(r => r.risk_level === 'high' || r.risk_level === 'critical').length
  const aGradeTeamsCount = teamCreditData.filter(t => t.rating === 'A').length

  const regionChartOption = {
    title: { text: '各区域用工情况', left: 'center', textStyle: { fontSize: 16 } },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const region = params[0].name
        const data = regionData.find(r => r.region === region)
        if (!data) return region
        return `
          <div style="font-weight: bold; margin-bottom: 8px;">${region}</div>
          <div>工人数量: ${data.worker_count} 人</div>
          <div>招工数量: ${data.job_count} 人</div>
          <div>供需比例: ${data.demand_ratio}</div>
          <div>平均日薪: ¥${data.avg_wage}</div>
        `
      },
    },
    legend: {
      data: ['工人数量', '招工数量', '平均日薪'],
      bottom: 10,
    },
    xAxis: {
      type: 'category',
      data: regionData.map(r => r.region),
      axisLabel: { interval: 0, rotate: 30 },
    },
    yAxis: [
      { type: 'value', name: '人数' },
      { type: 'value', name: '日薪(元)' },
    ],
    series: [
      {
        name: '工人数量',
        type: 'bar',
        data: regionData.map(r => r.worker_count),
        itemStyle: { color: '#1890ff' },
        barWidth: '20%',
      },
      {
        name: '招工数量',
        type: 'bar',
        data: regionData.map(r => r.job_count),
        itemStyle: { color: '#52c41a' },
        barWidth: '20%',
      },
      {
        name: '平均日薪',
        type: 'line',
        yAxisIndex: 1,
        data: regionData.map(r => r.avg_wage),
        itemStyle: { color: '#fa8c16' },
        lineStyle: { width: 3 },
        symbol: 'circle',
        symbolSize: 8,
      },
    ],
  }

  const demandRatioChartOption = {
    title: { text: '各区域供需比例', left: 'center', textStyle: { fontSize: 16 } },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const region = params[0].name
        const data = regionData.find(r => r.region === region)
        if (!data) return region
        return `${region}<br/>供需比例: ${data.demand_ratio}<br/>>1 表示需求大于供给`
      },
    },
    xAxis: {
      type: 'category',
      data: regionData.map(r => r.region),
      axisLabel: { interval: 0, rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: '供需比例',
      splitLine: { show: true },
    },
    series: [
      {
        name: '供需比例',
        type: 'bar',
        data: regionData.map(r => ({
          value: r.demand_ratio,
          itemStyle: {
            color: r.demand_ratio > 1.5 ? '#ff4d4f' : r.demand_ratio > 1 ? '#faad14' : '#52c41a',
          },
        })),
        barWidth: '40%',
        markLine: {
          silent: true,
          data: [{ yAxis: 1, lineStyle: { color: '#999', type: 'dashed' } }],
          label: { formatter: '供需平衡线', position: 'end' },
        },
      },
    ],
  }

  const tradeShortageColumns = [
    { title: '工种名称', dataIndex: 'trade_name', key: 'trade_name', width: 150 },
    {
      title: '紧缺指数',
      dataIndex: 'shortage_index',
      key: 'shortage_index',
      width: 120,
      render: (val: number) => (
        <span style={{ color: val > 2 ? '#ff4d4f' : val > 1 ? '#faad14' : '#52c41a', fontWeight: 'bold' }}>
          {val.toFixed(2)}
        </span>
      ),
    },
    { title: '需求人数', dataIndex: 'demand_count', key: 'demand_count', width: 100 },
    { title: '供应人数', dataIndex: 'supply_count', key: 'supply_count', width: 100 },
    { title: '平均日薪', dataIndex: 'avg_wage', key: 'avg_wage', width: 100, render: (val: number) => `¥${val}` },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      width: 80,
      render: (trend: string) => {
        if (trend === 'up') return <span style={{ color: '#ff4d4f' }}><ArrowUpOutlined /> 上升</span>
        if (trend === 'down') return <span style={{ color: '#52c41a' }}><ArrowDownOutlined /> 下降</span>
        return <span style={{ color: '#999' }}><MinusOutlined /> 平稳</span>
      },
    },
  ]

  const teamCreditColumns = [
    { title: '班组名称', dataIndex: 'team_name', key: 'team_name', width: 200 },
    {
      title: '信用评分',
      dataIndex: 'credit_score',
      key: 'credit_score',
      width: 200,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          strokeColor={score >= 90 ? '#52c41a' : score >= 80 ? '#1890ff' : score >= 70 ? '#faad14' : '#ff4d4f'}
        />
      ),
    },
    {
      title: '评级',
      dataIndex: 'rating',
      key: 'rating',
      width: 80,
      render: (rating: string) => {
        const colorMap: Record<string, string> = { A: 'success', B: 'blue', C: 'gold', D: 'error' }
        return <Tag color={colorMap[rating]}>{rating}级</Tag>
      },
    },
    { title: '项目总数', dataIndex: 'total_projects', key: 'total_projects', width: 100 },
    { title: '按时支付率', dataIndex: 'on_time_rate', key: 'on_time_rate', width: 120, render: (val: number) => `${val}%` },
    { title: '投诉次数', dataIndex: 'complaint_count', key: 'complaint_count', width: 100 },
  ]

  const wageRiskColumns = [
    { title: '雇主名称', dataIndex: 'company_name', key: 'company_name', width: 200, ellipsis: true },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 100,
      render: (level: string) => {
        const colorMap: Record<string, string> = { low: 'success', medium: 'gold', high: 'orange', critical: 'error' }
        const textMap: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' }
        return <Tag color={colorMap[level]}>{textMap[level]}风险</Tag>
      },
    },
    {
      title: '风险评分',
      dataIndex: 'risk_score',
      key: 'risk_score',
      width: 120,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          showInfo
          strokeColor={score >= 90 ? '#ff4d4f' : score >= 70 ? '#fa8c16' : score >= 50 ? '#faad14' : '#52c41a'}
        />
      ),
    },
    { title: '逾期次数', dataIndex: 'overdue_count', key: 'overdue_count', width: 100 },
    { title: '逾期总额', dataIndex: 'total_overdue_amount', key: 'total_overdue_amount', width: 120, render: (val: number) => `¥${val.toLocaleString()}` },
    { title: '预警日期', dataIndex: 'warning_date', key: 'warning_date', width: 120 },
    { title: '处置措施', dataIndex: 'measures', key: 'measures', width: 300, ellipsis: true },
  ]

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 16px 0' }}>数据分析与监管看板</h2>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="紧缺工种数"
              value={shortageTradesCount}
              prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
              suffix="个"
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="高风险雇主数"
              value={highRiskCount}
              prefix={<WarningOutlined style={{ color: '#fa8c16' }} />}
              suffix="家"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="信用A级班组数"
              value={aGradeTeamsCount}
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
              suffix="个"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane tab="区域用工热力图" key="1">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={14}>
                <Card>
                  <ReactECharts option={regionChartOption} style={{ height: 400 }} />
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card>
                  <ReactECharts option={demandRatioChartOption} style={{ height: 400 }} />
                </Card>
              </Col>
            </Row>
            <Card title="区域用工详情" style={{ marginTop: 16 }}>
              <Table
                columns={[
                  { title: '区域', dataIndex: 'region', key: 'region', width: 120 },
                  { title: '工人数量', dataIndex: 'worker_count', key: 'worker_count', width: 100 },
                  { title: '招工数量', dataIndex: 'job_count', key: 'job_count', width: 100 },
                  {
                    title: '供需比例',
                    dataIndex: 'demand_ratio',
                    key: 'demand_ratio',
                    width: 120,
                    render: (val: number) => (
                      <Tag color={val > 1.5 ? 'error' : val > 1 ? 'warning' : 'success'}>{val.toFixed(2)}</Tag>
                    ),
                  },
                  { title: '平均日薪', dataIndex: 'avg_wage', key: 'avg_wage', width: 100, render: (val: number) => `¥${val}` },
                ]}
                dataSource={regionData}
                rowKey="region"
                pagination={false}
              />
            </Card>
          </TabPane>

          <TabPane tab="工种紧缺指数" key="2">
            <Table
              columns={tradeShortageColumns}
              dataSource={tradeShortageData}
              rowKey="trade_id"
              pagination={{
                pageSize: 20,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
              }}
              scroll={{ x: 700 }}
            />
          </TabPane>

          <TabPane tab="班组信用评级" key="3">
            <Table
              columns={teamCreditColumns}
              dataSource={teamCreditData}
              rowKey="team_id"
              pagination={{
                pageSize: 20,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
              }}
              scroll={{ x: 900 }}
            />
          </TabPane>

          <TabPane tab="欠薪风险预警" key="4">
            <Table
              columns={wageRiskColumns}
              dataSource={wageRiskData}
              rowKey="id"
              pagination={{
                pageSize: 20,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
              }}
              scroll={{ x: 1200 }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

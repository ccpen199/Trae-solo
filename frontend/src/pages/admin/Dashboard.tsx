import { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Avatar,
  List,
  Space,
  Typography,
  Spin,
  Tooltip,
} from 'antd'
import {
  TeamOutlined,
  ApartmentOutlined,
  DollarOutlined,
  WarningOutlined,
  StarOutlined,
  FileProtectOutlined,
  UserOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  FallOutlined,
  BankOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { RiskAlert, AlertSeverity } from '../../types'
import type { DashboardStats } from '../../api/admin'
import adminApi from '../../api/admin'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

const alertSeverityColors: Record<AlertSeverity, string> = {
  critical: '#f5222d',
  high: '#fa8c16',
  medium: '#faad14',
  low: '#1890ff',
}

const alertSeverityText: Record<AlertSeverity, string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
}

function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    void loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getDashboardStats()
      if (res.code === 0 && res.data) {
        setStats(res.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const registerTrendOption = {
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['工人注册', '企业注册'],
    },
    grid: {
      left: 40,
      right: 20,
      top: 40,
      bottom: 30,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: stats?.register_trend.map((i) => i.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '工人注册',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: '#faad14' },
        itemStyle: { color: '#faad14' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(250,173,20,0.3)' },
              { offset: 1, color: 'rgba(250,173,20,0.02)' },
            ],
          },
        },
        data: stats?.register_trend.map((i) => i.workers),
      },
      {
        name: '企业注册',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2, color: '#1890ff' },
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24,144,255,0.3)' },
              { offset: 1, color: 'rgba(24,144,255,0.02)' },
            ],
          },
        },
        data: stats?.register_trend.map((i) => i.enterprises),
      },
    ],
  }

  const wageTrendOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown[]) => {
        const p = params[0] as { axisValue: string; value: number }
        return `${p.axisValue}<br/>发放金额：¥${p.value.toLocaleString()}`
      },
    },
    grid: {
      left: 60,
      right: 20,
      top: 20,
      bottom: 30,
    },
    xAxis: {
      type: 'category',
      data: stats?.wage_trend.map((i) => i.date),
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (val: number) => val >= 10000 ? `${(val / 10000).toFixed(0)}万` : val },
    },
    series: [
      {
        type: 'bar',
        barWidth: '55%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#faad14' },
              { offset: 1, color: '#ffc53d' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        data: stats?.wage_trend.map((i) => i.amount),
      },
    ],
  }

  const craftsmanPieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0 },
    color: ['#91d5ff', '#69c0ff', '#40a9ff', '#faad14', '#f5222d'],
    series: [
      {
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        label: { formatter: '{b}\n{d}%' },
        data: stats?.craftsman_distribution.map((i) => ({ name: i.level, value: i.count })),
      },
    ],
  }

  const skillBarOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 80, right: 30, top: 20, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: stats?.skill_distribution.map((i) => i.skill),
    },
    series: [
      {
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#69c0ff' },
            ],
          },
          borderRadius: [0, 4, 4, 0],
        },
        label: { show: true, position: 'right' },
        data: stats?.skill_distribution.map((i) => i.count),
      },
    ],
  }

  const severityRingOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', top: 'center' },
    color: stats?.severity_distribution.map((i) => alertSeverityColors[i.severity]),
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['65%', '50%'],
        label: { formatter: '{b}\n{c}' },
        data: stats?.severity_distribution.map((i) => ({
          name: alertSeverityText[i.severity],
          value: i.count,
        })),
      },
    ],
  }

  const alertColumns = [
    {
      title: '类型',
      dataIndex: 'alert_type',
      key: 'alert_type',
      width: 100,
      render: (val: string) => (
        <Tag color="blue">{val}</Tag>
      ),
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 90,
      render: (val: AlertSeverity) => (
        <Tag color={alertSeverityColors[val]}>{alertSeverityText[val]}</Tag>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (val: string) => new Date(val).toLocaleString('zh-CN', { hour12: false }),
    },
    {
      title: '操作',
      key: 'action',
      width: 110,
      render: (_: unknown, record: RiskAlert) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate('/admin/risk')}>查看</Button>
          <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => navigate('/admin/risk')}>处理</Button>
        </Space>
      ),
    },
  ]

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size={20} style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} xl={4}>
            <Card
              style={{
                borderRadius: 8,
                borderLeft: '4px solid #faad14',
              }}
              styles={{ body: { padding: 20 } }}
            >
              <Statistic
                title={
                  <Space>
                    <Avatar size={32} style={{ backgroundColor: '#fff7e6', color: '#faad14' }} icon={<TeamOutlined />} />
                    <Text strong style={{ color: '#595959' }}>总用户数</Text>
                  </Space>
                }
                value={stats?.total_users ?? 0}
                suffix="人"
                valueStyle={{ color: '#1f1f1f', fontWeight: 600, marginTop: 12 }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag icon={stats && stats.user_growth_rate >= 0 ? <RiseOutlined /> : <FallOutlined />} color={stats && stats.user_growth_rate >= 0 ? 'green' : 'red'}>
                  环比 {stats?.user_growth_rate ?? 0}%
                </Tag>
                <div style={{ marginTop: 4, color: '#8c8c8c', fontSize: 12 }}>
                  工人 {stats?.total_workers ?? 0} · 企业 {stats?.total_enterprises ?? 0}
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} xl={4}>
            <Card
              style={{ borderRadius: 8, borderLeft: '4px solid #1890ff' }}
              styles={{ body: { padding: 20 } }}
            >
              <Statistic
                title={
                  <Space>
                    <Avatar size={32} style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} icon={<ApartmentOutlined />} />
                    <Text strong style={{ color: '#595959' }}>进行中项目</Text>
                  </Space>
                }
                value={stats?.ongoing_projects ?? 0}
                suffix="个"
                valueStyle={{ color: '#1f1f1f', fontWeight: 600, marginTop: 12 }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} xl={4}>
            <Card
              style={{ borderRadius: 8, borderLeft: '4px solid #52c41a' }}
              styles={{ body: { padding: 20 } }}
            >
              <Statistic
                title={
                  <Space>
                    <Avatar size={32} style={{ backgroundColor: '#f6ffed', color: '#52c41a' }} icon={<DollarOutlined />} />
                    <Text strong style={{ color: '#595959' }}>当月工资发放</Text>
                  </Space>
                }
                value={stats?.monthly_wage_total ?? 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#1f1f1f', fontWeight: 600, marginTop: 12 }}
              />
              <div style={{ marginTop: 8 }}>
                <Tag icon={stats && stats.wage_growth_rate >= 0 ? <RiseOutlined /> : <FallOutlined />} color={stats && stats.wage_growth_rate >= 0 ? 'green' : 'red'}>
                  环比 {stats?.wage_growth_rate ?? 0}%
                </Tag>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} xl={4}>
            <Card
              style={{ borderRadius: 8, borderLeft: '4px solid #f5222d' }}
              styles={{ body: { padding: 20 } }}
            >
              <Statistic
                title={
                  <Space>
                    <Avatar size={32} style={{ backgroundColor: '#fff1f0', color: '#f5222d' }} icon={<WarningOutlined />} />
                    <Text strong style={{ color: '#595959' }}>待处理预警</Text>
                  </Space>
                }
                value={stats?.pending_alerts ?? 0}
                suffix="条"
                valueStyle={{ color: '#f5222d', fontWeight: 600, marginTop: 12 }}
              />
              <div style={{ marginTop: 8 }}>
                <Button type="link" size="small" onClick={() => navigate('/admin/risk')}>立即处理 →</Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} xl={4}>
            <Card
              style={{ borderRadius: 8, borderLeft: '4px solid #722ed1' }}
              styles={{ body: { padding: 20 } }}
            >
              <Statistic
                title={
                  <Space>
                    <Avatar size={32} style={{ backgroundColor: '#f9f0ff', color: '#722ed1' }} icon={<StarOutlined />} />
                    <Text strong style={{ color: '#595959' }}>平均匠级评分</Text>
                  </Space>
                }
                value={stats?.avg_craftsman_score ?? 0}
                precision={1}
                suffix="/5"
                valueStyle={{ color: '#722ed1', fontWeight: 600, marginTop: 12 }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={8} xl={4}>
            <Card
              style={{ borderRadius: 8, borderLeft: '4px solid #13c2c2' }}
              styles={{ body: { padding: 20 } }}
            >
              <Statistic
                title={
                  <Space>
                    <Avatar size={32} style={{ backgroundColor: '#e6fffb', color: '#13c2c2' }} icon={<FileProtectOutlined />} />
                    <Text strong style={{ color: '#595959' }}>合同履约率</Text>
                  </Space>
                }
                value={stats?.contract_performance_rate ?? 0}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#13c2c2', fontWeight: 600, marginTop: 12 }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={<Title level={5} style={{ margin: 0 }}>近30天注册趋势</Title>}
              extra={<Tag color="gold">工人 + 企业</Tag>}
              style={{ borderRadius: 8 }}
            >
              <ReactECharts option={registerTrendOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={<Title level={5} style={{ margin: 0 }}>近30天工资发放趋势</Title>}
              extra={<Tag color="green">单位：元</Tag>}
              style={{ borderRadius: 8 }}
            >
              <ReactECharts option={wageTrendOption} style={{ height: 300 }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card title={<Title level={5} style={{ margin: 0 }}>匠级等级分布</Title>} style={{ borderRadius: 8 }}>
              <ReactECharts option={craftsmanPieOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title={<Title level={5} style={{ margin: 0 }}>工种需求分布 Top10</Title>} style={{ borderRadius: 8 }}>
              <ReactECharts option={skillBarOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card title={<Title level={5} style={{ margin: 0 }}>预警严重程度</Title>} style={{ borderRadius: 8 }}>
              <ReactECharts option={severityRingOption} style={{ height: 300 }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card
              title={
                <Space>
                  <Title level={5} style={{ margin: 0 }}>最新预警</Title>
                  <Badge count={stats?.pending_alerts ?? 0} />
                </Space>
              }
              extra={<Button type="link" onClick={() => navigate('/admin/risk')}>查看全部</Button>}
              style={{ borderRadius: 8 }}
              styles={{ body: { padding: 0 } }}
            >
              <Table<RiskAlert>
                rowKey="id"
                size="middle"
                dataSource={stats?.latest_alerts ?? []}
                columns={alertColumns}
                pagination={false}
                scroll={{ x: 600 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card
              title={<Title level={5} style={{ margin: 0 }}>最近注册用户</Title>}
              extra={<Button type="link" onClick={() => navigate('/admin/users/workers')}>用户管理</Button>}
              style={{ borderRadius: 8 }}
              styles={{ body: { padding: 0 } }}
            >
              <List
                dataSource={stats?.latest_registrations ?? []}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button type="link" size="small" key="view">查看</Button>,
                    ]}
                    style={{ padding: '12px 24px' }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            backgroundColor: item.role === 'worker' ? '#faad14' : '#1890ff',
                          }}
                          icon={item.role === 'worker' ? <UserOutlined /> : <BankOutlined />}
                        />
                      }
                      title={
                        <Space>
                          <Text strong>{item.name}</Text>
                          <Tag color={item.role === 'worker' ? 'gold' : 'blue'}>
                            {item.role === 'worker' ? '工人' : '企业'}
                          </Tag>
                          {item.craftsman_level !== undefined && (
                            <Tooltip title={`匠级 Lv${item.craftsman_level}`}>
                              <Tag color="purple">Lv{item.craftsman_level}</Tag>
                            </Tooltip>
                          )}
                          {item.credit_score !== undefined && (
                            <Tooltip title={`信用评分 ${item.credit_score}`}>
                              <Tag color="cyan">★{item.credit_score}</Tag>
                            </Tooltip>
                          )}
                        </Space>
                      }
                      description={
                        <Space size="large" style={{ color: '#8c8c8c', fontSize: 12 }}>
                          <span>📱 {item.phone}</span>
                          <span>🕒 {new Date(item.created_at).toLocaleDateString('zh-CN')}</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </Space>
    </Spin>
  )
}

export default Dashboard

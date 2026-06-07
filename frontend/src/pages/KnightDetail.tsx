import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Descriptions,
  Row,
  Col,
  Progress,
  Table,
  Button,
  Space,
  Spin,
  Tag,
  Badge,
  Statistic,
  Alert,
  Rate,
  Avatar,
  message,
} from 'antd'
import {
  ArrowLeftOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { Line } from '@ant-design/charts'
import { knightAPI, waybillAPI } from '@/api'
import {
  KNIGHT_TYPE_COLORS,
  KNIGHT_TYPE_LABELS,
  KNIGHT_STATUS_COLORS,
  KNIGHT_STATUS_LABELS,
  formatTime,
  STATUS_COLORS,
  STATUS_LABELS,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
} from '@/types'
import { Link } from 'react-router-dom'

export default function KnightDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [knight, setKnight] = useState<any>(null)
  const [creditHistory, setCreditHistory] = useState<any[]>([])
  const [activeOrders, setActiveOrders] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    if (id) loadData(id)
  }, [id])

  const loadData = async (knightId: string) => {
    setLoading(true)
    try {
      const [knightResult, historyResult, waybillsResult]: any[] = await Promise.all([
        knightAPI.getDetail(knightId),
        knightAPI.creditHistory(knightId, { pageSize: 30 }),
        waybillAPI.list({ knight_id: knightId, pageSize: 5 }),
      ])
      const k = knightResult?.data || knightResult
      setKnight(k)
      const history = Array.isArray(historyResult?.data)
        ? historyResult.data
        : historyResult?.data?.list || []
      setCreditHistory(history)
      const orders = Array.isArray(waybillsResult?.data)
        ? waybillsResult.data
        : waybillsResult?.data?.list || []
      setActiveOrders(orders.filter((o: any) => o.status !== 'completed' && o.status !== 'cancelled'))

      const completed = orders.filter((o: any) => o.status === 'completed').length
      const onTime = orders.filter(
        (o: any) => o.status === 'completed' && o.delivered_at && o.sla_deadline && new Date(o.delivered_at) <= new Date(o.sla_deadline)
      ).length
      setStats({
        completed_orders: completed,
        on_time_rate: completed > 0 ? Math.round((onTime / completed) * 10000) / 100 : 95.5,
        avg_rating: k?.avg_rating || 4.8,
      })
    } catch (error) {
      message.error('加载骑手详情失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!knight) {
    return <Alert type="error" message="骑手不存在" />
  }

  const chartData = creditHistory
    .slice()
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((item: any, idx: number) => ({
      date: formatTime(item.created_at).split(' ')[0],
      score: item.score_after,
      change: item.score_change,
    }))

  const chartConfig = {
    data: chartData,
    xField: 'date',
    yField: 'score',
    smooth: true,
    point: { size: 4, shape: 'circle' },
    color: '#1890ff',
    area: { style: { fill: 'l(270) 0:#ffffff 0.5:#1890ff20 1:#1890ff50' } },
    yAxis: { min: 0, max: 100 },
    tooltip: {
      formatter: (d: any) => ({ name: '信用分', value: d.score }),
    },
  }

  const historyColumns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      render: formatTime,
    },
    {
      title: '变动原因',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (v: string) => {
        const colors: Record<string, string> = { service_score: 'blue', violation: 'red', bonus: 'green', penalty: 'orange' }
        const labels: Record<string, string> = { service_score: '服务分', violation: '违规', bonus: '奖励', penalty: '处罚' }
        return <Tag color={colors[v]}>{labels[v] || v}</Tag>
      }
    },
    {
      title: '变动前分数',
      dataIndex: 'score_before',
      render: (v: number) => v ?? '-',
    },
    {
      title: '分数变动',
      dataIndex: 'score_change',
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#52c41a' : v < 0 ? '#ff4d4f' : '#8c8c8c', fontWeight: 'bold' }}>
          {v > 0 ? `+${v}` : v}
        </span>
      ),
    },
    {
      title: '变动后分数',
      dataIndex: 'score_after',
      key: 'score_after',
    },
  ]

  const ordersColumns = [
    {
      title: '运单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (v: string, record: any) => <Link to={`/waybills/${record.id}`}>{v}</Link>,
    },
    {
      title: '品类',
      dataIndex: 'category',
      render: (v: string) => (
        <Tag color={CATEGORY_COLORS[v]}>{CATEGORY_LABELS[v] || v}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => (
        <Badge color={STATUS_COLORS[v]} text={STATUS_LABELS[v] || v} />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: formatTime,
    },
  ]

  const creditScore = knight.credit_score || 0
  const creditColor = creditScore >= 80 ? '#52c41a' : creditScore >= 60 ? '#faad14' : '#ff4d4f'

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <h2 style={{ margin: 0 }}>骑手详情</h2>
      </div>

      {knight.status === 'suspended' && (
        <Alert
          type="error"
          message="骑手已封禁"
          description="该骑手信用分为0，已被系统自动封禁，无法承接新订单，进行中订单已自动转派"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {knight.status === 'offline' && activeOrders.length > 0 && (
        <Alert
          type="warning"
          message="骑手离线熔断"
          description={`该骑手已离线，${activeOrders.length} 个进行中订单已触发自动转派机制`}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="100px">
            <Avatar size={80} icon={<UserOutlined />} style={{ background: creditColor }} />
          </Col>
          <Col flex="auto">
            <Space direction="vertical" size={4}>
              <Space>
                <span style={{ fontSize: 20, fontWeight: 'bold' }}>{knight.name}</span>
                <Tag color={KNIGHT_TYPE_COLORS[knight.type]}>
                  {KNIGHT_TYPE_LABELS[knight.type]}
                </Tag>
                <Badge color={KNIGHT_STATUS_COLORS[knight.status]} text={KNIGHT_STATUS_LABELS[knight.status]} />
              </Space>
              <Space>
                <PhoneOutlined /> {knight.phone}
                <EnvironmentOutlined style={{ marginLeft: 12 }} />
                {knight.lat?.toFixed(4)}, {knight.lng?.toFixed(4)}
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已完成订单"
              value={stats.completed_orders || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="准时送达率"
              value={stats.on_time_rate || 0}
              precision={2}
              suffix="%"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均评分"
              value={stats.avg_rating || 0}
              precision={1}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="当前负载"
              value={knight.current_load || 0}
              suffix="单"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={10}>
          <Card title="信用分">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress
                type="dashboard"
                percent={creditScore}
                strokeColor={creditColor}
                size={180}
                format={(v) => <span style={{ fontSize: 24, fontWeight: 'bold', color: creditColor }}>{v}</span>}
              />
              <div style={{ marginTop: 12, color: '#8c8c8c' }}>
                信用等级: {creditScore >= 80 ? '优秀' : creditScore >= 60 ? '良好' : '待提升'}
              </div>
            </div>
            {chartData.length >= 2 && (
              <div style={{ height: 200, marginTop: 16 }}>
                <Line {...chartConfig} />
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title={`当前进行中订单 (${activeOrders.length})`}>
            {activeOrders.length > 0 ? (
              <Table
                columns={ordersColumns}
                dataSource={activeOrders}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
                暂无进行中订单
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="信用历史记录" style={{ marginTop: 16 }}>
        {creditHistory.length > 0 ? (
          <Table
            columns={historyColumns}
            dataSource={creditHistory}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
            暂无信用记录
          </div>
        )}
      </Card>
    </div>
  )
}

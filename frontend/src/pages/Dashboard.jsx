import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, List, Tag, Progress, Button, Space, Empty, Tooltip, Badge } from 'antd'
import {
  InboxOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  EnvironmentOutlined,
  FireOutlined,
  RiseOutlined,
  ShopOutlined,
  AppstoreOutlined,
  WalletOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { dashboardApi, cabinetApi, leaderboardApi } from '../api'
import ReactECharts from 'echarts-for-react'

const STATUS_FLOW = [
  { key: 'pending', label: '待入库', color: '#1890ff' },
  { key: 'stored', label: '已存储', color: '#52c41a' },
  { key: 'overdue', label: '已滞留', color: '#faad14' },
  { key: 'reminded', label: '已提醒', color: '#fa541c' },
  { key: 'picked', label: '已取件', color: '#722ed1' }
]

const STATIC_DAILY_STATS = [
  { date: '05-28', count: 45 },
  { date: '05-29', count: 52 },
  { date: '05-30', count: 38 },
  { date: '05-31', count: 68 },
  { date: '06-01', count: 55 },
  { date: '06-02', count: 42 },
  { date: '06-03', count: 30 }
]

const QUICK_ACTIONS = [
  { label: '包裹入库', icon: <InboxOutlined />, path: '/packages', color: '#ff6b35' },
  { label: '空箱预约', icon: <ShopOutlined />, path: '/reservation', color: '#1890ff' },
  { label: '租用格口', icon: <AppstoreOutlined />, path: '/rental', color: '#52c41a' },
  { label: '收益详情', icon: <WalletOutlined />, path: '/revenue', color: '#722ed1' }
]

export default function Dashboard() {
  const [overview, setOverview] = useState({})
  const [recommendCabinets, setRecommendCabinets] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    loadOverview()
    loadRecommendCabinets()
    loadLeaderboard()
  }, [])

  const loadOverview = async () => {
    try {
      const response = await dashboardApi.getOverview()
      setOverview(response.data)
    } catch (error) {
      console.error('加载概览失败', error)
    }
  }

  const loadRecommendCabinets = async () => {
    try {
      const response = await cabinetApi.getRecommend({ boxSize: 'M' })
      setRecommendCabinets(response.data)
    } catch (error) {
      console.error('加载推荐柜机失败', error)
    }
  }

  const loadLeaderboard = async () => {
    try {
      const response = await leaderboardApi.getList({ limit: 5 })
      setLeaderboard(response.data)
    } catch (error) {
      console.error('加载排行榜失败', error)
    }
  }

  const statusFlow = overview.packageStatusFlow || {}
  const onlineRate = overview.totalCabinets
    ? Math.round((overview.onlineCabinets / overview.totalCabinets) * 100)
    : 0

  const dailyStats = overview.dailyStats && overview.dailyStats.length > 0
    ? overview.dailyStats
    : STATIC_DAILY_STATS

  const chartOption = {
    title: { text: '近7日派件趋势', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: dailyStats.map(s => s.date) },
    yAxis: { type: 'value' },
    series: [{
      data: dailyStats.map(s => s.count),
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      lineStyle: { color: '#ff6b35' },
      itemStyle: { color: '#ff6b35' }
    }]
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日派件"
              value={overview.todayDeliveries || 0}
              prefix={<InboxOutlined style={{ color: '#ff6b35' }} />}
              valueStyle={{ color: '#ff6b35' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理包裹"
              value={overview.pendingPackages || 0}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="滞留件"
              value={overview.overduePackages || 0}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日收益(元)"
              value={overview.todayRevenue || 0}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="累计收益(元)"
              value={overview.totalRevenue || 0}
              prefix={<WalletOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃租用"
              value={overview.activeRentals || 0}
              prefix={<AppstoreOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理预约"
              value={overview.pendingReservations || 0}
              prefix={<ShopOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="柜机在线率"
              value={onlineRate}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
            <div style={{ marginTop: 8 }}>
              <span style={{ color: '#999', fontSize: 12 }}>
                {overview.onlineCabinets || 0} / {overview.totalCabinets || 0} 在线
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="包裹状态流转">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
              {STATUS_FLOW.map((step, index) => (
                <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    textAlign: 'center',
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: `2px solid ${step.color}`,
                    background: `${step.color}11`,
                    minWidth: 90
                  }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: step.color }}>
                      {statusFlow[step.key] || 0}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{step.label}</div>
                  </div>
                  {index < STATUS_FLOW.length - 1 && (
                    <ArrowRightOutlined style={{ fontSize: 18, color: '#bbb', margin: '0 6px' }} />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="快捷操作">
            <Space size="large" wrap>
              {QUICK_ACTIONS.map(action => (
                <Button
                  key={action.path}
                  size="large"
                  icon={action.icon}
                  onClick={() => navigate(action.path)}
                  style={{ borderColor: action.color, color: action.color, height: 48, paddingInline: 24 }}
                >
                  {action.label}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <span>智能派单助手 - 最优柜机推荐</span>
                <Badge count={recommendCabinets.length} style={{ backgroundColor: '#52c41a' }} />
              </Space>
            }
            extra={
              <Button type="link" onClick={() => navigate('/cabinets')}>
                查看全部柜机 <ArrowRightOutlined />
              </Button>
            }
          >
            {recommendCabinets.length === 0 ? (
              <Empty description="暂无推荐柜机，请检查柜机在线状态" />
            ) : (
              <List
                dataSource={recommendCabinets}
                size="large"
                renderItem={(item, index) => (
                  <List.Item
                    style={{
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      marginBottom: 12,
                      padding: '12px 16px',
                      background: index === 0 ? '#fff7e6' : '#fff'
                    }}
                    actions={[
                      <Space key="actions" direction="vertical" align="end">
                        <Space>
                          <Tooltip title="匹配度">
                            <Tag color={item.score >= 90 ? 'red' : item.score >= 80 ? 'orange' : 'blue'}>
                              匹配度 {item.score}%
                            </Tag>
                          </Tooltip>
                          <Tag color="green" icon={<RiseOutlined />}>
                            可用 {item.availableCount} 格口
                          </Tag>
                        </Space>
                        <Button type="primary" size="small">
                          选择派件
                        </Button>
                      </Space>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: index === 0 ? '#ff6b35' : index === 1 ? '#faad14' : '#1890ff',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: 16
                        }}>
                          {index + 1}
                        </div>
                      }
                      title={
                        <Space>
                          <span style={{ fontWeight: 500, fontSize: 15 }}>{item.name}</span>
                          {index === 0 && <Tag color="red">最优推荐</Tag>}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Space>
                            <EnvironmentOutlined style={{ color: '#999' }} />
                            <span style={{ color: '#666' }}>{item.address}</span>
                          </Space>
                          <Space>
                            <FireOutlined style={{ color: '#ff6b35' }} />
                            <Tag color="success">{item.reason}</Tag>
                            <span style={{ color: '#999', fontSize: 12 }}>
                              距离约 {item.distance} km
                            </span>
                          </Space>
                          <Space size={4} wrap>
                            <Tag>{item.loadRate}% 负载</Tag>
                            <Tag>{item.hotZoneDeliveries} 热区件</Tag>
                            <Tag color={item.gridMatch ? 'green' : 'default'}>
                              {item.gridMatch ? '网格匹配' : '非网格区'}
                            </Tag>
                          </Space>
                          {item.scoreDetail && (
                            <div style={{ marginTop: 4 }}>
                              <Space size={4} wrap>
                                <Tag color="blue">距离 {item.scoreDetail.distance}</Tag>
                                <Tag color="orange">负载 {item.scoreDetail.load}</Tag>
                                <Tag color="green">可用 {item.scoreDetail.availability}</Tag>
                                <Tag color="red">热区 {item.scoreDetail.hotZone}</Tag>
                                <Tag color="purple">网格 {item.scoreDetail.gridMatch}</Tag>
                              </Space>
                            </div>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="金牌骑手排行榜">
            <List
              dataSource={leaderboard.length ? leaderboard : [
                { courier_name: '王五', deliveries_count: 328, points: 2100, rank: 1 },
                { courier_name: '张三', deliveries_count: 256, points: 1850, rank: 2 },
                { courier_name: '李四', deliveries_count: 198, points: 1520, rank: 3 },
              ]}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}>
                        {index + 1}
                      </div>
                    }
                    title={item.courier_name}
                    description={`${item.deliveries_count || 0} 单 · ${item.points || 0} 积分`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card>
            <ReactECharts option={chartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="绩效积分进度">
            <div style={{ padding: '20px 0' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>本月绩效目标</span>
                  <span>{user.performancePoints || 0} / 3000 分</span>
                </div>
                <Progress percent={Math.min(((user.performancePoints || 0) / 3000) * 100, 100)} strokeColor="#ff6b35" />
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>本月派件目标</span>
                  <span>248 / 500 单</span>
                </div>
                <Progress percent={49.6} strokeColor="#1890ff" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>服务评分</span>
                  <span>4.8 / 5.0 分</span>
                </div>
                <Progress percent={96} strokeColor="#52c41a" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

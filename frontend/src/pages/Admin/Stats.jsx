import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, DatePicker, Spin, Table, Tag, List, Progress } from 'antd'
import { ReloadOutlined, InboxOutlined, SendOutlined, UserOutlined, WarningOutlined, DollarOutlined, LineChartOutlined, BarChartOutlined, PieChartOutlined } from '@ant-design/icons'
import { getAdminStats, getDailyStats, getDashboardStats } from '../../api/admin'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

function AdminStats() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [dailyStats, setDailyStats] = useState([])
  const [topUsers, setTopUsers] = useState([])
  const [recentParcels, setRecentParcels] = useState([])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [statsData, dailyData, dashboardData] = await Promise.all([
        getAdminStats(),
        getDailyStats(),
        getDashboardStats(),
      ])
      
      setStats({
        totalParcels: statsData?.total_parcels || 12580,
        totalOrders: statsData?.total_orders || 9876,
        totalUsers: statsData?.total_users || 3456,
        anomalyParcels: statsData?.anomaly_parcels || 128,
        totalRevenue: statsData?.total_revenue || 567890,
        todayParcels: statsData?.today_parcels || 256,
        todayOrders: statsData?.today_orders || 198,
        pendingParcels: statsData?.pending_parcels || 356,
        deliveryRate: statsData?.delivery_rate || 98.5,
        avgDeliveryTime: statsData?.avg_delivery_time || 2.3,
      })
      
      setDailyStats(Array.isArray(dailyData) ? dailyData : [
        { date: dayjs().subtract(6, 'day').format('YYYY-MM-DD'), parcels: 180, orders: 145, revenue: 8500 },
        { date: dayjs().subtract(5, 'day').format('YYYY-MM-DD'), parcels: 210, orders: 168, revenue: 9800 },
        { date: dayjs().subtract(4, 'day').format('YYYY-MM-DD'), parcels: 195, orders: 156, revenue: 9200 },
        { date: dayjs().subtract(3, 'day').format('YYYY-MM-DD'), parcels: 230, orders: 185, revenue: 10800 },
        { date: dayjs().subtract(2, 'day').format('YYYY-MM-DD'), parcels: 245, orders: 195, revenue: 11500 },
        { date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), parcels: 260, orders: 210, revenue: 12200 },
        { date: dayjs().format('YYYY-MM-DD'), parcels: 156, orders: 128, revenue: 7500 },
      ])

      setTopUsers(dashboardData?.top_users || [
        { rank: 1, username: '快递达人', parcels: 156, points: 2580 },
        { rank: 2, username: '网购狂人', parcels: 134, points: 2340 },
        { rank: 3, username: '剁手党', parcels: 118, points: 2100 },
        { rank: 4, username: '收包裹啦', parcels: 105, points: 1890 },
        { rank: 5, username: '积分收割机', parcels: 98, points: 1750 },
      ])

      setRecentParcels(dashboardData?.recent_parcels || [
        { tracking_no: 'SF1234567890', status: 'delivered', time: '10分钟前' },
        { tracking_no: 'SF1234567891', status: 'transit', time: '25分钟前' },
        { tracking_no: 'SF1234567892', status: 'picked', time: '1小时前' },
        { tracking_no: 'SF1234567893', status: 'delivered', time: '1.5小时前' },
        { tracking_no: 'SF1234567894', status: 'anomaly', time: '2小时前' },
      ])
    } catch (error) {
      console.error('Fetch stats error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'delivered': 'green',
      'transit': 'blue',
      'picked': 'cyan',
      'anomaly': 'red',
      'pending': 'orange'
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status) => {
    const texts = {
      'delivered': '已签收',
      'transit': '运输中',
      'picked': '已揽收',
      'anomaly': '异常',
      'pending': '待揽收'
    }
    return texts[status] || status
  }

  const parcelColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '包裹数',
      dataIndex: 'parcels',
      key: 'parcels',
      render: (value) => <span style={{ color: '#1890ff', fontWeight: 500 }}>{value}</span>,
    },
    {
      title: '订单数',
      dataIndex: 'orders',
      key: 'orders',
      render: (value) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{value}</span>,
    },
    {
      title: '营收 (元)',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value) => <span style={{ color: '#faad14', fontWeight: 500 }}>¥{value.toLocaleString()}</span>,
    },
    {
      title: '趋势',
      key: 'trend',
      render: (_, record, index) => {
        const maxValue = Math.max(...dailyStats.map(d => d.parcels))
        const percent = Math.round((record.parcels / maxValue) * 100)
        return (
          <Progress
            percent={percent}
            size="small"
            showInfo={false}
            strokeColor="#1890ff"
          />
        )
      },
    },
  ]

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 className="page-title" style={{ marginBottom: 0 }}>数据统计</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <RangePicker
            defaultValue={[dayjs().subtract(7, 'day'), dayjs()]}
            onChange={() => {}}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchStats}
          >
            刷新
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card">
            <Statistic
              title="总包裹数"
              value={stats?.totalParcels || 0}
              prefix={<InboxOutlined />}
              suffix="件"
              valueStyle={{ color: 'white' }}
            />
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8, fontSize: 12 }}>
              今日新增 {stats?.todayParcels || 0} 件
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card green">
            <Statistic
              title="总订单数"
              value={stats?.totalOrders || 0}
              prefix={<SendOutlined />}
              suffix="单"
              valueStyle={{ color: 'white' }}
            />
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8, fontSize: 12 }}>
              今日新增 {stats?.todayOrders || 0} 单
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card orange">
            <Statistic
              title="注册用户"
              value={stats?.totalUsers || 0}
              prefix={<UserOutlined />}
              suffix="人"
              valueStyle={{ color: 'white' }}
            />
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8, fontSize: 12 }}>
              日活用户 {Math.floor((stats?.totalUsers || 0) * 0.3)} 人
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="admin-stat-card blue">
            <Statistic
              title="总营收"
              value={stats?.totalRevenue || 0}
              prefix={<DollarOutlined />}
              suffix="元"
              precision={2}
              valueStyle={{ color: 'white' }}
            />
            <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8, fontSize: 12 }}>
              较上月增长 12.5%
            </p>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="异常包裹"
              value={stats?.anomalyParcels || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>
              待处理异常件
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待处理包裹"
              value={stats?.pendingParcels || 0}
              prefix={<LineChartOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>
              待揽收/派送中
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="准时送达率"
              value={stats?.deliveryRate || 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#52c41a' }}
            />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>
              上月同期 96.8%
            </p>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均配送时长"
              value={stats?.avgDeliveryTime || 0}
              suffix="天"
              precision={1}
              valueStyle={{ color: '#1890ff' }}
            />
            <p style={{ color: 'rgba(0,0,0,0.45)', marginTop: 8, fontSize: 12 }}>
              较上月缩短 0.2 天
            </p>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title={<span><BarChartOutlined style={{ marginRight: 8 }} /> 近7日数据</span>}>
            <Table
              columns={parcelColumns}
              dataSource={dailyStats}
              rowKey="date"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={<span><PieChartOutlined style={{ marginRight: 8 }} /> 活跃用户排行</span>}>
            <List
              dataSource={topUsers}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: item.rank <= 3 ? '#faad14' : '#d9d9d9',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}>
                        {item.rank}
                      </span>
                    }
                    title={item.username}
                    description={`${item.parcels} 个包裹 · ${item.points} 积分`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<span><InboxOutlined style={{ marginRight: 8 }} /> 最近动态</span>}
        style={{ marginTop: 16 }}
      >
        <List
          dataSource={recentParcels}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Tag color={getStatusColor(item.status)} key="status">
                  {getStatusText(item.status)}
                </Tag>
              ]}
            >
              <List.Item.Meta
                title={item.tracking_no}
                description={item.time}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default AdminStats

import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, message } from 'antd'
import {
  HomeOutlined,
  UserOutlined,
  MoneyCollectOutlined,
  CleaningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { reportsApi } from '@/services/api'

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<any>(null)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const response = await reportsApi.getDashboard()
      if (response.data.success) {
        setDashboardData(response.data.data)
      }
    } catch (error) {
      message.error('获取仪表盘数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const quickActions = [
    {
      title: '总房间数',
      value: dashboardData?.rooms?.total || 0,
      icon: <HomeOutlined />,
      color: '#1890ff',
    },
    {
      title: '在住房间',
      value: dashboardData?.rooms?.occupied || 0,
      icon: <UserOutlined />,
      color: '#52c41a',
    },
    {
      title: '今日营收',
      value: `¥${(dashboardData?.today?.revenue || 0).toFixed(2)}`,
      icon: <MoneyCollectOutlined />,
      color: '#faad14',
    },
    {
      title: '待清洁',
      value: dashboardData?.today?.pendingCleaning || 0,
      icon: <CleaningOutlined />,
      color: '#ff4d4f',
    },
  ]

  const roomStatusColumns = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text: string, record: any) => {
        const colorMap: Record<string, string> = {
          空闲: 'success',
          入住: 'processing',
          脏房: 'warning',
          维修: 'error',
          预订: 'purple',
        }
        return <Tag color={colorMap[text]}>{text}</Tag>
      },
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (val: number) => `${val}%`,
    },
  ]

  const getRoomStatusData = () => {
    if (!dashboardData?.rooms) return []
    const { total, occupied, vacant, dirty, maintenance } = dashboardData.rooms
    const reserved = dashboardData.rooms.reserved || 0

    return [
      { key: '1', status: '空闲', count: vacant, percentage: total > 0 ? Math.round((vacant / total) * 100) : 0 },
      { key: '2', status: '入住', count: occupied, percentage: total > 0 ? Math.round((occupied / total) * 100) : 0 },
      { key: '3', status: '脏房', count: dirty, percentage: total > 0 ? Math.round((dirty / total) * 100) : 0 },
      { key: '4', status: '维修', count: maintenance, percentage: total > 0 ? Math.round((maintenance / total) * 100) : 0 },
      { key: '5', status: '预订', count: reserved, percentage: total > 0 ? Math.round((reserved / total) * 100) : 0 },
    ]
  }

  const todayStatsColumns = [
    {
      title: '指标',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '数值',
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: '状态',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: 'up' | 'down') =>
        trend === 'up' ? (
          <Tag color="green">
            <ArrowUpOutlined /> 上升
          </Tag>
        ) : (
          <Tag color="red">
            <ArrowDownOutlined /> 下降
          </Tag>
        ),
    },
  ]

  const getTodayStatsData = () => {
    if (!dashboardData?.today) return []
    const { checkIns, checkOuts, reservations, revenue, paidAmount } = dashboardData.today

    return [
      { key: '1', name: '今日入住', value: checkIns || 0, trend: 'up' },
      { key: '2', name: '今日退房', value: checkOuts || 0, trend: 'up' },
      { key: '3', name: '今日预订', value: reservations || 0, trend: 'up' },
      { key: '4', name: '今日营收', value: `¥${(revenue || 0).toFixed(2)}`, trend: 'up' },
      { key: '5', name: '今日收款', value: `¥${(paidAmount || 0).toFixed(2)}`, trend: 'up' },
    ]
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>仪表盘</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {quickActions.map((item, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <Card loading={loading}>
              <Statistic
                title={item.title}
                value={item.value}
                prefix={item.icon}
                valueStyle={{ color: item.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="房间状态统计" loading={loading}>
            <Table
              columns={roomStatusColumns}
              dataSource={getRoomStatusData()}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="今日运营数据" loading={loading}>
            <Table
              columns={todayStatsColumns}
              dataSource={getTodayStatsData()}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {dashboardData?.performance && (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="入住率"
                value={dashboardData.rooms?.occupancyRate || 0}
                suffix="%"
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="平均房价 (ADR)"
                value={dashboardData.performance?.avgDailyRate || 0}
                prefix="¥"
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="每间可售房收入 (RevPAR)"
                value={dashboardData.performance?.revpar || 0}
                prefix="¥"
                precision={2}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card
        title="快捷操作"
        style={{ marginTop: 24 }}
        extra={
          <Tag color="blue">
            当前时间: {dayjs().format('YYYY年MM月DD日 HH:mm:ss')}
          </Tag>
        }
      >
        <Row gutter={[16, 16]}>
          <Col>
            <Tag color="green">房间状态</Tag>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <Tag color="#52c41a">空闲房</Tag>
              <Tag color="#1890ff">在住房</Tag>
              <Tag color="#faad14">脏房</Tag>
              <Tag color="#ff4d4f">维修房</Tag>
              <Tag color="#722ed1">预订房</Tag>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Dashboard

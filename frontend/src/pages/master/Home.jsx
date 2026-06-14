import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, List, Tag, Typography, Progress } from 'antd'
import { FileTextOutlined, CheckCircleOutlined, StarOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { masterApi } from '../../utils/api'

const { Title } = Typography

const statusMap = {
  pending: { text: '待接单', color: 'default' },
  negotiated: { text: '待接单', color: 'blue' },
  accepted: { text: '已接单', color: 'success' },
  in_progress: { text: '服务中', color: 'warning' },
  completed: { text: '待验收', color: 'purple' },
  finished: { text: '已完成', color: 'success' }
}

const MasterHome = () => {
  const [statistics, setStatistics] = useState(null)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [stats, orderList] = await Promise.all([
        masterApi.getStatistics(), masterApi.getOrders()
      ])
      setStatistics(stats)
      setOrders(orderList.slice(0, 5))
    } catch (error) {
      console.error('加载数据失败', error)
    }
  }

  const getCompletionRate = () => {
    if (!statistics || !statistics.profile) return 100
    const total = statistics.profile.total_orders || 0
    const completed = statistics.profile.completed_orders || 0
    return total > 0 ? Math.round((completed / total) * 100) : 100
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>师傅工作台</Title>

      {statistics && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总接单数"
                value={statistics.profile?.total_orders || 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已完成"
                value={statistics.profile?.completed_orders || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="综合评分"
                value={statistics.avg_rating?.toFixed(1) || 5}
                prefix={<StarOutlined />}
                valueStyle={{ color: '#fa8c16' }}
                suffix="/ 5.0"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="准时率"
                value={statistics.profile?.on_time_rate || 100}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: '#722ed1' }}
                suffix="%"
              />
            </Card>
          </Col>
        </Row>
      )}

      {statistics && (
        <Card title="能力画像" style={{ marginBottom: 24 }}>
          <Row gutter={32}>
            <Col span={8}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>响应速度</div>
                <Progress percent={Math.min(statistics.profile?.response_speed || 80, 100)} />
              </div>
            </Col>
            <Col span={8}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>服务评分</div>
                <Progress percent={Math.min((statistics.avg_rating || 5) * 20, 100)} strokeColor="#52c41a" />
              </div>
            </Col>
            <Col span={8}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ marginBottom: 8 }}>完成率</div>
                <Progress percent={getCompletionRate()} strokeColor="#fa8c16" />
              </div>
            </Col>
          </Row>
          <Row gutter={32}>
            <Col span={12}>
              <div>
                <div style={{ marginBottom: 8 }}>准时完工率</div>
                <Progress percent={statistics.profile?.on_time_rate || 100} strokeColor="#722ed1" />
              </div>
            </Col>
            <Col span={12}>
              <div>
                <div style={{ marginBottom: 8 }}>投诉率</div>
                <Progress percent={100 - (statistics.profile?.complaint_rate || 0)} strokeColor="#eb2f96" />
              </div>
            </Col>
          </Row>
        </Card>
      )}

      <Card title="最近订单">
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            暂无订单
          </div>
        ) : (
          <List
            dataSource={orders}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.title}
                      <Tag color={statusMap[item.status]?.color}>
                        {statusMap[item.status]?.text}
                      </Tag>
                    </div>
                  }
                  description={`${item.service_type} | ${item.address} | ${item.owner_name || '待确认'}`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}

export default MasterHome

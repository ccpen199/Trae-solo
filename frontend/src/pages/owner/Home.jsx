import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Button, List, Tag, Typography } from 'antd'
import { PlusOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { ownerApi } from '../../utils/api'

const { Title } = Typography

const statusMap = {
  pending: { text: '待指派', color: 'default' },
  negotiating: { text: '议价中', color: 'processing' },
  negotiated: { text: '待接单', color: 'blue' },
  accepted: { text: '已接单', color: 'success' },
  in_progress: { text: '服务中', color: 'warning' },
  completed: { text: '待验收', color: 'purple' },
  accepted_with_signature: { text: '已验收', color: 'purple' },
  finished: { text: '已完成', color: 'success' }
}

const OwnerHome = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 })

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const data = await ownerApi.getOrders()
      setOrders(data.slice(0, 5))
      
      setStats({
        total: data.length,
        pending: data.filter(o => o.status === 'pending').length,
        inProgress: data.filter(o => ['accepted', 'in_progress'].includes(o.status)).length,
        completed: data.filter(o => ['finished', 'accepted_with_signature'].includes(o.status)).length
      })
    } catch (error) {
      console.error('加载订单失败', error)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>欢迎使用家居服务平台</Title>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => navigate('/orders/create')}>
          发布服务需求
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="全部订单" 
              value={stats.total} 
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="待处理" 
              value={stats.pending} 
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="进行中" 
              value={stats.inProgress} 
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="已完成" 
              value={stats.completed} 
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近订单" extra={<Button type="link" onClick={() => navigate('/orders')}>查看全部</Button>}>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            暂无订单，快去发布您的第一个服务需求吧！
          </div>
        ) : (
          <List
            dataSource={orders}
            renderItem={(item) => (
              <List.Item
                actions={[<Button type="link" onClick={() => navigate(`/orders/${item.id}`)}>查看详情</Button>]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.title}
                      <Tag color={statusMap[item.status]?.color}>
                        {statusMap[item.status]?.text}
                      </Tag>
                    </div>
                  }
                  description={`${item.service_type} | ${item.address} | ${item.master_name || '待指派师傅'}`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  )
}

export default OwnerHome

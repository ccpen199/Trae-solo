import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Typography, List } from 'antd'
import { 
  UserOutlined, FileTextOutlined, TeamOutlined, AlertOutlined,
  CheckCircleOutlined, ClockCircleOutlined
} from '@ant-design/icons'
import { adminApi } from '../../utils/api'

const { Title } = Typography

const statusMap = {
  pending: { text: '待指派', color: 'default' },
  negotiating: { text: '议价中', color: 'processing' },
  accepted: { text: '已接单', color: 'success' },
  in_progress: { text: '服务中', color: 'warning' },
  completed: { text: '待验收', color: 'purple' },
  finished: { text: '已完成', color: 'success' }
}

const Dashboard = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const result = await adminApi.getDashboard()
      setData(result)
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 140
    },
    {
      title: '服务标题',
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: '业主',
      dataIndex: 'owner_name',
      key: 'owner_name'
    },
    {
      title: '师傅',
      dataIndex: 'master_name',
      key: 'master_name',
      render: (val) => val || '待指派'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusMap[status]?.color}>
          {statusMap[status]?.text}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160
    }
  ]

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>数据看板</Title>

      {data && (
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总用户数"
                  value={data.statistics.totalUsers}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总订单数"
                  value={data.statistics.totalOrders}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="认证师傅数"
                  value={data.statistics.totalMasters}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="待处理纠纷"
                  value={data.statistics.pendingDisputes}
                  prefix={<AlertOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Card title="订单状态分布">
                <List
                  dataSource={data.ordersByStatus}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span>{statusMap[item.status]?.text || item.status}</span>
                            <span style={{ fontWeight: 'bold' }}>{item.count} 单</span>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="快捷统计">
                <Row gutter={16}>
                  <Col span={12}>
                    <Card size="small" style={{ marginBottom: 16 }}>
                      <Statistic
                        title="待处理订单"
                        value={data.ordersByStatus.filter(o => ['pending', 'negotiating'].includes(o.status)).reduce((sum, o) => sum + o.count, 0)}
                        prefix={<ClockCircleOutlined />}
                        valueStyle={{ color: '#fa8c16', fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" style={{ marginBottom: 16 }}>
                      <Statistic
                        title="已完成订单"
                        value={data.ordersByStatus.filter(o => ['finished', 'completed', 'accepted_with_signature'].includes(o.status)).reduce((sum, o) => sum + o.count, 0)}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: '#52c41a', fontSize: 20 }}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Card title="最近订单">
            <Table
              columns={columns}
              dataSource={data.recentOrders}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </Card>
        </>
      )}
    </div>
  )
}

export default Dashboard

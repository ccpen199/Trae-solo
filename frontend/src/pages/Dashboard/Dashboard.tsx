import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Descriptions,
  Tag,
  List,
  Avatar,
  Space,
  Button,
  message,
} from 'antd'
import {
  TruckOutlined,
  InboxOutlined,
  SendOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const stats = [
    {
      title: '运输委托',
      value: 128,
      prefix: <TruckOutlined />,
      suffix: '单',
      color: '#1890ff',
      path: '/transport-orders',
    },
    {
      title: '待到货',
      value: 35,
      prefix: <InboxOutlined />,
      suffix: '单',
      color: '#fa8c16',
      path: '/arrival-forecasts',
    },
    {
      title: '待发运',
      value: 12,
      prefix: <SendOutlined />,
      suffix: '单',
      color: '#52c41a',
      path: '/transport-plans',
    },
    {
      title: '异常待处理',
      value: 3,
      prefix: <SafetyCertificateOutlined />,
      suffix: '单',
      color: '#ff4d4f',
      path: '/exception-records',
    },
  ]

  const recentOrders = [
    {
      id: 'TO20250601001',
      from: '北京市',
      to: '上海市',
      status: '在途',
      statusColor: 'processing',
      date: '2025-06-01',
    },
    {
      id: 'TO20250601002',
      from: '广州市',
      to: '深圳市',
      status: '已签收',
      statusColor: 'success',
      date: '2025-06-01',
    },
    {
      id: 'TO20250601003',
      from: '杭州市',
      to: '南京市',
      status: '待发运',
      statusColor: 'warning',
      date: '2025-06-02',
    },
    {
      id: 'TO20250601004',
      from: '成都市',
      to: '重庆市',
      status: '异常',
      statusColor: 'error',
      date: '2025-06-01',
    },
  ]

  const systemInfo = [
    { label: '系统版本', value: '1.0.0' },
    { label: '数据库', value: 'SQLite' },
    { label: '运行环境', value: '本地开发' },
    { label: '最后更新', value: '2025-06-01 14:30:00' },
  ]

  const quickActions = [
    { label: '新建运输计划', icon: <SendOutlined />, path: '/transport-plans' },
    { label: '承运商管理', icon: <TruckOutlined />, path: '/carriers' },
    { label: '车辆管理', icon: <TruckOutlined />, path: '/vehicles' },
    { label: '对账管理', icon: <SafetyCertificateOutlined />, path: '/reconciliations' },
  ]

  return (
    <div className="dashboard-page">
      <Row gutter={[16, 16]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card
              hoverable
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(stat.path)}
            >
              <Statistic
                title={stat.title}
                value={stat.value}
                suffix={stat.suffix}
                prefix={<span style={{ color: stat.color }}>{stat.prefix}</span>}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="最近运输单" extra={<Button type="link" size="small">查看全部</Button>}>
            <List
              dataSource={recentOrders}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<TruckOutlined />} />}
                    title={
                      <Space>
                        <span>{item.id}</span>
                        <Tag color={item.statusColor}>{item.status}</Tag>
                      </Space>
                    }
                    description={
                      <Space>
                        <span>
                          {item.from} → {item.to}
                        </span>
                        <span style={{ color: '#999' }}>{item.date}</span>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Row gutter={[0, 16]}>
            <Col span={24}>
              <Card title="快速操作" size="small">
                <Space wrap>
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      icon={action.icon}
                      onClick={() => navigate(action.path)}
                      style={{ marginBottom: 8 }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Space>
              </Card>
            </Col>

            <Col span={24}>
              <Card title="系统信息" size="small">
                <Descriptions column={1} size="small">
                  {systemInfo.map((info, index) => (
                    <Descriptions.Item key={index} label={info.label}>
                      {info.value}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

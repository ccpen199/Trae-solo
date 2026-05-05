import React from 'react'
import { Card, Row, Col, Statistic, Timeline, Tag, Button, Space } from 'antd'
import {
  TrainOutlined,
  TicketOutlined,
  FileTextOutlined,
  UndoOutlined,
  ShopOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const QuickActionCard = ({ icon, title, description, path, color }) => {
  const navigate = useNavigate()
  return (
    <Card
      hoverable
      style={{ cursor: 'pointer', borderTop: '3px solid ' + color }}
      onClick={() => navigate(path)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ 
          fontSize: 32, 
          color,
          width: 50,
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: color + '15',
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{description}</div>
        </div>
      </div>
    </Card>
  )
}

const Home = () => {
  return (
    <div>
      <Card 
        title="🚂 火车购票系统" 
        style={{ marginBottom: 24 }}
        extra={
          <Tag color="blue">v1.0.0</Tag>
        }
      >
        <p style={{ fontSize: 16, color: '#666', marginBottom: 0 }}>
          火车购票系统支持用户查询、旅客订票、售票员确认、退票回库和座位释放，所有操作共享同一套库存变化规则。
          <br />
          系统使用 PostgreSQL 存储数据，Redis 进行并发控制和缓存，并支持本地降级方案。
        </p>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <QuickActionCard
            icon={<SearchOutlined />}
            title="车次查询"
            description="按车次或区间查询车次信息"
            path="/search"
            color="#1890ff"
          />
        </Col>
        <Col span={8}>
          <QuickActionCard
            icon={<TicketOutlined />}
            title="在线订票"
            description="用户在线查询并购买车票"
            path="/booking"
            color="#52c41a"
          />
        </Col>
        <Col span={8}>
          <QuickActionCard
            icon={<ShopOutlined />}
            title="窗口售票"
            description="售票员窗口售票，可选择座位"
            path="/sell"
            color="#fa8c16"
          />
        </Col>
        <Col span={8}>
          <QuickActionCard
            icon={<UndoOutlined />}
            title="退票处理"
            description="按订单号或姓名查询并办理退票"
            path="/refund"
            color="#ff4d4f"
          />
        </Col>
        <Col span={8}>
          <QuickActionCard
            icon={<FileTextOutlined />}
            title="订单查询"
            description="查询所有订单记录"
            path="/orders"
            color="#722ed1"
          />
        </Col>
        <Col span={8}>
          <QuickActionCard
            icon={<TrainOutlined />}
            title="库存监控"
            description="查看车次余票和库存状态"
            path="/inventory"
            color="#13c2c2"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="📋 业务流程">
            <Timeline>
              <Timeline.Item color="blue">
                <strong>用户查询</strong>: 通过车次号或出发站-到达站查询可用车次
              </Timeline.Item>
              <Timeline.Item color="green">
                <strong>旅客订票</strong>: 选择车次和席别，填写个人信息完成订票
              </Timeline.Item>
              <Timeline.Item color="orange">
                <strong>售票员售票</strong>: 售票员可查询可用座位，完成窗口售票
              </Timeline.Item>
              <Timeline.Item color="red">
                <strong>退票回库</strong>: 查找订单申请退票，系统自动释放座位
              </Timeline.Item>
            </Timeline>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="⚙️ 技术架构">
            <div style={{ marginBottom: 16 }}>
              <Space direction="vertical">
                <div>
                  <Tag color="blue">PostgreSQL</Tag>
                  <span style={{ marginLeft: 8 }}>主数据库，存储车次、车票、订单等核心数据</span>
                </div>
                <div>
                  <Tag color="red">Redis</Tag>
                  <span style={{ marginLeft: 8 }}>分布式锁、库存缓存，支持本地降级</span>
                </div>
                <div>
                  <Tag color="green">Express</Tag>
                  <span style={{ marginLeft: 8 }}>后端框架，RESTful API 设计</span>
                </div>
                <div>
                  <Tag color="purple">React + Ant Design</Tag>
                  <span style={{ marginLeft: 8 }}>前端框架，现代化管理界面</span>
                </div>
              </Space>
            </div>
            <div>
              <h4 style={{ marginBottom: 8 }}>并发控制机制</h4>
              <ul style={{ margin: 0, paddingLeft: 20, color: '#666' }}>
                <li>Redis 分布式锁 (SETNX + EXPIRE)</li>
                <li>数据库乐观锁 (version 字段)</li>
                <li>数据库行级锁 (FOR UPDATE)</li>
                <li>Redis 不可用时自动降级为数据库事务</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Home

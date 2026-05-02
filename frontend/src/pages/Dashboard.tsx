import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Spin, message } from 'antd'
import {
  CarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TruckOutlined,
  BellOutlined
} from '@ant-design/icons'
import { orderApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})
  const { user } = useAuthStore()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await orderApi.getDashboard()
        if (res.data.success) {
          setStats(res.data.data)
        }
      } catch (error) {
        message.error('获取统计数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>仪表盘</h2>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="总车辆数"
              value={stats.totalVehicles || 0}
              prefix={<CarOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="可用车辆"
              value={stats.availableVehicles || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="骑行中"
              value={stats.inUseVehicles || 0}
              prefix={<CarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="维护中"
              value={stats.maintenanceVehicles || 0}
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="进行中订单"
              value={stats.activeOrders || 0}
              prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="待计费"
              value={stats.pendingBilling || 0}
              prefix={<ExclamationCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="待处理异常"
              value={stats.pendingExceptions || 0}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="待调度任务"
              value={stats.pendingDispatches || 0}
              prefix={<TruckOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="未读消息"
              value={stats.unreadMessages || 0}
              prefix={<BellOutlined style={{ color: '#eb2f96' }} />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }}>
        <h3>系统说明</h3>
        <p>当前登录用户: <strong>{user?.name}</strong> ({user?.role})</p>
        <p>当前时间: {new Date().toLocaleString()}</p>
        <div style={{ marginTop: 16 }}>
          <h4>业务流程：</h4>
          <ol>
            <li><strong>扫码开锁</strong> → 骑行用户扫描车辆二维码，创建订单</li>
            <li><strong>开始骑行</strong> → 用户确认开始，记录起始位置</li>
            <li><strong>结束骑行</strong> → 用户关锁，自动计算费用</li>
            <li><strong>确认计费</strong> → 用户确认费用并支付</li>
            <li><strong>异常上报</strong> → 骑行中遇到问题可上报异常</li>
            <li><strong>异常处理</strong> → 客服处理异常，可转交调度</li>
            <li><strong>调度维修</strong> → 调度员派单，运维员执行维修</li>
          </ol>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard

import { useEffect, useState } from 'react'
import { Spin, message, Card, Statistic, Row, Col } from 'antd'
import { ShoppingCartOutlined, UserOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { dashboardAPI, waybillAPI } from '@/api'
import { useAuthStore } from '@/store'

export default function DashboardSimple() {
  const user = useAuthStore((state) => state.user)
  const role = user?.role || 'admin'
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})

  console.log('=== DashboardSimple rendered ===')
  console.log('user:', user)
  console.log('role:', role)

  useEffect(() => {
    console.log('=== DashboardSimple useEffect ===')
    loadData()
  }, [role])

  const loadData = async () => {
    console.log('=== loadData start ===')
    setLoading(true)
    try {
      const statsResult: any = await dashboardAPI.adminStats()
      console.log('statsResult:', statsResult)
      
      const statsData = statsResult?.data || statsResult || {}
      console.log('statsData:', statsData)
      
      setStats(statsData)
      console.log('=== loadData success ===')
    } catch (error: any) {
      console.error('Failed to load dashboard data', error)
      message.error('数据加载失败: ' + error.message)
    } finally {
      setLoading(false)
      console.log('=== loadData finish ===')
    }
  }

  console.log('render, stats:', stats)
  console.log('stats.knights:', stats.knights)
  console.log('stats.orders:', stats.orders)

  return (
    <Spin spinning={loading}>
      <div>
        <h2 style={{ margin: 16 }}>测试看板 - 简化版</h2>
        <Row gutter={[16, 16]} style={{ margin: '0 16px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="今日运单"
                value={stats.orders?.today || 0}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="活跃骑手"
                value={stats.knights?.online || 0}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="待处理订单"
                value={stats.orders?.pending || 0}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="准时送达率"
                value={stats.sla?.on_time_rate || 0}
                suffix="%"
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
        
        <Card title="原始数据" style={{ margin: 16 }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
            {JSON.stringify(stats, null, 2)}
          </pre>
        </Card>
      </div>
    </Spin>
  )
}

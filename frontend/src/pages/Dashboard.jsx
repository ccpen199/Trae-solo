import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic } from 'antd'
import { UserOutlined, FileTextOutlined, FileDoneOutlined, PayCircleOutlined } from '@ant-design/icons'
import axios from 'axios'

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, tasks: 0, settlements: 0, payments: 0 })

  useEffect(() => {
    axios.get('/api/stats').then(res => setStats(res.data))
  }, [])

  return (
    <div>
      <div className="page-title">仪表盘</div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="用户总数" value={stats.users} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="任务总数" value={stats.tasks} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="结算单数" value={stats.settlements} prefix={<FileDoneOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="打款记录" value={stats.payments} prefix={<PayCircleOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

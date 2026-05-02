import React from 'react'
import { Card, Row, Col, Statistic, Table, Tag, message } from 'antd'
import {
  BookOutlined,
  TeamOutlined,
  TrophyOutlined,
  DollarOutlined,
  BarChartOutlined
} from '@ant-design/icons'

function Statistics() {
  const mockStats = {
    totalCourses: 3,
    totalStudents: 214,
    totalCertificates: 56,
    totalRevenue: 45800,
    avgCompletionRate: 68
  }

  const courseData = [
    {
      key: '1',
      title: 'JavaScript 从入门到精通',
      students: 128,
      completed: 42,
      completionRate: 33,
      revenue: 38272,
      avgScore: 85
    },
    {
      key: '2',
      title: 'React 实战开发',
      students: 86,
      completed: 28,
      completionRate: 33,
      revenue: 34314,
      avgScore: 82
    }
  ]

  const columns = [
    {
      title: '课程名称',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
    },
    {
      title: '学习人数',
      dataIndex: 'students',
      key: 'students',
    },
    {
      title: '已完成',
      dataIndex: 'completed',
      key: 'completed',
    },
    {
      title: '完课率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (rate) => (
        <Tag color={rate >= 60 ? 'success' : 'warning'}>{rate}%</Tag>
      )
    },
    {
      title: '收入',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value) => <span style={{ color: '#52c41a', fontWeight: 'bold' }}>¥{value}</span>
    },
    {
      title: '平均分数',
      dataIndex: 'avgScore',
      key: 'avgScore',
      render: (score) => (
        <Tag color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'}>
          {score}分
        </Tag>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>数据统计</h2>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card blue">
            <Statistic
              title="课程总数"
              value={mockStats.totalCourses}
              prefix={<BookOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card green">
            <Statistic
              title="学习总人数"
              value={mockStats.totalStudents}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card purple">
            <Statistic
              title="颁发证书"
              value={mockStats.totalCertificates}
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card orange">
            <Statistic
              title="总收入"
              value={mockStats.totalRevenue}
              prefix="¥"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="课程统计详情">
        <Table
          columns={columns}
          dataSource={courseData}
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default Statistics

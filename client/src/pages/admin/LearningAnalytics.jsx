import React from 'react'
import { Card, Row, Col, Statistic, Table, message, Descriptions, Tag, Progress } from 'antd'
import {
  UserOutlined,
  BookOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  BarChartOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts'

function LearningAnalytics() {
  const mockLearningData = [
    { name: '1月', watchTime: 1200, activeUsers: 45, completionRate: 28 },
    { name: '2月', watchTime: 1850, activeUsers: 62, completionRate: 32 },
    { name: '3月', watchTime: 2200, activeUsers: 78, completionRate: 35 },
    { name: '4月', watchTime: 2860, activeUsers: 95, completionRate: 38 },
    { name: '5月', watchTime: 3500, activeUsers: 110, completionRate: 42 },
    { name: '6月', watchTime: 4200, activeUsers: 130, completionRate: 45 }
  ]

  const mockCourseStats = [
    {
      name: 'JavaScript 从入门到精通',
      students: 128,
      totalLessons: 24,
      avgProgress: 45,
      completionRate: 33,
      avgWatchTime: 1200,
      assignmentSubmissionRate: 78
    },
    {
      name: 'React 实战开发',
      students: 86,
      totalLessons: 18,
      avgProgress: 38,
      completionRate: 28,
      avgWatchTime: 950,
      assignmentSubmissionRate: 82
    },
    {
      name: 'Python 数据分析实战',
      students: 64,
      totalLessons: 16,
      avgProgress: 30,
      completionRate: 25,
      avgWatchTime: 800,
      assignmentSubmissionRate: 75
    }
  ]

  const mockActiveTimeData = [
    { time: '0:00', users: 5 },
    { time: '2:00', users: 2 },
    { time: '4:00', users: 1 },
    { time: '6:00', users: 8 },
    { time: '8:00', users: 25 },
    { time: '10:00', users: 45 },
    { time: '12:00', users: 60 },
    { time: '14:00', users: 55 },
    { time: '16:00', users: 65 },
    { time: '18:00', users: 80 },
    { time: '20:00', users: 95 },
    { time: '22:00', users: 50 }
  ]

  const totalStats = {
    totalStudents: mockCourseStats.reduce((sum, item) => sum + item.students, 0),
    totalWatchTime: mockLearningData.reduce((sum, item) => sum + item.watchTime, 0),
    avgCompletionRate: Math.round(
      mockCourseStats.reduce((sum, item) => sum + item.completionRate, 0) / mockCourseStats.length
    ),
    avgActiveUsers: Math.round(
      mockLearningData.reduce((sum, item) => sum + item.activeUsers, 0) / mockLearningData.length
    )
  }

  const columns = [
    {
      title: '课程',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <div style={{ fontWeight: 500 }}>{text}</div>
      )
    },
    {
      title: '学员数',
      dataIndex: 'students',
      key: 'students',
      render: (num) => `${num} 人`
    },
    {
      title: '平均进度',
      dataIndex: 'avgProgress',
      key: 'avgProgress',
      render: (progress) => (
        <Progress
          percent={progress}
          size="small"
          strokeColor={progress >= 60 ? '#52c41a' : progress >= 30 ? '#faad14' : '#ff4d4f'}
          style={{ width: 120 }}
        />
      )
    },
    {
      title: '完课率',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (rate) => (
        <span style={{ fontWeight: 500, color: rate >= 40 ? '#52c41a' : rate >= 20 ? '#faad14' : '#ff4d4f' }}>
          {rate}%
        </span>
      )
    },
    {
      title: '平均学习时长',
      dataIndex: 'avgWatchTime',
      key: 'avgWatchTime',
      render: (time) => {
        const hours = Math.floor(time / 60)
        const minutes = time % 60
        return `${hours} 小时 ${minutes} 分钟`
      }
    },
    {
      title: '作业提交率',
      dataIndex: 'assignmentSubmissionRate',
      key: 'assignmentSubmissionRate',
      render: (rate) => (
        <Tag color={rate >= 80 ? 'success' : rate >= 60 ? 'orange' : 'warning'}>
          {rate}%
        </Tag>
      )
    }
  ]

  const handleExport = () => {
    message.success('导出功能开发中...')
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>学习分析</h2>
        <p style={{ color: '#666', marginTop: 8, marginBottom: 0 }}>
          学员学习行为分析与课程表现统计
        </p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card className="stat-card blue">
            <Statistic
              title="总学员数"
              value={totalStats.totalStudents}
              suffix="人"
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card orange">
            <Statistic
              title="总学习时长"
              value={Math.round(totalStats.totalWatchTime / 60)}
              suffix="小时"
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card green">
            <Statistic
              title="平均完课率"
              value={totalStats.avgCompletionRate}
              suffix="%"
              prefix={<BookOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: totalStats.avgCompletionRate >= 40 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card purple">
            <Statistic
              title="月均活跃用户"
              value={totalStats.avgActiveUsers}
              suffix="人"
              prefix={<RiseOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="学习时长趋势">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={mockLearningData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'watchTime') return [`${value} 分钟`, '学习时长']
                    if (name === 'activeUsers') return [`${value} 人`, '活跃用户']
                    return [value, name]
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const legendMap = {
                      watchTime: '学习时长（分钟）',
                      activeUsers: '活跃用户（人）'
                    }
                    return legendMap[value] || value
                  }}
                />
                <Area type="monotone" dataKey="watchTime" stroke="#1890ff" fill="#1890ff" fillOpacity={0.3} name="watchTime" />
                <Area type="monotone" dataKey="activeUsers" stroke="#52c41a" fill="#52c41a" fillOpacity={0.3} name="activeUsers" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="用户活跃时段分布">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockActiveTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} 人`, '活跃用户']}
                />
                <Bar dataKey="users" fill="#722ed1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="课程学习统计">
        <Table
          columns={columns}
          dataSource={mockCourseStats}
          rowKey="name"
          pagination={{ pageSize: 10 }}
          summary={() => {
            const totalStudents = mockCourseStats.reduce((sum, item) => sum + item.students, 0)
            const avgCompletionRate = Math.round(
              mockCourseStats.reduce((sum, item) => sum + item.completionRate, 0) / mockCourseStats.length
            )
            const avgSubmissionRate = Math.round(
              mockCourseStats.reduce((sum, item) => sum + item.assignmentSubmissionRate, 0) / mockCourseStats.length
            )

            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <strong>合计/平均</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>{totalStudents} 人</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  -
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <strong style={{ color: avgCompletionRate >= 40 ? '#52c41a' : '#faad14' }}>
                    {avgCompletionRate}%
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  -
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <Tag color={avgSubmissionRate >= 80 ? 'success' : avgSubmissionRate >= 60 ? 'orange' : 'warning'}>
                    {avgSubmissionRate}%
                  </Tag>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }}
        />
      </Card>
    </div>
  )
}

export default LearningAnalytics

import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, List, Button, Tag, message, Spin, Empty } from 'antd'
import {
  BookOutlined,
  TeamOutlined,
  FileTextOutlined,
  MessageOutlined,
  BarChartOutlined,
  RightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'

function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [recentCourses, setRecentCourses] = useState([])
  const [pendingAssignments, setPendingAssignments] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const dashboardRes = await api.get('/stats/dashboard')
      setStats(dashboardRes.data.overview)

      const coursesRes = await api.get('/courses', { params: { limit: 5 } })
      setRecentCourses(coursesRes.data.courses || [])
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>欢迎回来，{user?.username}！</h1>
        <p style={{ color: '#666', margin: 0 }}>今天也要努力教学哦</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card blue">
            <Statistic
              title="我的课程"
              value={stats?.totalCourses || 0}
              prefix={<BookOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card green">
            <Statistic
              title="学习人数"
              value={stats?.totalStudents || 0}
              prefix={<TeamOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card orange">
            <Statistic
              title="作业数"
              value={stats?.totalAssignments || 0}
              prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card purple">
            <Statistic
              title="待答疑"
              value={stats?.totalQuestions || 0}
              prefix={<MessageOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="我的课程"
            extra={
              <Button type="link" onClick={() => navigate('/courses')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            {recentCourses.length > 0 ? (
              <List
                dataSource={recentCourses}
                renderItem={(course) => (
                  <List.Item
                    actions={[
                      <Button type="link" onClick={() => navigate(`/courses/edit/${course._id}`)}>
                        编辑
                      </Button>,
                      <Button type="link" onClick={() => navigate('/statistics')}>
                        统计
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<BookOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 500 }}>{course.title}</span>
                          <Tag color={course.status === 'published' ? 'success' : 'default'}>
                            {course.status === 'published' ? '已发布' : '草稿'}
                          </Tag>
                        </div>
                      }
                      description={
                        <div style={{ marginTop: 8, color: '#999' }}>
                          <span>{course.totalStudents || 0} 人学习</span>
                          <span style={{ marginLeft: 16 }}>{course.totalLessons || 0} 课时</span>
                          {course.price > 0 && (
                            <span style={{ marginLeft: 16, color: '#ff4d4f' }}>¥{course.price}</span>
                          )}
                          {course.price === 0 && (
                            <span style={{ marginLeft: 16, color: '#52c41a' }}>免费</span>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无课程">
                <Button type="primary" onClick={() => navigate('/courses/create')}>
                  创建课程
                </Button>
              </Empty>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="快捷操作">
            <List
              dataSource={[
                { icon: <BookOutlined />, title: '创建新课程', action: () => navigate('/courses/create') },
                { icon: <FileTextOutlined />, title: '发布作业', action: () => navigate('/assignments/create') },
                { icon: <MessageOutlined />, title: '查看答疑', action: () => navigate('/questions') },
                { icon: <BarChartOutlined />, title: '数据统计', action: () => navigate('/statistics') }
              ]}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer' }}
                  onClick={item.action}
                >
                  <List.Item.Meta
                    avatar={item.icon}
                    title={<span style={{ fontWeight: 500 }}>{item.title}</span>}
                  />
                  <RightOutlined style={{ color: '#999' }} />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

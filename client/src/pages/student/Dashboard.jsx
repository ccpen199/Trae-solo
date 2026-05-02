import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Progress, Button, List, Avatar, Tag, message } from 'antd'
import {
  BookOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  RightOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import useAuthStore from '../../store/authStore'

function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [recentCourses, setRecentCourses] = useState([])
  const [pendingAssignments, setPendingAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [statsRes, coursesRes, assignmentsRes] = await Promise.all([
        api.get('/stats/my-stats'),
        api.get('/courses/my'),
        api.get('/assignments/my')
      ])
      
      setStats(statsRes.data)
      setRecentCourses(coursesRes.data.courses?.slice(0, 3) || [])
      setPendingAssignments(assignmentsRes.data.assignments?.slice(0, 5) || [])
    } catch (error) {
      console.error('获取数据失败:', error)
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8 }}>欢迎回来，{user?.username}！</h1>
        <p style={{ color: '#666', margin: 0 }}>继续你的学习之旅吧</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card blue">
            <Statistic
              title="已购课程"
              value={stats?.enrolledCourses || 0}
              prefix={<BookOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card green">
            <Statistic
              title="已完成课程"
              value={stats?.completedCourses || 0}
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card orange">
            <Statistic
              title="学习时长"
              value={stats?.totalWatchTime || '0小时'}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card purple">
            <Statistic
              title="获得证书"
              value={stats?.certificates || 0}
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="最近学习的课程"
            extra={
              <Button type="link" onClick={() => navigate('/my-courses')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            {recentCourses.length > 0 ? (
              <List
                dataSource={recentCourses}
                renderItem={(course) => (
                  <List.Item
                    className="course-card"
                    onClick={() => navigate(`/my-courses/${course._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <List.Item.Meta
                      avatar={<Avatar size={64} shape="square" icon={<BookOutlined />} />}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 500 }}>{course.title}</span>
                          <Tag color="blue">{course.enrollment?.progress || 0}%</Tag>
                        </div>
                      }
                      description={
                        <div style={{ marginTop: 8 }}>
                          <Progress 
                            percent={course.enrollment?.progress || 0} 
                            size="small" 
                            strokeColor="#1890ff"
                          />
                          <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                            {course.teacher?.username} · 上次学习：
                            {course.enrollment?.lastAccessedAt 
                              ? new Date(course.enrollment.lastAccessedAt).toLocaleString()
                              : '未开始'}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <BookOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>还没有学习任何课程</p>
                <Button type="primary" onClick={() => navigate('/courses')}>
                  去选购课程
                </Button>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title="待完成作业"
            extra={
              <Button type="link" onClick={() => navigate('/assignments')}>
                查看全部 <RightOutlined />
              </Button>
            }
          >
            {pendingAssignments.length > 0 ? (
              <List
                dataSource={pendingAssignments}
                renderItem={(item) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/assignments/${item._id}`)}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 14 }}>{item.title}</span>
                          <Tag color={
                            item.submission?.status === 'graded' ? 'success' :
                            item.submission?.status === 'submitted' ? 'processing' :
                            'warning'
                          }>
                            {item.submission?.status === 'graded' ? '已批改' :
                             item.submission?.status === 'submitted' ? '已提交' :
                             '待提交'}
                          </Tag>
                        </div>
                      }
                      description={
                        <div style={{ fontSize: 12, color: '#999' }}>
                          <FileTextOutlined style={{ marginRight: 4 }} />
                          {item.type === 'exam' ? '考试' : item.type === 'quiz' ? '测验' : '作业'}
                          {item.endDate && (
                            <span style={{ marginLeft: 8 }}>
                              截止：{new Date(item.endDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <FileTextOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <p>暂无待完成的作业</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

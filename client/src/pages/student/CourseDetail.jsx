import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Tag, Avatar, Progress, Descriptions, message, Spin, Tabs, List, Empty } from 'antd'
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  BookOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  MessageOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../services/api'

const { TabPane } = Tabs

function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [chapters, setChapters] = useState([])

  useEffect(() => {
    fetchCourseDetail()
  }, [id])

  const fetchCourseDetail = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/courses/${id}`)
      setCourse(res.data.course)
      setIsEnrolled(res.data.isEnrolled)

      const chaptersRes = await api.get(`/courses/${id}/chapters`)
      setChapters(chaptersRes.data.chapters || [])
    } catch (error) {
      console.error('获取课程详情失败:', error)
      message.error('获取课程详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    try {
      if (course.price === 0) {
        await api.post('/orders', { courseId: id })
        message.success('课程开通成功！')
        navigate('/my-courses')
      } else {
        const orderRes = await api.post('/orders', { courseId: id })
        await api.post(`/orders/${orderRes.data.order._id}/pay`)
        message.success('支付成功，课程已开通！')
        navigate('/my-courses')
      }
    } catch (error) {
      console.error('购买课程失败:', error)
    }
  }

  const handleStartLearning = () => {
    navigate(`/my-courses/${id}`)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!course) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Empty description="课程不存在" />
        <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/courses')}>
          返回课程列表
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/courses')}
        style={{ marginBottom: 16 }}
      >
        返回课程列表
      </Button>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <div
              style={{
                height: 300,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                color: '#fff',
                marginBottom: 24
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <PlayCircleOutlined style={{ fontSize: 80, marginBottom: 16, opacity: 0.8 }} />
                <h2 style={{ color: '#fff', margin: 0 }}>课程预览</h2>
              </div>
            </div>

            <h1 style={{ marginBottom: 16 }}>{course.title}</h1>
            <p style={{ color: '#666', fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
              {course.description}
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
              <Tag color="blue">{course.category}</Tag>
              <Tag>
                <BookOutlined style={{ marginRight: 4 }} />
                {course.totalLessons || 0} 课时
              </Tag>
              <Tag>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                约 {Math.round(course.estimatedDuration / 3600) || 0} 小时
              </Tag>
              {course.difficulty && (
                <Tag color={
                  course.difficulty === 'beginner' ? 'green' :
                  course.difficulty === 'intermediate' ? 'orange' : 'red'
                }>
                  {course.difficulty === 'beginner' ? '初级' :
                   course.difficulty === 'intermediate' ? '中级' : '高级'}
                </Tag>
              )}
              {course.rating > 0 && (
                <Tag color="gold">评分: {course.rating}/5</Tag>
              )}
            </div>
          </Col>

          <Col xs={24} md={8}>
            <Card>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                {course.price === 0 ? (
                  <div style={{ fontSize: 36, color: '#52c41a', fontWeight: 'bold' }}>免费</div>
                ) : (
                  <div>
                    <span style={{ fontSize: 36, color: '#ff4d4f', fontWeight: 'bold' }}>
                      ¥{course.price}
                    </span>
                    {course.originalPrice && course.originalPrice > course.price && (
                      <span style={{ marginLeft: 8, color: '#999', textDecoration: 'line-through', fontSize: 16 }}>
                        ¥{course.originalPrice}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isEnrolled ? (
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<PlayCircleOutlined />}
                  onClick={handleStartLearning}
                >
                  开始学习
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<ShoppingCartOutlined />}
                  onClick={handleEnroll}
                >
                  {course.price === 0 ? '免费加入' : '立即购买'}
                </Button>
              )}

              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <Avatar size={48} icon={<UserOutlined />} src={course.teacher?.avatar} />
                  <div style={{ marginLeft: 12 }}>
                    <div style={{ fontWeight: 500 }}>{course.teacher?.username}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>讲师</div>
                  </div>
                </div>
                {course.teacher?.bio && (
                  <p style={{ fontSize: 12, color: '#666', margin: 0 }}>{course.teacher.bio}</p>
                )}
              </div>

              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
                <Row>
                  <Col span={12} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                      {course.totalStudents || 0}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>学习人数</div>
                  </Col>
                  <Col span={12} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                      {course.ratingCount || 0}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>评价次数</div>
                  </Col>
                </Row>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs defaultActiveKey="chapters">
          <TabPane tab="课程目录" key="chapters">
            {chapters.length > 0 ? (
              chapters.map((chapter, idx) => (
                <Card
                  key={chapter._id || idx}
                  title={
                    <span>
                      <span style={{ color: '#1890ff', marginRight: 8 }}>第{idx + 1}章</span>
                      {chapter.title}
                    </span>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <List
                    dataSource={chapter.lessons || []}
                    renderItem={(lesson, lessonIdx) => (
                      <List.Item
                        className={`lesson-item ${lesson.freePreview ? '' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <PlayCircleOutlined style={{ marginRight: 12, color: '#1890ff' }} />
                          <span>{lesson.title}</span>
                          {lesson.freePreview && (
                            <Tag color="green" style={{ marginLeft: 12 }}>免费试看</Tag>
                          )}
                        </div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          {lesson.duration ? `${Math.floor(lesson.duration / 60)}分钟` : ''}
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              ))
            ) : (
              <Empty description="暂无课程目录" />
            )}
          </TabPane>

          <TabPane tab="课程介绍" key="intro">
            <div style={{ padding: '0 24px' }}>
              <h3 style={{ marginBottom: 16 }}>课程简介</h3>
              <p style={{ lineHeight: 1.8, color: '#333' }}>{course.description}</p>

              <h3 style={{ marginTop: 32, marginBottom: 16 }}>讲师介绍</h3>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar size={64} icon={<UserOutlined />} src={course.teacher?.avatar} />
                <div style={{ marginLeft: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{course.teacher?.username}</div>
                  <div style={{ color: '#666' }}>{course.teacher?.bio}</div>
                </div>
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default CourseDetail

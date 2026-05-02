import React, { useState, useEffect } from 'react'
import { Row, Col, Card, List, Avatar, Tag, Progress, Button, message, Spin, Empty } from 'antd'
import {
  BookOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

function MyCourses() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState([])

  useEffect(() => {
    fetchMyCourses()
  }, [])

  const fetchMyCourses = async () => {
    setLoading(true)
    try {
      const res = await api.get('/courses/my')
      setCourses(res.data.courses || [])
    } catch (error) {
      console.error('获取我的课程失败:', error)
      message.error('获取我的课程失败')
    } finally {
      setLoading(false)
    }
  }

  const handleContinueLearning = (course) => {
    navigate(`/my-courses/${course._id}`)
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
        <h2 style={{ margin: 0 }}>我的课程</h2>
        <p style={{ color: '#666', marginTop: 8, marginBottom: 0 }}>
          共 {courses.length} 门课程正在学习中
        </p>
      </div>

      {courses.length > 0 ? (
        <Row gutter={[24, 24]}>
          {courses.map(course => (
            <Col xs={24} sm={12} lg={8} key={course._id}>
              <Card
                hoverable
                className="card-hover"
                onClick={() => handleContinueLearning(course)}
                cover={
                  <div
                    style={{
                      height: 160,
                      background: course.enrollment?.status === 'completed' 
                        ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      position: 'relative'
                    }}
                  >
                    <BookOutlined style={{ fontSize: 48, marginBottom: 12, opacity: 0.9 }} />
                    <span style={{ fontSize: 14, opacity: 0.9 }}>
                      {course.enrollment?.status === 'completed' ? '已完成' : '学习中'}
                    </span>
                    {course.enrollment?.status === 'completed' && (
                      <CheckCircleOutlined style={{ position: 'absolute', top: 16, right: 16, fontSize: 24, opacity: 0.9 }} />
                    )}
                  </div>
                }
              >
                <Card.Meta
                  title={
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      {course.title}
                    </div>
                  }
                  description={
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <Avatar size={20} icon={<BookOutlined />} src={course.teacher?.avatar} />
                        <span style={{ marginLeft: 8, fontSize: 12, color: '#999' }}>
                          {course.teacher?.username}
                        </span>
                      </div>
                      
                      <div style={{ marginBottom: 8 }}>
                        <Progress
                          percent={course.enrollment?.progress || 0}
                          size="small"
                          strokeColor={course.enrollment?.status === 'completed' ? '#52c41a' : '#1890ff'}
                        />
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#999' }}>
                        <span>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          进度: {course.enrollment?.progress || 0}%
                        </span>
                        <span>
                          <EyeOutlined style={{ marginRight: 4 }} />
                          {course.totalStudents || 0} 人学习
                        </span>
                      </div>

                      <Button
                        type="primary"
                        block
                        style={{ marginTop: 16 }}
                        icon={<PlayCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleContinueLearning(course)
                        }}
                      >
                        {course.enrollment?.status === 'completed' ? '复习课程' : '继续学习'}
                      </Button>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <BookOutlined style={{ fontSize: 64, color: '#999', marginBottom: 16 }} />
          <h3 style={{ color: '#666', marginBottom: 8 }}>还没有学习任何课程</h3>
          <p style={{ color: '#999', marginBottom: 24 }}>
            去课程中心选购感兴趣的课程吧
          </p>
          <Button type="primary" onClick={() => navigate('/courses')}>
            去选购课程
          </Button>
        </div>
      )}
    </div>
  )
}

export default MyCourses

import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Input, Select, Button, Tag, Avatar, Modal, message, Spin, Empty } from 'antd'
import {
  SearchOutlined,
  BookOutlined,
  ShoppingCartOutlined,
  PlayCircleOutlined,
  UserOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const { Search } = Input
const { Option } = Select
const { Meta } = Card

function CourseList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0 })
  const [filters, setFilters] = useState({ category: '', keyword: '' })
  const [categories, setCategories] = useState([])
  const [enrollModalVisible, setEnrollModalVisible] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)

  useEffect(() => {
    fetchCategories()
    fetchCourses()
  }, [filters])

  const fetchCategories = async () => {
    try {
      const res = await api.get('/courses/categories/list')
      setCategories(res.data.categories || [])
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.category && { category: filters.category }),
        ...(filters.keyword && { keyword: filters.keyword })
      }
      
      const res = await api.get('/courses', { params })
      setCourses(res.data.courses || [])
      setPagination(prev => ({
        ...prev,
        total: res.data.pagination?.total || 0,
        totalPages: res.data.pagination?.totalPages || 0
      }))
    } catch (error) {
      console.error('获取课程列表失败:', error)
      message.error('获取课程列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, keyword: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleCategoryChange = (value) => {
    setFilters(prev => ({ ...prev, category: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleCourseClick = (course) => {
    navigate(`/courses/${course._id}`)
  }

  const handleEnroll = (course) => {
    setSelectedCourse(course)
    setEnrollModalVisible(true)
  }

  const confirmEnroll = async () => {
    if (!selectedCourse) return
    
    try {
      if (selectedCourse.price === 0) {
        await api.post('/orders', { courseId: selectedCourse._id })
        message.success('课程开通成功！')
        navigate('/my-courses')
      } else {
        const orderRes = await api.post('/orders', { courseId: selectedCourse._id })
        await api.post(`/orders/${orderRes.data.order._id}/pay`)
        message.success('支付成功，课程已开通！')
        navigate('/my-courses')
      }
      setEnrollModalVisible(false)
    } catch (error) {
      console.error('购买课程失败:', error)
    }
  }

  return (
    <div>
      <div className="page-header">
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <h2 style={{ margin: 0 }}>课程中心</h2>
          </Col>
          <Col>
            <Search
              placeholder="搜索课程"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              style={{ width: 320 }}
            />
          </Col>
          <Col>
            <Select
              placeholder="选择分类"
              allowClear
              size="large"
              style={{ width: 180 }}
              value={filters.category || undefined}
              onChange={handleCategoryChange}
            >
              {categories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </div>

      <Spin spinning={loading}>
        {courses.length > 0 ? (
          <Row gutter={[24, 24]}>
            {courses.map(course => (
              <Col xs={24} sm={12} md={8} lg={6} key={course._id}>
                <Card
                  hoverable
                  className="course-card card-hover"
                  cover={
                    <div
                      style={{
                        height: 180,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff'
                      }}
                    >
                      <BookOutlined style={{ fontSize: 64, opacity: 0.8 }} />
                    </div>
                  }
                  actions={[
                    <Button
                      type="primary"
                      ghost
                      icon={<ShoppingCartOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEnroll(course)
                      }}
                    >
                      {course.price === 0 ? '免费加入' : `¥${course.price}`}
                    </Button>
                  ]}
                  onClick={() => handleCourseClick(course)}
                >
                  <Meta
                    title={
                      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                        {course.title}
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                          <Avatar size={24} icon={<UserOutlined />} src={course.teacher?.avatar} />
                          <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>
                            {course.teacher?.username}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <Tag color="blue">{course.category}</Tag>
                          <Tag>
                            <PlayCircleOutlined style={{ marginRight: 4 }} />
                            {course.totalLessons || 0} 课时
                          </Tag>
                          {course.originalPrice && course.originalPrice > course.price && (
                            <Tag color="orange">优惠</Tag>
                          )}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty
            description="暂无课程"
            style={{ padding: '100px 0' }}
          >
            <Button type="primary" onClick={() => setFilters({ category: '', keyword: '' })}>
              查看所有课程
            </Button>
          </Empty>
        )}
      </Spin>

      <Modal
        title="确认购买"
        open={enrollModalVisible}
        onOk={confirmEnroll}
        onCancel={() => setEnrollModalVisible(false)}
        okText={selectedCourse?.price === 0 ? '确认加入' : '立即支付'}
        cancelText="取消"
      >
        {selectedCourse && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 80,
                  height: 60,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  marginRight: 16
                }}
              >
                <BookOutlined style={{ fontSize: 32, color: '#fff' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, marginBottom: 4 }}>{selectedCourse.title}</h3>
                <p style={{ margin: 0, color: '#666', fontSize: 12 }}>
                  讲师：{selectedCourse.teacher?.username}
                </p>
              </div>
            </div>
            <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>课程价格</span>
                <div style={{ textAlign: 'right' }}>
                  {selectedCourse.price === 0 ? (
                    <span style={{ fontSize: 24, color: '#52c41a', fontWeight: 'bold' }}>免费</span>
                  ) : (
                    <div>
                      <span style={{ fontSize: 24, color: '#ff4d4f', fontWeight: 'bold' }}>
                        ¥{selectedCourse.price}
                      </span>
                      {selectedCourse.originalPrice && selectedCourse.originalPrice > selectedCourse.price && (
                        <span style={{ marginLeft: 8, color: '#999', textDecoration: 'line-through' }}>
                          ¥{selectedCourse.originalPrice}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CourseList

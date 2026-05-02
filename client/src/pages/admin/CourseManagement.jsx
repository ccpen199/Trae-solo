import React, { useState } from 'react'
import { Card, Table, Button, Tag, Modal, Descriptions, message, Avatar, Space, Row, Col, Statistic } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  BarChartOutlined,
  BookOutlined,
  UserOutlined,
  DollarOutlined
} from '@ant-design/icons'

function CourseManagement() {
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)

  const mockCourses = [
    {
      key: '1',
      _id: '1',
      title: 'JavaScript 从入门到精通',
      description: '本课程将带你从零开始学习 JavaScript，涵盖基础语法、函数、对象、异步编程等核心概念。',
      category: '前端开发',
      teacher: { _id: 't1', username: '张教授', avatar: '' },
      price: 299,
      originalPrice: 599,
      status: 'published',
      totalStudents: 128,
      totalLessons: 24,
      rating: 4.8,
      ratingCount: 56,
      createdAt: '2024-01-15T10:30:00Z',
      stats: {
        completionRate: 33,
        avgProgress: 45,
        totalWatchTime: 360000,
        revenue: 38272
      }
    },
    {
      key: '2',
      _id: '2',
      title: 'React 实战开发',
      description: '本课程将带你深入学习 React 框架，从基础到高级，涵盖组件开发、状态管理、路由、性能优化等核心内容。',
      category: '前端开发',
      teacher: { _id: 't1', username: '张教授', avatar: '' },
      price: 399,
      originalPrice: 699,
      status: 'published',
      totalStudents: 86,
      totalLessons: 18,
      rating: 4.9,
      ratingCount: 42,
      createdAt: '2024-02-20T14:00:00Z',
      stats: {
        completionRate: 33,
        avgProgress: 38,
        totalWatchTime: 240000,
        revenue: 34314
      }
    },
    {
      key: '3',
      _id: '3',
      title: 'Python 数据分析实战',
      description: '从零开始学习 Python 数据分析，掌握 NumPy、Pandas、Matplotlib 等核心库。',
      category: '数据科学',
      teacher: { _id: 't1', username: '张教授', avatar: '' },
      price: 349,
      originalPrice: 599,
      status: 'published',
      totalStudents: 64,
      totalLessons: 16,
      rating: 4.7,
      ratingCount: 28,
      createdAt: '2024-03-01T09:00:00Z',
      stats: {
        completionRate: 25,
        avgProgress: 30,
        totalWatchTime: 180000,
        revenue: 22336
      }
    },
    {
      key: '4',
      _id: '4',
      title: 'Vue3 高级开发',
      description: 'Vue3 高级开发课程，深入讲解 Composition API、响应式原理、性能优化等内容。',
      category: '前端开发',
      teacher: { _id: 't2', username: '李老师', avatar: '' },
      price: 349,
      originalPrice: null,
      status: 'draft',
      totalStudents: 0,
      totalLessons: 12,
      rating: 0,
      ratingCount: 0,
      createdAt: '2024-03-10T16:00:00Z',
      stats: {
        completionRate: 0,
        avgProgress: 0,
        totalWatchTime: 0,
        revenue: 0
      }
    }
  ]

  const columns = [
    {
      title: '课程',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 60,
              height: 45,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}
          >
            <BookOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{record.category}</div>
          </div>
        </div>
      )
    },
    {
      title: '讲师',
      dataIndex: ['teacher', 'username'],
      key: 'teacher',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={24}>{text?.charAt(0)}</Avatar>
          <span>{text}</span>
        </div>
      )
    },
    {
      title: '价格',
      key: 'price',
      render: (_, record) => (
        <div>
          {record.price > 0 ? (
            <div>
              <span style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: 16 }}>¥{record.price}</span>
              {record.originalPrice && (
                <span style={{ marginLeft: 8, color: '#999', textDecoration: 'line-through' }}>
                  ¥{record.originalPrice}
                </span>
              )}
            </div>
          ) : (
            <span style={{ color: '#52c41a', fontWeight: 'bold' }}>免费</span>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'published' ? 'success' : 'default'}>
          {status === 'published' ? '已发布' : '草稿'}
        </Tag>
      )
    },
    {
      title: '学习数据',
      key: 'stats',
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 12 }}>
            学员：{record.totalStudents} 人
          </div>
          <div style={{ fontSize: 12, color: '#999' }}>
            完课率：{record.stats?.completionRate || 0}%
          </div>
        </div>
      )
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating, record) => (
        <div>
          {rating > 0 ? (
            <div>
              <span style={{ color: '#faad14', fontWeight: 'bold' }}>{rating}</span>
              <span style={{ marginLeft: 4, color: '#999', fontSize: 12 }}>
                ({record.ratingCount}人评价)
              </span>
            </div>
          ) : (
            <span style={{ color: '#999' }}>暂无评分</span>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewCourse(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<BarChartOutlined />}
            onClick={() => viewStats(record)}
          >
            统计
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
          >
            编辑
          </Button>
        </Space>
      )
    }
  ]

  const viewCourse = (course) => {
    setSelectedCourse(course)
    setModalVisible(true)
  }

  const viewStats = (course) => {
    message.info('统计功能开发中...')
  }

  const totalStats = {
    totalCourses: mockCourses.length,
    publishedCourses: mockCourses.filter(c => c.status === 'published').length,
    totalStudents: mockCourses.reduce((sum, c) => sum + c.totalStudents, 0),
    totalRevenue: mockCourses.reduce((sum, c) => sum + (c.stats?.revenue || 0), 0)
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>课程管理</h2>
          <p style={{ color: '#666', marginTop: 8, marginBottom: 0 }}>
            总课程：{totalStats.totalCourses} | 已发布：{totalStats.publishedCourses} | 
            总学员：{totalStats.totalStudents} | 总收入：¥{totalStats.totalRevenue.toLocaleString()}
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />}>
          创建课程
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={mockCourses}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="课程详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={null}
      >
        {selectedCourse && (
          <div>
            <Row gutter={[24, 16]} style={{ marginBottom: 24 }}>
              <Col xs={12} sm={6}>
                <Card className="stat-card blue">
                  <Statistic
                    title="学员数"
                    value={selectedCourse.totalStudents}
                    prefix={<UserOutlined style={{ color: '#1890ff' }} />}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="stat-card green">
                  <Statistic
                    title="完课率"
                    value={selectedCourse.stats?.completionRate || 0}
                    suffix="%"
                    prefix={<BookOutlined style={{ color: '#52c41a' }} />}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="stat-card orange">
                  <Statistic
                    title="总收入"
                    value={selectedCourse.stats?.revenue || 0}
                    prefix="¥"
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={6}>
                <Card className="stat-card purple">
                  <Statistic
                    title="评分"
                    value={selectedCourse.rating || 0}
                    suffix={selectedCourse.ratingCount > 0 ? `/${selectedCourse.ratingCount}人` : ''}
                    prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
                  />
                </Card>
              </Col>
            </Row>

            <Descriptions title="基本信息" column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="课程名称">{selectedCourse.title}</Descriptions.Item>
              <Descriptions.Item label="分类">{selectedCourse.category}</Descriptions.Item>
              <Descriptions.Item label="讲师">{selectedCourse.teacher?.username}</Descriptions.Item>
              <Descriptions.Item label="课时数">{selectedCourse.totalLessons} 节</Descriptions.Item>
              <Descriptions.Item label="价格">
                {selectedCourse.price > 0 ? (
                  <div>
                    <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{selectedCourse.price}</span>
                    {selectedCourse.originalPrice && (
                      <span style={{ marginLeft: 8, color: '#999', textDecoration: 'line-through' }}>
                        ¥{selectedCourse.originalPrice}
                      </span>
                    )}
                  </div>
                ) : (
                  <span style={{ color: '#52c41a', fontWeight: 'bold' }}>免费</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedCourse.status === 'published' ? 'success' : 'default'}>
                  {selectedCourse.status === 'published' ? '已发布' : '草稿'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {new Date(selectedCourse.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginBottom: 12 }}>课程简介</h4>
            <Card size="small" style={{ background: '#fafafa' }}>
              <p style={{ margin: 0, lineHeight: 1.8 }}>{selectedCourse.description}</p>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CourseManagement

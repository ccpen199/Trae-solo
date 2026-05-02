import React from 'react'
import { Card, List, Button, Tag, Empty, Space, message } from 'antd'
import { PlusOutlined, EditOutlined, BarChartOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

function CourseManagement() {
  const navigate = useNavigate()

  const mockCourses = [
    {
      _id: '1',
      title: 'JavaScript 从入门到精通',
      status: 'published',
      totalStudents: 128,
      totalLessons: 24,
      price: 299,
      createdAt: '2024-01-15'
    },
    {
      _id: '2',
      title: 'React 实战开发',
      status: 'published',
      totalStudents: 86,
      totalLessons: 18,
      price: 399,
      createdAt: '2024-02-20'
    },
    {
      _id: '3',
      title: 'Vue3 高级开发',
      status: 'draft',
      totalStudents: 0,
      totalLessons: 12,
      price: 349,
      createdAt: '2024-03-10'
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>课程管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/courses/create')}>
          创建课程
        </Button>
      </div>

      <Card>
        <List
          dataSource={mockCourses}
          renderItem={(course) => (
            <List.Item
              actions={[
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/courses/edit/${course._id}`)}>
                  编辑
                </Button>,
                <Button type="link" size="small" icon={<BarChartOutlined />} onClick={() => message.info('统计功能开发中...')}>
                  统计
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 500 }}>{course.title}</span>
                    <Tag color={course.status === 'published' ? 'success' : 'default'}>
                      {course.status === 'published' ? '已发布' : '草稿'}
                    </Tag>
                  </div>
                }
                description={
                  <div style={{ marginTop: 8, color: '#999', fontSize: 13 }}>
                    <span>学习人数：{course.totalStudents}</span>
                    <span style={{ marginLeft: 24 }}>课时数：{course.totalLessons}</span>
                    <span style={{ marginLeft: 24, color: course.price > 0 ? '#ff4d4f' : '#52c41a' }}>
                      价格：{course.price > 0 ? `¥${course.price}` : '免费'}
                    </span>
                    <span style={{ marginLeft: 24 }}>创建时间：{course.createdAt}</span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default CourseManagement

import React from 'react'
import { Card, List, Button, Tag, Empty, Space, message } from 'antd'
import { PlusOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

function AssignmentManagement() {
  const navigate = useNavigate()

  const mockAssignments = [
    {
      _id: '1',
      title: 'JavaScript 第一章课后作业',
      courseTitle: 'JavaScript 从入门到精通',
      type: 'homework',
      status: 'published',
      totalScore: 100,
      submittedCount: 45,
      gradedCount: 38,
      endDate: '2024-04-30'
    },
    {
      _id: '2',
      title: 'React 组件开发测验',
      courseTitle: 'React 实战开发',
      type: 'quiz',
      status: 'published',
      totalScore: 50,
      submittedCount: 32,
      gradedCount: 32,
      endDate: '2024-04-25'
    },
    {
      _id: '3',
      title: 'JavaScript 综合应用考试',
      courseTitle: 'JavaScript 从入门到精通',
      type: 'exam',
      status: 'draft',
      totalScore: 100,
      submittedCount: 0,
      gradedCount: 0,
      endDate: null
    }
  ]

  const getTypeText = (type) => {
    switch (type) {
      case 'exam': return '考试'
      case 'quiz': return '测验'
      default: return '作业'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'exam': return 'red'
      case 'quiz': return 'orange'
      default: return 'blue'
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>作业管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/assignments/create')}>
          发布作业
        </Button>
      </div>

      <Card>
        <List
          dataSource={mockAssignments}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/assignments/${item._id}/submissions`)}>
                  查看提交 ({item.submittedCount})
                </Button>,
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/assignments/edit/${item._id}`)}>
                  编辑
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 500 }}>{item.title}</span>
                    <Tag color={getTypeColor(item.type)}>{getTypeText(item.type)}</Tag>
                    <Tag color={item.status === 'published' ? 'success' : 'default'}>
                      {item.status === 'published' ? '已发布' : '草稿'}
                    </Tag>
                  </div>
                }
                description={
                  <div style={{ marginTop: 8, color: '#999', fontSize: 13 }}>
                    <span>所属课程：{item.courseTitle}</span>
                    <span style={{ marginLeft: 24 }}>总分：{item.totalScore}分</span>
                    <span style={{ marginLeft: 24, color: '#1890ff' }}>
                      已提交：{item.submittedCount} / 已批改：{item.gradedCount}
                    </span>
                    {item.endDate && (
                      <span style={{ marginLeft: 24 }}>截止时间：{item.endDate}</span>
                    )}
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

export default AssignmentManagement

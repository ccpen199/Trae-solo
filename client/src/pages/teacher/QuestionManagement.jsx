import React from 'react'
import { Card, List, Button, Tag, Empty, Space, message } from 'antd'
import { MessageOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

function QuestionManagement() {
  const navigate = useNavigate()

  const mockQuestions = [
    {
      _id: '1',
      title: 'var 和 let 的区别是什么？',
      courseTitle: 'JavaScript 从入门到精通',
      user: '王学员',
      status: 'open',
      views: 128,
      answerCount: 3,
      likeCount: 8,
      createdAt: '2024-04-28T10:30:00Z'
    },
    {
      _id: '2',
      title: 'React 中如何处理表单数据？',
      courseTitle: 'React 实战开发',
      user: '李学员',
      status: 'resolved',
      views: 256,
      answerCount: 5,
      likeCount: 15,
      createdAt: '2024-04-25T08:15:00Z'
    },
    {
      _id: '3',
      title: 'Pandas 如何进行数据合并？',
      courseTitle: 'Python 数据分析实战',
      user: '张学员',
      status: 'open',
      views: 64,
      answerCount: 0,
      likeCount: 2,
      createdAt: '2024-04-27T14:20:00Z'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'success'
      case 'closed': return 'default'
      default: return 'processing'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'resolved': return '已解决'
      case 'closed': return '已关闭'
      default: return '待回答'
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>答疑管理</h2>
      </div>

      <Card>
        <List
          dataSource={mockQuestions}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => message.info('问题详情功能开发中...')}>
                  查看详情
                </Button>
              ]}
              style={{ cursor: 'pointer' }}
            >
              <List.Item.Meta
                avatar={<MessageOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 500 }}>{item.title}</span>
                    <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                  </div>
                }
                description={
                  <div style={{ marginTop: 8, color: '#999', fontSize: 13 }}>
                    <span>课程：{item.courseTitle}</span>
                    <span style={{ marginLeft: 24 }}>提问者：{item.user}</span>
                    <span style={{ marginLeft: 24 }}>{dayjs(item.createdAt).fromNow()}</span>
                    <span style={{ marginLeft: 24, color: '#1890ff' }}>
                      {item.views} 浏览 · {item.answerCount} 回答 · {item.likeCount} 点赞
                    </span>
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

export default QuestionManagement

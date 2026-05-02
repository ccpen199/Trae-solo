import React, { useState } from 'react'
import { Card, List, Button, Tag, Avatar, Input, message, Modal, Form, Descriptions, Space } from 'antd'
import {
  MessageOutlined,
  EyeOutlined,
  SendOutlined,
  UserOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { TextArea } = Input

function QuestionAnswer() {
  const navigate = useNavigate()
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const mockQuestions = [
    {
      _id: '1',
      title: 'var 和 let 的区别是什么？',
      content: '我在学习 JavaScript 变量声明时，遇到了 var、let、const 三种方式，请问它们之间有什么区别？什么时候应该使用哪种？',
      course: { _id: 'c1', title: 'JavaScript 从入门到精通' },
      user: { _id: 'u1', username: '王学员', avatar: '' },
      status: 'open',
      views: 128,
      likeCount: 8,
      answerCount: 3,
      createdAt: '2024-04-28T10:30:00Z',
      tags: ['JavaScript', '变量', '基础'],
      answers: [
        {
          _id: 'a1',
          user: { _id: 't1', username: '张教授', avatar: '' },
          content: '这是一个非常好的问题！var、let、const 的主要区别在于作用域和可变性...',
          likeCount: 5,
          isAccepted: true,
          createdAt: '2024-04-28T11:00:00Z'
        },
        {
          _id: 'a2',
          user: { _id: 'u2', username: '李学员', avatar: '' },
          content: '我补充一下，var 存在变量提升，而 let 和 const 不存在...',
          likeCount: 2,
          isAccepted: false,
          createdAt: '2024-04-28T12:00:00Z'
        }
      ]
    },
    {
      _id: '2',
      title: 'React 中如何处理表单数据？',
      content: '我正在学习 React 表单处理，请问受控组件和非受控组件有什么区别？应该如何选择？',
      course: { _id: 'c2', title: 'React 实战开发' },
      user: { _id: 'u3', username: '张学员', avatar: '' },
      status: 'open',
      views: 64,
      likeCount: 3,
      answerCount: 0,
      createdAt: '2024-04-27T14:20:00Z',
      tags: ['React', '表单', '受控组件'],
      answers: []
    },
    {
      _id: '3',
      title: 'Pandas 如何进行数据合并？',
      content: '我想知道 Pandas 中 merge、join、concat 这三种数据合并方式有什么区别？分别适用于什么场景？',
      course: { _id: 'c3', title: 'Python 数据分析实战' },
      user: { _id: 'u4', username: '赵学员', avatar: '' },
      status: 'resolved',
      views: 256,
      likeCount: 15,
      answerCount: 5,
      createdAt: '2024-04-25T08:15:00Z',
      tags: ['Python', 'Pandas', '数据处理'],
      answers: []
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

  const viewQuestion = (question) => {
    setSelectedQuestion(question)
    setModalVisible(true)
  }

  const handleAddAnswer = async (values) => {
    try {
      message.success('回答成功！')
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('回答失败:', error)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>答疑回复</h2>
        <p style={{ color: '#666', marginTop: 8, marginBottom: 0 }}>
          共 {mockQuestions.length} 个问题，待回答：{mockQuestions.filter(q => q.status === 'open').length} 个
        </p>
      </div>

      <Card>
        <List
          dataSource={mockQuestions}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => viewQuestion(item)}
                >
                  查看详情
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<MessageOutlined style={{ fontSize: 28, color: '#722ed1' }} />}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontWeight: 500 }}>{item.title}</span>
                    <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginTop: 4, marginBottom: 8, color: '#666' }}>
                      {item.content?.substring(0, 100)}{item.content?.length > 100 ? '...' : ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#999' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Avatar size={18}>{item.user?.username?.charAt(0)}</Avatar>
                        {item.user?.username}
                      </span>
                      <span>{item.course?.title}</span>
                      <span>{dayjs(item.createdAt).fromNow()}</span>
                      <span>{item.views} 浏览</span>
                      <span>{item.answerCount} 回答</span>
                    </div>
                    {item.tags?.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {item.tags.map((tag, idx) => (
                          <Tag key={idx} color="blue" style={{ marginRight: 4 }}>{tag}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="问题详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={null}
      >
        {selectedQuestion && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <Avatar size={40} icon={<UserOutlined />} src={selectedQuestion.user?.avatar} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <h3 style={{ margin: 0 }}>{selectedQuestion.title}</h3>
                    <Tag color={getStatusColor(selectedQuestion.status)}>
                      {getStatusText(selectedQuestion.status)}
                    </Tag>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#999', fontSize: 13 }}>
                    <span>{selectedQuestion.user?.username}</span>
                    <span>{selectedQuestion.course?.title}</span>
                    <span>{dayjs(selectedQuestion.createdAt).fromNow()}</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8, marginBottom: 12 }}>
                <p style={{ margin: 0, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{selectedQuestion.content}</p>
              </div>

              {selectedQuestion.tags?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {selectedQuestion.tags.map((tag, idx) => (
                    <Tag key={idx} color="blue">{tag}</Tag>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 24, color: '#999', fontSize: 13 }}>
                <span>{selectedQuestion.views} 浏览</span>
                <span>{selectedQuestion.likeCount} 点赞</span>
                <span>{selectedQuestion.answerCount} 回答</span>
              </div>
            </div>

            {selectedQuestion.answers?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ marginBottom: 16 }}>回答 ({selectedQuestion.answers.length})</h4>
                {selectedQuestion.answers.map((answer, idx) => (
                  <div
                    key={answer._id || idx}
                    style={{
                      marginBottom: 16,
                      padding: 16,
                      background: answer.isAccepted ? '#f6ffed' : '#fafafa',
                      borderRadius: 8,
                      borderLeft: `3px solid ${answer.isAccepted ? '#52c41a' : '#1890ff'}`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <Avatar size={32} icon={<UserOutlined />} src={answer.user?.avatar} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 500 }}>{answer.user?.username}</span>
                          {answer.isAccepted && (
                            <Tag color="success">已采纳</Tag>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {dayjs(answer.createdAt).fromNow()}
                        </div>
                      </div>
                    </div>
                    <p style={{ margin: 0, lineHeight: 1.8 }}>{answer.content}</p>
                    <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                      {answer.likeCount} 点赞
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
              <h4 style={{ marginBottom: 16 }}>我来回答</h4>
              <Form form={form} layout="vertical" onFinish={handleAddAnswer}>
                <Form.Item
                  name="content"
                  rules={[{ required: true, message: '请输入回答内容' }]}
                >
                  <TextArea rows={4} placeholder="写下你的回答..." />
                </Form.Item>
                <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                  <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                    提交回答
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default QuestionAnswer

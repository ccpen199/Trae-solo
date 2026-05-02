import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Tag, Avatar, Input, message, Spin, Empty, Descriptions, Divider, Form, List } from 'antd'
import {
  ArrowLeftOutlined,
  MessageOutlined,
  EyeOutlined,
  LikeOutlined,
  CheckCircleOutlined,
  UserOutlined,
  SendOutlined
} from '@ant-design/icons'
import api from '../../services/api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { TextArea } = Input

function QuestionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [question, setQuestion] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchQuestionDetail()
  }, [id])

  const fetchQuestionDetail = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/questions/${id}`)
      setQuestion(res.data.question)
    } catch (error) {
      console.error('获取问题详情失败:', error)
      message.error('获取问题详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAnswer = async (values) => {
    try {
      await api.post(`/questions/${id}/answers`, {
        content: values.content
      })
      message.success('回答成功！')
      form.resetFields()
      fetchQuestionDetail()
    } catch (error) {
      console.error('回答失败:', error)
    }
  }

  const handleLikeQuestion = async () => {
    try {
      await api.post(`/questions/${id}/like`)
      message.success('操作成功')
      fetchQuestionDetail()
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  const handleAcceptAnswer = async (answerId) => {
    try {
      await api.post(`/questions/${id}/answers/${answerId}/accept`)
      message.success('采纳成功！')
      fetchQuestionDetail()
    } catch (error) {
      console.error('采纳失败:', error)
    }
  }

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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!question) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Empty description="问题不存在" />
        <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/questions')}>
          返回答疑社区
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/questions')}
        style={{ marginBottom: 24 }}
      >
        返回答疑社区
      </Button>

      <Card>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
            <Avatar size={48} icon={<UserOutlined />} src={question.user?.avatar} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>{question.title}</h3>
                <Tag color={getStatusColor(question.status)}>{getStatusText(question.status)}</Tag>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#999', fontSize: 13 }}>
                <span>提问者：{question.user?.username}</span>
                <span>{dayjs(question.createdAt).fromNow()}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8, marginBottom: 16 }}>
            <p style={{ margin: 0, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{question.content}</p>
          </div>

          {question.tags?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {question.tags.map((tag, idx) => (
                <Tag key={idx} color="blue">{tag}</Tag>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 24, color: '#999', fontSize: 13 }}>
            <span>
              <EyeOutlined style={{ marginRight: 4 }} />
              {question.views || 0} 浏览
            </span>
            <span style={{ cursor: 'pointer' }} onClick={handleLikeQuestion}>
              <LikeOutlined style={{ marginRight: 4 }} />
              {question.likeCount || 0} 点赞
            </span>
            <span>
              <MessageOutlined style={{ marginRight: 4 }} />
              {question.answerCount || 0} 回答
            </span>
          </div>
        </div>

        <Divider orientation="left">回答 ({question.answers?.length || 0})</Divider>

        {question.answers?.length > 0 ? (
          <div>
            {question.answers.map((answer, idx) => (
              <div
                key={answer._id || idx}
                className={`answer-card ${answer.isAccepted ? 'accepted' : ''}`}
                style={{ marginBottom: 16 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <Avatar size={36} icon={<UserOutlined />} src={answer.user?.avatar} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{answer.user?.username}</span>
                      {answer.isAccepted && (
                        <Tag color="success" icon={<CheckCircleOutlined />}>已采纳</Tag>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: '#999' }}>
                      {dayjs(answer.createdAt).fromNow()}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: 12, paddingLeft: 48 }}>
                  <p style={{ margin: 0, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{answer.content}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 48 }}>
                  <div style={{ display: 'flex', gap: 16, color: '#999', fontSize: 13 }}>
                    <span>
                      <LikeOutlined style={{ marginRight: 4 }} />
                      {answer.likeCount || 0}
                    </span>
                  </div>
                  {!answer.isAccepted && question.status !== 'resolved' && (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => handleAcceptAnswer(answer._id)}
                    >
                      采纳答案
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <MessageOutlined style={{ fontSize: 48, color: '#999', marginBottom: 16 }} />
            <p style={{ color: '#999', margin: 0 }}>暂无回答，快来抢沙发吧！</p>
          </div>
        )}

        <Divider />

        <div style={{ marginTop: 24 }}>
          <h4 style={{ marginBottom: 16 }}>我来回答</h4>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddAnswer}
          >
            <Form.Item
              name="content"
              rules={[{ required: true, message: '请输入回答内容' }]}
            >
              <TextArea
                rows={4}
                placeholder="写下你的回答..."
              />
            </Form.Item>
            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                提交回答
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Card>
    </div>
  )
}

export default QuestionDetail

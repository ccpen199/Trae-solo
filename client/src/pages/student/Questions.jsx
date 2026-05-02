import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, List, Tag, Avatar, Input, message, Spin, Empty, Modal, Form, Select } from 'antd'
import {
  MessageOutlined,
  LikeOutlined,
  EyeOutlined,
  PlusOutlined,
  UserOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Search } = Input
const { TextArea } = Input
const { Option } = Select

function Questions() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState([])
  const [myQuestions, setMyQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [myCourses, setMyCourses] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    fetchMyCourses()
    fetchQuestions()
  }, [])

  const fetchMyCourses = async () => {
    try {
      const res = await api.get('/courses/my')
      setMyCourses(res.data.courses || [])
    } catch (error) {
      console.error('获取我的课程失败:', error)
    }
  }

  const fetchQuestions = async () => {
    setLoading(true)
    try {
      const [allRes, myRes] = await Promise.all([
        api.get('/questions'),
        api.get('/questions/my')
      ])
      setQuestions(allRes.data.questions || [])
      setMyQuestions(myRes.data.questions || [])
    } catch (error) {
      console.error('获取问题列表失败:', error)
      message.error('获取问题列表失败')
    } finally {
      setLoading(false)
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

  const handleViewDetail = async (item) => {
    try {
      const res = await api.get(`/questions/${item._id}`)
      setSelectedQuestion(res.data.question)
      setShowDetail(true)
    } catch (error) {
      console.error('获取问题详情失败:', error)
    }
  }

  const handleCreateQuestion = async (values) => {
    try {
      await api.post('/questions', {
        courseId: values.courseId,
        title: values.title,
        content: values.content,
        tags: values.tags?.split(',').map(t => t.trim()).filter(t => t) || []
      })
      message.success('提问成功！')
      setShowCreate(false)
      form.resetFields()
      fetchQuestions()
    } catch (error) {
      console.error('提问失败:', error)
    }
  }

  const handleAddAnswer = async (values) => {
    if (!selectedQuestion) return
    
    try {
      await api.post(`/questions/${selectedQuestion._id}/answers`, {
        content: values.content
      })
      message.success('回答成功！')
      
      const res = await api.get(`/questions/${selectedQuestion._id}`)
      setSelectedQuestion(res.data.question)
      form.resetFields()
    } catch (error) {
      console.error('回答失败:', error)
    }
  }

  const handleLikeQuestion = async () => {
    if (!selectedQuestion) return
    
    try {
      await api.post(`/questions/${selectedQuestion._id}/like`)
      
      const res = await api.get(`/questions/${selectedQuestion._id}`)
      setSelectedQuestion(res.data.question)
    } catch (error) {
      console.error('点赞失败:', error)
    }
  }

  const handleAcceptAnswer = async (answerId) => {
    if (!selectedQuestion) return
    
    try {
      await api.post(`/questions/${selectedQuestion._id}/answers/${answerId}/accept`)
      message.success('采纳成功！')
      
      const res = await api.get(`/questions/${selectedQuestion._id}`)
      setSelectedQuestion(res.data.question)
    } catch (error) {
      console.error('采纳失败:', error)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>答疑社区</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
          我要提问
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="热门问题">
            <QuestionList
              questions={questions}
              loading={loading}
              onViewDetail={handleViewDetail}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="我的提问" style={{ marginBottom: 16 }}>
            {myQuestions.length > 0 ? (
              <List
                size="small"
                dataSource={myQuestions.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleViewDetail(item)}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 14 }}>{item.title}</span>
                          <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                        </div>
                      }
                      description={
                        <span style={{ fontSize: 12, color: '#999' }}>
                          {dayjs(item.createdAt).fromNow()} · {item.answerCount || 0} 回答
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无提问" />
            )}
          </Card>

          <Card title="热门标签">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['JavaScript', 'React', 'Vue', 'CSS', '算法', '面试', 'Python', '数据结构'].map(tag => (
                <Tag key={tag} color="blue" style={{ cursor: 'pointer' }}>
                  {tag}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title="我要提问"
        open={showCreate}
        onCancel={() => setShowCreate(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateQuestion}
        >
          <Form.Item
            name="courseId"
            label="选择课程"
            rules={[{ required: true, message: '请选择课程' }]}
          >
            <Select placeholder="请选择相关课程">
              {myCourses.map(course => (
                <Option key={course._id} value={course._id}>
                  {course.title}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="问题标题"
            rules={[{ required: true, message: '请输入问题标题' }]}
          >
            <Input placeholder="请简要描述你的问题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="问题详情"
            rules={[{ required: true, message: '请输入问题详情' }]}
          >
            <TextArea
              rows={6}
              placeholder="请详细描述你的问题，以便获得更好的回答"
            />
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签（多个标签用逗号分隔）"
          >
            <Input placeholder="例如：JavaScript, React, 前端" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setShowCreate(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              提交问题
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>{selectedQuestion?.title}</span>
            <Tag color={getStatusColor(selectedQuestion?.status)}>
              {getStatusText(selectedQuestion?.status)}
            </Tag>
          </div>
        }
        open={showDetail}
        onCancel={() => setShowDetail(false)}
        width={800}
        footer={null}
      >
        {selectedQuestion && (
          <div>
            <div className="question-card">
              <div className="question-header">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar icon={<UserOutlined />} src={selectedQuestion.user?.avatar} />
                  <div style={{ marginLeft: 12 }}>
                    <div style={{ fontWeight: 500 }}>{selectedQuestion.user?.username}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {dayjs(selectedQuestion.createdAt).fromNow()}
                    </div>
                  </div>
                </div>
                {selectedQuestion.tags?.length > 0 && (
                  <div>
                    {selectedQuestion.tags.map(tag => (
                      <Tag key={tag} color="blue" style={{ marginLeft: 4 }}>{tag}</Tag>
                    ))}
                  </div>
                )}
              </div>

              <div className="question-content">
                <p style={{ margin: 0, lineHeight: 1.8 }}>{selectedQuestion.content}</p>
              </div>

              <div className="question-footer">
                <span><EyeOutlined style={{ marginRight: 4 }} />{selectedQuestion.views || 0} 浏览</span>
                <span onClick={handleLikeQuestion} style={{ cursor: 'pointer' }}>
                  <LikeOutlined style={{ marginRight: 4 }} />{selectedQuestion.likeCount || 0} 点赞
                </span>
                <span><MessageOutlined style={{ marginRight: 4 }} />{selectedQuestion.answerCount || 0} 回答</span>
              </div>
            </div>

            <h3 style={{ margin: '24px 0 16px' }}>
              回答 ({selectedQuestion.answers?.length || 0})
            </h3>

            {selectedQuestion.answers?.length > 0 ? (
              <div>
                {selectedQuestion.answers.map((answer) => (
                  <div
                    key={answer._id}
                    className={`answer-card ${answer.isAccepted ? 'accepted' : ''}`}
                  >
                    <div className="answer-header">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar icon={<UserOutlined />} src={answer.user?.avatar} />
                        <div style={{ marginLeft: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 500 }}>{answer.user?.username}</span>
                            {answer.isAccepted && (
                              <Tag color="success" icon={<CheckCircleOutlined />}>
                                已采纳
                              </Tag>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: '#999' }}>
                            {dayjs(answer.createdAt).fromNow()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="answer-content">
                      <p style={{ margin: 0, lineHeight: 1.8 }}>{answer.content}</p>
                    </div>

                    <div className="answer-footer">
                      <span><LikeOutlined style={{ marginRight: 4 }} />{answer.likeCount || 0}</span>
                      {!answer.isAccepted && 
                       selectedQuestion.user?._id?.toString() === selectedQuestion.answers?.[0]?.user?._id?.toString() && (
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
              <Empty description="暂无回答，快来抢沙发吧！" />
            )}

            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
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
                  <Button type="primary" htmlType="submit">
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

function QuestionList({ questions, loading, onViewDetail, getStatusColor, getStatusText }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (questions.length === 0) {
    return <Empty description="暂无问题" />
  }

  return (
    <List
      dataSource={questions}
      renderItem={(item) => (
        <List.Item
          className="question-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onViewDetail(item)}
        >
          <List.Item.Meta
            avatar={<Avatar icon={<QuestionCircleOutlined />} src={item.user?.avatar} />}
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 500, fontSize: 15 }}>{item.title}</span>
                  <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                </div>
                <div style={{ fontSize: 12, color: '#999' }}>
                  {dayjs(item.createdAt).fromNow()}
                </div>
              </div>
            }
            description={
              <div>
                <div style={{ marginBottom: 8, color: '#666' }}>
                  {item.content?.substring(0, 150)}{item.content?.length > 150 ? '...' : ''}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#999' }}>
                  <span><EyeOutlined style={{ marginRight: 4 }} />{item.views || 0}</span>
                  <span><LikeOutlined style={{ marginRight: 4 }} />{item.likeCount || 0}</span>
                  <span><MessageOutlined style={{ marginRight: 4 }} />{item.answerCount || 0}</span>
                  {item.user?.username && (
                    <span><UserOutlined style={{ marginRight: 4 }} />{item.user.username}</span>
                  )}
                </div>
              </div>
            }
          />
        </List.Item>
      )}
    />
  )
}

export default Questions

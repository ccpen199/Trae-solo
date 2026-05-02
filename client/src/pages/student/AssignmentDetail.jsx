import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Tag, Progress, List, Avatar, message, Spin, Empty, Descriptions, Divider, Form, Input, Radio, Checkbox } from 'antd'
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SaveOutlined
} from '@ant-design/icons'
import api from '../../services/api'

function AssignmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [assignment, setAssignment] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchAssignmentDetail()
  }, [id])

  const fetchAssignmentDetail = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/assignments/${id}`)
      setAssignment(res.data.assignment)
      setSubmission(res.data.submission)
    } catch (error) {
      console.error('获取作业详情失败:', error)
      message.error('获取作业详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (values) => {
    try {
      const answers = Object.entries(values).map(([key, value]) => ({
        questionId: key,
        answer: value
      }))

      await api.post(`/assignments/${id}/submit`, { answers })
      message.success('提交成功！')
      fetchAssignmentDetail()
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'graded': return 'success'
      case 'submitted': return 'processing'
      case 'draft': return 'default'
      default: return 'warning'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'graded': return '已批改'
      case 'submitted': return '已提交'
      case 'draft': return '草稿'
      default: return '待提交'
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Empty description="作业不存在" />
        <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/assignments')}>
          返回作业列表
        </Button>
      </div>
    )
  }

  const canSubmit = !submission || submission.status === 'draft'
  const showAnswers = submission?.status === 'graded'

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/assignments')}
        style={{ marginBottom: 24 }}
      >
        返回作业列表
      </Button>

      <Card>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <FileTextOutlined style={{ fontSize: 32, color: '#1890ff' }} />
            <div>
              <h2 style={{ margin: 0, marginBottom: 4 }}>{assignment.title}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <Tag color={getTypeColor(assignment.type)}>{getTypeText(assignment.type)}</Tag>
                {submission && (
                  <Tag color={getStatusColor(submission.status)}>{getStatusText(submission.status)}</Tag>
                )}
              </div>
            </div>
          </div>

          <Descriptions size="small" column={4}>
            <Descriptions.Item label="总分">{assignment.totalScore || 0}分</Descriptions.Item>
            <Descriptions.Item label="及格分">{assignment.passingScore || 60}分</Descriptions.Item>
            {submission?.totalScore !== null && submission?.totalScore !== undefined && (
              <Descriptions.Item label="我的得分">
                <span style={{ 
                  color: submission.totalScore >= (assignment.passingScore || 60) ? '#52c41a' : '#ff4d4f',
                  fontWeight: 'bold'
                }}>
                  {submission.totalScore}分
                </span>
              </Descriptions.Item>
            )}
            {assignment.endDate && (
              <Descriptions.Item label="截止时间">
                {new Date(assignment.endDate).toLocaleString()}
              </Descriptions.Item>
            )}
          </Descriptions>

          {assignment.description && (
            <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              <h4 style={{ marginBottom: 8 }}>作业说明</h4>
              <p style={{ margin: 0, color: '#666' }}>{assignment.description}</p>
            </div>
          )}
        </div>

        <Divider />

        {canSubmit ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            {assignment.questions?.map((question, idx) => (
              <div key={question._id || idx} className="question-item">
                <div style={{ marginBottom: 12 }}>
                  <span className="question-number">{idx + 1}.</span>
                  <span style={{ fontWeight: 500 }}>{question.content}</span>
                  <Tag style={{ marginLeft: 8 }}>
                    {question.type === 'single_choice' ? '单选题' :
                     question.type === 'multiple_choice' ? '多选题' :
                     question.type === 'true_false' ? '判断题' : '简答题'}
                  </Tag>
                  <Tag color="orange" style={{ marginLeft: 8 }}>{question.score}分</Tag>
                </div>

                {question.type === 'single_choice' && (
                  <Form.Item
                    name={question._id?.toString() || `q${idx}`}
                    rules={[{ required: true, message: '请选择答案' }]}
                  >
                    <Radio.Group>
                      {question.options?.map((option, optIdx) => (
                        <Radio value={option} key={optIdx} style={{ display: 'block', marginBottom: 8 }}>
                          {String.fromCharCode(65 + optIdx)}. {option}
                        </Radio>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                )}

                {question.type === 'multiple_choice' && (
                  <Form.Item
                    name={question._id?.toString() || `q${idx}`}
                    rules={[{ required: true, message: '请选择答案' }]}
                  >
                    <Checkbox.Group>
                      {question.options?.map((option, optIdx) => (
                        <Checkbox value={option} key={optIdx} style={{ display: 'block', marginBottom: 8 }}>
                          {String.fromCharCode(65 + optIdx)}. {option}
                        </Checkbox>
                      ))}
                    </Checkbox.Group>
                  </Form.Item>
                )}

                {question.type === 'true_false' && (
                  <Form.Item
                    name={question._id?.toString() || `q${idx}`}
                    rules={[{ required: true, message: '请选择答案' }]}
                  >
                    <Radio.Group>
                      <Radio value="正确">正确</Radio>
                      <Radio value="错误">错误</Radio>
                    </Radio.Group>
                  </Form.Item>
                )}

                {question.type === 'essay' && (
                  <Form.Item
                    name={question._id?.toString() || `q${idx}`}
                    rules={[{ required: true, message: '请输入答案' }]}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="请输入你的答案..."
                    />
                  </Form.Item>
                )}
              </div>
            ))}

            <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} size="large">
                提交作业
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <div>
            {submission?.status === 'submitted' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <ClockCircleOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                <h3 style={{ marginBottom: 8 }}>作业已提交</h3>
                <p style={{ color: '#999', margin: 0 }}>等待老师批改中...</p>
              </div>
            )}

            {submission?.status === 'graded' && (
              <div>
                <div style={{ textAlign: 'center', padding: '24px 0', marginBottom: 24, background: '#f6ffed', borderRadius: 8 }}>
                  <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 12 }} />
                  <h3 style={{ marginBottom: 8 }}>批改完成</h3>
                  <div style={{ fontSize: 32, fontWeight: 'bold', color: submission.totalScore >= (assignment.passingScore || 60) ? '#52c41a' : '#ff4d4f' }}>
                    {submission.totalScore}分
                  </div>
                  <div style={{ color: '#999', marginTop: 4 }}>
                    总分 {assignment.totalScore || 0}分，及格分 {assignment.passingScore || 60}分
                  </div>
                </div>

                {submission.answers?.map((answer, idx) => {
                  const question = assignment.questions?.[idx]
                  return (
                    <div key={idx} className="question-item">
                      <div style={{ marginBottom: 12 }}>
                        <span className="question-number">{idx + 1}.</span>
                        <span style={{ fontWeight: 500 }}>{question?.content}</span>
                        <Tag style={{ marginLeft: 8 }}>
                          {question?.type === 'single_choice' ? '单选题' :
                           question?.type === 'multiple_choice' ? '多选题' :
                           question?.type === 'true_false' ? '判断题' : '简答题'}
                        </Tag>
                        <Tag color={
                          answer.isCorrect === true ? 'success' :
                          answer.isCorrect === false ? 'error' : 'default'
                        } style={{ marginLeft: 8 }}>
                          {answer.score}/{question?.score}分
                        </Tag>
                      </div>

                      <div style={{ marginBottom: 8, color: '#666' }}>
                        <strong>你的答案：</strong>
                        {Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer}
                      </div>

                      {question?.correctAnswer && (
                        <div style={{ marginBottom: 8, color: '#52c41a' }}>
                          <strong>正确答案：</strong>
                          {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
                        </div>
                      )}

                      {answer.teacherComment && (
                        <div style={{ color: '#1890ff', fontStyle: 'italic' }}>
                          <strong>老师评语：</strong>{answer.teacherComment}
                        </div>
                      )}
                    </div>
                  )
                })}

                {submission.teacherFeedback && (
                  <div style={{ marginTop: 24, padding: 16, background: '#e6f7ff', borderRadius: 8 }}>
                    <strong>老师总评：</strong>{submission.teacherFeedback}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export default AssignmentDetail

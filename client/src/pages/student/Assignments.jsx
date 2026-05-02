import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, List, Tag, Avatar, Statistic, message, Spin, Empty, Tabs, Modal, Form, Input, Radio, Checkbox, Space } from 'antd'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'

const { TabPane } = Tabs

function Assignments() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [assignments, setAssignments] = useState([])
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/assignments/my')
      setAssignments(res.data.assignments || [])
    } catch (error) {
      console.error('获取作业列表失败:', error)
      message.error('获取作业列表失败')
    } finally {
      setLoading(false)
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

  const getTypeText = (type) => {
    switch (type) {
      case 'exam': return '考试'
      case 'quiz': return '测验'
      default: return '作业'
    }
  }

  const handleViewDetail = (item) => {
    setSelectedAssignment(item)
    setShowDetail(true)
  }

  const handleSubmit = async (values) => {
    if (!selectedAssignment) return

    try {
      const answers = Object.entries(values).map(([key, value]) => ({
        questionId: key,
        answer: value
      }))

      await api.post(`/assignments/${selectedAssignment._id}/submit`, { answers })
      message.success('提交成功！')
      setShowDetail(false)
      form.resetFields()
      fetchAssignments()
    } catch (error) {
      console.error('提交失败:', error)
    }
  }

  const stats = {
    total: assignments.length,
    submitted: assignments.filter(a => a.submission?.status === 'submitted' || a.submission?.status === 'graded').length,
    graded: assignments.filter(a => a.submission?.status === 'graded').length,
    pending: assignments.filter(a => !a.submission || a.submission.status === 'draft').length
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic title="总作业数" value={stats.total} prefix={<FileTextOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="待提交" value={stats.pending} valueStyle={{ color: '#fa8c16' }} prefix={<ClockCircleOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="已提交" value={stats.submitted} valueStyle={{ color: '#1890ff' }} prefix={<PlayCircleOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="已批改" value={stats.graded} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
        </Row>
      </div>

      <Card>
        <Tabs defaultActiveKey="all">
          <TabPane tab="全部" key="all">
            <AssignmentList
              assignments={assignments}
              loading={loading}
              onViewDetail={handleViewDetail}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              getTypeText={getTypeText}
            />
          </TabPane>
          <TabPane tab="待提交" key="pending">
            <AssignmentList
              assignments={assignments.filter(a => !a.submission || a.submission.status === 'draft')}
              loading={loading}
              onViewDetail={handleViewDetail}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              getTypeText={getTypeText}
            />
          </TabPane>
          <TabPane tab="已完成" key="completed">
            <AssignmentList
              assignments={assignments.filter(a => a.submission?.status === 'submitted' || a.submission?.status === 'graded')}
              loading={loading}
              onViewDetail={handleViewDetail}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              getTypeText={getTypeText}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={
          <div>
            <span>{selectedAssignment?.title}</span>
            <Tag style={{ marginLeft: 12 }}>{getTypeText(selectedAssignment?.type)}</Tag>
            <Tag color={getStatusColor(selectedAssignment?.submission?.status)} style={{ marginLeft: 8 }}>
              {getStatusText(selectedAssignment?.submission?.status)}
            </Tag>
          </div>
        }
        open={showDetail}
        onCancel={() => setShowDetail(false)}
        width={800}
        footer={null}
      >
        {selectedAssignment && (
          <div>
            <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#999' }}>总分</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                    {selectedAssignment.totalScore || 0}分
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ fontSize: 12, color: '#999' }}>及格分</div>
                  <div style={{ fontSize: 20, fontWeight: 'bold', color: '#fa8c16' }}>
                    {selectedAssignment.passingScore || 60}分
                  </div>
                </Col>
                {selectedAssignment.submission?.totalScore !== null && selectedAssignment.submission?.totalScore !== undefined && (
                  <Col span={6}>
                    <div style={{ fontSize: 12, color: '#999' }}>我的得分</div>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: 
                      selectedAssignment.submission.totalScore >= (selectedAssignment.passingScore || 60) ? '#52c41a' : '#ff4d4f'
                    }}>
                      {selectedAssignment.submission.totalScore}分
                    </div>
                  </Col>
                )}
                {selectedAssignment.endDate && (
                  <Col span={6}>
                    <div style={{ fontSize: 12, color: '#999' }}>截止时间</div>
                    <div style={{ fontSize: 14 }}>
                      {new Date(selectedAssignment.endDate).toLocaleString()}
                    </div>
                  </Col>
                )}
              </Row>
            </div>

            {selectedAssignment.description && (
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ marginBottom: 8 }}>作业说明</h4>
                <p style={{ color: '#666' }}>{selectedAssignment.description}</p>
              </div>
            )}

            {(!selectedAssignment.submission || selectedAssignment.submission.status === 'draft') &&
              selectedAssignment.questions && selectedAssignment.questions.length > 0 ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                {selectedAssignment.questions.map((question, idx) => (
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
                  <Space>
                    <Button onClick={() => setShowDetail(false)}>取消</Button>
                    <Button type="primary" htmlType="submit">提交作业</Button>
                  </Space>
                </Form.Item>
              </Form>
            ) : selectedAssignment.submission?.status === 'submitted' ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <PlayCircleOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                <p style={{ color: '#666' }}>作业已提交，等待老师批改中...</p>
              </div>
            ) : selectedAssignment.submission?.status === 'graded' ? (
              <div>
                <h4 style={{ marginBottom: 16 }}>批改结果</h4>
                {selectedAssignment.submission.answers?.map((answer, idx) => {
                  const question = selectedAssignment.questions?.[idx]
                  return (
                    <div key={idx} className="question-item">
                      <div style={{ marginBottom: 12 }}>
                        <span className="question-number">{idx + 1}.</span>
                        <span style={{ fontWeight: 500 }}>{question?.content}</span>
                        <Tag color={
                          answer.isCorrect === true ? 'success' :
                          answer.isCorrect === false ? 'error' : 'default'
                        } style={{ marginLeft: 8 }}>
                          {answer.score}分 / {question?.score}分
                        </Tag>
                      </div>
                      <div style={{ marginBottom: 8, color: '#666' }}>
                        <strong>你的答案：</strong>{answer.answer}
                      </div>
                      {question?.showAnswerAfterSubmit !== false && question?.correctAnswer && (
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
                {selectedAssignment.submission.teacherFeedback && (
                  <div style={{ marginTop: 24, padding: 16, background: '#e6f7ff', borderRadius: 8 }}>
                    <strong>老师总评：</strong>{selectedAssignment.submission.teacherFeedback}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  )
}

function AssignmentList({ assignments, loading, onViewDetail, getStatusColor, getStatusText, getTypeText }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (assignments.length === 0) {
    return <Empty description="暂无作业" />
  }

  return (
    <List
      dataSource={assignments}
      renderItem={(item) => (
        <List.Item
          actions={[
            <Button type="link" onClick={() => onViewDetail(item)}>
              查看详情
            </Button>
          ]}
        >
          <List.Item.Meta
            avatar={<FileTextOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 500 }}>{item.title}</span>
                <Tag>{getTypeText(item.type)}</Tag>
                <Tag color={getStatusColor(item.submission?.status)}>
                  {getStatusText(item.submission?.status)}
                </Tag>
              </div>
            }
            description={
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ color: '#999' }}>
                    总分: {item.totalScore || 0}分
                  </span>
                  {item.submission?.totalScore !== null && item.submission?.totalScore !== undefined && (
                    <span style={{ color: 
                      item.submission.totalScore >= (item.passingScore || 60) ? '#52c41a' : '#ff4d4f'
                    }}>
                      得分: {item.submission.totalScore}分
                    </span>
                  )}
                  {item.endDate && (
                    <span style={{ color: '#999' }}>
                      截止: {new Date(item.endDate).toLocaleDateString()}
                    </span>
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

export default Assignments

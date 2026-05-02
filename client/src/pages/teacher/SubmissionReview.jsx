import React, { useState } from 'react'
import { Card, Table, Button, Tag, Modal, Form, Input, InputNumber, message, Descriptions, Space, List, Avatar } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  SaveOutlined
} from '@ant-design/icons'

const { TextArea } = Input

function SubmissionReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const mockAssignment = {
    _id: id,
    title: 'JavaScript 第一章课后作业',
    courseTitle: 'JavaScript 从入门到精通',
    type: 'homework',
    totalScore: 100,
    passingScore: 60,
    endDate: '2024-04-30'
  }

  const mockSubmissions = [
    {
      key: '1',
      _id: '1',
      student: { _id: '1', username: '王学员', avatar: '' },
      status: 'submitted',
      totalScore: null,
      submittedAt: '2024-04-25T10:30:00Z',
      answers: [
        { questionId: 'q1', answer: '选项A', score: null, isCorrect: null },
        { questionId: 'q2', answer: ['选项A', '选项C'], score: null, isCorrect: null },
        { questionId: 'q3', answer: '这是简答题的答案...', score: null, isCorrect: null }
      ]
    },
    {
      key: '2',
      _id: '2',
      student: { _id: '2', username: '李学员', avatar: '' },
      status: 'graded',
      totalScore: 85,
      submittedAt: '2024-04-24T14:20:00Z',
      gradedAt: '2024-04-26T09:00:00Z',
      gradedBy: { username: '张教授' },
      answers: [
        { questionId: 'q1', answer: '选项A', score: 10, isCorrect: true },
        { questionId: 'q2', answer: ['选项A', '选项C'], score: 15, isCorrect: true },
        { questionId: 'q3', answer: '这是简答题的答案...', score: 60, isCorrect: null, teacherComment: '回答得很好，逻辑清晰。' }
      ]
    },
    {
      key: '3',
      _id: '3',
      student: { _id: '3', username: '张学员', avatar: '' },
      status: 'submitted',
      totalScore: null,
      submittedAt: '2024-04-26T08:15:00Z',
      answers: []
    }
  ]

  const columns = [
    {
      title: '学员',
      dataIndex: ['student', 'username'],
      key: 'student',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={32}>{text?.charAt(0)}</Avatar>
          <span>{text}</span>
        </div>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (time) => new Date(time).toLocaleString()
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={
          status === 'graded' ? 'success' :
          status === 'submitted' ? 'processing' : 'warning'
        }>
          {status === 'graded' ? '已批改' :
           status === 'submitted' ? '已提交' : '草稿'}
        </Tag>
      )
    },
    {
      title: '得分',
      dataIndex: 'totalScore',
      key: 'totalScore',
      render: (score, record) => {
        if (score === null || score === undefined) {
          return <Tag color="default">待批改</Tag>
        }
        const isPass = score >= (mockAssignment.passingScore || 60)
        return (
          <span style={{ 
            color: isPass ? '#52c41a' : '#ff4d4f',
            fontWeight: 'bold'
          }}>
            {score}/{mockAssignment.totalScore}
          </span>
        )
      }
    },
    {
      title: '批改时间',
      dataIndex: 'gradedAt',
      key: 'gradedAt',
      render: (time) => time ? new Date(time).toLocaleString() : '-'
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
            onClick={() => viewSubmission(record)}
          >
            查看
          </Button>
          {record.status !== 'graded' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => startGrading(record)}
            >
              批改
            </Button>
          )}
        </Space>
      )
    }
  ]

  const viewSubmission = (record) => {
    setSelectedSubmission(record)
    setModalVisible(true)
  }

  const startGrading = (record) => {
    setSelectedSubmission(record)
    form.setFieldsValue({
      totalScore: record.totalScore,
      teacherFeedback: record.teacherFeedback
    })
    setModalVisible(true)
  }

  const handleGrade = async (values) => {
    setLoading(true)
    try {
      message.success('批改成功！')
      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('批改失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: mockSubmissions.length,
    submitted: mockSubmissions.filter(s => s.status === 'submitted').length,
    graded: mockSubmissions.filter(s => s.status === 'graded').length,
    avgScore: mockSubmissions.filter(s => s.totalScore !== null).length > 0
      ? Math.round(
          mockSubmissions
            .filter(s => s.totalScore !== null)
            .reduce((sum, s) => sum + s.totalScore, 0) /
          mockSubmissions.filter(s => s.totalScore !== null).length
        )
      : 0
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/assignments')}
        style={{ marginBottom: 24 }}
      >
        返回作业列表
      </Button>

      <Card style={{ marginBottom: 24 }}>
        <Descriptions title={mockAssignment.title} column={4}>
          <Descriptions.Item label="课程">{mockAssignment.courseTitle}</Descriptions.Item>
          <Descriptions.Item label="类型">
            <Tag color={
              mockAssignment.type === 'exam' ? 'red' :
              mockAssignment.type === 'quiz' ? 'orange' : 'blue'
            }>
              {mockAssignment.type === 'exam' ? '考试' :
               mockAssignment.type === 'quiz' ? '测验' : '作业'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="总分">{mockAssignment.totalScore}分</Descriptions.Item>
          <Descriptions.Item label="及格分">{mockAssignment.passingScore}分</Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 16, display: 'flex', gap: 24 }}>
          <div>
            <span style={{ color: '#999' }}>总提交数：</span>
            <span style={{ fontWeight: 'bold', marginLeft: 4 }}>{stats.total}</span>
          </div>
          <div>
            <span style={{ color: '#999' }}>待批改：</span>
            <span style={{ fontWeight: 'bold', marginLeft: 4, color: '#1890ff' }}>{stats.submitted - stats.graded}</span>
          </div>
          <div>
            <span style={{ color: '#999' }}>已批改：</span>
            <span style={{ fontWeight: 'bold', marginLeft: 4, color: '#52c41a' }}>{stats.graded}</span>
          </div>
          {stats.avgScore > 0 && (
            <div>
              <span style={{ color: '#999' }}>平均分：</span>
              <span style={{ fontWeight: 'bold', marginLeft: 4 }}>{stats.avgScore}分</span>
            </div>
          )}
        </div>
      </Card>

      <Card title="提交列表">
        <Table
          columns={columns}
          dataSource={mockSubmissions}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={selectedSubmission?.status === 'graded' ? '查看批改结果' : '批改作业'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={
          selectedSubmission?.status !== 'graded' ? [
            <Button key="cancel" onClick={() => setModalVisible(false)}>取消</Button>,
            <Button key="submit" type="primary" loading={loading} icon={<SaveOutlined />} onClick={() => form.submit()}>
              完成批改
            </Button>
          ] : null
        }
      >
        {selectedSubmission && (
          <div>
            <Descriptions size="small" column={3} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="学员">{selectedSubmission.student.username}</Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {new Date(selectedSubmission.submittedAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={
                  selectedSubmission.status === 'graded' ? 'success' :
                  selectedSubmission.status === 'submitted' ? 'processing' : 'warning'
                }>
                  {selectedSubmission.status === 'graded' ? '已批改' :
                   selectedSubmission.status === 'submitted' ? '已提交' : '草稿'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedSubmission.answers?.length > 0 ? (
              <div>
                <h4 style={{ marginBottom: 16 }}>答题详情</h4>
                <List
                  dataSource={selectedSubmission.answers}
                  renderItem={(answer, idx) => (
                    <List.Item>
                      <Card size="small" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <strong>第 {idx + 1} 题</strong>
                          {answer.score !== null && answer.score !== undefined ? (
                            <span style={{ 
                              color: answer.isCorrect ? '#52c41a' : '#ff4d4f',
                              fontWeight: 'bold'
                            }}>
                              {answer.score}分
                            </span>
                          ) : (
                            selectedSubmission.status !== 'graded' && (
                              <Form.Item
                                name={['scores', idx]}
                                style={{ margin: 0 }}
                              >
                                <InputNumber min={0} placeholder="打分" />
                              </Form.Item>
                            )
                          )}
                        </div>

                        <div style={{ marginBottom: 8 }}>
                          <strong>答案：</strong>
                          {Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer}
                        </div>

                        {answer.teacherComment && (
                          <div style={{ color: '#1890ff', fontStyle: 'italic' }}>
                            <strong>评语：</strong>{answer.teacherComment}
                          </div>
                        )}

                        {selectedSubmission.status !== 'graded' && (
                          <Form.Item
                            name={['comments', idx]}
                            style={{ marginTop: 12, marginBottom: 0 }}
                          >
                            <TextArea rows={2} placeholder="写下评语..." />
                          </Form.Item>
                        )}
                      </Card>
                    </List.Item>
                  )}
                />
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                暂无答题详情
              </div>
            )}

            {selectedSubmission.status !== 'graded' && (
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f0f0f0' }}>
                <Form form={form} layout="vertical" onFinish={handleGrade}>
                  <Form.Item
                    name="totalScore"
                    label="总分"
                    rules={[{ required: true, message: '请输入总分' }]}
                  >
                    <InputNumber min={0} max={mockAssignment.totalScore} style={{ width: '100%' }} placeholder="请输入总分" />
                  </Form.Item>
                  <Form.Item name="teacherFeedback" label="总评">
                    <TextArea rows={3} placeholder="写下总评..." />
                  </Form.Item>
                </Form>
              </div>
            )}

            {selectedSubmission.status === 'graded' && (
              <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                <h4 style={{ marginBottom: 12 }}>批改结果</h4>
                <div style={{ marginBottom: 8 }}>
                  <strong>总分：</strong>
                  <span style={{ 
                    color: selectedSubmission.totalScore >= (mockAssignment.passingScore || 60) ? '#52c41a' : '#ff4d4f',
                    fontWeight: 'bold',
                    fontSize: 18
                  }}>
                    {selectedSubmission.totalScore}/{mockAssignment.totalScore}分
                  </span>
                </div>
                {selectedSubmission.teacherFeedback && (
                  <div>
                    <strong>总评：</strong>{selectedSubmission.teacherFeedback}
                  </div>
                )}
                {selectedSubmission.gradedBy && (
                  <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                    批改人：{selectedSubmission.gradedBy.username} · {new Date(selectedSubmission.gradedAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default SubmissionReview

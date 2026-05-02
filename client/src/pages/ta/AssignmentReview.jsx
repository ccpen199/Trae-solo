import React, { useState } from 'react'
import { Card, Table, Button, Tag, Modal, Form, Input, InputNumber, message, Avatar, Space, List, Descriptions } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  EyeOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SaveOutlined
} from '@ant-design/icons'

const { TextArea } = Input

function AssignmentReview() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const mockSubmissions = [
    {
      key: '1',
      _id: '1',
      assignment: { _id: 'a1', title: 'JavaScript 第一章课后作业' },
      student: { _id: '1', username: '王学员', avatar: '' },
      course: { _id: 'c1', title: 'JavaScript 从入门到精通' },
      status: 'submitted',
      totalScore: null,
      submittedAt: '2024-04-25T10:30:00Z',
      answers: [
        { questionId: 'q1', answer: '选项A', score: null, isCorrect: null },
        { questionId: 'q2', answer: '这是简答题的答案...', score: null, isCorrect: null }
      ]
    },
    {
      key: '2',
      _id: '2',
      assignment: { _id: 'a1', title: 'JavaScript 第一章课后作业' },
      student: { _id: '2', username: '李学员', avatar: '' },
      course: { _id: 'c1', title: 'JavaScript 从入门到精通' },
      status: 'graded',
      totalScore: 85,
      submittedAt: '2024-04-24T14:20:00Z',
      gradedAt: '2024-04-26T09:00:00Z',
      gradedBy: { username: '李助教' },
      answers: []
    },
    {
      key: '3',
      _id: '3',
      assignment: { _id: 'a2', title: 'React 组件开发测验' },
      student: { _id: '3', username: '张学员', avatar: '' },
      course: { _id: 'c2', title: 'React 实战开发' },
      status: 'submitted',
      totalScore: null,
      submittedAt: '2024-04-26T08:15:00Z',
      answers: []
    }
  ]

  const columns = [
    {
      title: '作业',
      dataIndex: ['assignment', 'title'],
      key: 'assignment',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.course?.title}</div>
        </div>
      )
    },
    {
      title: '学员',
      dataIndex: ['student', 'username'],
      key: 'student',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={28}>{text?.charAt(0)}</Avatar>
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
      render: (score) => {
        if (score === null || score === undefined) {
          return <Tag color="default">待批改</Tag>
        }
        return (
          <span style={{ fontWeight: 'bold', color: score >= 60 ? '#52c41a' : '#ff4d4f' }}>
            {score}分
          </span>
        )
      }
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
    pending: mockSubmissions.filter(s => s.status === 'submitted').length,
    graded: mockSubmissions.filter(s => s.status === 'graded').length
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>作业批改</h2>
        <p style={{ color: '#666', marginTop: 8, marginBottom: 0 }}>
          待批改：{stats.pending} 份 | 已批改：{stats.graded} 份
        </p>
      </div>

      <Card>
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
            <Descriptions size="small" column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="作业">{selectedSubmission.assignment?.title}</Descriptions.Item>
              <Descriptions.Item label="学员">{selectedSubmission.student?.username}</Descriptions.Item>
              <Descriptions.Item label="课程">{selectedSubmission.course?.title}</Descriptions.Item>
              <Descriptions.Item label="提交时间">
                {new Date(selectedSubmission.submittedAt).toLocaleString()}
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>第 {idx + 1} 题</strong>
                          {answer.score !== null && answer.score !== undefined ? (
                            <span style={{ fontWeight: 'bold' }}>{answer.score}分</span>
                          ) : selectedSubmission.status !== 'graded' ? (
                            <Form.Item name={['scores', idx]} style={{ margin: 0 }}>
                              <InputNumber min={0} placeholder="打分" />
                            </Form.Item>
                          ) : null}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <strong>答案：</strong>
                          {Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer}
                        </div>
                        {selectedSubmission.status !== 'graded' && (
                          <Form.Item name={['comments', idx]} style={{ marginTop: 8, marginBottom: 0 }}>
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
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入总分" />
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
                    color: selectedSubmission.totalScore >= 60 ? '#52c41a' : '#ff4d4f',
                    fontWeight: 'bold',
                    fontSize: 18
                  }}>
                    {selectedSubmission.totalScore}分
                  </span>
                </div>
                {selectedSubmission.teacherFeedback && (
                  <div>
                    <strong>总评：</strong>{selectedSubmission.teacherFeedback}
                  </div>
                )}
                {selectedSubmission.gradedBy && (
                  <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                    批改人：{selectedSubmission.gradedBy.username}
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

export default AssignmentReview

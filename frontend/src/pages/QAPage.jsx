import React, { useState } from 'react'
import { Card, Input, Button, List, Tag, Spin, message, Space, Rate, Modal, Form } from 'antd'
import { SendOutlined, LikeOutlined, DislikeOutlined } from '@ant-design/icons'
import { qaAPI, feedbackAPI } from '../utils/api'
import dayjs from 'dayjs'

const { TextArea: AntTextArea } = Input

function QAPage({ user }) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [feedbackModal, setFeedbackModal] = useState(false)
  const [currentTask, setCurrentTask] = useState(null)
  const [form] = Form.useForm()

  const handleAsk = async () => {
    if (!question.trim()) {
      message.warning('请输入问题')
      return
    }

    setLoading(true)
    const userQuestion = question
    setQuestion('')
    
    setHistory(prev => [...prev, { type: 'user', content: userQuestion, time: new Date() }])

    try {
      const response = await qaAPI.ask(userQuestion)
      const result = response.data
      
      setHistory(prev => [...prev, {
        type: 'assistant',
        content: result.answer,
        citations: result.citations,
        sources: result.sources,
        task_id: result.task_id,
        time: new Date()
      }])
    } catch (error) {
      message.error('提问失败，请稍后重试')
      setHistory(prev => [...prev, { type: 'assistant', content: '抱歉，系统暂时无法回答您的问题，请稍后重试。', time: new Date() }])
    } finally {
      setLoading(false)
    }
  }

  const showFeedback = (item) => {
    setCurrentTask(item.task_id)
    setFeedbackModal(true)
    form.resetFields()
  }

  const handleFeedback = async (values) => {
    try {
      await feedbackAPI.create({
        task_id: currentTask,
        rating: values.rating,
        is_correct: values.is_correct,
        comment: values.comment,
        correction_suggestion: values.correction_suggestion
      })
      message.success('感谢您的反馈！')
      setFeedbackModal(false)
    } catch (error) {
      message.error('反馈提交失败')
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>智能问答</h2>
      
      <Card style={{ height: 'calc(100vh - 350px)', overflowY: 'auto', marginBottom: 16 }}>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#999' }}>
            <p>欢迎使用AI售后知识库问答系统</p>
            <p style={{ fontSize: '12px', marginTop: 8 }}>请在下方输入您的问题，我将为您查找相关答案</p>
          </div>
        ) : (
          <List
            dataSource={history}
            renderItem={(item, index) => (
              <List.Item style={{ border: 'none', padding: '12px 0' }}>
                <div className={`chat-message ${item.type}`} style={{ width: '100%', maxWidth: '100%' }}>
                  <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
                    {item.type === 'user' ? '您的问题' : 'AI回答'}
                    <span style={{ fontSize: '12px', color: '#999', marginLeft: 8 }}>
                      {dayjs(item.time).format('HH:mm:ss')}
                    </span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{item.content}</div>
                  
                  {item.citations && item.citations.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>引用来源：</div>
                      {item.citations.map((cit, idx) => (
                        <div key={idx} className="citation-item">
                          <div style={{ fontSize: '12px', color: '#1890ff', marginBottom: 4 }}>
                            来源文档 #{cit.document_id}
                            {cit.similarity_score && ` (相似度: ${(cit.similarity_score * 100).toFixed(1)}%)`}
                          </div>
                          <div style={{ fontSize: '13px' }}>{cit.quote_text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {item.type === 'assistant' && item.task_id && (
                    <div style={{ marginTop: 16, textAlign: 'right' }}>
                      <Button size="small" onClick={() => showFeedback(item)}>
                        提交反馈
                      </Button>
                    </div>
                  )}
                </div>
              </List.Item>
            )}
          />
        )}
        {loading && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Spin tip="正在检索知识库..." />
          </div>
        )}
      </Card>

      <Card>
        <Space.Compact style={{ width: '100%' }}>
          <AntTextArea
            rows={2}
            placeholder="请输入您的问题..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault()
                handleAsk()
              }
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleAsk}
            loading={loading}
            style={{ height: '100%' }}
          >
            提问
          </Button>
        </Space.Compact>
      </Card>

      <Modal
        title="提交反馈"
        open={feedbackModal}
        onCancel={() => setFeedbackModal(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleFeedback} layout="vertical">
          <Form.Item name="rating" label="评分">
            <Rate />
          </Form.Item>
          <Form.Item name="is_correct" label="答案是否正确" rules={[{ required: true }]}>
            <Space>
              <Button icon={<LikeOutlined />} onClick={() => form.setFieldValue('is_correct', true)}>
                正确
              </Button>
              <Button icon={<DislikeOutlined />} onClick={() => form.setFieldValue('is_correct', false)}>
                不正确
              </Button>
            </Space>
          </Form.Item>
          <Form.Item name="comment" label="反馈意见">
            <AntTextArea rows={3} placeholder="请输入您的反馈意见..." />
          </Form.Item>
          <Form.Item name="correction_suggestion" label="更正建议">
            <AntTextArea rows={3} placeholder="如果答案不正确，请告诉我正确的答案..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              提交反馈
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default QAPage

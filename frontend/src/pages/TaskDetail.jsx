import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Descriptions, Tag, Timeline, List, Space, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { taskAPI } from '../utils/api'
import dayjs from 'dayjs'

function TaskDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTask()
  }, [id])

  const loadTask = async () => {
    try {
      const response = await taskAPI.get(id)
      setTask(response.data)
    } catch (error) {
      message.error('加载任务失败')
    } finally {
      setLoading(false)
    }
  }

  if (!task) return null

  const statusMap = {
    pending: { color: 'default', text: '待处理' },
    processing: { color: 'processing', text: '处理中' },
    reviewing: { color: 'warning', text: '待审核' },
    approved: { color: 'success', text: '已通过' },
    rejected: { color: 'error', text: '已拒绝' },
    completed: { color: 'success', text: '已完成' }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')}>
          返回列表
        </Button>
      </div>

      <Card title={`任务 #${task.id} - ${task.title}`} loading={loading}>
        <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="任务类型">{task.task_type}</Descriptions.Item>
          <Descriptions.Item label="优先级">
            <Tag color={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'green'}>
              {task.priority}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusMap[task.status]?.color || 'default'}>
              {statusMap[task.status]?.text || task.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="规则版本">{task.rule_version || '-'}</Descriptions.Item>
          <Descriptions.Item label="创建时间">{dayjs(task.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
          <Descriptions.Item label="完成时间">{task.completed_at ? dayjs(task.completed_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
        </Descriptions>

        {task.question && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 8 }}>问题</h3>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>{task.question}</div>
          </div>
        )}

        {task.answer && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 8 }}>答案</h3>
            <div style={{ padding: 12, background: '#e6f7ff', borderRadius: 4, whiteSpace: 'pre-wrap' }}>{task.answer}</div>
          </div>
        )}

        {task.citations && task.citations.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>引用来源</h3>
            <List
              dataSource={task.citations}
              renderItem={(item) => (
                <List.Item>
                  <div className="citation-item" style={{ width: '100%' }}>
                    <div style={{ fontSize: '12px', color: '#1890ff', marginBottom: 4 }}>
                      文档 #{item.document_id}
                      {item.similarity_score && ` (相似度: ${(item.similarity_score * 100).toFixed(1)}%)`}
                    </div>
                    <div style={{ fontSize: '13px' }}>{item.quote_text}</div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}

        {task.status_history && task.status_history.length > 0 && (
          <div>
            <h3 style={{ marginBottom: 16 }}>状态流转</h3>
            <Timeline>
              {task.status_history.map((item, index) => (
                <Timeline.Item key={index}>
                  <p><strong>{item.from_status || '初始'} → {item.to_status}</strong></p>
                  <p style={{ color: '#666', fontSize: '12px' }}>
                    {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    {item.remark && ` - ${item.remark}`}
                  </p>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        )}
      </Card>
    </div>
  )
}

export default TaskDetail

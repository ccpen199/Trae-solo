import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Button, Tag, Space, Modal, Input, message } from 'antd'
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons'
import { taskAPI } from '../utils/api'
import dayjs from 'dayjs'

const { TextArea } = Input

function ReviewWorkbench({ user }) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [rejectModal, setRejectModal] = useState(false)
  const [currentTask, setCurrentTask] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const response = await taskAPI.list({ status: 'reviewing' })
      setTasks(response.data)
    } catch (error) {
      message.error('加载待审核任务失败')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await taskAPI.approve(id, '审核通过')
      message.success('审核通过')
      loadTasks()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      message.warning('请输入拒绝原因')
      return
    }
    try {
      await taskAPI.reject(currentTask.id, rejectReason)
      message.success('已拒绝')
      setRejectModal(false)
      setRejectReason('')
      loadTasks()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const openRejectModal = (task) => {
    setCurrentTask(task)
    setRejectReason('')
    setRejectModal(true)
  }

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'task_type',
      key: 'task_type',
      width: 100,
      render: (type) => {
        const typeMap = {
          qa: { color: 'blue', text: '问答' },
          document: { color: 'green', text: '文档' },
          review: { color: 'orange', text: '审核' }
        }
        const info = typeMap[type] || { color: 'default', text: type }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '规则版本',
      dataIndex: 'rule_version',
      key: 'rule_version',
      width: 100
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/tasks/${record.id}`)}>
            查看
          </Button>
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)}>
            通过
          </Button>
          <Button size="small" danger icon={<CloseOutlined />} onClick={() => openRejectModal(record)}>
            拒绝
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>审核工作台</h2>

      <Card>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无待审核任务' }}
        />
      </Card>

      <Modal
        title="拒绝任务"
        open={rejectModal}
        onOk={handleReject}
        onCancel={() => setRejectModal(false)}
        okText="确认拒绝"
        cancelText="取消"
      >
        <div style={{ marginBottom: 8 }}>请输入拒绝原因：</div>
        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="请详细说明拒绝原因..."
        />
      </Modal>
    </div>
  )
}

export default ReviewWorkbench

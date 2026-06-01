import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Space, Modal, Input, message } from 'antd'
import { CheckOutlined, EyeOutlined } from '@ant-design/icons'
import { exceptionAPI } from '../utils/api'
import dayjs from 'dayjs'

const { TextArea } = Input

function ExceptionList({ user }) {
  const [exceptions, setExceptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [resolveModal, setResolveModal] = useState(false)
  const [currentException, setCurrentException] = useState(null)
  const [manualNote, setManualNote] = useState('')

  useEffect(() => {
    loadExceptions()
  }, [])

  const loadExceptions = async () => {
    setLoading(true)
    try {
      const response = await exceptionAPI.list()
      setExceptions(response.data)
    } catch (error) {
      message.error('加载异常列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    try {
      await exceptionAPI.resolve(currentException.id, manualNote)
      message.success('已标记为已解决')
      setResolveModal(false)
      loadExceptions()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '操作类型',
      dataIndex: 'operation_type',
      key: 'operation_type',
      width: 120
    },
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 100
    },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      key: 'error_message',
      ellipsis: true
    },
    {
      title: '补偿动作',
      dataIndex: 'compensation_action',
      key: 'compensation_action',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'resolved',
      key: 'resolved',
      width: 100,
      render: (resolved) => resolved ? <Tag color="success">已解决</Tag> : <Tag color="error">未解决</Tag>
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
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />}>详情</Button>
          {!record.resolved && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => {
              setCurrentException(record)
              setManualNote('')
              setResolveModal(true)
            }}>
              解决
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>异常处理</h2>

      <Card>
        <Table
          columns={columns}
          dataSource={exceptions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="处理异常"
        open={resolveModal}
        onOk={handleResolve}
        onCancel={() => setResolveModal(false)}
        okText="确认解决"
        cancelText="取消"
      >
        <div style={{ marginBottom: 8 }}>处理备注：</div>
        <TextArea
          rows={4}
          value={manualNote}
          onChange={(e) => setManualNote(e.target.value)}
          placeholder="请输入处理备注..."
        />
      </Modal>
    </div>
  )
}

export default ExceptionList

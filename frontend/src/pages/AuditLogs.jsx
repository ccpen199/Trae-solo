import React, { useState, useEffect } from 'react'
import { Card, Table, Select, Tag, message } from 'antd'
import { auditAPI } from '../utils/api'
import dayjs from 'dayjs'

const { Option } = Select

function AuditLogs({ user }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [operationType, setOperationType] = useState('')

  useEffect(() => {
    loadLogs()
  }, [operationType])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = operationType ? { operation_type: operationType } : {}
      const response = await auditAPI.list(params)
      setLogs(response.data)
    } catch (error) {
      message.error('加载审计日志失败')
    } finally {
      setLoading(false)
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
      width: 150,
      render: (type) => <Tag color="blue">{type}</Tag>
    },
    {
      title: '操作人ID',
      dataIndex: 'operator_id',
      key: 'operator_id',
      width: 100
    },
    {
      title: '文档ID',
      dataIndex: 'document_id',
      key: 'document_id',
      width: 100
    },
    {
      title: '任务ID',
      dataIndex: 'task_id',
      key: 'task_id',
      width: 100
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>审计日志</h2>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Select
            placeholder="操作类型筛选"
            value={operationType}
            onChange={setOperationType}
            style={{ width: 200 }}
            allowClear
          >
            <Option value="create_document">创建文档</Option>
            <Option value="update_document">更新文档</Option>
            <Option value="create_task">创建任务</Option>
          </Select>
        </div>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default AuditLogs

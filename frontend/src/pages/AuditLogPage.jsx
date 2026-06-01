import React, { useState, useEffect } from 'react'
import { Table, message, Spin, Card } from 'antd'
import { AuditOutlined } from '@ant-design/icons'
import { getAuditLogs } from '../api'

function AuditLogPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState([])

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const res = await getAuditLogs()
      if (res.data.success) {
        setLogs(res.data.data)
      } else {
        message.error('加载失败')
      }
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 120
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 120
    },
    {
      title: '目标类型',
      dataIndex: 'target_type',
      key: 'target_type',
      width: 120
    },
    {
      title: '目标ID',
      dataIndex: 'target_id',
      key: 'target_id'
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details'
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 200
    }
  ]

  return (
    <Card title={<span><AuditOutlined /> 审计日志</span>}>
      {loading ? (
        <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />
      ) : (
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      )}
    </Card>
  )
}

export default AuditLogPage

import React, { useState, useEffect } from 'react'
import { Table, message } from 'antd'
import { adminAPI } from '../../utils/api'
import dayjs from 'dayjs'

function Logs() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    loadData()
  }, [page])

  const loadData = async () => {
    try {
      const data = await adminAPI.logs({ page, pageSize: 20 })
      setList(data.list || [])
      setTotal(data.total || 0)
    } catch (e) {
      message.error('加载失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '操作人', dataIndex: 'operator_name', key: 'operator_name' },
    { title: '操作', dataIndex: 'action', key: 'action' },
    { title: '目标类型', dataIndex: 'target_type', key: 'target_type' },
    { title: '目标ID', dataIndex: 'target_id', key: 'target_id' },
    { title: 'IP', dataIndex: 'ip', key: 'ip' },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', render: v => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>操作日志</h2>
      <Table 
        columns={columns} 
        dataSource={list} 
        rowKey="id" 
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage
        }}
      />
    </div>
  )
}

export default Logs

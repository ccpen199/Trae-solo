import React, { useState, useEffect } from 'react'
import { Card, Table, Select, Space, Input } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import axios from 'axios'

const API_BASE = '/api'

const OperationLogs = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [moduleFilter, setModuleFilter] = useState('')
  const [keyword, setKeyword] = useState('')

  const moduleMap = {
    negotiation: '谈判管理',
    configuration: '系统配置',
    exception: '异常处理',
    user: '用户管理'
  }

  useEffect(() => {
    loadData()
  }, [moduleFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE}/operation-logs`, {
        params: { module: moduleFilter || undefined, limit: 200 }
      })
      setData(res.data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: '时间', dataIndex: 'created_at', width: 180 },
    { title: '用户', dataIndex: 'user_name', width: 100 },
    {
      title: '模块',
      dataIndex: 'module',
      width: 120,
      render: m => moduleMap[m] || m
    },
    { title: '操作', dataIndex: 'operation', width: 120 },
    {
      title: '参数',
      dataIndex: 'params',
      ellipsis: true,
      render: p => {
        try {
          const obj = JSON.parse(p)
          return <code style={{ fontSize: 12 }}>{JSON.stringify(obj)}</code>
        } catch {
          return p
        }
      }
    },
    {
      title: '结果',
      dataIndex: 'result',
      ellipsis: true,
      render: r => {
        if (!r) return '-'
        try {
          const obj = JSON.parse(r)
          return <code style={{ fontSize: 12 }}>{JSON.stringify(obj)}</code>
        } catch {
          return r
        }
      }
    }
  ]

  const filteredData = keyword
    ? data.filter(item =>
        item.operation?.includes(keyword) ||
        item.user_name?.includes(keyword) ||
        item.params?.includes(keyword)
      )
    : data

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">操作日志</h1>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索操作/用户/参数"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            allowClear
          />
          <span>模块：</span>
          <Select
            style={{ width: 150 }}
            allowClear
            placeholder="全部"
            value={moduleFilter || undefined}
            onChange={setModuleFilter}
            options={Object.entries(moduleMap).map(([k, v]) => ({ value: k, label: v }))}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`
          }}
        />
      </Card>
    </div>
  )
}

export default OperationLogs

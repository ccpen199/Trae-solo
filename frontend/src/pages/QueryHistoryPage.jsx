import React, { useState, useEffect } from 'react'
import { Table, Tag, message, Spin, Card } from 'antd'
import { HistoryOutlined } from '@ant-design/icons'
import { getQueries } from '../api'

function QueryHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [queries, setQueries] = useState([])

  useEffect(() => {
    loadQueries()
  }, [])

  const loadQueries = async () => {
    setLoading(true)
    try {
      const res = await getQueries()
      if (res.data.success) {
        setQueries(res.data.data)
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
      title: '统一社会信用代码',
      dataIndex: 'credit_code',
      key: 'credit_code'
    },
    {
      title: '企业名称',
      dataIndex: 'enterprise_name',
      key: 'enterprise_name'
    },
    {
      title: '客户经理',
      dataIndex: 'account_manager',
      key: 'account_manager',
      width: 120
    },
    {
      title: '查询用途',
      dataIndex: 'query_purpose',
      key: 'query_purpose'
    },
    {
      title: '授权文件',
      dataIndex: 'auth_file',
      key: 'auth_file',
      width: 120,
      render: (text) => text ? <Tag color="green">已上传</Tag> : <Tag color="red">缺失</Tag>
    },
    {
      title: '查询时间',
      dataIndex: 'query_time',
      key: 'query_time',
      width: 200
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => text === 'success' ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag>
    }
  ]

  return (
    <Card title={<span><HistoryOutlined /> 查询历史</span>}>
      {loading ? (
        <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />
      ) : (
        <Table
          dataSource={queries}
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

export default QueryHistoryPage

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Tag, Button, Space, message, Spin, Card } from 'antd'
import { EyeOutlined, FileTextOutlined } from '@ant-design/icons'
import { getReports } from '../api'

function ReportListPage() {
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      const res = await getReports()
      if (res.data.success) {
        setReports(res.data.data)
      } else {
        message.error('加载失败')
      }
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (level) => {
    const map = {
      low: 'green',
      medium: 'orange',
      high: 'red',
      critical: 'red'
    }
    return map[level] || 'default'
  }

  const getRiskLevelText = (level) => {
    const map = {
      low: '低风险',
      medium: '中风险',
      high: '高风险',
      critical: '极高风险'
    }
    return map[level] || level
  }

  const columns = [
    {
      title: '报告编号',
      dataIndex: 'report_no',
      key: 'report_no',
      width: 180,
      render: (text) => <code>{text}</code>
    },
    {
      title: '企业名称',
      dataIndex: 'enterprise_name',
      key: 'enterprise_name'
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'credit_code',
      key: 'credit_code'
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 120,
      render: (text) => (
        <Tag color={getRiskLevelColor(text)}>{getRiskLevelText(text)}</Tag>
      )
    },
    {
      title: '风险评分',
      dataIndex: 'risk_score',
      key: 'risk_score',
      width: 120
    },
    {
      title: '生成人',
      dataIndex: 'generated_by',
      key: 'generated_by',
      width: 120
    },
    {
      title: '生成时间',
      dataIndex: 'generated_at',
      key: 'generated_at',
      width: 200
    },
    {
      title: '状态',
      dataIndex: 'is_archived',
      key: 'is_archived',
      width: 100,
      render: (text) => text === 1 ? <Tag color="blue">已归档</Tag> : <Tag color="green">正常</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/reports/${record.id}`)}
        >
          查看
        </Button>
      )
    }
  ]

  return (
    <Card title={<span><FileTextOutlined /> 报告列表</span>}>
      {loading ? (
        <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />
      ) : (
        <Table
          dataSource={reports}
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

export default ReportListPage

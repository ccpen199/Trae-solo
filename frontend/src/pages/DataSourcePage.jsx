import React, { useState, useEffect } from 'react'
import { Table, Tag, message, Spin, Card, Row, Col, Statistic } from 'antd'
import { DatabaseOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { getDataSources } from '../api'

function DataSourcePage() {
  const [loading, setLoading] = useState(true)
  const [sources, setSources] = useState([])

  useEffect(() => {
    loadSources()
  }, [])

  const loadSources = async () => {
    setLoading(true)
    try {
      const res = await getDataSources()
      if (res.data.success) {
        setSources(res.data.data)
      } else {
        message.error('加载失败')
      }
    } catch (error) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const activeCount = sources.filter(s => s.status === 'active').length
  const degradedCount = sources.filter(s => s.status === 'degraded').length

  const columns = [
    {
      title: '数据源代码',
      dataIndex: 'source_code',
      key: 'source_code',
      width: 120,
      render: (text) => <code>{text}</code>
    },
    {
      title: '数据源名称',
      dataIndex: 'source_name',
      key: 'source_name'
    },
    {
      title: '类型',
      dataIndex: 'source_type',
      key: 'source_type',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (text) =>
        text === 'active' ? (
          <Tag icon={<CheckCircleOutlined />} color="green">正常</Tag>
        ) : (
          <Tag icon={<WarningOutlined />} color="orange">降级</Tag>
        )
    },
    {
      title: '重试次数',
      dataIndex: 'retry_count',
      key: 'retry_count',
      width: 100
    },
    {
      title: '失败次数',
      dataIndex: 'failure_count',
      key: 'failure_count',
      width: 100
    },
    {
      title: '最后成功时间',
      dataIndex: 'last_success_at',
      key: 'last_success_at',
      width: 200,
      render: (text) => text || '-'
    },
    {
      title: '最后失败时间',
      dataIndex: 'last_failure_at',
      key: 'last_failure_at',
      width: 200,
      render: (text) => text || '-'
    }
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="数据源总数"
              value={sources.length}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="正常数据源"
              value={activeCount}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="降级数据源"
              value={degradedCount}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
          </Col>
        </Row>
      </Card>

      <Card title={<span><DatabaseOutlined /> 数据源监控</span>}>
        {loading ? (
          <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 100 }} />
        ) : (
          <Table
            dataSource={sources}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>
    </div>
  )
}

export default DataSourcePage

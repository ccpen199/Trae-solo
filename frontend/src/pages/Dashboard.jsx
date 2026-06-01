import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Button, Progress, List } from 'antd'
import {
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE = '/api'

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    summary: { totalNegotiations: 0, totalAmount: 0, completedRate: 0 },
    statusStats: [],
    monthlyStats: []
  })
  const [recentNegotiations, setRecentNegotiations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, negoRes] = await Promise.all([
        axios.get(`${API_BASE}/dashboard/stats`),
        axios.get(`${API_BASE}/negotiations`)
      ])
      if (statsRes.data.success) {
        setStats(statsRes.data.data)
      }
      if (negoRes.data.success) {
        setRecentNegotiations(negoRes.data.data?.slice(0, 5) || [])
      }
    } catch (e) {
      console.error('加载数据失败:', e)
    } finally {
      setLoading(false)
    }
  }

  const statusMap = {
    draft: { text: '草稿', color: 'default' },
    submitted: { text: '已提交', color: 'blue' },
    executing: { text: '执行中', color: 'orange' },
    reviewing: { text: '审核中', color: 'purple' },
    returned: { text: '已退回', color: 'red' },
    completed: { text: '已完成', color: 'green' },
    closed: { text: '已关闭', color: 'default' }
  }

  const columns = [
    { title: '编号', dataIndex: 'code', width: 120 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '供应商', dataIndex: 'supplier_name', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: s => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag>
    },
    { title: '创建时间', dataIndex: 'created_at', width: 180 }
  ]

  const pendingCount = stats?.statusStats?.filter(s => 
    ['submitted', 'reviewing', 'executing'].includes(s.status)
  ).reduce((sum, s) => sum + s.count, 0) || 0

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">数据看板</h1>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="谈判总数"
              value={stats?.summary?.totalNegotiations || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="总金额(万元)"
              value={((stats?.summary?.totalAmount || 0) / 10000).toFixed(1)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="完成率"
              value={stats?.summary?.completedRate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={loading}>
            <Statistic
              title="待处理"
              value={pendingCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={16}>
          <Card title="完成进度" loading={loading}>
            <div style={{ padding: '20px 0' }}>
              <Progress 
                type="dashboard" 
                percent={Number(stats?.summary?.completedRate) || 0}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#52c41a',
                }}
              />
              <div style={{ marginTop: 16 }}>
                <h4>月度谈判统计</h4>
                <List
                  size="small"
                  dataSource={stats?.monthlyStats || []}
                  renderItem={item => (
                    <List.Item>
                      <span>{item.month}</span>
                      <span>数量: {item.count}, 金额: ¥{((item.amount || 0) / 10000).toFixed(1)}万</span>
                    </List.Item>
                  )}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="状态分布" loading={loading}>
            <List
              dataSource={stats?.statusStats || []}
              renderItem={item => (
                <List.Item>
                  <Tag color={statusMap[item.status]?.color}>
                    {statusMap[item.status]?.text}
                  </Tag>
                  <span style={{ marginLeft: 'auto' }}>{item.count} 个</span>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="最近谈判"
        extra={
          <Button type="link" onClick={() => navigate('/negotiations')}>
            查看全部 <ArrowRightOutlined />
          </Button>
        }
        loading={loading}
      >
        <Table
          columns={columns}
          dataSource={recentNegotiations}
          rowKey="id"
          pagination={false}
          onRow={record => ({
            onClick: () => navigate(`/negotiation/${record.id}`),
            style: { cursor: 'pointer' }
          })}
        />
      </Card>
    </div>
  )
}

export default Dashboard

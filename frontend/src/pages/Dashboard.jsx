import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Button } from 'antd'
import {
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { transactionApi } from '../services/api'
import { formatCurrency, getStatusTag, formatDate } from '../utils/constants'

function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const statsRes = await transactionApi.getStats()
      if (statsRes.data.success) {
        setStats(statsRes.data.data.transactions)
      }

      const listRes = await transactionApi.getList({ page_size: 5 })
      if (listRes.data.success) {
        setRecentTransactions(listRes.data.data.transactions || [])
      }
    } catch (err) {
      console.error('Load dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val, record) => formatCurrency(val, record.currency),
    },
    {
      title: '目标币种金额',
      dataIndex: 'target_amount',
      key: 'target_amount',
      render: (val, record) => val ? formatCurrency(val, record.target_currency) : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const tag = getStatusTag(status)
        return <Tag color={tag.color}>{tag.text}</Tag>
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val) => formatDate(val),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => navigate(`/transactions/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">仪表盘</div>
        <div className="page-desc">跨境支付结算系统概览</div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <div className="stats-card">
            <Statistic
              title="总交易数"
              value={stats?.total_count || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stats-card blue">
            <Statistic
              title="待支付"
              value={stats?.pending_payment_count || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stats-card green">
            <Statistic
              title="已完成"
              value={stats?.completed_count || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <div className="stats-card orange">
            <Statistic
              title="异常单"
              value={stats?.exception_count || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </div>
        </Col>
      </Row>

      <Card
        title="最近交易"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/transactions/create')}
          >
            创建收款
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={recentTransactions}
          rowKey="id"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-text">暂无交易记录</div>
              </div>
            ),
          }}
        />
      </Card>

      <div style={{ marginTop: 24 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Card title="快速统计">
              <div style={{ padding: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#666' }}>待合规审核</span>
                  <Tag color="orange" style={{ fontWeight: 600, fontSize: 16 }}>
                    {stats?.pending_compliance_count || 0}
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#666' }}>待结算</span>
                  <Tag color="gold" style={{ fontWeight: 600, fontSize: 16 }}>
                    {stats?.pending_settlement_count || 0}
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
                  <span style={{ color: '#666' }}>支付完成</span>
                  <Tag color="cyan" style={{ fontWeight: 600, fontSize: 16 }}>
                    {stats?.payment_completed_count || 0}
                  </Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>总金额</span>
                  <span style={{ fontWeight: 600, fontSize: 18, color: '#1890ff' }}>
                    {stats?.total_amount ? `¥${stats.total_amount.toLocaleString()}` : '0'}
                  </span>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="工作流节点说明">
              <div style={{ fontSize: 14, lineHeight: 2 }}>
                <p>
                  <Tag color="default">1. 创建收款</Tag> - 商户创建收款单
                </p>
                <p>
                  <Tag color="blue">2. 待支付</Tag> - 支付机构处理支付
                </p>
                <p>
                  <Tag color="cyan">3. 汇率换算</Tag> - 按锁定汇率换算币种
                </p>
                <p>
                  <Tag color="orange">4. 合规审核</Tag> - KYC校验和合规检查
                </p>
                <p>
                  <Tag color="gold">5. 待结算</Tag> - 财务人员处理结算
                </p>
                <p>
                  <Tag color="green">6. 结算完成</Tag> - 交易完成
                </p>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default Dashboard

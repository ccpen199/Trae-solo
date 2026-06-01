import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Progress, Typography, Statistic, Space, Tag } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { qualityControlAPI, orderAPI, adverseEventAPI, patientPathwayAPI } from '../api'

const { Title } = Typography

function QualityControl() {
  const [summary, setSummary] = useState({})
  const [orders, setOrders] = useState([])
  const [events, setEvents] = useState([])
  const [pathways, setPathways] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [summaryData, orderData, eventData, pathwayData] = await Promise.all([
        qualityControlAPI.getSummary(),
        orderAPI.getAll(),
        adverseEventAPI.getAll(),
        patientPathwayAPI.getAll()
      ])
      setSummary(summaryData)
      setOrders(orderData)
      setEvents(eventData)
      setPathways(pathwayData)
    } catch (error) {
      console.error('Failed to load QC data:', error)
    }
  }

  const getOrderStats = () => {
    const total = orders.length
    const approved = orders.filter(o => o.approval_status === 'approved').length
    const rejected = orders.filter(o => o.approval_status === 'rejected').length
    const pending = orders.filter(o => o.approval_status === 'pending').length
    const offPathway = orders.filter(o => o.is_off_pathway).length
    return { total, approved, rejected, pending, offPathway }
  }

  const getEventStats = () => {
    const mild = events.filter(e => e.severity === 'mild').length
    const moderate = events.filter(e => e.severity === 'moderate').length
    const severe = events.filter(e => e.severity === 'severe').length
    return { mild, moderate, severe }
  }

  const orderStats = getOrderStats()
  const eventStats = getEventStats()

  const pathwayColumns = [
    { title: '患者', dataIndex: 'patient_name', key: 'patient_name' },
    { title: '路径名称', dataIndex: 'pathway_name', key: 'pathway_name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? '进行中' : '已结束'}</Tag>,
    },
    { title: '开始时间', dataIndex: 'created_at', key: 'created_at' },
  ]

  const recentOrderColumns = [
    { title: '患者', dataIndex: 'patient_name', key: 'patient_name' },
    { title: '药品', dataIndex: 'drug_name', key: 'drug_name' },
    {
      title: '超路径',
      dataIndex: 'is_off_pathway',
      key: 'is_off_pathway',
      render: (v) => v ? <Tag color="red">是</Tag> : <Tag color="green">否</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'approval_status',
      key: 'approval_status',
      render: (s) => {
        const colorMap = { pending: 'orange', approved: 'green', rejected: 'red' }
        const textMap = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }
        return <Tag color={colorMap[s]}>{textMap[s]}</Tag>
      },
    },
  ]

  const recentEventColumns = [
    { title: '患者', dataIndex: 'patient_name', key: 'patient_name' },
    { title: '事件类型', dataIndex: 'event_type', key: 'event_type' },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (s) => {
        const colorMap = { mild: 'green', moderate: 'orange', severe: 'red' }
        const textMap = { mild: '轻度', moderate: '中度', severe: '重度' }
        return <Tag color={colorMap[s]}>{textMap[s]}</Tag>
      },
    },
    { title: '关联药品', dataIndex: 'drug_name', key: 'drug_name' },
  ]

  const complianceRate = orderStats.total > 0 ? Math.round(((orderStats.total - orderStats.offPathway) / orderStats.total) * 100) : 0
  const approvalRate = orderStats.total > 0 ? Math.round((orderStats.approved / orderStats.total) * 100) : 0

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} className="page-header">质控分析报表</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-shadow">
            <Statistic
              title="路径总数"
              value={summary.total_pathways || 0}
              prefix={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-shadow">
            <Statistic
              title="在径患者"
              value={summary.active_pathways || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-shadow">
            <Statistic
              title="路径符合率"
              value={complianceRate}
              suffix="%"
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: complianceRate >= 80 ? '#52c41a' : '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="card-shadow">
            <Statistic
              title="医嘱通过率"
              value={approvalRate}
              suffix="%"
              valueStyle={{ color: approvalRate >= 90 ? '#52c41a' : '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="医嘱审核统计" className="card-shadow">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>已通过</span>
                  <span>{orderStats.approved} 条</span>
                </div>
                <Progress percent={orderStats.total > 0 ? Math.round((orderStats.approved / orderStats.total) * 100) : 0} strokeColor="#52c41a" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>待审核</span>
                  <span>{orderStats.pending} 条</span>
                </div>
                <Progress percent={orderStats.total > 0 ? Math.round((orderStats.pending / orderStats.total) * 100) : 0} strokeColor="#fa8c16" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>已拒绝</span>
                  <span>{orderStats.rejected} 条</span>
                </div>
                <Progress percent={orderStats.total > 0 ? Math.round((orderStats.rejected / orderStats.total) * 100) : 0} strokeColor="#ff4d4f" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>超路径用药</span>
                  <span>{orderStats.offPathway} 条</span>
                </div>
                <Progress percent={orderStats.total > 0 ? Math.round((orderStats.offPathway / orderStats.total) * 100) : 0} strokeColor="#eb2f96" />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="不良反应统计" className="card-shadow">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span><Tag color="green">轻度</Tag></span>
                  <span>{eventStats.mild} 例</span>
                </div>
                <Progress percent={events.length > 0 ? Math.round((eventStats.mild / events.length) * 100) : 0} strokeColor="#52c41a" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span><Tag color="orange">中度</Tag></span>
                  <span>{eventStats.moderate} 例</span>
                </div>
                <Progress percent={events.length > 0 ? Math.round((eventStats.moderate / events.length) * 100) : 0} strokeColor="#fa8c16" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span><Tag color="red">重度</Tag></span>
                  <span>{eventStats.severe} 例</span>
                </div>
                <Progress percent={events.length > 0 ? Math.round((eventStats.severe / events.length) * 100) : 0} strokeColor="#ff4d4f" />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="患者路径列表" className="card-shadow">
            <Table
              columns={pathwayColumns}
              dataSource={pathways.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="最近医嘱" className="card-shadow">
            <Table
              columns={recentOrderColumns}
              dataSource={orders.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="最近不良反应" className="card-shadow">
            <Table
              columns={recentEventColumns}
              dataSource={events.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default QualityControl

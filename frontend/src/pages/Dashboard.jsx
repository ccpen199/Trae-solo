import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Space, Typography } from 'antd'
import { qualityControlAPI, orderAPI, adverseEventAPI, patientPathwayAPI } from '../api'

const { Title } = Typography

function Dashboard() {
  const [summary, setSummary] = useState({})
  const [recentOrders, setRecentOrders] = useState([])
  const [recentEvents, setRecentEvents] = useState([])
  const [activePathways, setActivePathways] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const summaryData = await qualityControlAPI.getSummary()
      setSummary(summaryData)

      const orders = await orderAPI.getAll()
      setRecentOrders(orders.slice(0, 5))

      const events = await adverseEventAPI.getAll()
      setRecentEvents(events.slice(0, 5))

      const pathways = await patientPathwayAPI.getAll()
      setActivePathways(pathways.slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const statCards = [
    { title: '路径总数', value: summary.total_pathways || 0, color: '#1890ff' },
    { title: '患者总数', value: summary.total_patients || 0, color: '#52c41a' },
    { title: '在径患者', value: summary.active_pathways || 0, color: '#fa8c16' },
    { title: '待审核医嘱', value: summary.pending_orders || 0, color: '#eb2f96' },
    { title: '不良反应', value: summary.adverse_events || 0, color: '#f5222d' },
  ]

  const orderColumns = [
    { title: '患者', dataIndex: 'patient_name', key: 'patient_name' },
    { title: '药品', dataIndex: 'drug_name', key: 'drug_name' },
    { title: '剂量', dataIndex: 'dosage', key: 'dosage' },
    {
      title: '状态',
      dataIndex: 'approval_status',
      key: 'approval_status',
      render: (status) => {
        const colorMap = { pending: 'orange', approved: 'green', rejected: 'red' }
        const textMap = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>
      },
    },
  ]

  const eventColumns = [
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

  const pathwayColumns = [
    { title: '患者', dataIndex: 'patient_name', key: 'patient_name' },
    { title: '病历号', dataIndex: 'medical_record_no', key: 'medical_record_no' },
    { title: '路径名称', dataIndex: 'pathway_name', key: 'pathway_name' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? '进行中' : '已结束'}</Tag>,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} className="page-header">首页概览</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} md={8} lg={4} key={index}>
            <Card className="card-shadow" style={{ borderLeft: `4px solid ${card.color}` }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: card.color }}>{card.value}</div>
                <div style={{ color: '#666', marginTop: 8 }}>{card.title}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最近医嘱" className="card-shadow">
            <Table
              columns={orderColumns}
              dataSource={recentOrders}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近不良反应" className="card-shadow">
            <Table
              columns={eventColumns}
              dataSource={recentEvents}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="在径患者" className="card-shadow">
            <Table
              columns={pathwayColumns}
              dataSource={activePathways}
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

export default Dashboard

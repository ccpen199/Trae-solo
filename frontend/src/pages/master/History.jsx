import React, { useState, useEffect } from 'react'
import { Table, Tag, Rate, Typography, Card, Statistic, Row, Col } from 'antd'
import { CheckCircleOutlined, StarOutlined, WarningOutlined } from '@ant-design/icons'
import { masterApi } from '../../utils/api'

const { Title } = Typography

const statusMap = {
  accepted: { text: '进行中', color: 'processing' },
  completed: { text: '待验收', color: 'warning' },
  accepted_with_signature: { text: '已验收', color: 'purple' },
  finished: { text: '已完成', color: 'success' }
}

const MasterHistory = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ completed: 0, avgRating: 0, rework: 0 })

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await masterApi.getServiceHistory()
      setOrders(data)
      
      const finishedOrders = data.filter(o => o.status === 'finished')
      const ratedOrders = finishedOrders.filter(o => o.rating)
      
      setStats({
        completed: data.filter(o => ['finished', 'accepted_with_signature', 'completed'].includes(o.status)).length,
        avgRating: ratedOrders.length > 0 
          ? (ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) / ratedOrders.length).toFixed(1)
          : 0,
        rework: data.filter(o => (o.rework_count || 0) > 0).length
      })
    } catch (error) {
      console.error('加载历史记录失败', error)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      title: '订单编号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 160
    },
    {
      title: '服务标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.service_type}</div>
        </div>
      )
    },
    {
      title: '服务地址',
      dataIndex: 'address',
      key: 'address'
    },
    {
      title: '业主评价',
      dataIndex: 'rating',
      key: 'rating',
      render: (val, record) => (
        record.has_review ? <Rate disabled value={val} /> : <span style={{ color: '#999' }}>未评价</span>
      )
    },
    {
      title: '返工记录',
      dataIndex: 'rework_count',
      key: 'rework_count',
      render: (val) => (val > 0 ? (
        <Tag color="error"><WarningOutlined /> {val}次</Tag>
      ) : (
        <Tag color="success"><CheckCircleOutlined /> 无</Tag>
      ))
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusMap[status]?.color}>
          {statusMap[status]?.text}
        </Tag>
      )
    },
    {
      title: '完成时间',
      dataIndex: 'completed_at',
      key: 'completed_at',
      width: 180,
      render: (val) => val || '-'
    }
  ]

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>服务历史</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="服务完成数"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均评分"
              value={stats.avgRating}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
              suffix="/ 5.0"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="返工次数"
              value={stats.rework}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default MasterHistory

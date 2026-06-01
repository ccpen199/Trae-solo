import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Typography, Tag, Space, Statistic } from 'antd'
import {
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { masterAPI, appointmentAPI } from '../api'
import dayjs from 'dayjs'

const { Title } = Typography

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({})
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, aptRes] = await Promise.all([
        masterAPI.stats(),
        appointmentAPI.list({ date: dayjs().format('YYYY-MM-DD') })
      ])
      setStats(statsRes.data)
      setTodayAppointments(aptRes.data.list || [])
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      scheduled: { color: 'blue', text: '已预约' },
      confirmed: { color: 'green', text: '已确认' },
      completed: { color: 'purple', text: '已完成' },
      cancelled: { color: 'red', text: '已取消' },
      missed: { color: 'orange', text: '爽约' },
    }
    const info = statusMap[status] || { color: 'default', text: status }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const statCards = [
    { title: '患者总数', value: stats.patient_count || 0, icon: <TeamOutlined />, color: '#1890ff' },
    { title: '今日预约', value: stats.appointment_today || 0, icon: <CalendarOutlined />, color: '#52c41a' },
    { title: '待收费单', value: stats.pending_invoices || 0, icon: <DollarOutlined />, color: '#faad14' },
    { title: '库存预警', value: stats.low_stock || 0, icon: <WarningOutlined />, color: '#ff4d4f' },
  ]

  const columns = [
    { title: '时间', dataIndex: 'start_time', key: 'start_time', width: 100 },
    { title: '患者', dataIndex: 'patient_name', key: 'patient_name' },
    { title: '联系电话', dataIndex: 'patient_phone', key: 'patient_phone' },
    { title: '医生', dataIndex: 'doctor_name', key: 'doctor_name' },
    { title: '椅位', dataIndex: 'chair_name', key: 'chair_name' },
    { title: '项目', dataIndex: 'treatment_name', key: 'treatment_name' },
    { title: '状态', key: 'status', render: (_: any, record: any) => getStatusTag(record.status) },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>工作台概览</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card>
              <Statistic
                title={
                  <Space>
                    <span style={{ color: card.color }}>{card.icon}</span>
                    {card.title}
                  </Space>
                }
                value={card.value}
                valueStyle={{ color: card.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="今日预约" loading={loading}>
        <Table
          dataSource={todayAppointments}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  )
}

export default Dashboard

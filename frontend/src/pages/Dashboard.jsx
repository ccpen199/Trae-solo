import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Space } from 'antd'
import {
  ApartmentOutlined,
  TeamOutlined,
  CalendarOutlined,
  DollarOutlined,
  WarningOutlined,
  BellOutlined
} from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../utils/api'

export default function Dashboard() {
  const [stats, setStats] = useState({})
  const [monthlyData, setMonthlyData] = useState([])
  const [bookings, setBookings] = useState([])
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsData, reportsData, bookingsData, contractsData] = await Promise.all([
        api.dashboard(),
        api.monthlyReports(),
        api.bookings({ start_date: new Date().toISOString().split('T')[0] }),
        api.contracts()
      ])
      setStats(statsData)
      setMonthlyData(reportsData)
      setBookings(bookingsData.slice(0, 10))
      setContracts(contractsData.filter(c => c.expiring_soon).slice(0, 5))
    } finally {
      setLoading(false)
    }
  }

  const bookingColumns = [
    { title: '会议主题', dataIndex: 'title', key: 'title' },
    { title: '资源', dataIndex: 'resource_name', key: 'resource_name' },
    { title: '预订人', dataIndex: 'member_name', key: 'member_name' },
    { title: '时间', dataIndex: 'start_time', key: 'start_time', render: (t) => t?.slice(0, 16) },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => {
      const colors = { confirmed: 'green', cancelled: 'red', completed: 'blue' }
      const labels = { confirmed: '已确认', cancelled: '已取消', completed: '已完成' }
      return <Tag color={colors[s]}>{labels[s]}</Tag>
    }}
  ]

  const contractColumns = [
    { title: '企业', dataIndex: 'company_name', key: 'company_name' },
    { title: '套餐', dataIndex: 'package_type', key: 'package_type' },
    { title: '到期日期', dataIndex: 'end_date', key: 'end_date' },
    { title: '月租', dataIndex: 'monthly_rent', key: 'monthly_rent', render: v => `¥${v}` }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>运营看板</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总资源数"
              value={stats.totalResources || 0}
              prefix={<ApartmentOutlined />}
              suffix={`/ 可用 ${stats.availableResources || 0}`}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="活跃会员"
              value={stats.totalMembers || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="今日预约"
              value={stats.todayBookings || 0}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待收金额"
              value={stats.pendingAmount || 0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: stats.pendingAmount > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="即将到期合同"
              value={stats.expiringContracts || 0}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="维修中资源"
              value={stats.maintenanceResources || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card title="月度营收趋势" style={{ marginBottom: 16 }}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`¥${value}`, '营收']} />
                  <Line type="monotone" dataKey="revenue" stroke="#1890ff" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          <Card title="今日预约">
            <Table
              dataSource={bookings}
              columns={bookingColumns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        
        <Col span={10}>
          <Card title="即将到期合同" style={{ marginBottom: 16 }}>
            <Table
              dataSource={contracts}
              columns={contractColumns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
          
          <Card title="本月收入">
            <Statistic
              value={stats.monthlyRevenue || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ fontSize: 36 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

import React from 'react'
import { Card, Row, Col, Statistic, Table, Button, message, Descriptions } from 'antd'
import {
  DollarOutlined,
  UserOutlined,
  BookOutlined,
  RiseOutlined,
  CalendarOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

function RevenueReport() {
  const mockRevenueData = [
    { name: '1月', revenue: 12000, orders: 45, students: 38 },
    { name: '2月', revenue: 18500, orders: 62, students: 52 },
    { name: '3月', revenue: 22000, orders: 78, students: 65 },
    { name: '4月', revenue: 28600, orders: 95, students: 78 },
    { name: '5月', revenue: 35000, orders: 110, students: 92 },
    { name: '6月', revenue: 42000, orders: 130, students: 105 }
  ]

  const mockCourseRevenue = [
    { name: 'JavaScript 从入门到精通', revenue: 38272, orders: 128, students: 128, avgPrice: 299 },
    { name: 'React 实战开发', revenue: 34314, orders: 86, students: 86, avgPrice: 399 },
    { name: 'Python 数据分析实战', revenue: 22336, orders: 64, students: 64, avgPrice: 349 },
    { name: 'Vue3 高级开发', revenue: 0, orders: 0, students: 0, avgPrice: 349 }
  ]

  const pieData = [
    { name: 'JavaScript 从入门到精通', value: 38272 },
    { name: 'React 实战开发', value: 34314 },
    { name: 'Python 数据分析实战', value: 22336 },
    { name: '其他课程', value: 15000 }
  ]

  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#eb2f96']

  const totalStats = {
    totalRevenue: mockRevenueData.reduce((sum, item) => sum + item.revenue, 0),
    totalOrders: mockRevenueData.reduce((sum, item) => sum + item.orders, 0),
    totalStudents: mockCourseRevenue.reduce((sum, item) => sum + item.students, 0),
    avgOrderPrice: Math.round(
      mockRevenueData.reduce((sum, item) => sum + item.revenue, 0) /
      mockRevenueData.reduce((sum, item) => sum + item.orders, 0)
    )
  }

  const columns = [
    {
      title: '课程',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <div style={{ fontWeight: 500 }}>{text}</div>
      )
    },
    {
      title: '学员数',
      dataIndex: 'students',
      key: 'students',
      render: (num) => (
        <span style={{ fontWeight: 500 }}>{num} 人</span>
      )
    },
    {
      title: '订单数',
      dataIndex: 'orders',
      key: 'orders',
      render: (num) => `${num} 单`
    },
    {
      title: '单价',
      dataIndex: 'avgPrice',
      key: 'avgPrice',
      render: (price) => (
        <span>¥{price}</span>
      )
    },
    {
      title: '收入',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue) => (
        <span style={{ color: revenue > 0 ? '#ff4d4f' : '#999', fontWeight: 'bold' }}>
          ¥{revenue.toLocaleString()}
        </span>
      )
    },
    {
      title: '占比',
      key: 'percentage',
      render: (_, record) => {
        const total = mockCourseRevenue.reduce((sum, item) => sum + item.revenue, 0)
        const percentage = total > 0 ? Math.round((record.revenue / total) * 100) : 0
        return (
          <span>
            {percentage}%
          </span>
        )
      }
    }
  ]

  const handleExport = () => {
    message.success('导出功能开发中...')
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>营收报表</h2>
          <p style={{ color: '#666', marginTop: 8, marginBottom: 0 }}>
            实时查看平台营收数据与趋势分析
          </p>
        </div>
        <Button icon={<CalendarOutlined />} onClick={handleExport}>
          导出报表
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card className="stat-card red">
            <Statistic
              title="总收入"
              value={totalStats.totalRevenue}
              prefix="¥"
              valueStyle={{ color: '#ff4d4f', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card blue">
            <Statistic
              title="总订单数"
              value={totalStats.totalOrders}
              prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card green">
            <Statistic
              title="付费学员"
              value={totalStats.totalStudents}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card orange">
            <Statistic
              title="客单价"
              value={totalStats.avgOrderPrice}
              prefix="¥"
              suffix="/单"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="月度营收趋势">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={mockRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'revenue') return [`¥${value.toLocaleString()}`, '营收']
                    if (name === 'orders') return [`${value} 单`, '订单数']
                    if (name === 'students') return [`${value} 人`, '学员数']
                    return [value, name]
                  }}
                />
                <Legend
                  formatter={(value) => {
                    const legendMap = {
                      revenue: '营收',
                      orders: '订单数',
                      students: '学员数'
                    }
                    return legendMap[value] || value
                  }}
                />
                <Bar dataKey="revenue" fill="#ff4d4f" name="revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="orders" fill="#1890ff" name="orders" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="课程收入占比">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.substring(0, 6)}... ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`¥${value.toLocaleString()}`, '收入']}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="课程收入排行">
        <Table
          columns={columns}
          dataSource={mockCourseRevenue}
          rowKey="name"
          pagination={{ pageSize: 10 }}
          summary={() => {
            const totalRevenue = mockCourseRevenue.reduce((sum, item) => sum + item.revenue, 0)
            const totalOrders = mockCourseRevenue.reduce((sum, item) => sum + item.orders, 0)
            const totalStudents = mockCourseRevenue.reduce((sum, item) => sum + item.students, 0)

            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <strong>合计</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>{totalStudents} 人</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <strong>{totalOrders} 单</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  -
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                    ¥{totalRevenue.toLocaleString()}
                  </strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <strong>100%</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }}
        />
      </Card>
    </div>
  )
}

export default RevenueReport

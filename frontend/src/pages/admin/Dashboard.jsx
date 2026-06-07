import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, message } from 'antd'
import { DollarOutlined, ShoppingOutlined, ShopOutlined, UserOutlined } from '@ant-design/icons'
import { adminAPI } from '../../utils/api'

function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const d = await adminAPI.dashboard()
      setData(d)
    } catch (e) {
      message.error('加载失败')
    }
  }

  const cinemaColumns = [
    { title: '影院名称', dataIndex: 'name', key: 'name' },
    { title: '城市', dataIndex: 'city', key: 'city' },
    { title: '订单数', dataIndex: 'order_count', key: 'order_count' },
    { title: '营收', dataIndex: 'revenue', key: 'revenue', render: v => `¥${v.toFixed(2)}` },
  ]

  if (!data) return <div>加载中...</div>

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>数据看板</h2>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日订单"
              value={data.today_orders}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日营收"
              value={data.today_amount}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="影院总数"
              value={data.total_cinemas}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={data.total_users}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="影院营收排行" style={{ marginBottom: 24 }}>
        <Table
          dataSource={data.cinema_stats}
          columns={cinemaColumns}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Card title="最近7日销售趋势">
        <Row gutter={[8, 8]}>
          {(data.weekly_sales || []).map(d => (
            <Col key={d.date} flex="1">
              <Card size="small" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>{d.date}</div>
                <div style={{ fontSize: 14, fontWeight: 'bold' }}>{d.orders}单</div>
                <div style={{ color: '#ff4d4f' }}>¥{d.amount}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}

export default Dashboard

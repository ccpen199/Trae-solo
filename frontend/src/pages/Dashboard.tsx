import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Space } from 'antd'
import { FileSearchOutlined, DollarOutlined, InboxOutlined, FileTextOutlined, FileInvoiceOutlined, BarChartOutlined } from '@ant-design/icons'
import { inquiriesApi, quotationsApi, bookingsApi, settlementsApi } from '../api'

function Dashboard() {
  const [stats, setStats] = useState({
    inquiries: 0,
    quotations: 0,
    bookings: 0,
    settlements: 0,
  })
  const [recentInquiries, setRecentInquiries] = useState([])
  const [recentBookings, setRecentBookings] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [inquiriesRes, quotationsRes, bookingsRes, settlementsRes] = await Promise.all([
        inquiriesApi.list({ pageSize: 5 }),
        quotationsApi.list({ pageSize: 1 }),
        bookingsApi.list({ pageSize: 5 }),
        settlementsApi.list({ pageSize: 1 }),
      ])
      setStats({
        inquiries: inquiriesRes.data?.pagination?.total || 0,
        quotations: quotationsRes.data?.pagination?.total || 0,
        bookings: bookingsRes.data?.pagination?.total || 0,
        settlements: settlementsRes.data?.pagination?.total || 0,
      })
      setRecentInquiries(inquiriesRes.data?.data || [])
      setRecentBookings(bookingsRes.data?.data || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  const inquiryColumns = [
    { title: '询价单号', dataIndex: 'inquiry_no', key: 'inquiry_no' },
    { title: '客户', dataIndex: 'customer', key: 'customer' },
    { title: '起运港', dataIndex: 'origin_port', key: 'origin_port' },
    { title: '目的港', dataIndex: 'destination_port', key: 'destination_port' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'confirmed' ? 'green' : 'orange'}>{status}</Tag>
      ),
    },
  ]

  const bookingColumns = [
    { title: '订舱单号', dataIndex: 'booking_no', key: 'booking_no' },
    { title: '客户', dataIndex: 'customer', key: 'customer' },
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'confirmed' ? 'green' : status === 'draft' ? 'default' : 'blue'}>{status}</Tag>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>数据概览</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="询价单总数"
              value={stats.inquiries}
              prefix={<FileSearchOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="报价单总数"
              value={stats.quotations}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="订舱单数"
              value={stats.bookings}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="结算单数"
              value={stats.settlements}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最近询价单">
            <Table
              columns={inquiryColumns}
              dataSource={recentInquiries}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近订舱单">
            <Table
              columns={bookingColumns}
              dataSource={recentBookings}
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

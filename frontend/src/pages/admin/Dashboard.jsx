import React, { useState, useEffect } from 'react'
import { Row, Col, Card, message } from 'antd'
import { UserOutlined, CreditCardOutlined, DollarOutlined, GiftOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import api from '../../utils/api'

const Dashboard = () => {
  const [stats, setStats] = useState({
    user_count: 0,
    account_count: 0,
    total_payment: 0,
    exchange_count: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const data = await api.get('/admin/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`
        }
      })
      setStats(data)
    } catch (error) {
      message.error('获取统计数据失败')
    }
  }

  const statCards = [
    { title: '注册用户数', value: stats.user_count, icon: <UserOutlined />, color: '#1890ff' },
    { title: '绑定户号数', value: stats.account_count, icon: <CreditCardOutlined />, color: '#52c41a' },
    { title: '累计交易额', value: `¥${stats.total_payment}`, icon: <DollarOutlined />, color: '#fa8c16' },
    { title: '积分兑换数', value: stats.exchange_count, icon: <GiftOutlined />, color: '#722ed1' },
  ]

  const getChartOption = () => {
    return {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['用户增长', '交易金额']
      },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月']
      },
      yAxis: [
        { type: 'value', name: '用户数' },
        { type: 'value', name: '金额(万)' }
      ],
      series: [
        {
          name: '用户增长',
          type: 'bar',
          data: [120, 200, 150, 80, 70, 110]
        },
        {
          name: '交易金额',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: [2.5, 4.2, 3.8, 5.1, 6.2, 8.5]
        }
      ]
    }
  }

  return (
    <div>
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <div className="admin-stat-card">
                <div style={{ fontSize: 40, color: card.color, marginBottom: 12 }}>
                  {card.icon}
                </div>
                <div className="number" style={{ color: card.color }}>
                  {card.value}
                </div>
                <div className="label">{card.title}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="业务趋势">
            <ReactECharts option={getChartOption()} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="快捷操作">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Card type="inner" size="small" hoverable>
                用户管理
              </Card>
              <Card type="inner" size="small" hoverable>
                交费记录审核
              </Card>
              <Card type="inner" size="small" hoverable>
                兑换风控审查
              </Card>
              <Card type="inner" size="small" hoverable>
                营商环境数据报送
              </Card>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

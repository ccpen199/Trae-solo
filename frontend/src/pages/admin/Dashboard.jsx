import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, List, Tag, message } from 'antd'
import {
  UserOutlined, ShopOutlined, ShoppingOutlined, ShoppingCartOutlined, AlertOutlined } from '@ant-design/icons'
import api from '../../utils/api'

const AdminDashboard = () => {
  const [data, setData] = useState({
    userCount: 0,
    merchantCount: 0,
    orderCount: 0,
    productCount: 0,
    pendingMerchants: 0,
    salesByDomain: [],
    recentOrders: [],
    orderStatusStats: []
  })

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard')
      setData(res.data)
    } catch (error) {
      message.error('加载数据失败')
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>📊 数据看板</h2>
      
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={data.userCount}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="商户总数"
              value={data.merchantCount}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            {data.pendingMerchants > 0 && (
              <Tag color="orange" style={{ marginTop: '8px' }}>
                <AlertOutlined /> {data.pendingMerchants} 家待审核
              </Tag>
            )}
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="订单总数"
              value={data.orderCount}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="商品总数"
              value={data.productCount}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="按业务域统计">
            {data.salesByDomain.length > 0 ? (
              <List
                dataSource={data.salesByDomain}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.business_domain === 'takeout' ? '🍔 外卖' :
                            item.business_domain === 'instore' ? '🏬 到店' :
                            item.business_domain === 'travel' ? '🚗 出行' : '🏨 旅游'}
                      description={`订单数: ${item.order_count} | 销售额: ¥${item.total_sales || 0}`}
                    />
                  </List.Item>
                )}
              />
            ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>暂无数据</div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="订单状态分布">
            {data.orderStatusStats.length > 0 ? (
              <List
                dataSource={data.orderStatusStats}
                renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>
                          {item.status === 'pending' ? '待支付' :
                                  item.status === 'paid' ? '已支付' :
                                  item.status === 'delivering' ? '配送中' :
                                  item.status === 'completed' ? '已完成' : item.status}
                        </span>
                        <Tag color="blue">{item.count}</Tag>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>暂无数据</div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="最近订单" style={{ marginTop: '24px' }}>
        {data.recentOrders.length > 0 ? (
          <List
            dataSource={data.recentOrders}
            renderItem={order => (
            <List.Item>
              <List.Item.Meta
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <span>{order.order_no}</span>
                    <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>¥{order.pay_amount}</span>
                  </div>
                }
                description={
                  <div>
                    <span>用户: {order.user_name}</span>
                    <span style={{ marginLeft: '16px' }}>商户: {order.merchant_name}</span>
                    <span style={{ marginLeft: '16px', color: '#999' }}>{order.created_at}</span>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>暂无订单</div>
        )}
      </Card>
    </div>
  )
}

export default AdminDashboard

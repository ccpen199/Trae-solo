import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Tabs, List, Avatar, Button, Tag, message, Empty, Statistic, Row, Col } from 'antd'
import { ShoppingCartOutlined, TagsOutlined, GiftOutlined, UserOutlined, CreditCardOutlined } from '@ant-design/icons'
import { orderAPI, userAPI, benefitAPI } from '../utils/api'
import MoviePoster from '../components/MoviePoster'
import dayjs from 'dayjs'

function UserCenter() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeKey, setActiveKey] = useState(searchParams.get('tab') || 'profile')
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [coupons, setCoupons] = useState([])
  const [packages, setPackages] = useState([])
  const [points, setPoints] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [p, o, c, pk, pts] = await Promise.all([
        userAPI.profile(),
        orderAPI.myOrders({ pageSize: 20 }),
        userAPI.coupons(),
        benefitAPI.packages(),
        userAPI.points()
      ])
      setProfile(p)
      setOrders(o.list || [])
      setCoupons(c || [])
      setPackages(pk || [])
      setPoints(pts.points || 0)
    } catch (e) {
      message.error('加载失败')
    }
  }

  const handleBuyPackage = async id => {
    try {
      await benefitAPI.buyPackage(id)
      message.success('购买成功')
      loadData()
    } catch (e) {
      message.error('购买失败')
    }
  }

  const handlePayOrder = async id => {
    try {
      await orderAPI.pay(id)
      message.success('支付成功')
      loadData()
    } catch (e) {
      message.error('支付失败')
    }
  }

  const tabItems = [
    {
      key: 'profile',
      label: '个人信息',
      icon: <UserOutlined />,
      children: (
        <Card>
          <Row gutter={24}>
            <Col span={12}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <Avatar size={80} icon={<UserOutlined />} />
                <div>
                  <h2 style={{ margin: 0 }}>{profile?.nickname || profile?.username}</h2>
                  <Tag color="blue">Lv.{profile?.member_level}</Tag>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>用户名：{profile?.username}</div>
              <div style={{ marginBottom: 12 }}>手机号：{profile?.phone}</div>
            </Col>
            <Col span={12}>
              <Row gutter={16}>
                <Col span={12}>
                  <Card>
                    <Statistic title="积分余额" value={points} prefix={<GiftOutlined />} />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <Statistic title="优惠券" value={coupons.length} prefix={<TagsOutlined />} />
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>
      )
    },
    {
      key: 'orders',
      label: '我的订单',
      icon: <ShoppingCartOutlined />,
      children: (
        <Card>
          {orders.length === 0 ? (
            <Empty description="暂无订单" />
          ) : (
            <List
              dataSource={orders}
              renderItem={order => (
                <List.Item
                  actions={[
                    order.pay_status === 0 ? (
                      <Button type="primary" size="small" onClick={() => handlePayOrder(order.id)}>去支付</Button>
                    ) : (
                      <Tag color="green">已支付</Tag>
                    )
                  ]}
                >
                  <List.Item.Meta
                    avatar={<MoviePoster movie={order} height={84} compact style={{ width: 60, borderRadius: 4 }} />}
                    title={order.title}
                    description={
                      <div>
                        <div>订单号：{order.order_no}</div>
                        <div>{dayjs(order.start_time).format('YYYY-MM-DD HH:mm')} | {order.cinema_name} {order.hall_name}</div>
                        <div>座位：{JSON.parse(order.seats || '[]').map(s => {
                          const [r, c] = s.split('-')
                          return `${parseInt(r) + 1}排${parseInt(c) + 1}座`
                        }).join(', ')}</div>
                        {order.verify_code && <Tag color="purple">核销码：{order.verify_code}</Tag>}
                      </div>
                    }
                  />
                  <div style={{ fontWeight: 'bold', color: '#ff4d4f' }}>¥{order.pay_amount || order.total_amount}</div>
                </List.Item>
              )}
            />
          )}
        </Card>
      )
    },
    {
      key: 'coupons',
      label: '优惠券',
      icon: <TagsOutlined />,
      children: (
        <Card>
          {coupons.length === 0 ? (
            <Empty description="暂无优惠券" />
          ) : (
            <Row gutter={[16, 16]}>
              {coupons.map(c => (
                <Col span={8} key={c.id}>
                  <Card size="small" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>¥{c.value}</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>{c.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>满{c.min_amount}可用</div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card>
      )
    },
    {
      key: 'benefits',
      label: '权益包',
      icon: <CreditCardOutlined />,
      children: (
        <Card title="购买权益包">
          <Row gutter={[16, 16]}>
            {packages.map(p => (
              <Col span={8} key={p.id}>
                <Card hoverable>
                  <h3>{p.name}</h3>
                  <p style={{ color: '#666', fontSize: 12 }}>{p.description}</p>
                  <div style={{ marginBottom: 12 }}>
                    <Tag color="gold">赠送 {p.points_bonus} 积分</Tag>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                    ¥{p.price}
                  </div>
                  <Button type="primary" block style={{ marginTop: 12 }} onClick={() => handleBuyPackage(p.id)}>
                    购买
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )
    }
  ]

  return (
    <div>
      <Tabs activeKey={activeKey} onChange={setActiveKey} items={tabItems} />
    </div>
  )
}

export default UserCenter

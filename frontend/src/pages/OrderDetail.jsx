import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Row, Col, Button, Card, Descriptions, Tag, Spin, message } from 'antd'
import { CheckCircleOutlined, PayCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { getOrderDetail, payOrder, cancelOrder } from '../services/api'
import dayjs from 'dayjs'

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    loadOrderDetail()
  }, [id])

  const loadOrderDetail = async () => {
    setLoading(true)
    try {
      const res = await getOrderDetail(id)
      setOrder(res.data)
    } catch (err) {
      message.error('加载订单详情失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    setPaying(true)
    try {
      await payOrder(id)
      message.success('支付成功')
      loadOrderDetail()
    } catch (err) {
      message.error('支付失败')
      console.error(err)
    } finally {
      setPaying(false)
    }
  }

  const handleCancel = async () => {
    setCanceling(true)
    try {
      await cancelOrder(id)
      message.success('取消成功')
      loadOrderDetail()
    } catch (err) {
      message.error('取消失败')
      console.error(err)
    } finally {
      setCanceling(false)
    }
  }

  const getStatusTag = (status) => {
    const statusMap = {
      0: { text: '待支付', color: 'warning' },
      1: { text: '已出票', color: 'success' },
      2: { text: '已取消', color: 'default' },
    }
    const info = statusMap[status] || { text: '未知', color: 'default' }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  if (loading || !order) {
    return (
      <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1 style={{ color: 'white', marginBottom: '10px' }}>订单详情</h1>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '30px' }}>
        {order.status === 1 && (
          <Card style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)', color: 'white' }}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <CheckCircleOutlined style={{ fontSize: '64px', marginBottom: '20px' }} />
              <h2 style={{ color: 'white', marginBottom: '10px' }}>购票成功</h2>
              <p style={{ fontSize: '16px', marginBottom: '10px' }}>取票码：<strong style={{ fontSize: '24px' }}>{order.ticket_code}</strong></p>
              <p>请凭取票码到影院自助取票机取票</p>
            </div>
          </Card>
        )}

        <Card style={{ marginBottom: '20px' }}>
          <Row gutter={20}>
            <Col xs={24} sm={6}>
              <img src={order.movie_poster} alt={order.movie_title} style={{ width: '100%', borderRadius: '8px' }} />
            </Col>
            <Col xs={24} sm={18}>
              <h2 style={{ marginBottom: '20px' }}>{order.movie_title}</h2>
              <Descriptions column={2} style={{ marginBottom: '20px' }}>
                <Descriptions.Item label="影院">{order.cinema_name}</Descriptions.Item>
                <Descriptions.Item label="影厅">{order.hall_name}</Descriptions.Item>
                <Descriptions.Item label="场次">
                  {dayjs(order.start_time).format('YYYY年M月D日 HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="座位">
                  {(order.seats || []).map(s => s.seat_code).join('、')}
                </Descriptions.Item>
                <Descriptions.Item label="订单状态">{getStatusTag(order.status)}</Descriptions.Item>
                <Descriptions.Item label="订单编号">{order.order_no}</Descriptions.Item>
              </Descriptions>

              <div className="price-tag" style={{ fontSize: '28px', marginBottom: '20px' }}>
                合计：¥{order.total_amount}
              </div>

              {order.status === 0 && (
                <div style={{ display: 'flex', gap: '15px' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PayCircleOutlined />}
                    onClick={handlePay}
                    loading={paying}
                    style={{
                      background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                      border: 'none',
                      padding: '0 40px',
                    }}
                  >
                    立即支付
                  </Button>
                  <Button
                    size="large"
                    onClick={handleCancel}
                    loading={canceling}
                  >
                    取消订单
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </Card>

        <Card title="订单信息">
          <Descriptions column={2}>
            <Descriptions.Item label="创建时间">
              {dayjs(order.created_at).format('YYYY年M月D日 HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="支付时间">
              {order.pay_time ? dayjs(order.pay_time).format('YYYY年M月D日 HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </div>
  )
}

export default OrderDetail

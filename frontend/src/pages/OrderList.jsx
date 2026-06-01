import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { List, Card, Tag, Button, Spin, message, Tabs, Empty } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { getOrders } from '../services/api'
import dayjs from 'dayjs'

function OrderList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadOrders()
  }, [activeTab])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const status = activeTab === 'all' ? '' : activeTab
      const res = await getOrders({ status })
      setOrders(res.data.list || [])
    } catch (err) {
      message.error('加载订单列表失败')
      console.error(err)
    } finally {
      setLoading(false)
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

  const tabItems = [
    { key: 'all', label: '全部订单' },
    { key: '0', label: '待支付' },
    { key: '1', label: '已完成' },
    { key: '2', label: '已取消' },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <h1 style={{ color: 'white', marginBottom: '10px' }}>我的订单</h1>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '30px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: '20px' }}
        />

        <Spin spinning={loading}>
          {orders.length === 0 ? (
            <Empty description="暂无订单" style={{ padding: '60px 0' }} />
          ) : (
            <List
              dataSource={orders}
              renderItem={order => (
                <List.Item style={{ background: '#fff', borderRadius: '8px', marginBottom: '15px', padding: '0' }}>
                  <Card style={{ width: '100%', border: 'none' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ width: '100px', flexShrink: 0 }}>
                        <img 
                          src={order.movie_poster} 
                          alt={order.movie_title} 
                          style={{ width: '100%', borderRadius: '4px' }} 
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <h3 style={{ marginBottom: '5px' }}>{order.movie_title}</h3>
                          {getStatusTag(order.status)}
                        </div>
                        <p style={{ color: '#666', marginBottom: '5px' }}>
                          {order.cinema_name} - {order.hall_name}
                        </p>
                        <p style={{ color: '#666', marginBottom: '10px' }}>
                          {dayjs(order.start_time).format('YYYY年M月D日 HH:mm')}
                        </p>
                        <p style={{ color: '#999', marginBottom: '10px' }}>
                          座位：{(order.seats || []).map(s => s.seat_code).join('、')}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="price-tag">¥{order.total_amount}</span>
                          <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/order/${order.id}`)}
                          >
                            查看详情
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </Spin>
      </div>
    </div>
  )
}

export default OrderList

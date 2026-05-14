import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { orderApi } from '../api'
import './Orders.css'

const statusTabs = [
  { key: '', label: '全部订单' },
  { key: 'pending', label: '待支付' },
  { key: 'paid', label: '待发货' },
  { key: 'shipped', label: '待收货' },
  { key: 'completed', label: '已完成' },
]

const Orders = () => {
  const [activeTab, setActiveTab] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 })

  useEffect(() => {
    loadOrders()
  }, [activeTab])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, pageSize: pagination.pageSize }
      if (activeTab) params.status = activeTab
      
      const res = await orderApi.getList(params)
      if (res.success) {
        setOrders(res.data)
        setPagination(res.pagination)
      }
    } catch (e) {
      console.error('加载订单失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async (orderId) => {
    if (!confirm('确认支付？')) return
    try {
      const res = await orderApi.pay(orderId)
      if (res.success) {
        alert('支付成功！')
        loadOrders()
      }
    } catch (e) {
      alert(e.error || '支付失败')
    }
  }

  const handleCancel = async (orderId) => {
    if (!confirm('确定取消订单？')) return
    try {
      const res = await orderApi.cancel(orderId)
      if (res.success) {
        alert('订单已取消')
        loadOrders()
      }
    } catch (e) {
      alert(e.error || '取消失败')
    }
  }

  const handleConfirm = async (orderId) => {
    if (!confirm('确认收货？')) return
    try {
      const res = await orderApi.confirm(orderId)
      if (res.success) {
        alert('已确认收货')
        loadOrders()
      }
    } catch (e) {
      alert(e.error || '操作失败')
    }
  }

  if (loading) {
    return <div className="loading" style={{ padding: '100px' }}>加载中...</div>
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1 className="page-title">我的订单</h1>

        <div className="orders-tabs">
          {statusTabs.map(tab => (
            <button
              key={tab.key}
              className={`order-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className="empty">
            <p>暂无订单</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>去购物</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-no">订单号：{order.order_no}</span>
                  <span className="order-time">{order.created_at}</span>
                  <span className={`order-status status-${order.status}`}>
                    {order.status_text}
                  </span>
                </div>
                <div className="order-body">
                  <div className="order-items">
                    {order.items.map(item => (
                      <div key={item.id} className="order-item-mini">
                        <Link to={`/product/${item.product_id}`} className="item-image">
                          <span>📦</span>
                        </Link>
                        <div className="item-info">
                          <Link to={`/product/${item.product_id}`} className="item-name">
                            {item.product_name}
                          </Link>
                          <div className="item-price">
                            ¥{item.price.toFixed(2)} x {item.quantity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="order-total">
                    <div className="total-info">
                      <span>共 {order.items.reduce((s, i) => s + i.quantity, 0)} 件商品</span>
                      <span className="total-amount">实付：<span className="price">¥{order.pay_amount.toFixed(2)}</span></span>
                    </div>
                    <div className="order-actions">
                      <Link to={`/orders/${order.id}`} className="btn btn-ghost">
                        查看详情
                      </Link>
                      {order.status === 'pending' && (
                        <>
                          <button className="btn btn-outline" onClick={() => handleCancel(order.id)}>
                            取消订单
                          </button>
                          <button className="btn btn-primary" onClick={() => handlePay(order.id)}>
                            立即支付
                          </button>
                        </>
                      )}
                      {order.status === 'shipped' && (
                        <button className="btn btn-primary" onClick={() => handleConfirm(order.id)}>
                          确认收货
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders

import React, { useEffect, useState } from 'react'
import { orderApi, adminApi } from '../../api'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')

  useEffect(() => {
    loadOrders()
  }, [activeTab])

  const loadOrders = async () => {
    try {
      const params = { pageSize: 100 }
      if (activeTab) params.status = activeTab
      const res = await orderApi.getList(params)
      if (res.success) {
        setOrders(res.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleShip = async (id) => {
    try {
      const res = await adminApi.shipOrder(id)
      if (res.success) {
        alert('发货成功')
        loadOrders()
      }
    } catch (e) {
      alert(e.error || '操作失败')
    }
  }

  if (loading) return <div className="loading">加载中...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>📦 订单管理</h1>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {['', 'pending', 'paid', 'shipped', 'completed', 'cancelled'].map(status => (
          <button
            key={status || 'all'}
            className={`btn ${activeTab === status ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab(status)}
          >
            {status === '' ? '全部' : status === 'pending' ? '待支付' : status === 'paid' ? '待发货' : status === 'shipped' ? '待收货' : status === 'completed' ? '已完成' : '已取消'}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>订单号</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>商品</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>金额</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>状态</th>
              <th style={{ textAlign: 'left', padding: 16, fontSize: 13, color: '#666' }}>时间</th>
              <th style={{ textAlign: 'right', padding: 16, fontSize: 13, color: '#666' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: 16, fontFamily: 'monospace' }}>{order.order_no}</td>
                <td style={{ padding: 16 }}>
                  <div style={{ maxWidth: 300 }}>
                    {order.items?.slice(0, 2).map(item => (
                      <div key={item.id} style={{ fontSize: 13 }}>{item.product_name} x{item.quantity}</div>
                    ))}
                    {order.items?.length > 2 && <div style={{ color: '#999', fontSize: 12 }}>等共{order.items.length}件</div>}
                  </div>
                </td>
                <td style={{ padding: 16, fontWeight: 500 }}>¥{order.pay_amount.toFixed(2)}</td>
                <td style={{ padding: 16 }}>
                  <span style={{
                    padding: '2px 8px',
                    background: order.status === 'completed' ? '#f6ffed' : order.status === 'cancelled' ? '#f5f5f5' : order.status === 'pending' ? '#fffbe6' : '#e6f7ff',
                    color: order.status === 'completed' ? '#52c41a' : order.status === 'cancelled' ? '#999' : order.status === 'pending' ? '#faad14' : '#1890ff',
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    {order.status_text}
                  </span>
                </td>
                <td style={{ padding: 16, color: '#999', fontSize: 13 }}>{order.created_at}</td>
                <td style={{ padding: 16, textAlign: 'right' }}>
                  {order.status === 'paid' && (
                    <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => handleShip(order.id)}>
                      发货
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无订单</div>
        )}
      </div>
    </div>
  )
}

export default Orders

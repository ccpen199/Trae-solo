import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { orderApi } from '../api'

const OrderDetail = () => {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrder()
  }, [id])

  const loadOrder = async () => {
    try {
      const res = await orderApi.getDetail(id)
      if (res.success) {
        setOrder(res.data)
      }
    } catch (e) {
      console.error('加载订单详情失败', e)
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    if (!confirm('确认支付？')) return
    try {
      const res = await orderApi.pay(id)
      if (res.success) {
        alert('支付成功！')
        loadOrder()
      }
    } catch (e) {
      alert(e.error || '支付失败')
    }
  }

  const handleCancel = async () => {
    if (!confirm('确定取消订单？')) return
    try {
      const res = await orderApi.cancel(id)
      if (res.success) {
        alert('订单已取消')
        loadOrder()
      }
    } catch (e) {
      alert(e.error || '取消失败')
    }
  }

  const handleConfirm = async () => {
    if (!confirm('确认收货？')) return
    try {
      const res = await orderApi.confirm(id)
      if (res.success) {
        alert('已确认收货')
        loadOrder()
      }
    } catch (e) {
      alert(e.error || '操作失败')
    }
  }

  if (loading) {
    return <div className="loading" style={{ padding: '100px' }}>加载中...</div>
  }

  if (!order) {
    return <div className="container" style={{ padding: '100px', textAlign: 'center' }}>订单不存在</div>
  }

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <h1 className="page-title" style={{ fontSize: 24, marginBottom: 20 }}>订单详情</h1>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>订单状态</div>
            <div className={`status-${order.status}`} style={{ fontSize: 20, fontWeight: 600 }}>
              {order.status_text}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#666', marginBottom: 8 }}>订单号：{order.order_no}</div>
            <div style={{ color: '#999', fontSize: 13 }}>下单时间：{order.created_at}</div>
          </div>
        </div>
      </div>

      {order.address && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>收货信息</div>
          <div style={{ color: '#666' }}>{order.address}</div>
        </div>
      )}

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>商品信息</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {order.items.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
              <Link to={`/product/${item.product_id}`} style={{ width: 80, height: 80, background: '#f5f5f5', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                📦
              </Link>
              <div style={{ flex: 1, paddingLeft: 16 }}>
                <Link to={`/product/${item.product_id}`} style={{ color: '#333' }}>
                  {item.product_name}
                </Link>
                <div style={{ color: '#999', fontSize: 13, marginTop: 4 }}>
                  ¥{item.price.toFixed(2)} x {item.quantity}
                </div>
              </div>
              <div style={{ color: '#ff4d4f', fontWeight: 600 }}>
                ¥{item.subtotal.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>订单金额</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
          <div style={{ color: '#666' }}>商品金额：¥{order.total_amount.toFixed(2)}</div>
          {order.discount_amount > 0 && (
            <div style={{ color: '#ff4d4f' }}>优惠减免：-¥{order.discount_amount.toFixed(2)}</div>
          )}
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>
            实付金额：¥{order.pay_amount.toFixed(2)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          {order.status === 'pending' && (
            <>
              <button className="btn btn-outline" onClick={handleCancel}>取消订单</button>
              <button className="btn btn-primary" onClick={handlePay}>立即支付</button>
            </>
          )}
          {order.status === 'shipped' && (
            <button className="btn btn-primary" onClick={handleConfirm}>确认收货</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default OrderDetail

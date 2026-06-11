import React, { useState, useEffect } from 'react'
import api from '../utils/api'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')

  useEffect(() => {
    loadOrders()
  }, [status])

  const loadOrders = async () => {
    try {
      const url = status === 'all' ? '/shop/orders' : `/shop/orders?status=${status}`
      const res = await api.get(url)
      setOrders(res.data.orders || [])
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReceipt = async (orderId) => {
    const receiptUrl = prompt('请上传开箱验机照片（输入图片URL）：');
    if (!receiptUrl) {
      try {
        await api.put(`/shop/orders/${orderId}/receipt`, { receipt_photo: receiptUrl })
        alert('验机照片上传成功！')
        loadOrders()
      } catch (err) {
        alert(err.response?.data?.error || '上传失败')
      }
    }
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    paid: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700'
  }

  const statusLabels = {
    pending: '待付款',
    paid: '待发货',
    shipped: '运输中',
    delivered: '已完成',
    cancelled: '已取消'
  }

  const statusTabs = [
    { id: 'all', name: '全部' },
    { id: 'pending', name: '待付款' },
    { id: 'shipped', name: '运输中' },
    { id: 'delivered', name: '已完成' }
  ]

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">我的订单</h2>

      <div className="flex space-x-2 bg-white p-1 rounded-lg shadow-sm w-fit">
        {statusTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatus(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              status === tab.id
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-500">订单号: </span>
                  <span className="font-mono text-gray-700">{order.order_no}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || ''}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>

              <div className="p-6">
                {(order.items || []).map(item => (
                  <div key={item.id} className="flex items-center pb-4 mb-4 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                      🛴
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="font-medium text-gray-800">{item.name}</div>
                      <div className="text-sm text-gray-500">x{item.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">¥{item.unit_price}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  下单时间: {new Date(order.created_at).toLocaleString('zh-CN')}
                </div>
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-gray-500 text-sm">合计: </span>
                    <span className="text-xl font-bold text-red-600">¥{order.total_amount?.toFixed(2)}</span>
                  </div>
                  {order.n_coins_used > 0 && (
                    <div className="text-sm text-orange-600">
                      N币抵扣: -{order.n_coins_used}
                    </div>
                  )}
                  {order.status === 'shipped' && (
                    <button
                      onClick={() => handleReceipt(order.id)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                    >
                      开箱验机
                    </button>
                  )}
                </div>
              </div>

              {order.tracking_no && (
                <div className="px-6 py-3 bg-blue-50 text-sm text-blue-700">
                  📦 物流信息: {order.shipping_carrier || '快递'} - {order.tracking_no}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📦</div>
          <p>暂无订单</p>
          <p className="text-sm mt-2">去商城逛逛吧～</p>
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import api from '../utils/api'

export default function ServiceOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [devices, setDevices] = useState([])
  const [faultCodes, setFaultCodes] = useState([])
  const [newOrder, setNewOrder] = useState({
    device_id: '',
    fault_code: '',
    description: '',
    appointment_time: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ordersRes, devicesRes, faultRes] = await Promise.all([
        api.get('/service/orders'),
        api.get('/devices'),
        api.get('/service/fault-codes')
      ])
      setOrders(ordersRes.data.orders || [])
      setDevices(devicesRes.data.devices?.filter(d => d.status === 'active') || [])
      setFaultCodes(faultRes.data.fault_codes || [])
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/service/orders', newOrder)
      setShowCreateModal(false)
      setNewOrder({ device_id: '', fault_code: '', description: '', appointment_time: '' })
      alert('工单提交成功！')
      loadData()
    } catch (err) {
      alert(err.response?.data?.error || '提交失败')
    }
  }

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/service/orders/${orderId}/status`, { status })
      loadData()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    assigned: 'bg-blue-100 text-blue-700',
    repairing: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700'
  }

  const statusLabels = {
    pending: '待分配',
    assigned: '已分派',
    repairing: '维修中',
    completed: '已完成',
    cancelled: '已取消'
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">我的工单</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          + 提交工单
        </button>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <h4 className="font-semibold text-gray-800">
                      工单 #{order.id}
                    </h4>
                    <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || ''}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    设备: {order.model} ({order.vin})
                  </p>
                  {order.fault_code && (
                    <p className="text-sm text-orange-600 mt-1">
                      故障码: {order.fault_code}
                    </p>
                  )}
                  {order.description && (
                    <p className="text-sm text-gray-600 mt-2">{order.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {order.shop_name && (
                    <div>
                      <div className="text-gray-500">维修网点</div>
                      <div className="text-gray-800 font-medium mt-1">{order.shop_name}</div>
                    </div>
                  )}
                  {order.technician_name && (
                    <div>
                      <div className="text-gray-500">维修技师</div>
                      <div className="text-gray-800 font-medium mt-1">{order.technician_name}</div>
                    </div>
                  )}
                  {order.cost > 0 && (
                    <div>
                      <div className="text-gray-500">维修费用</div>
                      <div className="text-orange-600 font-bold mt-1">¥{order.cost}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-gray-500">提交时间</div>
                    <div className="text-gray-800 mt-1">
                      {new Date(order.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              </div>

              {order.status === 'completed' && (
                <div className="mt-4 flex justify-end">
                  <span className="text-green-600 text-sm">✓ 维修已完成</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📋</div>
          <p>暂无维修工单</p>
          <p className="text-sm mt-2">设备有问题？快提交工单吧</p>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">提交维修工单</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择设备
                </label>
                <select
                  value={newOrder.device_id}
                  onChange={(e) => setNewOrder({ ...newOrder, device_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                >
                  <option value="">请选择设备</option>
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>{d.model} ({d.vin})</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  故障代码
                </label>
                <select
                  value={newOrder.fault_code}
                  onChange={(e) => setNewOrder({ ...newOrder, fault_code: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                >
                  <option value="">请选择（可选）</option>
                  {faultCodes.map(f => (
                    <option key={f.code} value={f.code}>{f.code} - {f.description}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  故障描述
                </label>
                <textarea
                  value={newOrder.description}
                  onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none h-24 resize-none"
                  placeholder="请描述故障现象..."
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  预约时间
                </label>
                <input
                  type="datetime-local"
                  value={newOrder.appointment_time}
                  onChange={(e) => setNewOrder({ ...newOrder, appointment_time: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  提交
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

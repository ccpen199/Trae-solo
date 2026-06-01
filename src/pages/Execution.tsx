import React, { useState, useEffect } from 'react'
import { Plus, CheckCircle, Clock, AlertCircle, ChefHat, Wrench, BedDouble, Users } from 'lucide-react'
import { api } from '../lib/api'

const departments = [
  { id: 'kitchen', name: '厨房', icon: ChefHat, color: 'text-orange-600' },
  { id: 'housekeeping', name: '客房', icon: BedDouble, color: 'text-blue-600' },
  { id: 'engineering', name: '工程', icon: Wrench, color: 'text-green-600' },
  { id: 'service', name: '服务', icon: Users, color: 'text-purple-600' },
]

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

const statusLabels: Record<string, string> = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成',
}

export default function Execution() {
  const [orders, setOrders] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [filterDept, setFilterDept] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [formData, setFormData] = useState({
    booking_id: '',
    department: 'kitchen',
    content: '',
    assignee: '',
    priority: 'normal',
  })
  const [batchOrders, setBatchOrders] = useState([
    { department: 'kitchen', content: '', assignee: '' },
    { department: 'service', content: '', assignee: '' },
  ])

  useEffect(() => {
    loadData()
  }, [filterDept])

  async function loadData() {
    try {
      const params: any = {}
      if (filterDept !== 'all') params.department = filterDept
      
      const [ordersRes, bookingsRes] = await Promise.all([
        api.execution.list(params),
        api.bookings.list(),
      ])
      setOrders(ordersRes.data)
      setBookings(bookingsRes.data)
    } catch (error) {
      console.error('加载数据失败', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.execution.create(formData)
      setShowModal(false)
      loadData()
      setFormData({ booking_id: '', department: 'kitchen', content: '', assignee: '', priority: 'normal' })
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function handleBatchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBooking) return
    
    try {
      const validOrders = batchOrders.filter(o => o.content.trim())
      if (validOrders.length === 0) {
        alert('请至少填写一项任务')
        return
      }
      
      await api.execution.createBatch({
        booking_id: selectedBooking.id,
        orders: validOrders,
      })
      setShowBatchModal(false)
      loadData()
      setBatchOrders([
        { department: 'kitchen', content: '', assignee: '' },
        { department: 'service', content: '', assignee: '' },
      ])
      setSelectedBooking(null)
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function handleUpdateStatus(order: any, status: string) {
    try {
      await api.execution.update(order.id, { status })
      loadData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  function getDepartmentInfo(deptId: string) {
    return departments.find(d => d.id === deptId) || departments[0]
  }

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    completed: orders.filter(o => o.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500">管理各部门执行任务，跟踪宴会执行进度</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBatchModal(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            批量生成
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新增任务
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">全部任务</span>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">待处理</span>
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">进行中</span>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-blue-600">{stats.in_progress}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">已完成</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-green-600">{stats.completed}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterDept('all')}
            className={`px-4 py-2 rounded-lg ${
              filterDept === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          {departments.map(dept => {
            const DeptIcon = dept.icon
            return (
              <button
                key={dept.id}
                onClick={() => setFilterDept(dept.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  filterDept === dept.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <DeptIcon className="w-4 h-4" />
                {dept.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">部门</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">任务内容</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">关联预订</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">负责人</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">优先级</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">状态</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => {
                const deptInfo = getDepartmentInfo(order.department)
                const DeptIcon = deptInfo.icon
                return (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DeptIcon className={`w-4 h-4 ${deptInfo.color}`} />
                        <span>{deptInfo.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-medium">{order.content}</div>
                      <div className="text-xs text-gray-500">{order.created_at}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{order.customer_name}</div>
                      <div className="text-xs text-gray-500">{order.booking_date}</div>
                    </td>
                    <td className="px-6 py-4">{order.assignee || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        order.priority === 'high' ? 'bg-red-100 text-red-700' :
                        order.priority === 'low' ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.priority === 'high' ? '高' : order.priority === 'low' ? '低' : '中'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {order.status !== 'completed' ? (
                          <button
                            onClick={() => handleUpdateStatus(order, 'completed')}
                            className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                            title="标记完成"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : null}
                        {order.status === 'pending' ? (
                          <button
                            onClick={() => handleUpdateStatus(order, 'in_progress')}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="开始执行"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    暂无执行任务
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold">新增执行任务</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">关联预订 *</label>
                <select
                  value={formData.booking_id}
                  onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">请选择预订</option>
                  {bookings.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.customer_name} - {b.booking_date} {b.hall_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">执行部门 *</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">任务内容 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
                  <input
                    type="text"
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">低</option>
                    <option value="normal">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold">批量生成执行单</h3>
            </div>
            <form onSubmit={handleBatchSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择预订 *</label>
                <select
                  value={selectedBooking?.id || ''}
                  onChange={(e) => {
                    const booking = bookings.find((b: any) => b.id === Number(e.target.value))
                    setSelectedBooking(booking || null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">请选择预订</option>
                  {bookings.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.customer_name} - {b.booking_date} {b.hall_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-3">
                {batchOrders.map((order, index) => {
                  const deptInfo = getDepartmentInfo(order.department)
                  const DeptIcon = deptInfo.icon
                  return (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <DeptIcon className="w-5 h-5" />
                        <span className="font-medium">{deptInfo.name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">任务内容 *</label>
                          <textarea
                            value={order.content}
                            onChange={(e) => {
                              const newOrders = [...batchOrders]
                              newOrders[index].content = e.target.value
                              setBatchOrders(newOrders)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
                          <input
                            type="text"
                            value={order.assignee}
                            onChange={(e) => {
                              const newOrders = [...batchOrders]
                              newOrders[index].assignee = e.target.value
                              setBatchOrders(newOrders)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => setBatchOrders([...batchOrders, { department: 'kitchen', content: '', assignee: '' }])}
                className="text-blue-600 text-sm hover:underline"
              >
                + 添加部门任务
              </button>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  批量创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

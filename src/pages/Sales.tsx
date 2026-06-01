import React, { useState, useEffect } from 'react'
import { Plus, Lock, UtensilsCrossed, Wine, Sparkles, Monitor, CheckCircle } from 'lucide-react'
import { api } from '../lib/api'

export default function Sales() {
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [salesPlans, setSalesPlans] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    menu_items: '',
    drinks: '',
    decorations: '',
    equipment: '',
    service_fee: '',
    discount: '',
    total_amount: '',
  })

  useEffect(() => {
    loadBookings()
  }, [])

  async function loadBookings() {
    try {
      const res = await api.bookings.list()
      setBookings(res.data)
    } catch (error) {
      console.error('加载预订失败', error)
    }
  }

  async function loadSalesPlans(bookingId: number) {
    try {
      const res = await api.sales.list(bookingId) as any
      setSalesPlans(res.data)
    } catch (error) {
      console.error('加载销售方案失败', error)
    }
  }

  function handleSelectBooking(booking: any) {
    setSelectedBooking(booking)
    loadSalesPlans(booking.id)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBooking) return
    
    try {
      await api.sales.create({
        booking_id: selectedBooking.id,
        menu_items: formData.menu_items.split('\n').filter(Boolean),
        drinks: formData.drinks.split('\n').filter(Boolean),
        decorations: formData.decorations.split('\n').filter(Boolean),
        equipment: formData.equipment.split('\n').filter(Boolean),
        service_fee: Number(formData.service_fee),
        discount: Number(formData.discount),
        total_amount: Number(formData.total_amount),
      })
      
      setShowModal(false)
      loadSalesPlans(selectedBooking.id)
      setFormData({ menu_items: '', drinks: '', decorations: '', equipment: '', service_fee: '', discount: '', total_amount: '' })
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function handleLock(planId: number) {
    if (!confirm('确定要锁定此销售方案吗？锁定后将无法修改。')) return
    
    try {
      await api.sales.lock(planId, '销售')
      loadSalesPlans(selectedBooking.id)
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500">为预订创建销售方案，包含菜单、酒水、布置、设备等</p>
        {selectedBooking && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            新建方案
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 font-medium">预订列表</div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {bookings.map((booking: any) => (
              <div
                key={booking.id}
                onClick={() => handleSelectBooking(booking)}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedBooking?.id === booking.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="font-medium">{booking.customer_name}</div>
                <div className="text-sm text-gray-500">
                  {booking.booking_date} · {booking.hall_name}
                </div>
                <div className="text-sm text-gray-500">
                  {booking.event_type} · {booking.tables_count}桌
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedBooking ? (
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-lg mb-4">销售方案历史</h3>
                {salesPlans.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    暂无销售方案，点击右上角创建
                  </div>
                ) : (
                  <div className="space-y-4">
                    {salesPlans.map((plan: any) => (
                      <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">版本 {plan.version}</span>
                            {plan.is_locked ? (
                              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                <Lock className="w-3 h-3" /> 已锁定
                              </span>
                            ) : (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                草稿
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{plan.created_at}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <UtensilsCrossed className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <div className="text-sm font-medium">菜单</div>
                              <div className="text-sm text-gray-600">
                                {plan.menu_items ? JSON.parse(plan.menu_items).length : 0} 项
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Wine className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <div className="text-sm font-medium">酒水</div>
                              <div className="text-sm text-gray-600">
                                {plan.drinks ? JSON.parse(plan.drinks).length : 0} 项
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <div className="text-sm font-medium">布置</div>
                              <div className="text-sm text-gray-600">
                                {plan.decorations ? JSON.parse(plan.decorations).length : 0} 项
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Monitor className="w-4 h-4 text-gray-400 mt-1" />
                            <div>
                              <div className="text-sm font-medium">设备</div>
                              <div className="text-sm text-gray-600">
                                {plan.equipment ? JSON.parse(plan.equipment).length : 0} 项
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                          <div className="flex gap-4">
                            <span className="text-sm">服务费: ¥{plan.service_fee}</span>
                            <span className="text-sm">优惠: ¥{plan.discount}</span>
                            <span className="text-sm font-semibold">总计: ¥{plan.total_amount}</span>
                          </div>
                          {!plan.is_locked && (
                            <button
                              onClick={() => handleLock(plan.id)}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                              确认锁定
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
              请从左侧选择一个预订查看销售方案
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold">新建销售方案</h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedBooking?.customer_name} - {selectedBooking?.hall_name}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">菜单（每行一项）</label>
                <textarea
                  value={formData.menu_items}
                  onChange={(e) => setFormData({ ...formData, menu_items: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="红烧狮子头
清蒸鲈鱼
..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">酒水</label>
                <textarea
                  value={formData.drinks}
                  onChange={(e) => setFormData({ ...formData, drinks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="白酒
红酒
..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">布置</label>
                <textarea
                  value={formData.decorations}
                  onChange={(e) => setFormData({ ...formData, decorations: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="鲜花布置
气球拱门
..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">设备</label>
                <textarea
                  value={formData.equipment}
                  onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="音响
投影仪
..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">服务费</label>
                  <input
                    type="number"
                    value={formData.service_fee}
                    onChange={(e) => setFormData({ ...formData, service_fee: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优惠</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">总计金额</label>
                  <input
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
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
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { BarChart3, CheckCircle, AlertTriangle, FileCheck, DollarSign, Building2, Users, Calendar } from 'lucide-react'
import { api } from '../lib/api'

export default function Reports() {
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [hallUsage, setHallUsage] = useState<any[]>([])
  const [eventTypes, setEventTypes] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [checklist, setChecklist] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [revenueRes, hallUsageRes, eventTypesRes, bookingsRes] = await Promise.all([
        api.reports.revenue({}),
        api.reports.hallUsage({}),
        api.reports.eventTypes(),
        api.bookings.list(),
      ])
      
      setRevenueData((revenueRes as any).data)
      setHallUsage((hallUsageRes as any).data)
      setEventTypes((eventTypesRes as any).data)
      setBookings(bookingsRes.data)
    } catch (error) {
      console.error('加载报表失败', error)
    }
  }

  async function loadChecklist(booking: any) {
    setSelectedBooking(booking)
    try {
      const res = await api.reports.checklist(booking.id) as any
      setChecklist(res.data)
    } catch (error) {
      console.error('加载验收清单失败', error)
    }
  }

  const totalRevenue = revenueData.reduce((sum, d) => sum + (d.total_revenue || 0), 0)
  const totalBookings = revenueData.reduce((sum, d) => sum + (d.booking_count || 0), 0)
  const totalTables = revenueData.reduce((sum, d) => sum + (d.total_tables || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-gray-500">查看收入报表、场地使用率和宴会验收</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-gray-500 text-sm">总收入</span>
          </div>
          <div className="text-2xl font-bold">¥{totalRevenue.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-500 text-sm">预订场次</span>
          </div>
          <div className="text-2xl font-bold">{totalBookings}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-gray-500 text-sm">总桌数</span>
          </div>
          <div className="text-2xl font-bold">{totalTables}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-gray-500 text-sm">宴会厅数</span>
          </div>
          <div className="text-2xl font-bold">{hallUsage.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            宴会厅使用情况
          </h3>
          <div className="space-y-4">
            {hallUsage.map((hall: any) => (
              <div key={hall.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{hall.name}</span>
                  <span className="text-sm text-gray-500">
                    {hall.booking_count || 0} 场 / {hall.total_tables || 0} 桌
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min((hall.booking_count || 0) * 20, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            活动类型分布
          </h3>
          <div className="space-y-3">
            {eventTypes.map((item: any) => (
              <div key={item.event_type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>{item.event_type}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{item.count} 场</span>
                  <span className="text-sm text-gray-500">{item.total_tables} 桌</span>
                </div>
              </div>
            ))}
            {eventTypes.length === 0 && (
              <div className="text-center text-gray-500 py-4">暂无数据</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <FileCheck className="w-5 h-5" />
          宴会验收清单
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="border-r border-gray-100 pr-6">
            <div className="text-sm font-medium text-gray-500 mb-3">选择预订</div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {bookings.map((booking: any) => (
                <div
                  key={booking.id}
                  onClick={() => loadChecklist(booking)}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedBooking?.id === booking.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="font-medium">{booking.customer_name}</div>
                  <div className="text-sm text-gray-500">
                    {booking.booking_date} · {booking.hall_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:col-span-2">
            {checklist ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium mb-1">{checklist.booking.customer_name}</div>
                  <div className="text-sm text-gray-500">
                    {checklist.booking.booking_date} {checklist.booking.start_time}-{checklist.booking.end_time} · {checklist.booking.hall_name}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                    checklist.checks.has_conflict ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'
                  }`}>
                    {checklist.checks.has_conflict ? (
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                    <div>
                      <div className="font-medium">档期冲突检查</div>
                      <div className="text-sm text-gray-600">
                        {checklist.checks.has_conflict ? '存在冲突' : '无冲突'}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                    checklist.checks.has_sales_plan ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'
                  }`}>
                    {checklist.checks.has_sales_plan ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    )}
                    <div>
                      <div className="font-medium">销售方案</div>
                      <div className="text-sm text-gray-600">
                        {checklist.checks.has_sales_plan ? '已创建并锁定' : '待创建'}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                    checklist.checks.has_contract ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'
                  }`}>
                    {checklist.checks.has_contract ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    )}
                    <div>
                      <div className="font-medium">合同签署</div>
                      <div className="text-sm text-gray-600">
                        {checklist.checks.has_contract ? '已创建' : '待创建'}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                    checklist.checks.deposit_received ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'
                  }`}>
                    {checklist.checks.deposit_received ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    )}
                    <div>
                      <div className="font-medium">定金收取</div>
                      <div className="text-sm text-gray-600">
                        {checklist.checks.deposit_received ? '已收到' : '待收取'}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                    checklist.checks.has_execution_orders ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'
                  }`}>
                    {checklist.checks.has_execution_orders ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    )}
                    <div>
                      <div className="font-medium">执行单</div>
                      <div className="text-sm text-gray-600">
                        {checklist.checks.has_execution_orders ? `已创建 (${checklist.execution_orders?.length || 0}项)` : '待创建'}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                    checklist.checks.all_executed ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'
                  }`}>
                    {checklist.checks.all_executed ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    )}
                    <div>
                      <div className="font-medium">执行完成</div>
                      <div className="text-sm text-gray-600">
                        {checklist.checks.all_executed ? '全部完成' : '待执行'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                请从左侧选择一个预订查看验收清单
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

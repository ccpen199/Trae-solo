import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Building2, AlertTriangle, CheckCircle, Clock, DollarSign, Users } from 'lucide-react'
import { api } from '../lib/api'

export default function Home() {
  const [stats, setStats] = useState({
    todayBookings: 0,
    totalHalls: 0,
    pendingDeposit: 0,
    thisMonthRevenue: 0,
  })
  const [todayBookings, setTodayBookings] = useState<any[]>([])
  const [pendingAlerts, setPendingAlerts] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const today = new Date().toISOString().split('T')[0]
      const [bookingsRes, hallsRes, alertsRes] = await Promise.all([
        api.bookings.list({ date: today }),
        api.halls.list({ status: 'active' }),
        api.reports.pendingDepositAlert(),
      ])
      
      setTodayBookings(bookingsRes.data)
      setStats(prev => ({
        ...prev,
        todayBookings: bookingsRes.data.length,
        totalHalls: hallsRes.data.length,
        pendingDeposit: (alertsRes as any).data.length,
      }))
      setPendingAlerts((alertsRes as any).data)
    } catch (error) {
      console.error('加载数据失败', error)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }

  const statusLabels: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">今日宴会</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.todayBookings}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">宴会厅数量</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.totalHalls}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待收定金</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">{stats.pendingDeposit}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">本月收入</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">¥{stats.thisMonthRevenue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              今日安排
            </h2>
          </div>
          <div className="p-6">
            {todayBookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                今日暂无宴会安排
              </div>
            ) : (
              <div className="space-y-4">
                {todayBookings.map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{booking.customer_name}</p>
                        <p className="text-sm text-gray-500">
                          {booking.hall_name} · {booking.start_time}-{booking.end_time} · {booking.tables_count}桌
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              待收定金提醒
            </h2>
          </div>
          <div className="p-6">
            {pendingAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
                <CheckCircle className="w-12 h-12 text-green-500" />
                暂无待收定金的预订
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAlerts.slice(0, 5).map((alert: any) => (
                  <div key={alert.id} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{alert.customer_name}</p>
                        <p className="text-sm text-gray-500">
                          {alert.hall_name} · {alert.booking_date}
                        </p>
                      </div>
                      <span className="text-sm text-orange-600 font-medium">
                        ¥{alert.deposit_amount || '待设置'}
                      </span>
                    </div>
                  </div>
                ))}
                {pendingAlerts.length > 5 && (
                  <Link to="/contracts" className="block text-center text-blue-600 text-sm hover:underline">
                    查看全部 {pendingAlerts.length} 条
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Link to="/bookings" className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Calendar className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">新建预订</span>
          </Link>
          <Link to="/halls" className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <Building2 className="w-8 h-8 text-green-600" />
            <span className="text-sm font-medium text-gray-700">宴会厅</span>
          </Link>
          <Link to="/contracts" className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <DollarSign className="w-8 h-8 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">合同管理</span>
          </Link>
          <Link to="/execution" className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <CheckCircle className="w-8 h-8 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">执行单</span>
          </Link>
          <Link to="/reports" className="flex flex-col items-center gap-2 p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">
            <DollarSign className="w-8 h-8 text-pink-600" />
            <span className="text-sm font-medium text-gray-700">收入报表</span>
          </Link>
          <Link to="/sales" className="flex flex-col items-center gap-2 p-4 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors">
            <CheckCircle className="w-8 h-8 text-cyan-600" />
            <span className="text-sm font-medium text-gray-700">销售方案</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

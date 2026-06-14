import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Truck, Clock, AlertTriangle, Package, CheckCircle2, XCircle, Timer } from 'lucide-react'
import { logisticsOrders } from '@/mocks'
import type { LogisticsOrder } from '@/types'

const statusConfig: Record<LogisticsOrder['status'], { label: string; color: string; bg: string }> = {
  pending: { label: '待发运', color: 'text-gray-600', bg: 'bg-gray-100' },
  in_transit: { label: '运输中', color: 'text-blue-600', bg: 'bg-blue-50' },
  delivered: { label: '已送达', color: 'text-green-600', bg: 'bg-green-50' },
  exception: { label: '异常', color: 'text-red-600', bg: 'bg-red-50' },
}

function RouteVisualization({ route }: { route: LogisticsOrder['route'] }) {
  return (
    <div className="flex items-center gap-0 py-2 px-1">
      {route.map((point, idx) => (
        <div key={idx} className="flex items-center">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              idx === 0
                ? 'bg-primary-500'
                : idx === route.length - 1
                  ? 'bg-gold-500'
                  : 'bg-gray-300'
            }`}
          />
          {idx < route.length - 1 && (
            <div className="w-6 h-0 border-t-2 border-dashed border-gray-300" />
          )}
        </div>
      ))}
    </div>
  )
}

export default function LogisticsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const totalShipments = logisticsOrders.length
  const inTransitCount = logisticsOrders.filter(o => o.status === 'in_transit').length
  const deliveredToday = logisticsOrders.filter(o => o.status === 'delivered').length
  const activeAlerts = logisticsOrders.reduce((sum, o) => sum + o.alerts.filter(a => !a.resolved).length, 0)

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 text-white">
        <div className="container mx-auto px-4 py-8 lg:py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-serif text-3xl lg:text-4xl font-bold">物流追踪</h1>
            <p className="mt-2 text-primary-100 text-sm lg:text-base">温湿度监控 · 轨迹追踪 · 异常预警</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[
            { label: '总运单', value: totalShipments, icon: Package, color: 'from-primary-500 to-primary-600' },
            { label: '运输中', value: inTransitCount, icon: Truck, color: 'from-blue-500 to-blue-600' },
            { label: '已送达', value: deliveredToday, icon: CheckCircle2, color: 'from-green-500 to-green-600' },
            { label: '活跃预警', value: activeAlerts, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-2xl lg:text-3xl font-bold mt-1 text-gray-800">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={20} className="text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="space-y-4">
          {logisticsOrders.map((order, idx) => {
            const config = statusConfig[order.status]
            const unresolvedAlerts = order.alerts.filter(a => !a.resolved).length
            const isExpanded = expandedId === order.id

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link to={`/logistics/${order.id}`} className="block">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all overflow-hidden">
                    <div className="p-4 lg:p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-serif text-lg font-semibold text-gray-800">{order.productName}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                              {config.label}
                            </span>
                            {unresolvedAlerts > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                                <AlertTriangle size={12} />
                                {unresolvedAlerts}个预警
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">批次号: {order.batchNo}</p>

                          <div className="flex items-center gap-2 mt-3 text-sm">
                            <span className="text-gray-700 font-medium">{order.origin}</span>
                            <ArrowRight size={16} className="text-primary-500 shrink-0" />
                            <span className="text-gray-700 font-medium">{order.destination}</span>
                          </div>

                          <RouteVisualization route={order.route} />
                        </div>

                        <div className="flex flex-row lg:flex-col gap-3 lg:gap-2 lg:items-end lg:min-w-[200px]">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Truck size={14} className="text-gray-400" />
                            <span>{order.carrier}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Package size={14} className="text-gray-400" />
                            <span>{order.vehicleNo}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock size={14} className="text-gray-400" />
                            <span>预计 {order.estimatedArrival}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="border-t border-gray-100 px-4 lg:px-6 py-4 bg-gray-50/50"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">当前温度</h4>
                            {order.tempData.length > 0 && (
                              <p className="text-lg font-bold text-primary-600">
                                {order.tempData[order.tempData.length - 1].temp}°C
                              </p>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">当前湿度</h4>
                            {order.tempData.length > 0 && (
                              <p className="text-lg font-bold text-blue-600">
                                {order.tempData[order.tempData.length - 1].humidity}%
                              </p>
                            )}
                          </div>
                        </div>
                        {order.alerts.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">预警记录</h4>
                            <div className="space-y-2">
                              {order.alerts.map(alert => (
                                <div
                                  key={alert.id}
                                  className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                                    alert.resolved ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                  }`}
                                >
                                  {alert.resolved ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" /> : <XCircle size={14} className="mt-0.5 shrink-0" />}
                                  <div>
                                    <p>{alert.message}</p>
                                    <p className="text-xs opacity-70 mt-0.5">{alert.timestamp}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </Link>

                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setExpandedId(isExpanded ? null : order.id)
                  }}
                  className="mt-2 flex items-center gap-1 text-xs text-primary-500 hover:text-primary-700 transition-colors mx-auto"
                >
                  <Timer size={12} />
                  {isExpanded ? '收起详情' : '展开详情'}
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

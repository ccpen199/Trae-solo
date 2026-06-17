import { useState } from 'react'
import { AlertTriangle, PieChart as PieChartIcon, List, Eye } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type AnomalyType = 'timeout' | 'cancel_surge' | 'price_error' | 'rider_complaint' | 'address_invalid'

interface AnomalyRecord {
  id: string
  orderId: string
  type: AnomalyType
  description: string
  severity: 'high' | 'medium' | 'low'
  status: 'pending' | 'processing' | 'resolved'
  createdAt: string
}

const anomalyLabels: Record<AnomalyType, string> = {
  timeout: '超时未送达',
  cancel_surge: '取消量激增',
  price_error: '价格异常',
  rider_complaint: '骑手投诉',
  address_invalid: '地址无效',
}

const severityConfig: Record<AnomalyRecord['severity'], { label: string; color: string }> = {
  high: { label: '高', color: '#EF4444' },
  medium: { label: '中', color: '#F59E0B' },
  low: { label: '低', color: '#3B82F6' },
}

const statusConfig: Record<AnomalyRecord['status'], { label: string; color: string }> = {
  pending: { label: '待处理', color: '#F59E0B' },
  processing: { label: '处理中', color: '#3B82F6' },
  resolved: { label: '已解决', color: '#10B981' },
}

const attributionData = [
  { name: '超时未送达', value: 35, color: '#EF4444' },
  { name: '取消量激增', value: 25, color: '#F59E0B' },
  { name: '价格异常', value: 18, color: '#8B5CF6' },
  { name: '骑手投诉', value: 12, color: '#3B82F6' },
  { name: '地址无效', value: 10, color: '#6B7280' },
]

const mockAnomalies: AnomalyRecord[] = [
  { id: '1', orderId: 'ORD20240115001', type: 'timeout', description: '配送超时45分钟，用户投诉', severity: 'high', status: 'pending', createdAt: '2024-01-15 14:30' },
  { id: '2', orderId: 'ORD20240115002', type: 'cancel_surge', description: '某区域30分钟内取消率达40%', severity: 'high', status: 'processing', createdAt: '2024-01-15 13:20' },
  { id: '3', orderId: 'ORD20240115003', type: 'price_error', description: '订单配送费计算异常，偏差>50%', severity: 'medium', status: 'pending', createdAt: '2024-01-15 12:10' },
  { id: '4', orderId: 'ORD20240115004', type: 'rider_complaint', description: '骑手投诉商家出餐慢导致超时', severity: 'medium', status: 'processing', createdAt: '2024-01-15 11:00' },
  { id: '5', orderId: 'ORD20240115005', type: 'address_invalid', description: '多个订单定位偏差超500米', severity: 'low', status: 'resolved', createdAt: '2024-01-15 10:30' },
  { id: '6', orderId: 'ORD20240115006', type: 'timeout', description: '高峰期批量配送超时', severity: 'high', status: 'pending', createdAt: '2024-01-15 09:00' },
]

export default function Anomaly() {
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>(mockAnomalies)

  const handleAction = (id: string, action: 'process' | 'resolve') => {
    setAnomalies((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: action === 'process' ? 'processing' : 'resolved' } : a,
      ),
    )
  }

  const pendingCount = anomalies.filter((a) => a.status === 'pending').length
  const processingCount = anomalies.filter((a) => a.status === 'processing').length
  const highCount = anomalies.filter((a) => a.severity === 'high').length

  return (
    <div className="space-y-6" style={{ backgroundColor: '#0F172A', minHeight: '100vh', padding: '1.5rem' }}>
      <h1 className="text-2xl font-bold text-white">异常归因</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">待处理异常</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-white">{pendingCount}</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">处理中</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white">{processingCount}</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">高严重度</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-red-400">{highCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-semibold text-white">归因分布</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={attributionData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#64748B' }}>
                {attributionData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <List className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">异常订单列表</h3>
          </div>
          <div className="space-y-3">
            {anomalies.map((anomaly) => (
              <div key={anomaly.id} className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/50">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono text-gray-400">{anomaly.orderId}</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: severityConfig[anomaly.severity].color + '20', color: severityConfig[anomaly.severity].color }}
                      >
                        {severityConfig[anomaly.severity].label}
                      </span>
                    </div>
                    <div className="text-sm text-white">{anomaly.description}</div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: statusConfig[anomaly.status].color + '20', color: statusConfig[anomaly.status].color }}
                  >
                    {statusConfig[anomaly.status].label}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-500">
                    {anomalyLabels[anomaly.type]} · {anomaly.createdAt}
                  </div>
                  <div className="flex gap-2">
                    {anomaly.status === 'pending' && (
                      <button
                        onClick={() => handleAction(anomaly.id, 'process')}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                      >
                        开始处理
                      </button>
                    )}
                    {anomaly.status === 'processing' && (
                      <button
                        onClick={() => handleAction(anomaly.id, 'resolve')}
                        className="px-3 py-1 rounded-lg text-xs font-medium bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
                      >
                        标记解决
                      </button>
                    )}
                    <button className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-700/50 text-gray-400 hover:bg-slate-700 transition-colors">
                      <Eye className="w-3.5 h-3.5 inline mr-1" />
                      详情
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

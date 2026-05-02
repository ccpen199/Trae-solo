import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'

interface Event {
  id: string
  aggregate_type: string
  aggregate_id: string
  event_type: string
  payload: any
  metadata: any
  created_at: string
}

export default function AdminAudit() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [filter, setFilter] = useState({
    aggregate_type: '',
    event_type: '',
  })

  useEffect(() => {
    fetchEvents()
  }, [filter])

  const fetchEvents = async () => {
    try {
      const params: Record<string, string> = {}
      if (filter.aggregate_type) params.aggregate_type = filter.aggregate_type
      if (filter.event_type) params.event_type = filter.event_type
      
      const response = await adminApi.getEvents(params)
      setEvents(response.data || [])
    } catch (error) {
      console.error('获取事件列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getAggregateTypeText = (type: string) => {
    const map: Record<string, string> = {
      User: '用户',
      Order: '订单',
      Asset: '资产',
      Product: '产品',
      Assessment: '风险测评',
      Dividend: '分红',
      Reconciliation: '对账',
      Alert: '告警',
    }
    return map[type] || type
  }

  const getEventTypeBadge = (eventType: string) => {
    if (eventType.includes('Submitted') || eventType.includes('Created')) {
      return { class: 'badge-info', text: '提交' }
    }
    if (eventType.includes('Confirmed') || eventType.includes('Completed')) {
      return { class: 'badge-success', text: '确认/完成' }
    }
    if (eventType.includes('Rejected')) {
      return { class: 'badge-danger', text: '驳回' }
    }
    if (eventType.includes('Retried')) {
      return { class: 'badge-warning', text: '重试' }
    }
    if (eventType.includes('Closed')) {
      return { class: 'badge-gray', text: '关闭' }
    }
    if (eventType.includes('Failed')) {
      return { class: 'badge-danger', text: '失败' }
    }
    return { class: 'badge-info', text: eventType }
  }

  const getAggregateTypeOptions = () => {
    const types = ['User', 'Order', 'Asset', 'Product', 'Assessment', 'Dividend', 'Reconciliation', 'Alert']
    return types.map(t => ({ value: t, label: getAggregateTypeText(t) }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">审计溯源</h1>
        <p className="text-gray-500 mt-1">查看和查询所有业务事件记录，支持全量审计溯源</p>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">聚合类型</label>
            <select
              value={filter.aggregate_type}
              onChange={(e) => setFilter({ ...filter, aggregate_type: e.target.value })}
              className="select-field w-40"
            >
              <option value="">全部类型</option>
              {getAggregateTypeOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchEvents}
              className="btn-primary"
            >
              刷新数据
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📜</p>
            <p className="text-gray-500">暂无事件记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">聚合类型</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">事件类型</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">聚合ID</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const badge = getEventTypeBadge(event.event_type)
                  return (
                    <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(event.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {getAggregateTypeText(event.aggregate_type)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${badge.class}`}>{event.event_type}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-500 font-mono">
                          {event.aggregate_id.substring(0, 12)}...
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">事件详情</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">事件ID</p>
                  <p className="font-medium text-gray-900 font-mono text-sm">{selectedEvent.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">创建时间</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedEvent.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">聚合类型</p>
                  <p className="font-medium text-gray-900">
                    {getAggregateTypeText(selectedEvent.aggregate_type)} ({selectedEvent.aggregate_type})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">聚合ID</p>
                  <p className="font-medium text-gray-900 font-mono text-sm">{selectedEvent.aggregate_id}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">事件载荷 (Payload)</p>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>

              {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">元数据 (Metadata)</p>
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="btn-secondary"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

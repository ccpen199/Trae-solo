import { useState, useEffect } from 'react'
import { Calendar, User, Clock, Link2, AlertCircle, Loader2 } from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { scheduleApi, dispatchApi } from '@/services/api'
import type { Application, Schedule, Dispatch } from '@/types'

const PRIORITY_CONFIG: Record<number, { label: string; className: string }> = {
  1: { label: '紧急', className: 'bg-red-100 text-red-700' },
  2: { label: '紧急', className: 'bg-red-50 text-red-600' },
  3: { label: '一般', className: 'bg-yellow-100 text-yellow-700' },
  4: { label: '一般', className: 'bg-yellow-50 text-yellow-600' },
  5: { label: '普通', className: 'bg-gray-100 text-gray-600' },
}

interface Props {
  app: Application
}

const ApplicationDetailPanel = ({ app }: Props) => {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [scheduleDispatchMap, setScheduleDispatchMap] = useState<Record<number, Dispatch>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchDispatchLinks = async (scheduleList: Schedule[]) => {
      try {
        const scheduleIds = new Set(scheduleList.map(s => s.id))
        const dispatchRes = await dispatchApi.getList({ pageSize: 50 })
        if (cancelled) return
        const newMap: Record<number, Dispatch> = {}
        for (const d of dispatchRes.data.list) {
          if (cancelled) break
          try {
            const detail = await dispatchApi.getDetail(d.id)
            if (cancelled) return
            const items = detail.data.items || []
            for (const item of items) {
              if (item.schedule_id && scheduleIds.has(item.schedule_id)) {
                newMap[item.schedule_id] = d
              }
            }
          } catch {}
        }
        setScheduleDispatchMap(newMap)
      } catch (err) {
        console.error('获取调度计划失败:', err)
      }
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await scheduleApi.getList({ application_id: app.id, pageSize: 100 })
        if (cancelled) return
        const scheduleList = res.data.list
        setSchedules(scheduleList)
        if (scheduleList.length > 0) {
          await fetchDispatchLinks(scheduleList)
        }
      } catch (err) {
        console.error('获取排程失败:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [app.id])

  const priorityConf = PRIORITY_CONFIG[app.priority] || PRIORITY_CONFIG[5]
  const isRejected = app.status === 'rejected'
  const rejectionReason = isRejected ? (app.rejection_reason || app.reason) : null

  return (
    <div className="p-4 bg-gray-50 space-y-4">
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">申请详情</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-md p-3 border">
            <div className="text-xs text-gray-400 mb-1">时间窗口</div>
            <div className="flex items-center text-sm">
              <Calendar className="h-3.5 w-3.5 mr-1 text-blue-500" />
              {app.start_date} ~ {app.end_date}
            </div>
          </div>
          <div className="bg-white rounded-md p-3 border">
            <div className="text-xs text-gray-400 mb-1">优先级</div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityConf.className}`}>
              {priorityConf.label} ({app.priority})
            </span>
          </div>
          <div className="bg-white rounded-md p-3 border">
            <div className="text-xs text-gray-400 mb-1">申请事由</div>
            <div className="text-sm truncate" title={app.reason}>
              {app.reason || '-'}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2">审核信息</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-md p-3 border">
            <div className="text-xs text-gray-400 mb-1">审核人</div>
            <div className="flex items-center text-sm">
              <User className="h-3.5 w-3.5 mr-1 text-gray-400" />
              {app.reviewed_by || '待审核'}
            </div>
          </div>
          <div className="bg-white rounded-md p-3 border">
            <div className="text-xs text-gray-400 mb-1">审核时间</div>
            <div className="flex items-center text-sm">
              <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
              {app.reviewed_at || '待审核'}
            </div>
          </div>
        </div>
        {isRejected && rejectionReason && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-red-500 font-medium">驳回原因</div>
                <div className="text-sm text-red-700">{rejectionReason}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
          <Link2 className="h-4 w-4 mr-1" />
          排程追溯
        </h4>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
            <span className="text-sm text-gray-500">加载排程数据...</span>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-4">暂无关联排程</div>
        ) : (
          <div className="bg-white rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">闸门</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">计划日期</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">时段</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">流量(m³/h)</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">水量(m³)</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">状态</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 whitespace-nowrap">调度计划</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(s => {
                  const dispatch = scheduleDispatchMap[s.id]
                  return (
                    <tr key={s.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">{s.gate_name || '-'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{s.scheduled_date}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{s.start_time} - {s.end_time}</td>
                      <td className="px-3 py-2">{s.planned_flow}</td>
                      <td className="px-3 py-2">{s.planned_volume}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {dispatch ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                            #{dispatch.id} {dispatch.plan_date} · {dispatch.water_source}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">未关联</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplicationDetailPanel

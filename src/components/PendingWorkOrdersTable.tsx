import { useNavigate } from 'react-router-dom'
import { AlertCircle, Camera, Clock } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import type { WorkOrder } from '@/api/client'

const woTypeLabels: Record<string, string> = {
  device_offline: '设备离线',
  port_damage: '端口损坏',
  charge_interrupt: '充电中断',
  complaint: '用户投诉',
}

interface PendingWorkOrdersTableProps {
  workOrders: WorkOrder[]
}

export default function PendingWorkOrdersTable({ workOrders }: PendingWorkOrdersTableProps) {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-500" />
          待处理工单
        </h3>
        <button type="button" onClick={() => navigate('/work-orders')} className="text-xs text-blue-600 hover:underline pointer-events-auto">
          查看全部
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>工单号</th>
              <th>故障类型</th>
              <th>优先级</th>
              <th>设备</th>
              <th>站点</th>
              <th>照片数</th>
              <th>投诉标记</th>
              <th>响应时间</th>
              <th>创建时间</th>
              <th>处理人</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {workOrders.length === 0 ? (
              <tr><td colSpan={11} className="text-center text-slate-400 py-6">暂无待处理工单</td></tr>
            ) : workOrders.map((wo) => (
              <tr key={wo.id}>
                <td className="font-mono text-xs">#{wo.id}</td>
                <td>{woTypeLabels[wo.type] || wo.type}</td>
                <td><StatusBadge status={wo.priority} type="priority" /></td>
                <td>{wo.device_name || wo.device_id || '-'}</td>
                <td>{wo.site_name || wo.site_id || '-'}</td>
                <td className="text-center">
                  <span className="inline-flex items-center gap-1">
                    <Camera className="w-3 h-3 text-slate-400" />
                    {wo.photo_count ?? '0'}
                  </span>
                </td>
                <td className="text-center">
                  {wo.type === 'complaint' ? (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-xs">投诉</span>
                    </span>
                  ) : '-'}
                </td>
                <td className="text-center">
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {wo.first_response_minutes != null ? `${wo.first_response_minutes}分钟` : '-'}
                  </span>
                </td>
                <td className="text-xs">{new Date(wo.created_at).toLocaleString()}</td>
                <td>{wo.assignee || '-'}</td>
                <td>
                  <button type="button" onClick={() => navigate(`/work-orders/${wo.id}`)} className="text-blue-600 hover:underline text-xs pointer-events-auto">
                    详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

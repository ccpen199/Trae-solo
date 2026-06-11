import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutGrid, List, Plus } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

type ViewMode = 'kanban' | 'list'

const mockOrders = [
  { id: '1', orderNo: 'WO-20260610-001', category: '水电', urgency: 'critical' as const, status: 'pending' as const, time: '10分钟前', reporter: '张三', description: '3号楼2单元501水管漏水严重' },
  { id: '2', orderNo: 'WO-20260610-002', category: '电梯', urgency: 'high' as const, status: 'pending' as const, time: '25分钟前', reporter: '李四', description: '5号楼电梯异响频繁' },
  { id: '3', orderNo: 'WO-20260609-008', category: '门窗', urgency: 'medium' as const, status: 'assigned' as const, time: '2小时前', reporter: '王五', description: '1号楼单元门关闭不严' },
  { id: '4', orderNo: 'WO-20260609-006', category: '管道', urgency: 'high' as const, status: 'processing' as const, time: '3小时前', reporter: '赵六', description: '2号楼下水管道堵塞' },
  { id: '5', orderNo: 'WO-20260609-005', category: '公共设施', urgency: 'low' as const, status: 'processing' as const, time: '4小时前', reporter: '孙七', description: '小区路灯不亮' },
  { id: '6', orderNo: 'WO-20260608-012', category: '水电', urgency: 'medium' as const, status: 'feedback' as const, time: '昨天', reporter: '周八', description: '6号楼走廊灯闪烁' },
  { id: '7', orderNo: 'WO-20260607-003', category: '电梯', urgency: 'low' as const, status: 'completed' as const, time: '3天前', reporter: '吴九', description: '4号楼电梯按键失灵' },
  { id: '8', orderNo: 'WO-20260607-001', category: '门窗', urgency: 'medium' as const, status: 'completed' as const, time: '3天前', reporter: '郑十', description: '7号楼楼道窗户破损' },
]

const columns = [
  { key: 'pending' as const, label: '待派单', color: 'border-amber-400' },
  { key: 'processing' as const, label: '处理中', color: 'border-blue-400' },
  { key: 'feedback' as const, label: '待反馈', color: 'border-purple-400' },
  { key: 'completed' as const, label: '已完成', color: 'border-emerald-400' },
]

const urgencyColors: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-amber-500', medium: 'bg-blue-500', low: 'bg-slate-400',
}

export default function RepairList() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <PageHeader
        title="工单列表"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('kanban')}
                className={cn('p-1.5 rounded-md transition-colors', viewMode === 'kanban' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400')}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-400')}
              >
                <List size={18} />
              </button>
            </div>
            <button
              onClick={() => navigate('/repairs/create')}
              className="h-9 px-4 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
            >
              <Plus size={16} />创建工单
            </button>
          </div>
        }
      />

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-4 gap-4">
          {columns.map((col) => {
            const items = mockOrders.filter((o) => o.status === col.key)
            return (
              <div key={col.key} className="bg-slate-100 rounded-xl p-3">
                <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${col.color}`}>
                  <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                  <span className="text-xs bg-white px-2 py-0.5 rounded-full text-slate-500">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/repairs/${order.id}`)}
                      className="bg-white rounded-lg p-3 shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-200 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-slate-400">{order.orderNo}</span>
                        <span className={`w-2 h-2 rounded-full ${urgencyColors[order.urgency]}`} />
                      </div>
                      <p className="text-sm text-slate-700 font-medium mb-1 line-clamp-2">{order.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400">{order.category}</span>
                        <span className="text-xs text-slate-400">{order.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">工单号</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">分类</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">描述</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">紧急度</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">状态</th>
                  <th className="px-5 py-3 text-xs font-medium text-slate-500 uppercase">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {mockOrders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => navigate(`/repairs/${o.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 text-sm font-mono text-slate-700">{o.orderNo}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{o.category}</td>
                    <td className="px-5 py-3 text-sm text-slate-800 max-w-xs truncate">{o.description}</td>
                    <td className="px-5 py-3"><StatusBadge status={o.urgency} /></td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3 text-sm text-slate-500">{o.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

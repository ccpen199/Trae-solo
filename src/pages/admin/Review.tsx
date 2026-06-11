import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '@/stores/adminStore'
import StatusBadge from '@/components/StatusBadge'
import { Filter, Eye } from 'lucide-react'
import { useEffect, useState } from 'react'

const statusMap: Record<string, { variant: 'pending' | 'success' | 'error' | 'info'; label: string }> = {
  pending: { variant: 'pending', label: '待复核' },
  approved: { variant: 'success', label: '已通过' },
  rejected: { variant: 'error', label: '已驳回' },
  transferred: { variant: 'info', label: '已转办' },
}

export default function Review() {
  const navigate = useNavigate()
  const { reviewOrders, fetchReviewOrders, loading } = useAdminStore()
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    const params: Record<string, string> = {}
    if (filterStatus) params.status = filterStatus
    fetchReviewOrders(params)
  }, [fetchReviewOrders, filterStatus])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={18} className="text-gray-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-badge px-3 py-2 text-sm bg-white"
        >
          <option value="">全部状态</option>
          <option value="pending">待复核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已驳回</option>
          <option value="transferred">已转办</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-20">加载中...</div>
      ) : (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">工单编号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">证件号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">姓名</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">认证时间</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">失败原因</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {reviewOrders.map((order) => {
                  const st = statusMap[order.status] || statusMap.pending
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => navigate(`/admin/review/${order.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                      <td className="px-4 py-3 font-mono text-xs">{order.idCard}</td>
                      <td className="px-4 py-3">{order.name}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{order.verifyTime}</td>
                      <td className="px-4 py-3">{order.failureReason}</td>
                      <td className="px-4 py-3">
                        <StatusBadge variant={st.variant} text={st.label} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/admin/review/${order.id}`) }}
                          className="flex items-center gap-1 text-primary hover:text-primary/80 text-sm"
                        >
                          <Eye size={14} />
                          查看
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

import { X } from 'lucide-react'
import type { Order } from '@/api/client'

interface FeeBreakdownModalProps {
  order: Order
  onClose: () => void
}

export default function FeeBreakdownModal({ order, onClose }: FeeBreakdownModalProps) {
  if (!order.fee_breakdown) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">费用明细</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500">订单号</span>
            <span className="font-mono text-sm">#{order.id}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500">电费</span>
            <span className="font-medium">¥{order.fee_breakdown.electricity_cost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-slate-500">服务费</span>
            <span className="font-medium">¥{order.fee_breakdown.service_cost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-700 font-semibold">总计</span>
            <span className="font-bold text-lg text-blue-600">¥{order.fee_breakdown.total_cost.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <button onClick={onClose} className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700">关闭</button>
        </div>
      </div>
    </div>
  )
}

export function FeeBreakdownTooltip({ order }: { order: Order }) {
  if (!order.fee_breakdown) return null
  return (
    <div className="absolute z-20 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-40 -top-2 left-1/2 -translate-x-1/2 -translate-y-full">
      <div className="flex justify-between gap-4 mb-1">
        <span className="text-slate-500">电费:</span>
        <span className="font-medium">¥{order.fee_breakdown.electricity_cost.toFixed(2)}</span>
      </div>
      <div className="flex justify-between gap-4 mb-1">
        <span className="text-slate-500">服务费:</span>
        <span className="font-medium">¥{order.fee_breakdown.service_cost.toFixed(2)}</span>
      </div>
      <div className="border-t border-slate-100 pt-1 mt-1 flex justify-between gap-4">
        <span className="text-slate-700 font-medium">总计:</span>
        <span className="font-semibold text-blue-600">¥{order.fee_breakdown.total_cost.toFixed(2)}</span>
      </div>
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45"></div>
    </div>
  )
}

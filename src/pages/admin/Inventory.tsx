import { useState } from 'react'
import { Search, Package, Link2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

const warehouses = [
  { name: '华东仓', total: 12580, lowStock: 23 },
  { name: '华南仓', total: 8960, lowStock: 15 },
  { name: '华北仓', total: 10340, lowStock: 31 },
]

const mockParts = [
  { code: 'PTH-001', name: 'iPhone 15 Pro 屏幕总成', category: '屏幕', warehouse: '华东仓', status: 'in_stock', orderId: '' },
  { code: 'PTH-002', name: 'MacBook Air 电池', category: '电池', warehouse: '华东仓', status: 'low_stock', orderId: '' },
  { code: 'PTH-003', name: 'iPad Pro 主板', category: '主板', warehouse: '华南仓', status: 'bound', orderId: 'ORD-20240101' },
  { code: 'PTH-004', name: '华为 Mate 60 摄像头', category: '摄像头', warehouse: '华北仓', status: 'in_stock', orderId: '' },
  { code: 'PTH-005', name: 'iPhone 14 充电口', category: '接口', warehouse: '华北仓', status: 'low_stock', orderId: '' },
  { code: 'PTH-006', name: '小米14 扬声器模组', category: '音频', warehouse: '华南仓', status: 'in_stock', orderId: '' },
]

export default function Inventory() {
  const [search, setSearch] = useState('')
  const [bindModal, setBindModal] = useState<string | null>(null)
  const [bindOrderId, setBindOrderId] = useState('')

  const filtered = mockParts.filter((p) =>
    p.name.includes(search) || p.code.includes(search),
  )

  return (
    <div className="animate-fade-in">
      <h1 className="font-title text-2xl font-bold text-white">配件库存</h1>
      <p className="mt-1 text-gray-400">管理配件入库、出库和订单绑定</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {warehouses.map((wh) => (
          <div key={wh.name} className="gradient-card rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2.5">
                <Package className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-white">{wh.name}</p>
                <p className="text-sm text-gray-400">配件总数</p>
              </div>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <span className="font-title text-3xl font-bold text-white">{wh.total.toLocaleString()}</span>
              <span className="flex items-center gap-1 text-sm text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                {wh.lowStock} 低库存
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-gray-700 bg-surface p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-title text-lg font-semibold text-white">配件列表</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索配件编码或名称..."
              className="rounded-lg border border-gray-700 bg-primary py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-left font-medium text-gray-400">编码</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">名称</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">分类</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">仓库</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">状态</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">绑定订单</th>
                <th className="px-4 py-3 text-left font-medium text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((part) => (
                <tr key={part.code} className="border-b border-gray-700/50 hover:bg-surface-light/5">
                  <td className="px-4 py-3 font-mono text-xs text-accent">{part.code}</td>
                  <td className="px-4 py-3 text-white">{part.name}</td>
                  <td className="px-4 py-3 text-gray-400">{part.category}</td>
                  <td className="px-4 py-3 text-gray-400">{part.warehouse}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={part.status} />
                  </td>
                  <td className="px-4 py-3">
                    {part.orderId ? (
                      <span className="font-mono text-xs text-blue-400">{part.orderId}</span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {part.status !== 'bound' && (
                      <button
                        onClick={() => setBindModal(part.code)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                      >
                        <Link2 className="h-3.5 w-3.5" />绑定
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {bindModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-surface p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-title text-lg font-semibold text-white">绑定订单</h3>
              <button onClick={() => setBindModal(null)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-400">配件编码: <span className="text-accent">{bindModal}</span></p>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-gray-400">订单 ID</label>
              <input
                value={bindOrderId}
                onChange={(e) => setBindOrderId(e.target.value)}
                placeholder="输入订单编号"
                className="w-full rounded-lg border border-gray-700 bg-primary px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-accent focus:outline-none"
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setBindModal(null)}
                className="flex-1 rounded-lg border border-gray-700 py-2 text-sm font-medium text-gray-400 hover:bg-primary"
              >
                取消
              </button>
              <button
                onClick={() => setBindModal(null)}
                className="flex-1 rounded-lg bg-accent py-2 text-sm font-medium text-primary hover:opacity-90"
              >
                确认绑定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
